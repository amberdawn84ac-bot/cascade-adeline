import prisma from '../db';
import { generateText } from 'ai';
import { getModel } from '../ai-models';
import { loadConfig } from '../config';

/**
 * Standards Service — State Standards Compliance
 *
 * Ported from old dear-adeline, adapted for Prisma + AI SDK.
 * Manages state education standards (Oklahoma, Common Core, etc.),
 * skill-to-standard mappings, and student mastery tracking.
 */

export interface StandardSummary {
  id: string;
  standardCode: string;
  jurisdiction: string;
  subject: string;
  gradeLevel: string;
  statementText: string;
}

/**
 * Get or create a state standard by code.
 * If not found in DB, uses LLM to generate a description and creates it.
 */
export async function getOrCreateStandard(
  standardCode: string,
  jurisdiction: string,
  gradeLevel?: string
): Promise<StandardSummary | null> {
  try {
    // Check if standard already exists
    const existing = await prisma.stateStandard.findFirst({
      where: { standardCode, jurisdiction },
    });

    if (existing) {
      return {
        id: existing.id,
        standardCode: existing.standardCode,
        jurisdiction: existing.jurisdiction,
        subject: existing.subject,
        gradeLevel: existing.gradeLevel,
        statementText: existing.statementText,
      };
    }

    // Infer subject from standard code (e.g., OK.MATH.8.A.1 → Mathematics)
    const codeParts = standardCode.split('.');
    const subjectHint = codeParts[1] || 'General';
    const subjectMap: Record<string, string> = {
      MATH: 'Mathematics',
      ELA: 'English Language Arts',
      SCI: 'Science',
      SS: 'Social Studies',
    };
    const subject = subjectMap[subjectHint.toUpperCase()] || subjectHint;

    // Use LLM to generate the standard statement
    const config = loadConfig();
    const { text } = await generateText({
      model: getModel(config.models.default),
      maxOutputTokens: 150,
      temperature: 0,
      prompt: `What is the education standard "${standardCode}" for ${jurisdiction}? Grade level: ${gradeLevel || 'K-12'}. Return ONLY the standard statement text (1-2 sentences).`,
    });

    const created = await prisma.stateStandard.create({
      data: {
        standardCode,
        jurisdiction,
        subject,
        gradeLevel: gradeLevel || 'K-12',
        statementText: text.trim(),
      },
    });

    return {
      id: created.id,
      standardCode: created.standardCode,
      jurisdiction: created.jurisdiction,
      subject: created.subject,
      gradeLevel: created.gradeLevel,
      statementText: created.statementText,
    };
  } catch (error) {
    console.error('[StandardsService] getOrCreateStandard failed:', error);
    return null;
  }
}

/**
 * Record that a student demonstrated a standard.
 * Upgrades mastery level: INTRODUCED → DEVELOPING → PROFICIENT → MASTERED
 */
export async function recordStandardProgress(
  userId: string,
  standardId: string,
  sourceType: string,
  sourceId?: string
): Promise<void> {
  const masteryOrder = ['INTRODUCED', 'DEVELOPING', 'PROFICIENT', 'MASTERED'] as const;

  const existing = await prisma.studentStandardProgress.findUnique({
    where: { userId_standardId: { userId, standardId } },
  });

  // Determine next mastery level
  let nextMastery: typeof masteryOrder[number] = 'INTRODUCED';
  if (existing) {
    const currentIdx = masteryOrder.indexOf(existing.mastery as any);
    if (currentIdx < masteryOrder.length - 1) {
      nextMastery = masteryOrder[currentIdx + 1];
    } else {
      nextMastery = 'MASTERED'; // already at max
    }
  }

  await prisma.studentStandardProgress.upsert({
    where: { userId_standardId: { userId, standardId } },
    update: {
      mastery: nextMastery as any,
      demonstratedAt: new Date(),
      sourceType,
      sourceId,
    },
    create: {
      userId,
      standardId,
      mastery: 'INTRODUCED',
      sourceType,
      sourceId,
    },
  });
}

/**
 * Get all standards progress for a student.
 */
export async function getStudentStandardsProgress(
  userId: string,
  options?: { jurisdiction?: string; subject?: string }
) {
  return prisma.studentStandardProgress.findMany({
    where: {
      userId,
      ...(options?.jurisdiction || options?.subject
        ? {
            standard: {
              ...(options.jurisdiction ? { jurisdiction: options.jurisdiction } : {}),
              ...(options.subject ? { subject: options.subject } : {}),
            },
          }
        : {}),
    },
    include: { standard: true },
    orderBy: { demonstratedAt: 'desc' },
  });
}

/**
 * Get unmet standards for a student (standards they haven't demonstrated yet).
 */
export async function getUnmetStandards(
  userId: string,
  jurisdiction: string,
  gradeLevel: string,
  subject?: string
) {
  const allStandards = await prisma.stateStandard.findMany({
    where: {
      jurisdiction,
      gradeLevel,
      ...(subject ? { subject } : {}),
    },
  });

  const progress = await prisma.studentStandardProgress.findMany({
    where: { userId },
    select: { standardId: true, mastery: true },
  });

  const progressMap = new Map(progress.map((p) => [p.standardId, p.mastery]));

  return allStandards.filter((s) => {
    const mastery = progressMap.get(s.id);
    return !mastery || mastery === 'INTRODUCED';
  });
}

/**
 * Get a formatted summary of standards progress for prompts.
 */
export async function getStandardsSummaryForPrompt(
  userId: string,
  jurisdiction?: string
): Promise<string> {
  const progress = await getStudentStandardsProgress(userId, { jurisdiction });

  if (progress.length === 0) {
    return 'No state standards progress recorded yet.';
  }

  const bySubject = new Map<string, typeof progress>();
  for (const p of progress) {
    const subject = p.standard.subject;
    if (!bySubject.has(subject)) bySubject.set(subject, []);
    bySubject.get(subject)!.push(p);
  }

  const lines: string[] = [];
  for (const [subject, entries] of bySubject) {
    const mastered = entries.filter((e) => e.mastery === 'MASTERED').length;
    const proficient = entries.filter((e) => e.mastery === 'PROFICIENT').length;
    lines.push(`${subject}: ${mastered} mastered, ${proficient} proficient, ${entries.length} total`);
  }

  return `State Standards Progress:\n${lines.join('\n')}`;
}
