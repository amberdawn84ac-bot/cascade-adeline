import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { loadConfig } from '@/lib/config';

export const maxDuration = 60; // Vercel: allow up to 60s for LLM call

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const learningPlanSchema = z.object({
  activeExpeditions: z.array(z.object({
    title: z.string().describe('Creative title that connects the subject to student interests'),
    subject: z.string().describe('The academic subject (e.g., Science, Math, English)'),
    creditsNeeded: z.number().describe('Number of credits this will earn'),
    description: z.string().describe('2-sentence description of what they will do'),
    progress: z.number().nullable().describe('Current progress percentage if in progress, or null'),
    dueDate: z.string().nullable().describe('Target completion date as ISO string, or null'),
  })),
  trailAhead: z.array(z.object({
    title: z.string().describe('Creative title that maps requirement to student interests'),
    subject: z.string().describe('The academic subject requirement'),
    creditsNeeded: z.number().describe('Number of credits needed'),
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
    const gradeLevel = Number(student.gradeLevel) || 9;
    const yearsToGraduation = Math.max(1, 13 - gradeLevel);
    const graduationDate = new Date();
    graduationDate.setFullYear(graduationDate.getFullYear() + yearsToGraduation);
    graduationDate.setMonth(4); // May

    const TOTAL_CREDITS_NEEDED = 24;

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

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a wise, encouraging, and supportive graduation coach. You are building a personalized learning plan for this student.

${studentContext}

CRITICAL MAPPING RULES:
1. Map standard academic requirements to the student's ACTUAL interests
   - If they need PE and love horses → "Equestrian Care & Physical Conditioning"
   - If they need Chemistry and run a homestead → "Food Preservation & Kitchen Chemistry"
   - If they need History and care about justice → "Primary Source Investigation: Mass Incarceration"

2. Active Expeditions (0-3 items): Credits they are CURRENTLY working on based on recent transcript activity
   - Look at their recent transcript entries
   - If they logged something in the last 7 days, it's active
   - Include realistic progress estimates

3. Trail Ahead (4-8 items): The remaining credits they need, personalized to their path
   - Calculate what subjects they still need based on standard requirements
   - Map each requirement to their interests creatively
   - Prioritize based on their chosen path (trade/business/college/balanced)

4. Adeline's Message: A warm, specific, and encouraging message based on their activity
   - If they haven't logged anything in 4+ days: Gently check in and offer help getting unstuck
   - If they're active: Celebrate their momentum and suggest the next exciting step
   - Always reference specific work, not vague encouragement
   - Use their name if you know it
   - Be inspiring and supportive, never harsh or demanding

STANDARD GRADUATION REQUIREMENTS (24 credits total):
- English: 4 credits
- Math: 3 credits  
- Science: 3 credits
- History/Social Studies: 3 credits
- Electives: 6 credits
- Trade/Business/CLEP: 3 credits
- Character/Service: 2 credits

The student has earned ${totalCreditsEarned} credits so far.
Last activity: ${lastActivity ? `${lastActivity.activityName} (${daysSinceLastActivity} days ago)` : 'None logged'}

Generate a plan that will get them to ${TOTAL_CREDITS_NEEDED} credits by graduation.`
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
