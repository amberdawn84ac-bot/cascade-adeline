import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

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
      interests: true,
      createdAt: true,
      transcriptEntries: {
        select: { creditsEarned: true, mappedSubject: true, dateCompleted: true },
        orderBy: { dateCompleted: 'desc' },
        take: 5,
      },
      standardsProgress: {
        select: {
          mastery: true,
          standard: { select: { subjectArea: true, standardCode: true } },
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      },
      userActivities: {
        select: { activityType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    students.map(s => ({
      ...s,
      totalCredits: s.transcriptEntries.reduce((sum, e) => sum + Number(e.creditsEarned), 0),
      lastActive: s.userActivities[0]?.createdAt ?? s.createdAt,
      masteryBreakdown: s.standardsProgress.reduce(
        (acc, p) => {
          const subj = p.standard.subjectArea;
          if (!acc[subj]) acc[subj] = { mastered: 0, total: 0 };
          acc[subj].total++;
          if (p.mastery === 'MASTERED' || p.mastery === 'PROFICIENT') acc[subj].mastered++;
          return acc;
        },
        {} as Record<string, { mastered: number; total: number }>
      ),
    }))
  );
}
