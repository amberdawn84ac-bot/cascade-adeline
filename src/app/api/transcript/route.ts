import { NextRequest } from 'next/server';
import prisma from '@/lib/db';

function parseDate(value?: string) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function isUuid(id: string | null | undefined) {
  return !!id && /^[0-9a-fA-F-]{36}$/.test(id);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId') || undefined;
  const subject = searchParams.get('subject') || undefined;
  const startDate = parseDate(searchParams.get('startDate') || undefined);
  const endDate = parseDate(searchParams.get('endDate') || undefined);

  const requesterId = searchParams.get('requesterId') || undefined;
  const requesterRole = (searchParams.get('requesterRole') || '').toUpperCase();

  // Basic RLS enforcement: student can only see own; parent can see children; others forbidden.
  if (!requesterId) return new Response('Unauthorized', { status: 401 });
  if (!isUuid(requesterId)) return new Response('Invalid requesterId', { status: 400 });
  if (requesterRole !== 'STUDENT' && requesterRole !== 'PARENT') {
    return new Response('Forbidden', { status: 403 });
  }

  if (studentId && !isUuid(studentId)) return new Response('Invalid studentId', { status: 400 });
  if ((startDate && !parseDate(searchParams.get('startDate') || undefined)) || (endDate && !parseDate(searchParams.get('endDate') || undefined))) {
    return new Response('Invalid date format', { status: 400 });
  }

  let allowedStudentIds: string[] = [];
  if (requesterRole === 'STUDENT') {
    if (studentId && studentId !== requesterId) return new Response('Forbidden', { status: 403 });
    allowedStudentIds = [requesterId];
  } else if (requesterRole === 'PARENT') {
    const parent = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { children: { select: { id: true } } },
    });
    allowedStudentIds = parent?.children.map((c: { id: string }) => c.id) || [];
    if (!studentId && allowedStudentIds.length === 0) return new Response('Forbidden', { status: 403 });
    if (studentId && !allowedStudentIds.includes(studentId)) return new Response('Forbidden', { status: 403 });
    if (!studentId) {
      // default to all children
    }
  }

  const where: any = {};
  where.userId = studentId || { in: allowedStudentIds };
  if (subject) where.mappedSubject = { contains: subject, mode: 'insensitive' };
  if (startDate || endDate) {
    where.dateCompleted = {};
    if (startDate) where.dateCompleted.gte = startDate;
    if (endDate) where.dateCompleted.lte = endDate;
  }

  const entries = await prisma.transcriptEntry.findMany({
    where,
    orderBy: { dateCompleted: 'desc' },
  });

  return Response.json({ entries });
}
