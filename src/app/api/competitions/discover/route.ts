import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const competitionSchema = z.object({
  competitions: z.array(z.object({
    name: z.string(),
    organization: z.string(),
    type: z.enum(['SCIENCE_FAIR', 'RESEARCH_PAPER', 'STEM_CHALLENGE', 'INNOVATION', 'ENVIRONMENTAL', 'MATH', 'WRITING', 'ROBOTICS', 'OTHER']),
    description: z.string(),
    deadline: z.string().describe('ISO date string'),
    eligibilityRules: z.object({
      grades: z.array(z.string()),
      ageMin: z.number().optional(),
      ageMax: z.number().optional(),
      notes: z.string(),
      prohibitions: z.array(z.string()).optional(),
    }),
    themes: z.array(z.string()),
    ageRange: z.string(),
    gradeRange: z.string(),
    url: z.string(),
    year: z.number(),
  })),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { studentAge, studentGrade, interests } = await req.json();

  const student = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { gradeLevel: true, age: true, interests: true },
  });

  const age = studentAge || student?.age || 15;
  const grade = studentGrade || student?.gradeLevel || '9';
  const studentInterests = interests || student?.interests || [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: competitionSchema,
    prompt: `You are a competition research assistant. Search your knowledge for current STEM competitions, science fairs, and academic challenges that are:

1. **Age-appropriate**: For a student who is ${age} years old in grade ${grade}
2. **Currently active**: Deadlines in ${currentYear} (we're currently in month ${currentMonth})
3. **Relevant**: Match these interests: ${studentInterests.join(', ') || 'general STEM'}

CRITICAL REQUIREMENTS:
- Only include competitions with deadlines that haven't passed yet (month ${currentMonth} or later in ${currentYear})
- Filter by age: only include competitions where ${age} falls within the age range
- Filter by grade: only include competitions where grade ${grade} is eligible
- Include a mix of local, national, and international opportunities
- Prioritize well-known, established competitions
- Include specific, actionable eligibility rules

Return 8-12 competitions that this student is actually eligible for RIGHT NOW.

Focus on major competitions like:
- Science fairs (ISEF, Google Science Fair, Broadcom MASTERS for middle school)
- Research competitions (Regeneron STS for seniors, JSHS)
- STEM challenges (Conrad Challenge, National STEM Festival)
- Math competitions (MATHCOUNTS for middle school, AMC for high school)
- Environmental (Lexus Eco Challenge)
- Innovation/entrepreneurship competitions
- Subject-specific competitions matching student interests

Be specific about deadlines, age ranges, and grade eligibility. Only include competitions this student can actually enter.`,
  });

  const discoveredCompetitions = result.object.competitions;

  const savedCompetitions = await Promise.all(
    discoveredCompetitions.map(async (comp) => {
      const existing = await prisma.competition.findFirst({
        where: { 
          name: comp.name,
          year: comp.year,
        },
      });

      if (existing) {
        return await prisma.competition.update({
          where: { id: existing.id },
          data: {
            description: comp.description,
            deadline: new Date(comp.deadline),
            eligibilityRules: comp.eligibilityRules as any,
            themes: comp.themes,
            url: comp.url,
            isActive: true,
            lastScrapedAt: new Date(),
          },
        });
      } else {
        return await prisma.competition.create({
          data: {
            name: comp.name,
            organization: comp.organization,
            type: comp.type,
            description: comp.description,
            deadline: new Date(comp.deadline),
            eligibilityRules: comp.eligibilityRules as any,
            themes: comp.themes,
            ageRange: comp.ageRange,
            gradeRange: comp.gradeRange,
            url: comp.url,
            year: comp.year,
            isActive: true,
            lastScrapedAt: new Date(),
          },
        });
      }
    })
  );

  return NextResponse.json({
    discovered: savedCompetitions.length,
    competitions: savedCompetitions,
  });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const student = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { gradeLevel: true, age: true },
  });

  const age = student?.age || 15;
  const grade = student?.gradeLevel || '9';

  const recentCompetitions = await prisma.competition.findMany({
    where: {
      isActive: true,
      lastScrapedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: { lastScrapedAt: 'desc' },
  });

  const eligibleCompetitions = recentCompetitions.filter(comp => {
    const rules = comp.eligibilityRules as any;
    if (rules.grades && !rules.grades.includes(grade) && !rules.grades.includes('K-12')) return false;
    if (rules.ageMin && age < rules.ageMin) return false;
    if (rules.ageMax && age > rules.ageMax) return false;
    return true;
  });

  return NextResponse.json({
    total: eligibleCompetitions.length,
    competitions: eligibleCompetitions,
  });
}
