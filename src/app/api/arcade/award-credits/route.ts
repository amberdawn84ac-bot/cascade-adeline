import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * STANDARDS-BASED MICROCREDIT SYSTEM
 * 
 * Credits are awarded based on MASTERY of specific learning standards, not time spent.
 * Each subject has defined learning objectives that must be demonstrated for credit.
 * 
 * Carnegie unit = 1 credit per subject per year
 * We reverse-engineer: What % of the total subject standards does this activity demonstrate?
 * 
 * ENGLISH LANGUAGE ARTS (Spelling Bee)
 * - Total ELA standards for one year ≈ 200 specific vocabulary/spelling objectives
 * - Mastering ONE word from grade-level list = 1/200 of vocabulary standards = 0.005 cr
 * - Partial mastery (incorrect but attempted) = 0.001 cr (exposure counts)
 * - Mastery requires: correct spelling + understanding definition + using in context
 * 
 * TECHNOLOGY (Typing Racer)
 * - Total keyboarding standards ≈ WPM benchmarks + accuracy + proper technique
 * - Grade-level typing mastery targets:
 *   - Elementary (K-5): 15-25 WPM at 90% accuracy
 *   - Middle (6-8): 30-40 WPM at 92% accuracy  
 *   - High (9-12): 45+ WPM at 95% accuracy
 * - Each passage demonstrates progress toward these benchmarks
 * - Credit = (performance / benchmark) × difficulty weight × 0.01
 * 
 * COMPUTER SCIENCE (Code Quest)
 * - Total CS standards for one year ≈ 50 core programming concepts
 * - Mastering ONE concept (variables, loops, functions, etc.) = 1/50 = 0.02 cr
 * - Partial understanding (incorrect but engaged) = 0.005 cr
 * - Mastery requires: reading code + predicting behavior + explaining why
 */

type SpellingResult = { word: string; correct: boolean; gradeLevel?: number };
type TypingResult = { 
  difficulty: 'easy' | 'medium' | 'hard'; 
  wpm: number; 
  accuracy: number;
  gradeLevel?: number;
};
type CodingResult = { 
  correct: boolean; 
  concept: string; 
  language: string;
  isNewConcept?: boolean; // First time mastering this concept
};
type LogicResult = {
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
};
type CartographerResult = {
  era: string;
  score: number;
};
type ReviewResult = {
  conceptName: string;
  quality: number; // 0-5 SM-2 quality score
};

function calcSpellingCredits(result: SpellingResult) {
  // Mastery of one grade-level vocabulary word = 1/200 of annual ELA vocabulary standards
  if (result.correct) {
    return 0.005; // Demonstrated mastery of this specific learning objective
  } else {
    return 0.001; // Exposure and attempt (partial progress toward mastery)
  }
}

function calcTypingCredits(result: TypingResult) {
  const gradeLevel = result.gradeLevel ?? 9; // Default to high school
  
  // Define mastery benchmarks by grade level
  const benchmarks = {
    elementary: { wpm: 20, accuracy: 90 },  // K-5
    middle: { wpm: 35, accuracy: 92 },      // 6-8
    high: { wpm: 45, accuracy: 95 }         // 9-12
  };
  
  const benchmark = gradeLevel <= 5 ? benchmarks.elementary :
                    gradeLevel <= 8 ? benchmarks.middle :
                    benchmarks.high;
  
  // Calculate performance ratio against grade-level standard
  const wpmRatio = Math.min(result.wpm / benchmark.wpm, 1.5); // Cap at 150% of benchmark
  const accuracyRatio = result.accuracy / benchmark.accuracy;
  const performanceScore = (wpmRatio + accuracyRatio) / 2;
  
  // Difficulty weights represent % of total typing standards demonstrated
  const difficultyWeight = {
    easy: 0.5,    // Basic passages (50% complexity)
    medium: 1.0,  // Standard passages (100% complexity)
    hard: 1.5     // Advanced passages (150% complexity)
  }[result.difficulty] ?? 1.0;
  
  // Base credit represents demonstrating typing standards
  const baseCredit = 0.01; // Each passage = 1/100 of annual typing practice
  
  return parseFloat((baseCredit * performanceScore * difficultyWeight).toFixed(4));
}

