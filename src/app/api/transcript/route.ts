import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function parseDate(value?: string) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function isUuid(id: string | null | undefined) {
  return !!id && /^[0-9a-fA-F-]{36}$/.test(id);
}

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId') || undefined;
  const subject = searchParams.get('subject') || undefined;
  const startDate = parseDate(searchParams.get('startDate') || undefined);
  const endDate = parseDate(searchParams.get('endDate') || undefined);

  const requesterId = sessionUser.userId;
  const requesterRole = sessionUser.role; // always from session, never query params

  if (studentId && !isUuid(studentId)) return new Response('Invalid studentId', { status: 400 });

  let allowedStudentIds: string[] = [];
  if (requesterRole === 'STUDENT') {
    if (studentId && studentId !== requesterId) return new Response('Forbidden', { status: 403 });
    allowedStudentIds = [requesterId];
  } else if (requesterRole === 'PARENT' || requesterRole === 'TEACHER') {
    const manager = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { children: { select: { id: true } } },
    });
    allowedStudentIds = manager?.children.map((c: { id: string }) => c.id) || [];
    if (studentId && !allowedStudentIds.includes(studentId)) return new Response('Forbidden', { status: 403 });
  } else if (requesterRole === 'ADMIN') {
    // admins can see any student — no restriction
    if (studentId) allowedStudentIds = [studentId];
  } else {
    return new Response('Forbidden', { status: 403 });
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

