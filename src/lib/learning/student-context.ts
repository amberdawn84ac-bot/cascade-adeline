import prisma from '@/lib/db';
import { getZPDSummaryForPrompt } from '@/lib/zpd-engine';

export interface StudentContext {
  gradeLevel: string;
  interests: string[];
  learningStyle: string;
  cognitiveProfile: string | null;
  bktSummary: string;
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

export async function getStudentContext(userId: string, opts?: { subjectArea?: string }): Promise<StudentContext> {
  const now = Date.now();
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const [user, bktSummary] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { gradeLevel: true, interests: true, learningStyle: true, metadata: true },
    }),
    getZPDSummaryForPrompt(userId, { subjectArea: opts?.subjectArea, limit: 5 }).catch(() => ''),
  ]);

  const gradeLevel = user?.gradeLevel ?? '3';
  const interests = user?.interests ?? [];
  const learningStyle = user?.learningStyle ?? 'EXPEDITION';
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

  const systemPromptAddendum = `\n\nCRITICAL STUDENT ADAPTATION RULES — THESE OVERRIDE ALL OTHER DEFAULTS:\n${parts.join('\n')}`;

  const data: StudentContext = {
    gradeLevel,
    interests,
    learningStyle,
    cognitiveProfile,
    bktSummary,
    systemPromptAddendum,
  };

  cache.set(userId, { data, expiresAt: now + CACHE_TTL_MS });
  return data;
}

// Backwards-compatible shim — callers not yet migrated can still import this
export async function buildStudentContextPrompt(userId: string): Promise<string> {
  const ctx = await getStudentContext(userId);
  return ctx.systemPromptAddendum;
}