function calcCodingCredits(result: CodingResult) {
  // Mastery of one programming concept = 1/50 of annual CS standards
  if (result.correct) {
    // Award bonus for first-time mastery of a new concept
    const masteryBonus = result.isNewConcept ? 1.5 : 1.0;
    return parseFloat((0.02 * masteryBonus).toFixed(4));
  } else {
    return 0.005; // Partial understanding (exposure to concept)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { game, result } = await req.json();

    // Get student's learning plan
    const learningPlan = await prisma.learningPlan.findUnique({
      where: { userId: user.userId },
      include: {
        planStandards: {
          where: { isActive: true },
          include: {
            standard: true,
            activities: true,
          },
        },
      },
    });

    let creditsEarned = 0;
    let activityName = '';
    let mappedSubject = '';
    let notes = '';
    let planStandardId: string | null = null;
    let masteryEvidence: any = null;

    if (game === 'spelling') {
      const r = result as SpellingResult;
      
      // Find the vocabulary standard for this word in the student's plan
      const vocabStandard = learningPlan?.planStandards.find(ps => 
        ps.standard.subject === 'English Language Arts' &&
        ps.standard.standardCode.includes('VOCAB') &&
        ps.activities.some(a => a.activityType === 'spelling')
      );

      if (vocabStandard) {
        // Use the microcredit value from the student's plan
        creditsEarned = r.correct ? Number(vocabStandard.microcreditValue) : Number(vocabStandard.microcreditValue) * 0.2;
        planStandardId = vocabStandard.id;
      } else {
        // Fallback to default calculation if no plan exists
        creditsEarned = calcSpellingCredits(r);
      }

      activityName = `Spelling Bee: "${r.word}"`;
      mappedSubject = 'English Language Arts';
      notes = r.correct
        ? `Correctly spelled "${r.word}" from definition and context clues`
        : `Practiced spelling "${r.word}" (word studied but not yet mastered)`;
      masteryEvidence = {
        word: r.word,
        correct: r.correct,
        masteryDemonstrated: r.correct,
      };

    } else if (game === 'typing') {
      const r = result as TypingResult;
      
      // Find the keyboarding standard for this grade level
      const typingStandard = learningPlan?.planStandards.find(ps =>
        ps.standard.subject === 'Technology' &&
        ps.standard.standardCode.includes('KEYBOARDING') &&
        ps.activities.some(a => a.activityType === 'typing')
      );

      if (typingStandard) {
        // Calculate performance-based credit from plan standard
        const gradeLevel = r.gradeLevel ?? 9;
        const benchmarks = {
          elementary: { wpm: 20, accuracy: 90 },
          middle: { wpm: 35, accuracy: 92 },
          high: { wpm: 45, accuracy: 95 }
        };
        const benchmark = gradeLevel <= 5 ? benchmarks.elementary :
                          gradeLevel <= 8 ? benchmarks.middle : benchmarks.high;
        
        const wpmRatio = Math.min(r.wpm / benchmark.wpm, 1.5);
        const accuracyRatio = r.accuracy / benchmark.accuracy;
        const performanceScore = (wpmRatio + accuracyRatio) / 2;
        const difficultyWeight = { easy: 0.5, medium: 1.0, hard: 1.5 }[r.difficulty] ?? 1.0;
        
        creditsEarned = Number(typingStandard.microcreditValue) * performanceScore * difficultyWeight;
        planStandardId = typingStandard.id;
      } else {
        creditsEarned = calcTypingCredits(r);
      }

      activityName = `Typing Racer (${r.difficulty})`;
      mappedSubject = 'Technology';
      notes = `Completed ${r.difficulty} passage at ${r.wpm} WPM with ${r.accuracy}% accuracy`;
      masteryEvidence = {
        wpm: r.wpm,
        accuracy: r.accuracy,
        difficulty: r.difficulty,
        benchmarkMet: r.wpm >= (r.gradeLevel && r.gradeLevel <= 5 ? 20 : r.gradeLevel && r.gradeLevel <= 8 ? 35 : 45),
      };

    } else if (game === 'coding') {
      const r = result as CodingResult;
      
      // Find the CS concept standard
      const csStandard = learningPlan?.planStandards.find(ps =>
        ps.standard.subject === 'Computer Science' &&
        ps.standard.standardCode.includes('CONCEPTS') &&
        ps.activities.some(a => a.activityType === 'coding')
      );

      if (csStandard) {
        const masteryBonus = r.isNewConcept ? 1.5 : 1.0;
        creditsEarned = r.correct ? Number(csStandard.microcreditValue) * masteryBonus : Number(csStandard.microcreditValue) * 0.25;
        planStandardId = csStandard.id;
      } else {
        creditsEarned = calcCodingCredits(r);
      }

      activityName = `Code Quest: ${r.concept} (${r.language})`;
      mappedSubject = 'Computer Science';
      notes = r.correct
        ? `Correctly identified ${r.concept} behavior in ${r.language}`
        : `Studied ${r.concept} in ${r.language} (reviewed explanation after incorrect attempt)`;
      masteryEvidence = {
        concept: r.concept,
        language: r.language,
        correct: r.correct,
        isNewConcept: r.isNewConcept,
      };

    } else if (game === 'logic') {
      const r = result as LogicResult;
      const diffMultiplier = r.difficulty === 'easy' ? 1 : r.difficulty === 'medium' ? 1.5 : 2;
      // Each puzzle solved = demonstrating one math reasoning standard (1/120 of annual math objectives)
      const puzzlesSolved = Math.max(1, Math.round(r.score / 10));
      creditsEarned = parseFloat((puzzlesSolved * 0.008 * diffMultiplier).toFixed(4));

      const mathStandard = learningPlan?.planStandards.find(ps =>
        ps.standard.subject === 'Mathematics' &&
        ps.activities.some(a => a.activityType === 'logic')
      );
      if (mathStandard) {
        creditsEarned = parseFloat((Number(mathStandard.microcreditValue) * puzzlesSolved * diffMultiplier).toFixed(4));
        planStandardId = mathStandard.id;
      }

      activityName = `Logic Labyrinth (${r.difficulty})`;
      mappedSubject = 'Mathematics';
      notes = `Completed ${puzzlesSolved} logic puzzles at ${r.difficulty} difficulty (score: ${r.score})`;
      masteryEvidence = { difficulty: r.difficulty, score: r.score, puzzlesSolved };

    } else if (game === 'cartographer') {
      const r = result as CartographerResult;
      // Each correct answer = demonstrating knowledge of one historical geography objective (1/100 of annual Social Studies)
      const questionsCorrect = Math.max(1, Math.round(r.score / 10));
      creditsEarned = parseFloat((questionsCorrect * 0.006).toFixed(4));

      const historyStandard = learningPlan?.planStandards.find(ps =>
        (ps.standard.subject === 'Social Studies' || ps.standard.subject === 'History') &&
        ps.activities.some(a => a.activityType === 'cartographer')
      );
      if (historyStandard) {
        creditsEarned = parseFloat((Number(historyStandard.microcreditValue) * questionsCorrect).toFixed(4));
        planStandardId = historyStandard.id;
      }

      const eraLabels: Record<string, string> = {
        rome: 'Roman Empire', egypt: 'Ancient Egypt',
        colonial: 'Colonial America', medieval: 'Medieval Europe',
      };
      activityName = `Historical Cartographer: ${eraLabels[r.era] ?? r.era}`;
      mappedSubject = 'Social Studies';
      notes = `Answered ${questionsCorrect} questions correctly in ${eraLabels[r.era] ?? r.era} era (score: ${r.score})`;
      masteryEvidence = { era: r.era, score: r.score, questionsCorrect };

    } else if (game === 'review') {
      const r = result as ReviewResult;
      // Successful spaced repetition recall (quality >= 3) = 0.005 cr (reinforcement of mastered concept)
      const recalled = r.quality >= 3;
      creditsEarned = recalled ? 0.005 : 0.001;

      activityName = `Spaced Repetition Review: "${r.conceptName}"`;
      mappedSubject = 'General';
      notes = recalled
        ? `Successfully recalled "${r.conceptName}" (SM-2 quality: ${r.quality}/5)`
        : `Reviewed "${r.conceptName}" — needs more practice (SM-2 quality: ${r.quality}/5)`;
      masteryEvidence = { conceptName: r.conceptName, quality: r.quality, recalled };

    } else {
      return NextResponse.json({ error: 'Unknown game type' }, { status: 400 });
    }

    // Update student standard progress if linked to a plan standard
    if (planStandardId && learningPlan) {
      const planStandard = learningPlan.planStandards.find(ps => ps.id === planStandardId);
      if (planStandard) {
        await prisma.studentStandardProgress.upsert({
          where: {
            userId_standardId: {
              userId: user.userId,
              standardId: planStandard.standardId,
            },
          },
          update: {
            microcreditsEarned: {
              increment: creditsEarned,
            },
            lastActivityAt: new Date(),
            mastery: creditsEarned > 0 ? 'DEVELOPING' : 'INTRODUCED',
          },
          create: {
            userId: user.userId,
            standardId: planStandard.standardId,
            microcreditsEarned: creditsEarned,
            lastActivityAt: new Date(),
            mastery: creditsEarned > 0 ? 'DEVELOPING' : 'INTRODUCED',
            evidence: masteryEvidence,
          },
        });
      }
    }

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName,
        mappedSubject,
        creditsEarned,
        dateCompleted: new Date(),
        notes,
        planStandardId,
        masteryEvidence,
        metadata: { game, result },
      },
    });

    // Record activity duration for analytics (non-blocking)
    prisma.userActivity.create({
      data: {
        userId: user.userId,
        activityType: `arcade_${game}`,
        duration: 5, // arcade sessions average ~5 min; could be passed from client in future
        metadata: { game, creditsEarned, mappedSubject },
      },
    }).catch(() => {});

    return NextResponse.json({ 
      creditsEarned, 
      transcriptEntry,
      standardLinked: !!planStandardId,
    });
  } catch (error) {
    console.error('[arcade/award-credits]', error);
    return NextResponse.json({ error: 'Failed to award credits' }, { status: 500 });
  }
}

