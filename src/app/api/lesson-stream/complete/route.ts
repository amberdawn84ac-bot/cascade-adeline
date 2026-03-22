import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStudentContext } from '@/lib/learning/student-context';
import prisma from '@/lib/db';
import { getAllCodesForSubject, getStandardsForSubject } from '@/lib/standards/subjectStandardsMap';
import { getOrCreateStandard, recordStandardProgress } from '@/lib/services/standardsService';
import { calculateLessonCredits, getTotalCreditHours } from '@/lib/standards/creditCalculator';
import type { LessonBlock } from '@/lib/langgraph/lesson/lessonState';

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

    const { creditId, subject, title, quizResults, blocks } = await req.json();
    // quizResults: Array<{ blockIndex: number; isCorrect: boolean }>
    // blocks: LessonBlock[] - full lesson blocks for credit calculation

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

    // ── Calculate multi-subject credits ──────────────────────────────────
    let transcriptEntries: Awaited<ReturnType<typeof prisma.transcriptEntry.create>>[] = [];
    let creditAwards: ReturnType<typeof calculateLessonCredits> = [];
    
    if (masteryAchieved && subject && title) {
      try {
        // Calculate credits for all subjects this lesson covers
        const lessonBlocks: LessonBlock[] = blocks ?? [];
        const completedBlockIds = lessonBlocks.map((_, i) => `block-${i}`);
        const standardsCodes = getAllCodesForSubject(subject);
        
        creditAwards = calculateLessonCredits({
          subject,
          topic: title,
          blocks: lessonBlocks,
          standardsCodes,
          quizScore: score,
          completedBlocks: completedBlockIds,
        });
        
        const totalHours = getTotalCreditHours(creditAwards);
        console.log(`[lesson-complete] Multi-subject credits: ${totalHours} total hours across ${creditAwards.length} subjects`);
        creditAwards.forEach(award => {
          console.log(`  - ${award.subject}: ${award.hours} hours (${award.standards.length} standards)`);
        });

        // Get learning plan for linking
        const plan = await prisma.learningPlan.findUnique({
          where: { userId: user.userId },
          include: {
            planStandards: {
              where: { isActive: true },
              include: { standard: true },
            },
          },
        });

        // Create transcript entry for each subject credit award
        for (const award of creditAwards) {
          let planStandardId: string | null = null;
          
          // Try to match to learning plan standard
          if (plan) {
            const subjectLower = award.subject.toLowerCase();
            const matched = plan.planStandards.find(ps =>
              ps.standard.subject.toLowerCase().includes(subjectLower) ||
              subjectLower.includes(ps.standard.subject.toLowerCase())
            );
            if (matched) {
              planStandardId = matched.id;
              // Update StudentStandardProgress
              await prisma.studentStandardProgress.upsert({
                where: { userId_standardId: { userId: user.userId, standardId: matched.standardId } },
                update: { 
                  microcreditsEarned: { increment: award.hours }, 
                  lastActivityAt: new Date(), 
                  mastery: 'DEVELOPING' 
                },
                create: { 
                  userId: user.userId, 
                  standardId: matched.standardId, 
                  microcreditsEarned: award.hours, 
                  lastActivityAt: new Date(), 
                  mastery: 'DEVELOPING', 
                  evidence: {} 
                },
              });
            }
          }
          
          const entry = await prisma.transcriptEntry.create({
            data: {
              userId: user.userId,
              activityName: `${title} - ${award.subject}`,
              mappedSubject: award.subject,
              creditsEarned: award.hours,
              dateCompleted: new Date(),
              notes: `Lesson completed with ${score}% mastery (${award.standards.length} standards)`,
              planStandardId,
              masteryEvidence: { score, correct, total, quizResults, standards: award.standards },
              metadata: { creditId, gradeLevel, source: 'lesson-stream', primarySubject: subject },
            },
          });
          
          transcriptEntries.push(entry);
        }

        console.log(`[lesson-complete] ${transcriptEntries.length} transcript entries written — ${totalHours} total hours for "${title}"`);

        // ── Record StudentStandardProgress for all standards across all subjects ────────
        const allStandards = new Set<string>();
        creditAwards.forEach(award => award.standards.forEach(s => allStandards.add(s)));
        
        if (allStandards.size > 0) {
          const progressResults = await Promise.allSettled(
            Array.from(allStandards).map(async (code) => {
              const jx = code.startsWith('OAS') ? 'Oklahoma' : code.startsWith('AP') ? 'AP' : 'Common Core';
              const std = await getOrCreateStandard(code, jx, gradeLevel);
              if (std) {
                // Use first transcript entry as reference
                await recordStandardProgress(user.userId, std.id, 'lesson', transcriptEntries[0]?.id);
              }
            })
          );
          const succeeded = progressResults.filter(r => r.status === 'fulfilled').length;
          console.log(`[lesson-complete] Standards recorded: ${succeeded}/${allStandards.size} across all subjects`);
        }
      } catch (transcriptErr) {
        console.error('[lesson-complete] Transcript write failed (non-fatal):', transcriptErr);
      }
    }

    return NextResponse.json({ 
      score, 
      masteryAchieved, 
      remediationTriggered, 
      correct, 
      total, 
      transcriptEntries,
      creditAwards: masteryAchieved ? creditAwards : undefined,
    });

  } catch (error) {
    console.error('[lesson-complete] Error:', error);
    return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 });
  }
}
