import React from 'react';
import { NextRequest } from 'next/server';
import { Document, Page, Text, StyleSheet, View, pdf } from '@react-pdf/renderer';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import redis from '@/lib/redis';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
    color: '#BD6809',
  },
  sectionHeader: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
    fontWeight: 700,
  },
  subHeader: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#CCCCCC',
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1 solid #ccc',
    paddingVertical: 4,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #eee',
    paddingVertical: 3,
  },
  colDate: { width: '18%' },
  colActivity: { width: '32%' },
  colSubject: { width: '22%' },
  colCredits: { width: '14%', textAlign: 'right' },
  colNotes: { width: '14%' },
  totalsRow: { flexDirection: 'row', paddingVertical: 3, borderBottom: '1 solid #eee' },
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  if (!studentId || !/^[0-9a-fA-F-]{36}$/.test(studentId)) return new Response('Invalid studentId', { status: 400 });
  if ((startDate && Number.isNaN(new Date(startDate).getTime())) || (endDate && Number.isNaN(new Date(endDate).getTime()))) {
    return new Response('Invalid date format', { status: 400 });
  }

  const rateKey = `transcript-export:${user.userId || 'anon'}`;
  const count = await redis.incr(rateKey);
  if (count === 1) await redis.expire(rateKey, 60 * 60);
  if (count > 20) return new Response('Export rate limit exceeded', { status: 429 });

  if (user.role === 'PARENT') {
    const parent = await prisma.user.findUnique({ where: { id: user.userId }, select: { children: { select: { id: true } } } });
    const allowed = parent?.children.some((c: { id: string }) => c.id === studentId);
    if (!allowed) return new Response('Forbidden', { status: 403 });
  } else if (user.role !== 'ADMIN' && user.userId !== studentId) {
    return new Response('Forbidden', { status: 403 });
  }

  const where: any = { userId: studentId };
  if (startDate || endDate) {
    where.dateCompleted = {};
    if (startDate) where.dateCompleted.gte = new Date(startDate);
    if (endDate) where.dateCompleted.lte = new Date(endDate);
  }

  type EntryShape = {
    activityName: string;
    mappedSubject: string;
    creditsEarned: any;
    dateCompleted: Date | string;
    notes: string | null;
  };

  const entries = await prisma.transcriptEntry.findMany({
    where,
    orderBy: { dateCompleted: 'desc' },
    select: {
      activityName: true,
      mappedSubject: true,
      creditsEarned: true,
      dateCompleted: true,
      notes: true,
    },
  });

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true, parent: { select: { name: true } } },
  });

  const subjectTotals = entries.reduce((acc: Record<string, number>, e: EntryShape) => {
    const subj = e.mappedSubject || 'Unknown';
    const credits = Number(e.creditsEarned || 0);
    acc[subj] = (acc[subj] || 0) + (isNaN(credits) ? 0 : credits);
    return acc;
  }, {} as Record<string, number>);
  const totalCredits = (Object.values(subjectTotals) as number[]).reduce((a: number, b: number) => a + b, 0);
  const subjectRows = Object.entries(subjectTotals).sort(([a], [b]) => a.localeCompare(b));

  const headerBlock = React.createElement(
    View,
    null,
    React.createElement(Text, { style: styles.title }, 'Dear Adeline Academy'),
    React.createElement(Text, { style: styles.subHeader }, 'Academic Transcript'),
    React.createElement(
      Text,
      { style: styles.subHeader },
      `${student?.name || 'Student'} — ${startDate || 'start'} to ${endDate || 'present'}`,
    ),
    React.createElement(
      Text,
      null,
      `Parent/Guardian: ${student?.parent?.name || '—'} | Generated: ${new Date().toLocaleDateString()}`,
    ),
  );

  const entriesTable = React.createElement(
    View,
    null,
    React.createElement(View, { style: styles.tableHeader },
      React.createElement(Text, { style: styles.colDate }, 'Date'),
      React.createElement(Text, { style: styles.colActivity }, 'Activity'),
      React.createElement(Text, { style: styles.colSubject }, 'Subject'),
      React.createElement(Text, { style: styles.colCredits }, 'Credits'),
      React.createElement(Text, { style: styles.colNotes }, 'Notes'),
    ),
    entries.map((e: EntryShape, idx: number) =>
      React.createElement(
        View,
        { key: idx, style: styles.tableRow },
        React.createElement(Text, { style: styles.colDate }, new Date(e.dateCompleted).toLocaleDateString()),
        React.createElement(Text, { style: styles.colActivity }, e.activityName),
        React.createElement(Text, { style: styles.colSubject }, e.mappedSubject),
        React.createElement(Text, { style: styles.colCredits }, e.creditsEarned.toString()),
        React.createElement(Text, { style: styles.colNotes }, e.notes || ''),
      ),
    ),
  );

  const totalsTable = React.createElement(
    View,
    null,
    React.createElement(Text, { style: styles.sectionHeader }, 'Subject Totals'),
    subjectRows.map(([subj, credits], idx) =>
      React.createElement(
        View,
        { key: idx, style: styles.totalsRow },
        React.createElement(Text, { style: { width: '70%' } }, subj),
        React.createElement(Text, { style: { width: '30%', textAlign: 'right' } }, (credits as number).toFixed(2)),
      ),
    ),
    React.createElement(View, { style: styles.totalsRow },
      React.createElement(Text, { style: { width: '70%', fontWeight: 700 } }, 'TOTAL'),
      React.createElement(Text, { style: { width: '30%', textAlign: 'right', fontWeight: 700 } }, totalCredits.toFixed(2)),
    ),
  );

  const pdfDoc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      headerBlock,
      React.createElement(View, { style: styles.divider }),
      React.createElement(Text, { style: styles.sectionHeader }, `Entries (${entries.length})`),
      entriesTable,
      React.createElement(View, { style: styles.divider }),
      totalsTable,
    ),
  );

  const pdfStream = await pdf(pdfDoc as any).toBuffer();
  const safeName = (student?.name || 'student').toLowerCase().replace(/\s+/g, '-');
  const filename = `transcript-${safeName}-2026.pdf`;
  return new Response(new Uint8Array(pdfStream), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
