import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStudentContext } from '@/lib/learning/student-context';
import prisma from '@/lib/db';

async function getRedis() {
  try {
    const { default: redis } = await import('@/lib/redis');
    return redis;
  } catch {
    return null;
  }
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { creditId, subject, title, quizResults } = await req.json();
    // quizResults: Array<{ blockIndex: number; isCorrect: boolean }>

    const results: Array<{ blockIndex: number; isCorrect: boolean }> = quizResults ?? [];
    const total = results.length;
    const correct = results.filter(r => r.isCorrect).length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 100;
    const masteryAchieved = score >= 70;
    const remediationTriggered = !masteryAchieved && total > 0;

    console.log(`[lesson-complete] userId=${user.userId} creditId=${creditId} score=${score}% remediation=${remediationTriggered}`);

    if (remediationTriggered) {
      const studentCtx = await getStudentContext(user.userId, { subjectArea: subject });
      const gradeLevel = studentCtx.activeGradeLevel;
      const topicKey = `${slugify(subject)}:${slugify(title)}`;
      const redisKey = `lesson:${user.userId}:${creditId || topicKey}:${gradeLevel}`;

      // Clear per-user cached lesson so next request runs lessonBrain fresh
      if (creditId) {
        await prisma.cachedLesson.deleteMany({
          where: { userId: user.userId, creditId },
        });
      }

      // Clear Redis entry
      const redis = await getRedis();
      if (redis) {
        try { await redis.del(redisKey); } catch { /* non-fatal */ }
      }
    }

    return NextResponse.json({ score, masteryAchieved, remediationTriggered, correct, total });

  } catch (error) {
    console.error('[lesson-complete] Error:', error);
    return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 });
  }
}
