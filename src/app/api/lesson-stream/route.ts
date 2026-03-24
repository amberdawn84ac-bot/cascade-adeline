import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStudentContext } from '@/lib/learning/student-context';
import prisma from '@/lib/db';
import { getCachedContent, saveToCache, getGradeBracket } from '@/lib/cache/contentCache';
import { lessonBrain } from '@/lib/langgraph/lesson/lessonGraph';
import { LessonBlock } from '@/lib/langgraph/lesson/lessonState';

export const maxDuration = 120;

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getRedis() {
  try {
    const { default: redis } = await import('@/lib/redis');
    return redis;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, title, description, creditId, gradeLevel: gradeLevelParam, quizScore, learningMode } = await req.json();
    if (!subject || !title) {
      return NextResponse.json({ error: 'subject and title required' }, { status: 400 });
    }

    const regenerate = req.nextUrl.searchParams.get('regenerate') === 'true';

    const studentCtx = await getStudentContext(user.userId, { subjectArea: subject });
    const gradeLevel = gradeLevelParam || studentCtx.activeGradeLevel;
    const gradeBracket = getGradeBracket(gradeLevel);
    const topicKey = `${slugify(subject)}:${slugify(title)}`;
    const redisKey = `lesson:${user.userId}:${creditId || topicKey}:${gradeLevel}`;

    console.log('[lesson-stream] Cache key details:', {
      userId: user.userId,
      creditId,
      topicKey,
      gradeLevel,
      redisKey,
      regenerate
    });

    // ── Layer 1: Redis cache ───────────────────────────────────────────────
    if (!regenerate) {
      const redis = await getRedis();
      if (redis) {
        try {
          const cached = await redis.get<LessonBlock[]>(redisKey);
          if (cached) {
            console.log('[lesson-stream] Redis HIT - returning', cached.length, 'blocks');
            return streamBlocks(cached);
          } else {
            console.log('[lesson-stream] Redis MISS - no cached data found');
          }
        } catch (e) {
          console.warn('[lesson-stream] Redis get failed (non-fatal):', e);
        }
      } else {
        console.log('[lesson-stream] Redis not available');
      }

      // ── Layer 2: GlobalContentCache (Postgres — grade-level keyed) ────────
      const globalCached = await getCachedContent('lesson', topicKey, gradeBracket);
      if (globalCached?.blocks) {
        console.log('[lesson-stream] GlobalContentCache HIT');
        const blocks = globalCached.blocks as LessonBlock[];
        void saveToRedis(redisKey, blocks);
        return streamBlocks(blocks);
      }

      // ── Layer 3: Per-user CachedLesson (Postgres — 7-day TTL) ─────────────
      if (creditId) {
        const userCached = await prisma.cachedLesson.findFirst({
          where: { userId: user.userId, creditId, expiresAt: { gte: new Date() } },
          orderBy: { generatedAt: 'desc' },
        });
        if (userCached?.lessonData) {
          const data = userCached.lessonData as any;
          if (data.blocks) {
            console.log('[lesson-stream] CachedLesson HIT');
            const blocks = data.blocks as LessonBlock[];
            void saveToRedis(redisKey, blocks);
            return streamBlocks(blocks);
          }
        }
      }
    }

    // ── Cache miss: run the lesson swarm ─────────────────────────────────
    console.log('[lesson-stream] Cache MISS — running lessonBrain');

    const initialState = {
      userId: user.userId,
      gradeLevel,
      subject,
      topic: title,
      description: description || '',
      creditId,
      interests: studentCtx.interests,
      learningStyle: studentCtx.learningStyle,
      learningMode: (learningMode === 'expedition' || learningMode === 'classic') ? learningMode : 'classic',
      ...(quizScore !== undefined ? { quizScore } : {}),
    };

    // Run graph to completion — if it throws the outer catch returns 500
    // which makes res.ok=false in the frontend, triggering fallback to /api/journey/lesson
    console.log('[lesson-stream] Running lessonBrain.invoke()');
    const finalState = await lessonBrain.invoke(initialState);
    const allBlocks: LessonBlock[] = finalState.blocks ?? [];
    console.log(`[lesson-stream] Graph complete — ${allBlocks.length} blocks`);

    if (allBlocks.length === 0) {
      return NextResponse.json({ error: 'Graph produced no blocks' }, { status: 500 });
    }

    // Persist to all cache layers (non-blocking)
    void persistLesson(user.userId, creditId, gradeLevel, gradeBracket, topicKey, redisKey, subject, title, allBlocks);

    return streamBlocks(allBlocks);

  } catch (error) {
    console.error('[lesson-stream] Error:', error);
    return NextResponse.json({ error: 'Failed to stream lesson' }, { status: 500 });
  }
}

function streamBlocks(blocks: LessonBlock[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Stream in chunks of ~5 blocks to simulate progressive rendering
      const chunkSize = 5;
      for (let i = 0; i < blocks.length; i += chunkSize) {
        const chunk = blocks.slice(i, i + chunkSize);
        controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}

async function saveToRedis(key: string, blocks: LessonBlock[]): Promise<void> {
  try {
    const redis = await getRedis();
    if (redis) {
      await redis.set(key, blocks, { ex: 3600 });
      console.log('[lesson-stream] Saved to Redis:', key, 'with', blocks.length, 'blocks');
    } else {
      console.log('[lesson-stream] Redis not available for saving');
    }
  } catch (e) {
    console.warn('[lesson-stream] Redis save failed (non-fatal):', e);
  }
}

async function persistLesson(
  userId: string,
  creditId: string | undefined,
  gradeLevel: string,
  gradeBracket: string,
  topicKey: string,
  redisKey: string,
  subject: string,
  title: string,
  blocks: LessonBlock[]
): Promise<void> {
  const lessonData = { blocks };

  // Save to Redis (1 hour TTL)
  void saveToRedis(redisKey, blocks);

  // Save to GlobalContentCache (shared across users, by grade bracket)
  void saveToCache('lesson', topicKey, gradeBracket, lessonData);

  // Save to per-user CachedLesson (7-day TTL)
  if (creditId) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.cachedLesson.upsert({
        where: { userId_creditId_gradeLevel: { userId, creditId, gradeLevel } },
        create: { userId, creditId, gradeLevel, subject, title, lessonData: lessonData as any, expiresAt },
        update: { lessonData: lessonData as any, generatedAt: new Date(), expiresAt },
      });
    } catch (e) {
      console.error('[lesson-stream] CachedLesson save failed:', e);
    }
  }
}
