import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get standards with introduced or developing mastery
    const inProgress = await prisma.studentStandardProgress.findMany({
      where: {
        userId: user.userId,
        mastery: { in: ['INTRODUCED', 'DEVELOPING'] },
      },
      include: { standard: { select: { description: true, subject: true, gradeLevel: true } } },
      take: 5,
      orderBy: { demonstratedAt: 'desc' },
    }).catch(() => []);

    const suggestions: { label: string; subject: string; prompt: string }[] = [];

    // Build suggestions from in-progress standards
    for (const p of inProgress.slice(0, 3)) {
      const desc = p.standard.description ?? p.standard.subject;
      suggestions.push({
        label: desc,
        subject: p.standard.subject,
        prompt: `Let's work on: ${desc}. Can you help me understand this concept in ${p.standard.subject}?`,
      });
    }

    // Fill with subject-based suggestions if not enough standards
    if (suggestions.length < 3) {
      const defaults: { label: string; subject: string; prompt: string }[] = [
        { label: 'Explore a science experiment', subject: 'Science', prompt: 'I want to do a hands-on science experiment today. What should we explore?' },
        { label: 'Practice math skills', subject: 'Math', prompt: 'Can we work on some math skills together? Start with something at my level.' },
        { label: 'Read and discuss a story', subject: 'Reading', prompt: 'I want to read and discuss a story today. Can you suggest one and we can talk about it?' },
        { label: 'Learn something from history', subject: 'History', prompt: 'Teach me something interesting from history today!' },
        { label: 'Try a writing prompt', subject: 'Writing', prompt: 'Give me a fun writing prompt and help me through it.' },
      ];
      for (const s of defaults) {
        if (suggestions.length >= 3) break;
        if (!suggestions.find(x => x.subject === s.subject)) suggestions.push(s);
      }
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    console.error('[WhatsNext] Error:', error);
    // Return default suggestions on error
    return NextResponse.json({
      suggestions: [
        { label: 'Start a science exploration', subject: 'Science', prompt: 'I want to explore something in science today. What do you suggest?' },
        { label: 'Practice math', subject: 'Math', prompt: 'Let\'s work on some math together today.' },
        { label: 'Read and discuss', subject: 'Reading', prompt: 'Can we read and discuss something interesting today?' },
      ],
    });
  }
}
