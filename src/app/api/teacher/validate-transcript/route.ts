import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { entryId, approved, adjustedCredits, teacherComment } = await req.json();
  if (!entryId) return NextResponse.json({ error: 'entryId is required' }, { status: 400 });

  const entry = await prisma.transcriptEntry.findUnique({ where: { id: entryId } });
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

  if (approved === false) {
    await prisma.transcriptEntry.delete({ where: { id: entryId } });
    return NextResponse.json({ ok: true, action: 'rejected' });
  }

  const updatedEntry = await prisma.transcriptEntry.update({
    where: { id: entryId },
    data: {
      approvedById: user.userId,
      creditsEarned: adjustedCredits !== undefined ? adjustedCredits : entry.creditsEarned,
      notes: teacherComment ? `${entry.notes || ''}\n\nTeacher: ${teacherComment}`.trim() : entry.notes,
    },
    include: {
      user: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, action: 'approved', entry: updatedEntry });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pendingEntries = await prisma.transcriptEntry.findMany({
    where: { approvedById: null, user: { role: 'STUDENT' } },
    include: {
      user: { select: { id: true, name: true, gradeLevel: true } },
      evidenceArtifact: { select: { id: true, title: true, fileUrl: true } },
    },
    orderBy: { dateCompleted: 'desc' },
    take: 50,
  });

  return NextResponse.json(pendingEntries);
}
