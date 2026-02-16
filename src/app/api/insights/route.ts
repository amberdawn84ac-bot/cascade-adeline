import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Conversation stats
    const messageCount = await prisma.conversationMemory.count({
      where: { userId: user.userId },
    });

    // Credits earned
    const transcriptEntries = await prisma.transcriptEntry.findMany({
      where: { userId: user.userId },
    });

    const totalCredits = transcriptEntries.reduce(
      (sum, entry) => sum + Number(entry.creditsEarned),
      0
    );

    const creditsBySubject = transcriptEntries.reduce((acc, entry) => {
      const subject = entry.mappedSubject;
      acc[subject] = (acc[subject] || 0) + Number(entry.creditsEarned);
      return acc;
    }, {} as Record<string, number>);

    // Reflection count
    const reflectionCount = await prisma.reflectionEntry.count({
      where: { userId: user.userId },
    });

    // Learning streak (count consecutive days with activity)
    const activityDates = await prisma.conversationMemory.findMany({
      where: { userId: user.userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    let streak = 0;
    if (activityDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueDays = new Set(
        activityDates.map((a) => {
          const d = new Date(a.createdAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );

      const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
      const oneDay = 86400000;

      for (let i = 0; i < sortedDays.length; i++) {
        const expectedDay = today.getTime() - i * oneDay;
        if (sortedDays[i] === expectedDay) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Concept mastery
    const masteries = await prisma.userConceptMastery.findMany({
      where: { userId: user.userId },
      include: { concept: { select: { name: true, subjectArea: true } } },
      orderBy: { masteryLevel: 'desc' },
      take: 10,
    });

    const topConcepts = masteries.map((m) => ({
      name: m.concept.name,
      subject: m.concept.subjectArea,
      mastery: Math.round(m.masteryLevel * 100),
    }));

    return NextResponse.json({
      messageCount,
      totalCredits: Math.round(totalCredits * 100) / 100,
      creditsBySubject,
      reflectionCount,
      streak,
      topConcepts,
      subjectCount: Object.keys(creditsBySubject).length,
    });
  } catch (err) {
    console.error('[insights]', err);
    return NextResponse.json({
      messageCount: 0,
      totalCredits: 0,
      creditsBySubject: {},
      reflectionCount: 0,
      streak: 0,
      topConcepts: [],
      subjectCount: 0,
    });
  }
}
