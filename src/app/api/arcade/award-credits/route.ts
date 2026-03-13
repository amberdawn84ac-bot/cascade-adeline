import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * Microcredit calibration rationale:
 *
 * Carnegie unit = 1 credit ≈ 120 hours of study per subject per year.
 * A typical homeschool year has ~180 instructional days, ~4-6 core subjects.
 *
 * Spelling Bee  → English Language Arts (vocabulary is ~10% of ELA credit)
 *   Correct word : 0.005 cr  — spelling one word correctly ≈ 36 seconds of focused ELA study
 *   Attempt      : 0.001 cr  — exposure/attempt with no mastery
 *
 * Typing Racer  → Technology / Computer Science (keyboarding is ~15% of tech credit)
 *   Scaled by difficulty × accuracy:
 *     easy    base 0.003  — a short, simple passage (~20 seconds)
 *     medium  base 0.006  — a paragraph-length passage (~45 seconds)
 *     hard    base 0.012  — an advanced vocabulary passage (~90 seconds)
 *   Accuracy multiplier: ≥95% → ×1.5 | ≥80% → ×1.0 | <80% → ×0.5
 *
 * Code Quest    → Computer Science (code-reading is substantive programming study)
 *   Correct answer : 0.02 cr — reading + reasoning about code (~2-3 minutes)
 *   Wrong answer   : 0.005 cr — engaged attempt, still learned from explanation
 */

type SpellingResult = { word: string; correct: boolean };
type TypingResult = { difficulty: 'easy' | 'medium' | 'hard'; wpm: number; accuracy: number };
type CodingResult = { correct: boolean; concept: string; language: string };

function calcSpellingCredits(result: SpellingResult) {
  return result.correct ? 0.005 : 0.001;
}

function calcTypingCredits(result: TypingResult) {
  const base = { easy: 0.003, medium: 0.006, hard: 0.012 }[result.difficulty] ?? 0.003;
  const mult = result.accuracy >= 95 ? 1.5 : result.accuracy >= 80 ? 1.0 : 0.5;
  return parseFloat((base * mult).toFixed(4));
}

function calcCodingCredits(result: CodingResult) {
  return result.correct ? 0.02 : 0.005;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { game, result } = await req.json();

    let creditsEarned = 0;
    let activityName = '';
    let mappedSubject = '';
    let notes = '';

    if (game === 'spelling') {
      const r = result as SpellingResult;
      creditsEarned = calcSpellingCredits(r);
      activityName = `Spelling Bee: "${r.word}"`;
      mappedSubject = 'English Language Arts';
      notes = r.correct
        ? `Correctly spelled "${r.word}" from definition and context clues`
        : `Practiced spelling "${r.word}" (word studied but not yet mastered)`;

    } else if (game === 'typing') {
      const r = result as TypingResult;
      creditsEarned = calcTypingCredits(r);
      activityName = `Typing Racer (${r.difficulty})`;
      mappedSubject = 'Technology';
      notes = `Completed ${r.difficulty} passage at ${r.wpm} WPM with ${r.accuracy}% accuracy`;

    } else if (game === 'coding') {
      const r = result as CodingResult;
      creditsEarned = calcCodingCredits(r);
      activityName = `Code Quest: ${r.concept} (${r.language})`;
      mappedSubject = 'Computer Science';
      notes = r.correct
        ? `Correctly identified ${r.concept} behavior in ${r.language}`
        : `Studied ${r.concept} in ${r.language} (reviewed explanation after incorrect attempt)`;

    } else {
      return NextResponse.json({ error: 'Unknown game type' }, { status: 400 });
    }

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName,
        mappedSubject,
        creditsEarned,
        dateCompleted: new Date(),
        notes,
        metadata: { game, result },
      },
    });

    return NextResponse.json({ creditsEarned, transcriptEntry });
  } catch (error) {
    console.error('[arcade/award-credits]', error);
    return NextResponse.json({ error: 'Failed to award credits' }, { status: 500 });
  }
}

