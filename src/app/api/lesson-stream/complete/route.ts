import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStudentContext } from '@/lib/learning/student-context';
import prisma from '@/lib/db';
import { getAllCodesForSubject, getStandardsForSubject } from '@/lib/standards/subjectStandardsMap';
import { getOrCreateStandard, recordStandardProgress } from '@/lib/services/standardsService';

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

    const studentCtx = await getStudentContext(user.userId, { subjectArea: subject });
    const gradeLevel = studentCtx.activeGradeLevel;
    const topicKey = `${slugify(subject)}:${slugify(title)}`;
    const redisKey = `lesson:${user.userId}:${creditId || topicKey}:${gradeLevel}`;

    if (remediationTriggered) {
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

    // ── Write transcript entry when mastery achieved ──────────────────────
    // Each lesson covers roughly 1/20 of a course credit (a full credit = ~20 lesson sessions).
    // Scale by quiz performance so a 100% score = full 0.05 cr, 70% = 0.035 cr.
    // This matches the calibrated-formula pattern used by the arcade route.
    let transcriptEntry: Awaited<ReturnType<typeof prisma.transcriptEntry.create>> | null = null;
    if (masteryAchieved && subject && title) {
      try {
        const BASE_LESSON_CREDIT = 0.05;
        const creditsEarned = parseFloat((BASE_LESSON_CREDIT * (score / 100)).toFixed(4));

        // Link to matching plan standard for progress tracking (subject match only)
        let planStandardId: string | null = null;
        try {
          const plan = await prisma.learningPlan.findUnique({
            where: { userId: user.userId },
            include: {
              planStandards: {
                where: { isActive: true },
                include: { standard: true },
              },
            },
          });
          if (plan) {
            const subjectLower = subject.toLowerCase();
            const matched = plan.planStandards.find(ps =>
              ps.standard.subject.toLowerCase().includes(subjectLower) ||
              subjectLower.includes(ps.standard.subject.toLowerCase())
            );
            if (matched) {
              planStandardId = matched.id;
              // Increment StudentStandardProgress for dashboard tracking
              await prisma.studentStandardProgress.upsert({
                where: { userId_standardId: { userId: user.userId, standardId: matched.standardId } },
                update: { microcreditsEarned: { increment: creditsEarned }, lastActivityAt: new Date(), mastery: 'DEVELOPING' },
                create: { userId: user.userId, standardId: matched.standardId, microcreditsEarned: creditsEarned, lastActivityAt: new Date(), mastery: 'DEVELOPING', evidence: {} },
              });
            }
          }
        } catch { /* non-fatal — still write transcript even if plan lookup fails */ }

        transcriptEntry = await prisma.transcriptEntry.create({
          data: {
            userId: user.userId,
            activityName: title,
            mappedSubject: subject,
            creditsEarned,
            dateCompleted: new Date(),
            notes: `Lesson completed with ${score}% mastery`,
            planStandardId,
            masteryEvidence: { score, correct, total, quizResults },
            metadata: { creditId, gradeLevel, source: 'lesson-stream' },
          },
        });

        console.log(`[lesson-complete] Transcript written — ${creditsEarned} microcredits for "${title}" (${subject})`);

        // ── Record StudentStandardProgress for each CCSS/OAS code ────────
        const standardCodes = getAllCodesForSubject(subject);
        const entry = getStandardsForSubject(subject);
        if (standardCodes.length > 0) {
          const progressResults = await Promise.allSettled(
            standardCodes.map(async (code) => {
              const jx = code.startsWith('OAS') ? 'Oklahoma' : code.startsWith('AP') ? 'AP' : 'Common Core';
              const std = await getOrCreateStandard(code, jx, entry?.scedCode ? gradeLevel : undefined);
              if (std) await recordStandardProgress(user.userId, std.id, 'lesson', transcriptEntry?.id);
            })
          );
          const succeeded = progressResults.filter(r => r.status === 'fulfilled').length;
          console.log(`[lesson-complete] Standards recorded: ${succeeded}/${standardCodes.length} for "${subject}"`);
        }
      } catch (transcriptErr) {
        console.error('[lesson-complete] Transcript write failed (non-fatal):', transcriptErr);
      }
    }

    return NextResponse.json({ score, masteryAchieved, remediationTriggered, correct, total, transcriptEntry });

  } catch (error) {
    console.error('[lesson-complete] Error:', error);
    return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 });
  }
}
