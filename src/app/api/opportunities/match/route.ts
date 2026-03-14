import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import prisma from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';

const matchSchema = z.object({
  matches: z.array(z.object({
    competitionId: z.string(),
    matchScore: z.number().min(0).max(1),
    matchReason: z.string(),
    howToApply: z.string(),
  })).max(3),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectContext } = await req.json();

  const student = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { gradeLevel: true, interests: true, age: true },
  });

  const studentContext = await buildStudentContextPrompt(user.userId);

  const grade = student?.gradeLevel || '9';
  const age = student?.age || 15;

  // Check if we have recent competitions (scraped within last 7 days)
  const recentCompetitions = await prisma.competition.findMany({
    where: {
      isActive: true,
      lastScrapedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // If no recent competitions, trigger discovery
  if (recentCompetitions.length === 0) {
    console.log('[OpportunityMatch] No recent competitions found, triggering discovery...');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/competitions/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentAge: age, studentGrade: grade, interests: student?.interests }),
      });
    } catch (e) {
      console.error('[OpportunityMatch] Failed to trigger discovery:', e);
    }
  }

  const competitions = await prisma.competition.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      organization: true,
      type: true,
      description: true,
      deadline: true,
      eligibilityRules: true,
      themes: true,
      ageRange: true,
      gradeRange: true,
      url: true,
    },
  });

  const eligibleCompetitions = competitions.filter(comp => {
    const rules = comp.eligibilityRules as any;
    if (rules.grades && !rules.grades.includes(grade) && !rules.grades.includes('K-12')) return false;
    if (rules.ageMin && age < rules.ageMin) return false;
    if (rules.ageMax && age > rules.ageMax) return false;
    return true;
  });

  if (eligibleCompetitions.length === 0) {
    return NextResponse.json([]);
  }

  const config = loadConfig();
  const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.3 }).withStructuredOutput(matchSchema);

  const competitionList = eligibleCompetitions.map(c => ({
    id: c.id,
    name: c.name,
    themes: c.themes,
    description: c.description,
    deadline: c.deadline?.toISOString(),
    eligibilityRules: c.eligibilityRules,
  }));

  const result = await llm.invoke([
    {
      role: 'system',
      content: `You are Adeline, helping a student find the best academic competitions for their work.${studentContext}

Your job is to match the student's project/interests to real competitions and return the TOP 3 best matches.

SCORING GUIDE:
- 0.9-1.0: Perfect thematic match, student clearly eligible, deadline not yet passed
- 0.7-0.9: Strong match on 2+ themes, eligible
- 0.5-0.7: Partial match, worth considering
- Below 0.5: Don't include

Be specific in matchReason — explain EXACTLY which theme or aspect of their work matches.
In howToApply, give a concrete first step.`,
    },
    {
      role: 'user',
      content: `Student's project/context: ${projectContext || 'General STEM interests'}

Available competitions:
${JSON.stringify(competitionList, null, 2)}

Return the top 3 matches as JSON.`,
    },
  ]);

  const matchesWithDetails = await Promise.all(
    result.matches.map(async (match) => {
      const comp = eligibleCompetitions.find(c => c.id === match.competitionId);
      if (!comp) return null;

      await prisma.competitionMatch.upsert({
        where: {
          id: `${user.userId}-${match.competitionId}`.slice(0, 36).padEnd(36, '0'),
        },
        update: {
          matchScore: match.matchScore,
          matchReason: match.matchReason,
          projectContext: projectContext || null,
        },
        create: {
          userId: user.userId,
          competitionId: match.competitionId,
          matchScore: match.matchScore,
          matchReason: match.matchReason,
          projectContext: projectContext || null,
        },
      }).catch(() => {
        return prisma.competitionMatch.create({
          data: {
            userId: user.userId,
            competitionId: match.competitionId,
            matchScore: match.matchScore,
            matchReason: match.matchReason,
            projectContext: projectContext || null,
          },
        });
      });

      const daysUntilDeadline = comp.deadline
        ? Math.ceil((new Date(comp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...match,
        competition: {
          ...comp,
          eligibilityRules: comp.eligibilityRules as any,
        },
        daysUntilDeadline,
        isUrgent: daysUntilDeadline !== null && daysUntilDeadline <= 30,
      };
    })
  );

  return NextResponse.json(matchesWithDetails.filter(Boolean));
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const matches = await prisma.competitionMatch.findMany({
    where: { userId: user.userId, dismissed: false },
    include: {
      competition: {
        select: {
          id: true,
          name: true,
          organization: true,
          type: true,
          description: true,
          deadline: true,
          themes: true,
          url: true,
        },
      },
    },
    orderBy: { matchScore: 'desc' },
    take: 5,
  });

  return NextResponse.json(
    matches.map(m => ({
      ...m,
      daysUntilDeadline: m.competition.deadline
        ? Math.ceil((new Date(m.competition.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
      isUrgent: m.competition.deadline
        ? Math.ceil((new Date(m.competition.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30
        : false,
    }))
  );
}
