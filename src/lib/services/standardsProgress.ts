/**
 * standardsProgress.ts
 *
 * Server-side data utility for fetching a student's standards progress,
 * fully aware of the decoupled subject-specific grade levels.
 *
 * Data shape: SubjectTab[] — one per subject (Math, ELA, Science, History),
 * each containing domain groups, each containing individual standards with mastery.
 */

import prisma from '@/lib/db';
import { gradeToBands } from '@/lib/learning/student-context';

// ─── Domain label maps ────────────────────────────────────────────────────────

const ELA_DOMAINS: Record<string, string> = {
  RL:  'Reading: Literature',
  RI:  'Reading: Informational Text',
  RF:  'Reading: Foundational Skills',
  W:   'Writing',
  SL:  'Speaking & Listening',
  L:   'Language',
};

const MATH_DOMAINS: Record<string, string> = {
  OA:  'Operations & Algebraic Thinking',
  NBT: 'Number & Operations in Base Ten',
  NF:  'Number & Operations — Fractions',
  MD:  'Measurement & Data',
  G:   'Geometry',
  RP:  'Ratios & Proportional Relationships',
  NS:  'The Number System',
  EE:  'Expressions & Equations',
  F:   'Functions',
  SP:  'Statistics & Probability',
  A:   'Algebra',
};

const SCIENCE_DOMAINS: Record<string, string> = {
  PS:  'Physical Science',
  LS:  'Life Science',
  ESS: 'Earth & Space Science',
  ETS: 'Engineering & Technology',
};

const HISTORY_DOMAINS: Record<string, string> = {
  H:   'History',
  G:   'Geography',
  E:   'Economics',
  C:   'Civics',
  SS:  'Social Studies',
};

const DOMAIN_MAPS: Record<string, Record<string, string>> = {
  'Mathematics':            MATH_DOMAINS,
  'Math':                   MATH_DOMAINS,
  'English Language Arts':  ELA_DOMAINS,
  'ELA':                    ELA_DOMAINS,
  'Science':                SCIENCE_DOMAINS,
  'Social Studies':         HISTORY_DOMAINS,
  'History':                HISTORY_DOMAINS,
  'Practical Arts':         {},
};

/**
 * Extract a domain code from a standard code.
 * Handles patterns like:
 *   OK.MATH.3.OA.1      → "OA"
 *   OK.ELA.3.RL.3       → "RL"
 *   OK.SCI.3.LS.1       → "LS"
 *   CCSS.Math.3.OA.A.1  → "OA"
 *   OK.FCS.K5.3         → "FCS"
 */
function extractDomainCode(code: string): string {
  const parts = code.split('.');
  // Skip the jurisdiction prefix (e.g. "OK", "CCSS")
  // and the subject segment (e.g. "MATH", "ELA")
  // The domain is typically segment index 3 (0-based)
  if (parts.length >= 4) return parts[3];
  if (parts.length === 3) return parts[2];
  return 'General';
}

