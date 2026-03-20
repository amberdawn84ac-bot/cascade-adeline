import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getCachedContent, saveToCache, getGradeBracket } from '@/lib/cache/contentCache';
import { lessonBrain } from '@/lib/langgraph/lesson/lessonGraph';
import { LessonBlock } from '@/lib/langgraph/lesson/lessonState';

export const maxDuration = 60;

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

    const { subject, title, description, creditId, gradeLevel: gradeLevelParam } = await req.json();
    if (!subject || !title) {
      return NextResponse.json({ error: 'subject and title required' }, { status: 400 });
    }

    const regenerate = req.nextUrl.searchParams.get('regenerate') === 'true';

    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, interests: true, learningStyle: true },
    });

    const gradeLevel = gradeLevelParam || student?.gradeLevel || '';
    const gradeBracket = getGradeBracket(gradeLevel);
    const topicKey = `${slugify(subject)}:${slugify(title)}`;
    const redisKey = `lesson:${user.userId}:${creditId || topicKey}:${gradeLevel}`;

    // ── Layer 1: Redis cache ───────────────────────────────────────────────
    if (!regenerate) {
      const redis = await getRedis();
      if (redis) {
        try {
          const cached = await redis.get<LessonBlock[]>(redisKey);
          if (cached) {
            console.log('[lesson-stream] Redis HIT');
            return streamBlocks(cached);
          }
        } catch (e) {
          console.warn('[lesson-stream] Redis get failed (non-fatal):', e);
        }
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
      interests: student?.interests ?? [],
      learningStyle: student?.learningStyle ?? 'EXPEDITION',
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const allBlocks: LessonBlock[] = [];

        try {
          for await (const chunk of await lessonBrain.stream(initialState, { streamMode: 'values' })) {
            const newBlocks: LessonBlock[] = chunk.blocks ?? [];
            const freshBlocks = newBlocks.slice(allBlocks.length);
            if (freshBlocks.length > 0) {
              allBlocks.push(...freshBlocks);
              controller.enqueue(encoder.encode(JSON.stringify(freshBlocks) + '\n'));
            }
          }

          // Save complete lesson to all cache layers
          void persistLesson(user.userId, creditId, gradeLevel, gradeBracket, topicKey, redisKey, subject, title, allBlocks);

        } catch (err) {
          console.error('[lesson-stream] Graph error:', err);
          controller.enqueue(encoder.encode(JSON.stringify([{
            type: 'text',
            content: "I'm having trouble generating this lesson right now. Please try again in a moment.",
            metadata: { skills: [subject], zpd_level: gradeLevel },
          }]) + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });

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
    if (redis) await redis.set(key, blocks, { ex: 3600 });
  } catch {
    // non-fatal
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
