import prisma from '@/lib/db';
import { getZPDSummaryForPrompt } from '@/lib/zpd-engine';

export interface TargetStandard {
  code: string;
  subject: string;
  statement: string;
  mastery: string;
}

export interface StudentContext {
  name: string;
  gradeLevel: string;
  interests: string[];
  learningStyle: string;
  age: number | null;
  cognitiveProfile: string | null;
  bktSummary: string;
  targetStandards: TargetStandard[];
  systemPromptAddendum: string;
}

// 5-minute in-memory cache — student profile data changes rarely
interface CacheEntry {
  data: StudentContext;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateStudentContext(userId: string): void {
  cache.delete(userId);
}

/** Maps a specific grade to the grade bands stored in StateStandard.gradeLevel */
function gradeToBands(gradeLevel: string): string[] {
  const g = gradeLevel.trim();
  const n = parseInt(g.replace(/\D/g, ''), 10);
  if (g === 'K' || n === 0) return ['K', 'K-5'];
  if (n >= 1 && n <= 5)     return [String(n), 'K-5'];
  if (n >= 6 && n <= 8)     return [String(n), '6-8'];
  if (n >= 9 && n <= 10)    return [String(n), '9-10', '9-12'];
  if (n >= 11 && n <= 12)   return [String(n), '11-12', '9-12'];
  return [g];
}

/** Fetch the top 3 standards this student hasn't mastered yet for their grade. */
async function fetchTargetStandards(userId: string, gradeLevel: string): Promise<TargetStandard[]> {
  try {
    const bands = gradeToBands(gradeLevel);

    // Prefer standards already in progress (INTRODUCED/DEVELOPING) over unstarted ones
    const inProgress = await prisma.studentStandardProgress.findMany({
      where: {
        userId,
        mastery: { in: ['INTRODUCED', 'DEVELOPING'] },
        standard: { gradeLevel: { in: bands } },
      },
      include: { standard: true },
      orderBy: { demonstratedAt: 'asc' },
      take: 3,
    });

    if (inProgress.length >= 3) {
      return inProgress.map((p) => ({
        code: p.standard.standardCode,
        subject: p.standard.subject,
        statement: p.standard.statementText,
        mastery: p.mastery,
      }));
    }

    // Fallback: grab any grade-level standards not yet touched at all
    const existingIds = new Set(
      (await prisma.studentStandardProgress.findMany({
        where: { userId },
        select: { standardId: true },
      })).map((r) => r.standardId)
    );

    const untouched = await prisma.stateStandard.findMany({
      where: {
        gradeLevel: { in: bands },
        jurisdiction: 'Oklahoma',
        id: existingIds.size > 0 ? { notIn: [...existingIds] } : undefined,
      },
      orderBy: { standardCode: 'asc' },
      take: 3 - inProgress.length,
    });

    const fallback: TargetStandard[] = untouched.map((s) => ({
      code: s.standardCode,
      subject: s.subject,
      statement: s.statementText,
      mastery: 'NOT_STARTED',
    }));

    return [
      ...inProgress.map((p) => ({
        code: p.standard.standardCode,
        subject: p.standard.subject,
        statement: p.standard.statementText,
        mastery: p.mastery,
      })),
      ...fallback,
    ];
  } catch {
    return [];
  }
}

export async function getStudentContext(userId: string, opts?: { subjectArea?: string }): Promise<StudentContext> {
  const now = Date.now();
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  // Step 1: fetch user profile (needed to determine grade for standards query)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, gradeLevel: true, interests: true, learningStyle: true, age: true, metadata: true },
  });

  const gradeLevel = user?.gradeLevel ?? '3';

  // Step 2: fetch ZPD summary + target standards in parallel
  const [bktSummary, targetStandards] = await Promise.all([
    getZPDSummaryForPrompt(userId, { subjectArea: opts?.subjectArea, limit: 5 }).catch(() => ''),
    fetchTargetStandards(userId, gradeLevel),
  ]);

  const name = user?.name ?? 'Explorer';
  const interests = user?.interests ?? [];
  const learningStyle = user?.learningStyle ?? 'EXPEDITION';
  const age = user?.age ?? null;
  const meta = (user?.metadata ?? {}) as Record<string, unknown>;
  const cognitiveProfile = typeof meta.cognitiveProfile === 'string' ? meta.cognitiveProfile : null;

  const parts: string[] = [];

  parts.push(
    `GRADE LEVEL: The student is in grade ${gradeLevel}. You MUST strictly restrict your vocabulary, math complexity, sentence length, and conceptual depth to this exact grade level. Align to Oklahoma Academic Standards (and Common Core where applicable) for grade ${gradeLevel}. Do NOT assume prior knowledge above this level.`
  );

  if (interests.length > 0) {
    parts.push(
      `INTERESTS: Their passions are: ${interests.join(', ')}. You MUST weave these directly into your analogies, examples, and real-world connections. A student who loves horses should see physics through horse mechanics. A student who loves cooking should see chemistry through the kitchen.`
    );
  }

  if (learningStyle) {
    parts.push(
      `LEARNING STYLE: Their learning modality is "${learningStyle}". Structure your explanation to perfectly match this. Visual learners get diagrams described. Kinesthetic learners get step-by-step hands-on actions. Auditory learners get rhythm and narrative.`
    );
  }

  if (cognitiveProfile) {
    parts.push(
      `COGNITIVE PROFILE: ${cognitiveProfile}. Use this profile to further shape how you sequence information and how you scaffold complexity.`
    );
  }

  if (bktSummary) {
    parts.push(
      `MASTERY & ZPD: ${bktSummary}\nAddress concepts in the student's Zone of Proximal Development. Challenge them appropriately — do not teach below their demonstrated mastery level.`
    );
  }

  // SNIPER INJECTION: quietly slip in 3 unmastered grade-level standards
  if (targetStandards.length > 0) {
    const standardLines = targetStandards
      .map((s, i) => `  ${i + 1}. [${s.subject}] ${s.statement} (${s.code})`)
      .join('\n');
    parts.push(
      `TARGET GRADE-LEVEL STANDARDS TO WEAVE INTO CONVERSATION:\nThe following are official grade ${gradeLevel} standards this student has NOT yet mastered. Without making it feel like a test, naturally weave opportunities to address these into your responses, activities, and examples:\n${standardLines}`
    );
  }

  const systemPromptAddendum = `\n\nCRITICAL STUDENT ADAPTATION RULES — THESE OVERRIDE ALL OTHER DEFAULTS:\n${parts.join('\n')}`;

  const data: StudentContext = {
    name,
    gradeLevel,
    interests,
    learningStyle,
    age,
    cognitiveProfile,
    bktSummary,
    targetStandards,
    systemPromptAddendum,
  };

  cache.set(userId, { data, expiresAt: now + CACHE_TTL_MS });
  return data;
}