function domainLabel(subjectName: string, domainCode: string): string {
  const map = DOMAIN_MAPS[subjectName] ?? {};
  return map[domainCode] ?? domainCode;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StandardEntry {
  id: string;
  code: string;
  statement: string;
  mastery: string;
  masteryPct: number;
  demonstratedAt: string | null;
}

export interface DomainGroup {
  domainCode: string;
  domainLabel: string;
  standards: StandardEntry[];
  summary: { total: number; mastered: number; pct: number };
}

export interface SubjectTab {
  subject: string;
  gradeLevel: number;
  gradeName: string;
  domains: DomainGroup[];
  summary: { total: number; mastered: number; pct: number };
}

export interface StandardsProgressResult {
  studentName: string;
  tabs: SubjectTab[];
  overallSummary: { total: number; mastered: number; pct: number };
}

// ─── Mastery level → numeric 0-100 ───────────────────────────────────────────

const MASTERY_PCT: Record<string, number> = {
  MASTERED:    100,
  PROFICIENT:   80,
  DEVELOPING:   50,
  INTRODUCED:   20,
  NOT_STARTED:   0,
};

// ─── Subject → DB field mapping ───────────────────────────────────────────────

const SUBJECT_LEVEL_FIELDS = [
  { subject: 'Mathematics',           dbField: 'mathLevel'    as const },
  { subject: 'English Language Arts', dbField: 'elaLevel'     as const },
  { subject: 'Science',               dbField: 'scienceLevel' as const },
  { subject: 'Social Studies',        dbField: 'historyLevel' as const },
  { subject: 'Practical Arts',        dbField: null },
];

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getStudentStandardsProgress(
  userId: string,
  opts?: { jurisdiction?: string }
): Promise<StandardsProgressResult> {
  const jurisdiction = opts?.jurisdiction ?? 'Oklahoma';

  // 1. Fetch user with all subject levels
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      gradeLevel: true,
      mathLevel: true,
      elaLevel: true,
      scienceLevel: true,
      historyLevel: true,
    },
  });

  const fallbackLevel = (() => {
    const g = user?.gradeLevel ?? '3';
    if (g.toLowerCase() === 'k') return 0;
    const n = parseInt(g);
    return isNaN(n) ? 3 : n;
  })();

  // 2. Fetch ALL progress records for this student (one query, not per-subject)
  const allProgress = await prisma.studentStandardProgress.findMany({
    where: { userId },
    select: { standardId: true, mastery: true, demonstratedAt: true },
  });
  const progressMap = new Map(allProgress.map((p) => [p.standardId, p]));

  // 3. Build a tab per subject
  const tabs: SubjectTab[] = [];
  let totalAll = 0;
  let masteredAll = 0;

  for (const { subject, dbField } of SUBJECT_LEVEL_FIELDS) {
    const rawLevel: number | null = dbField ? (user?.[dbField] ?? null) : null;
    const gradeLevel = rawLevel ?? fallbackLevel;
    const bands = gradeToBands(String(gradeLevel === 0 ? 'K' : gradeLevel));

    // 4. Fetch standards for this subject + grade bands
    const standards = await prisma.stateStandard.findMany({
      where: {
        jurisdiction,
        subject,
        gradeLevel: { in: bands },
      },
      orderBy: [{ gradeLevel: 'asc' }, { standardCode: 'asc' }],
    });

    if (standards.length === 0) continue;

    // 5. Build domain groups
    const domainMap = new Map<string, StandardEntry[]>();

    for (const s of standards) {
      const domCode = extractDomainCode(s.standardCode);
      if (!domainMap.has(domCode)) domainMap.set(domCode, []);
      const prog = progressMap.get(s.id);
      const mastery = prog?.mastery ?? 'NOT_STARTED';
      domainMap.get(domCode)!.push({
        id: s.id,
        code: s.standardCode,
        statement: s.statementText,
        mastery,
        masteryPct: MASTERY_PCT[mastery] ?? 0,
        demonstratedAt: prog?.demonstratedAt?.toISOString() ?? null,
      });
    }

    const domains: DomainGroup[] = [];
    let subjectTotal = 0;
    let subjectMastered = 0;

    for (const [domCode, entries] of domainMap) {
      const mastered = entries.filter(
        (e) => e.mastery === 'MASTERED' || e.mastery === 'PROFICIENT'
      ).length;
      domains.push({
        domainCode: domCode,
        domainLabel: domainLabel(subject, domCode),
        standards: entries,
        summary: {
          total: entries.length,
          mastered,
          pct: entries.length > 0 ? Math.round((mastered / entries.length) * 100) : 0,
        },
      });
      subjectTotal += entries.length;
      subjectMastered += mastered;
    }

    totalAll += subjectTotal;
    masteredAll += subjectMastered;

    tabs.push({
      subject,
      gradeLevel,
      gradeName: gradeLevel === 0 ? 'Kindergarten' : `Grade ${gradeLevel}`,
      domains,
      summary: {
        total: subjectTotal,
        mastered: subjectMastered,
        pct: subjectTotal > 0 ? Math.round((subjectMastered / subjectTotal) * 100) : 0,
      },
    });
  }

  return {
    studentName: user?.name ?? 'Student',
    tabs,
    overallSummary: {
      total: totalAll,
      mastered: masteredAll,
      pct: totalAll > 0 ? Math.round((masteredAll / totalAll) * 100) : 0,
    },
  };
}
