import prisma from '../db';
import { generateText } from 'ai';
import { getModel } from '../ai-models';
import { loadConfig } from '../config';

/**
 * Grade band mapping — maps a student's specific grade (e.g. "5") to the
 * grade bands used in the StateStandard table (e.g. "5", "K-5", "6-8", "9-10", "9-12").
 */
function getStandardGradeBands(gradeLevel: string): string[] {
  const g = gradeLevel.trim();
  const n = parseInt(g.replace(/\D/g, ''), 10);

  if (g === 'K' || n === 0) return ['K', 'K-5'];
  if (n >= 1 && n <= 5)  return [String(n), 'K-5'];
  if (n >= 6 && n <= 8)  return [String(n), '6-8'];
  if (n >= 9 && n <= 10) return [String(n), '9-10', '9-12'];
  if (n >= 11 && n <= 12) return [String(n), '11-12', '9-12'];
  return [g];
}

/**
 * Ensure a student has StudentStandardProgress rows for every standard
 * relevant to their current grade level. Called when grade is set or changed.
 * Uses INTRODUCED as the default mastery — just ensures the checklist exists.
 */
export async function ensureStudentStandardsLoaded(
  userId: string,
  gradeLevel: string,
  jurisdiction = 'Oklahoma'
): Promise<number> {
  const bands = getStandardGradeBands(gradeLevel);

  const standards = await prisma.stateStandard.findMany({
    where: {
      jurisdiction,
      gradeLevel: { in: bands },
    },
    select: { id: true },
  });

  if (standards.length === 0) return 0;

  // Upsert only — never downgrade mastery on existing rows
  const existingIds = new Set(
    (await prisma.studentStandardProgress.findMany({
      where: { userId, standardId: { in: standards.map((s) => s.id) } },
      select: { standardId: true },
    })).map((r) => r.standardId)
  );

  const toCreate = standards
    .filter((s) => !existingIds.has(s.id))
    .map((s) => ({
      userId,
      standardId: s.id,
      mastery: 'INTRODUCED' as const,
      sourceType: 'system',
    }));

  if (toCreate.length > 0) {
    await prisma.studentStandardProgress.createMany({ data: toCreate });
  }

  return toCreate.length;
}

/**
 * Use an LLM to identify which specific standards from a list are
 * addressed by a given activity description. Returns matched standard IDs.
 */
export async function matchActivityToStandards(
  activityDescription: string,
  gradeLevel: string,
  userId: string,
  jurisdiction = 'Oklahoma'
): Promise<string[]> {
  try {
    const bands = getStandardGradeBands(gradeLevel);

    const standards = await prisma.stateStandard.findMany({
      where: { jurisdiction, gradeLevel: { in: bands } },
      select: { id: true, standardCode: true, subject: true, statementText: true },
      take: 60, // keep prompt size manageable
    });

    if (standards.length === 0) return [];

    const config = loadConfig();
    const standardsList = standards
      .map((s) => `${s.standardCode}: ${s.statementText}`)
      .join('\n');

    const { text } = await generateText({
      model: getModel(config.models.default),
      temperature: 0,
      maxOutputTokens: 200,
      prompt: `A student in grade ${gradeLevel} did the following activity:
"${activityDescription}"

Below are academic standards for their grade level. Return ONLY a JSON array of the standard codes that this activity genuinely addresses (be conservative — only include real matches, max 5):
${standardsList}

Return ONLY valid JSON like: ["OK.MATH.3.MD.2", "OK.FCS.K5.3"]
If nothing matches, return: []`,
    });

    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const codes: string[] = JSON.parse(cleanText);
    if (!Array.isArray(codes)) return [];

    return standards
      .filter((s) => codes.includes(s.standardCode))
      .map((s) => s.id);
  } catch (err) {
    console.warn('[standardsService] matchActivityToStandards failed:', err);
    return [];
  }
}

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

