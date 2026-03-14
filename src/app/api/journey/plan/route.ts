import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { loadConfig } from '@/lib/config';

export const maxDuration = 60; // Vercel: allow up to 60s for LLM call

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse gradeLevel stored as "3", "K", "K-2", "3-5", "6-8", "9-12", etc.
 * Returns the numeric grade (K=0).
 */
function parseGradeLevel(raw: string | null): number {
  if (!raw) return 9;
  const s = raw.trim().toLowerCase();
  if (s === 'k' || s === 'kindergarten') return 0;
  // Range like "K-2" → average of 0 and 2 = 1
  const rangeK = s.match(/^k-(\d+)$/);
  if (rangeK) return Math.round(parseInt(rangeK[1]) / 2);
  // Range like "3-5", "6-8", "9-12"
  const range = s.match(/^(\d+)-(\d+)$/);
  if (range) return Math.round((parseInt(range[1]) + parseInt(range[2])) / 2);
  // Single number
  const n = parseInt(s);
  return isNaN(n) ? 9 : n;
}

function getSchoolLevel(grade: number): 'elementary' | 'middle' | 'high' {
  if (grade <= 5) return 'elementary';
  if (grade <= 8) return 'middle';
  return 'high';
}

const learningPlanSchema = z.object({
  activeExpeditions: z.array(z.object({
    title: z.string().describe('Creative title that connects the subject to student interests'),
    subject: z.string().describe('The academic subject (e.g., Science, Math, English)'),
    creditsNeeded: z.number().describe('Always exactly 1.0 — one course = one credit in K-12'),
    description: z.string().describe('2-sentence description of what they will do'),
    progress: z.number().nullable().describe('Current progress percentage if in progress, or null'),
    dueDate: z.string().nullable().describe('Target completion date as ISO string, or null'),
  })),
  trailAhead: z.array(z.object({
    title: z.string().describe('Creative title that maps requirement to student interests'),
    subject: z.string().describe('The academic subject requirement'),
    creditsNeeded: z.number().describe('Always exactly 1.0 — one course = one credit in K-12'),
    description: z.string().describe('How this could be earned based on their interests'),
  })),
  adelineMessage: z.string().describe('A warm, encouraging, and specific message based on their recent activity'),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get student profile + cached journey snapshot
    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { 
        gradeLevel: true,
        interests: true,
        createdAt: true,
        metadata: true,
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get live credit totals from transcript (always fresh — fast DB query)
    const transcriptEntries = await prisma.transcriptEntry.findMany({
      where: { userId: user.userId },
      orderBy: { dateCompleted: 'desc' },
      select: {
        activityName: true,
        creditsEarned: true,
        mappedSubject: true,
        dateCompleted: true,
      }
    });

    const totalCreditsEarned = transcriptEntries.reduce((sum, entry) => sum + Number(entry.creditsEarned), 0);
    const lastActivity = transcriptEntries[0];
    const daysSinceLastActivity = lastActivity 
      ? Math.floor((Date.now() - new Date(lastActivity.dateCompleted).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate graduation date
    const gradeLevel = parseGradeLevel(student.gradeLevel);
    const schoolLevel = getSchoolLevel(gradeLevel);
    const yearsToGraduation = Math.max(1, 13 - gradeLevel);
    const graduationDate = new Date();
    graduationDate.setFullYear(graduationDate.getFullYear() + yearsToGraduation);
    graduationDate.setMonth(4); // May

    // Credits scale by school level
    const TOTAL_CREDITS_NEEDED = schoolLevel === 'high' ? 24 : schoolLevel === 'middle' ? 16 : 8;

    // --- Cache check: serve stored snapshot if < 24 hours old ---
    const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';
    const meta = (student.metadata ?? {}) as Record<string, unknown>;
    const cachedAt = meta.journeyPlanCachedAt as string | undefined;
    const cachedPlan = meta.journeyPlanSnapshot as Record<string, unknown> | undefined;
    if (!forceRefresh && cachedPlan && cachedAt && Date.now() - new Date(cachedAt).getTime() < CACHE_TTL_MS) {
      return NextResponse.json({
        ...cachedPlan,
        creditsEarned: totalCreditsEarned, // always live
        lastActivity: lastActivity ? {
          activityName: lastActivity.activityName,
          date: lastActivity.dateCompleted.toISOString(),
          daysSince: daysSinceLastActivity,
        } : undefined,
      });
    }

    // --- Cache miss: generate plan with LLM ---
    const studentContext = await buildStudentContextPrompt(user.userId);

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.7 })
      .withStructuredOutput(learningPlanSchema);

    const gradeLabel = gradeLevel === 0 ? 'Kindergarten' : `Grade ${gradeLevel}`;

    const schoolLevelPrompt = schoolLevel === 'elementary' ? `
SCHOOL LEVEL: ELEMENTARY (${gradeLabel})
This is a young child in elementary school. ALL course suggestions MUST match their developmental stage.

AGE-APPROPRIATE CONTENT RULES — ABSOLUTE:
- NO welding, metalwork, woodshop, or any trade/shop coursework
- NO AP, CLEP, dual enrollment, or college-level content
- NO high school credit frameworks
- NO abstract formal algebra, chemistry, physics, or advanced academic subjects
- YES to: reading, writing stories, number sense, basic arithmetic, nature science, social studies (community/family/maps), art, music, physical activity, hands-on projects
- Lesson titles should sound FUN and age-appropriate: "Backyard Nature Lab", "Story World Writing", "Math Through Cooking"

LEARNING MILESTONES (${TOTAL_CREDITS_NEEDED} total, each = 1 milestone):
- Reading & Language Arts: 2 milestones
- Math: 2 milestones  
- Science & Nature: 1 milestone
- Social Studies / World Around Us: 1 milestone
- Art, Music, or Movement: 1 milestone
- Interest-Based Project: 1 milestone (connect directly to their passions)
` : schoolLevel === 'middle' ? `
SCHOOL LEVEL: MIDDLE SCHOOL (${gradeLabel})
This student is in middle school — transitioning from elementary foundations to high school readiness.

AGE-APPROPRIATE CONTENT RULES:
- NO AP, CLEP, or dual enrollment
- YES to: pre-algebra or algebra 1, life science/earth science/intro chemistry, American history, world cultures, composition, literature, electives tied to interests
- Courses should be exploratory and interest-driven, not overly academic
- Titles should be engaging: "Detective Science", "The Story of Civilizations", "Algebra Through Architecture"

LEARNING MILESTONES (${TOTAL_CREDITS_NEEDED} total, each = 1 milestone):
- Language Arts: 3 milestones
- Math: 3 milestones
- Science: 2 milestones
- History/Social Studies: 2 milestones
- Electives tied to interests: 4 milestones
- PE/Health: 1 milestone
- Character/Service: 1 milestone
` : `
SCHOOL LEVEL: HIGH SCHOOL (${gradeLabel})

GRADUATION REQUIREMENTS (${TOTAL_CREDITS_NEEDED} individual 1-credit courses):
- English: 4 courses
- Math: 3 courses
- Science: 3 courses
- History/Social Studies: 3 courses
- Electives: 6 courses (map directly to student interests)
- Trade/Business/CLEP/Dual Enrollment: 3 courses
- Character/Service: 2 courses
`;

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a wise and encouraging homeschool learning coach. You are building a personalized learning plan for this student.

${studentContext}
${schoolLevelPrompt}
CRITICAL MAPPING RULES:
1. Map every subject requirement to the student's ACTUAL interests
   - Loves horses + needs science → "Equine Biology & Animal Care"
   - Loves cooking + needs chemistry → "Kitchen Chemistry & Food Science"
   - Loves Minecraft + needs math → "Architecture Math: Area, Volume & Design"

2. Active Expeditions (0-3 items): What they are CURRENTLY working on
   - If they logged something in the last 7 days, mark it active
   - Include realistic progress estimates

3. Trail Ahead (4-8 items): Next milestones mapped to their interests
   - List the most important next subjects based on their level
   - Every title must feel exciting, not like a textbook chapter

4. Adeline's Message: Warm, specific, encouraging
   - If idle 4+ days: gently check in and suggest one concrete first step
   - If active: celebrate momentum and hint at what's next
   - Never harsh; always name-specific if you know their name

CREDIT RULE — NON-NEGOTIABLE: Each course = EXACTLY 1.0 credit/milestone. Never assign 2, 3, or 4.

The student has earned ${totalCreditsEarned} credits so far.
Last activity: ${lastActivity ? `${lastActivity.activityName} (${daysSinceLastActivity} days ago)` : 'None logged'}

List the next 4-8 individual 1-credit courses as trailAhead. Every creditsNeeded value must be 1.0.`
      },
      {
        role: 'user',
        content: 'Generate my personalized learning plan to graduation.'
      }
    ]);

    const snapshot = {
      graduationDate: graduationDate.toISOString(),
      totalCreditsNeeded: TOTAL_CREDITS_NEEDED,
      activeExpeditions: result.activeExpeditions.map((exp, i) => ({
        ...exp,
        id: `active-${i}`,
        status: 'active' as const,
      })),
      trailAhead: result.trailAhead.map((credit, i) => ({
        ...credit,
        id: `planned-${i}`,
        status: 'planned' as const,
      })),
      adelineMessage: result.adelineMessage,
    };

    // Persist snapshot to User.metadata (fire-and-forget)
    prisma.user.update({
      where: { id: user.userId },
      data: {
        metadata: {
          ...meta,
          journeyPlanSnapshot: snapshot,
          journeyPlanCachedAt: new Date().toISOString(),
        },
      },
    }).catch(err => console.error('[journey/plan] Cache write failed:', err));

    return NextResponse.json({
      ...snapshot,
      creditsEarned: totalCreditsEarned,
      lastActivity: lastActivity ? {
        activityName: lastActivity.activityName,
        date: lastActivity.dateCompleted.toISOString(),
        daysSince: daysSinceLastActivity,
      } : undefined,
    });

  } catch (error) {
    console.error('[journey/plan] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate learning plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
