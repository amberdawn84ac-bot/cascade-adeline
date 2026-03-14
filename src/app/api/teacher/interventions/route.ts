import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const interventionSchema = z.object({
  interventions: z.array(z.object({
    studentId: z.string(),
    studentName: z.string(),
    issue: z.string(),
    suggestedAction: z.string(),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      standardsProgress: {
        where: { mastery: { in: ['INTRODUCED', 'DEVELOPING'] } },
        select: {
          mastery: true,
          attempts: true,
          lastAttemptAt: true,
          standard: { select: { standardCode: true, description: true, subjectArea: true } },
        },
        orderBy: { lastAttemptAt: 'desc' },
        take: 5,
      },
      learningGaps: {
        where: { severity: { in: ['MODERATE', 'SIGNIFICANT'] } },
        select: {
          severity: true,
          detectedAt: true,
          concept: { select: { name: true, subjectArea: true } },
        },
        orderBy: { detectedAt: 'desc' },
        take: 3,
      },
      userActivities: {
        select: { activityType: true, duration: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
    take: 20,
  });

  const studentsNeedingIntervention = students.filter(s => {
    const hasLowMastery = s.standardsProgress.some(p => p.attempts >= 4 && p.mastery === 'DEVELOPING');
    const hasGaps = s.learningGaps.length > 0;
    const recentActivityCount = s.userActivities.filter(
      a => new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const isInactive = recentActivityCount < 3;
    return hasLowMastery || hasGaps || isInactive;
  });

  if (studentsNeedingIntervention.length === 0) {
    return NextResponse.json([]);
  }

  const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.3 }).withStructuredOutput(interventionSchema);

  const studentSummaries = studentsNeedingIntervention.map(s => ({
    id: s.id,
    name: s.name,
    gradeLevel: s.gradeLevel,
    strugglingStandards: s.standardsProgress.map(p => ({
      subject: p.standard.subjectArea,
      code: p.standard.standardCode,
      attempts: p.attempts,
      mastery: p.mastery,
    })),
    learningGaps: s.learningGaps.map(g => ({
      concept: g.concept.name,
      subject: g.concept.subjectArea,
      severity: g.severity,
    })),
    recentActivityDays: s.userActivities.length,
  }));

  const result = await llm.invoke([
    {
      role: 'system',
      content: `You are Adeline, an AI learning coach helping a teacher identify students who need intervention.

Your job is to analyze student data and generate ACTIONABLE intervention suggestions.

INTERVENTION CRITERIA:
- HIGH urgency: Student has made 4+ attempts with low mastery, or has SIGNIFICANT learning gaps
- MEDIUM urgency: Student has 2-3 moderate gaps or low recent activity
- LOW urgency: Minor concerns worth monitoring

INTERVENTION QUALITY:
- Be SPECIFIC: "Schedule 1-on-1 review of triangle congruence theorems" not "help with math"
- Be ACTIONABLE: Teacher should know exactly what to do
- Be BRIEF: 1-2 sentences max`,
    },
    {
      role: 'user',
      content: `Students needing intervention:\n${JSON.stringify(studentSummaries, null, 2)}\n\nGenerate intervention recommendations.`,
    },
  ]);

  return NextResponse.json(result.interventions);
}
