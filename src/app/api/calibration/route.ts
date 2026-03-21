import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import {
  updateSubjectBaseline,
  getSubjectLevel,
  updatePacingMultiplier,
  setTargetGraduationYear,
  autoAdvanceIfReady,
} from '@/lib/learning/calibration-engine';

/**
 * GET /api/calibration
 * Returns the current subject-specific levels for the authenticated student.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [math, ela, science, history] = await Promise.all([
    getSubjectLevel(user.userId, 'Math'),
    getSubjectLevel(user.userId, 'ELA'),
    getSubjectLevel(user.userId, 'Science'),
    getSubjectLevel(user.userId, 'History'),
  ]);

  return NextResponse.json({ math, ela, science, history });
}

/**
 * POST /api/calibration
 * Update a student's subject baseline, pacing multiplier, or graduation year.
 *
 * Body variants:
 *   { action: 'setLevel',       subject, newLevel }
 *   { action: 'autoAdvance',    subject, masteryScore, threshold? }
 *   { action: 'setPacing',      multiplier }
 *   { action: 'setGraduation',  year }
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'setLevel': {
      const { subject, newLevel } = body;
      if (!subject || newLevel == null) {
        return NextResponse.json({ error: 'subject and newLevel required' }, { status: 400 });
      }
      const result = await updateSubjectBaseline(user.userId, subject, Number(newLevel));
      return NextResponse.json(result);
    }

    case 'autoAdvance': {
      const { subject, masteryScore, threshold } = body;
      if (!subject || masteryScore == null) {
        return NextResponse.json({ error: 'subject and masteryScore required' }, { status: 400 });
      }
      const result = await autoAdvanceIfReady(
        user.userId,
        subject,
        Number(masteryScore),
        threshold != null ? Number(threshold) : undefined
      );
      return NextResponse.json(result);
    }

    case 'setPacing': {
      const { multiplier } = body;
      if (multiplier == null) {
        return NextResponse.json({ error: 'multiplier required' }, { status: 400 });
      }
      await updatePacingMultiplier(user.userId, Number(multiplier));
      return NextResponse.json({ ok: true, multiplier: Number(multiplier) });
    }

    case 'setGraduation': {
      const { year } = body;
      if (!year) {
        return NextResponse.json({ error: 'year required' }, { status: 400 });
      }
      await setTargetGraduationYear(user.userId, Number(year));
      return NextResponse.json({ ok: true, year: Number(year) });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
