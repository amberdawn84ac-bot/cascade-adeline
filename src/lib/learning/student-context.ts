import prisma from '@/lib/db';
import { getZPDSummaryForPrompt } from '@/lib/zpd-engine';
import { getRecommendedBooks } from '@/lib/learning/curated-library';

async function getRedis() {
  try {
    const { default: redis } = await import('@/lib/redis');
    return redis;
  } catch {
    return null;
  }
}

export interface TargetStandard {
  code: string;
  subject: string;
  statement: string;
  mastery: string;
}

export interface SubjectLevels {
  math: number | null;
  ela: number | null;
  science: number | null;
  history: number | null;
}

export interface StudentContext {
  name: string;
  /** Overall grade level string (e.g. "5", "K") — kept as fallback display value */
  gradeLevel: string;
  /** The resolved grade level for THIS specific interaction (may differ from gradeLevel) */
  activeGradeLevel: string;
  /** The subject this context was resolved for, if any */
  activeSubject: string | null;
  subjectLevels: SubjectLevels;
  pacingMultiplier: number;
  interests: string[];
  learningStyle: string;
  age: number | null;
  cognitiveProfile: string | null;
  bktSummary: string;
  targetStandards: TargetStandard[];
  systemPromptAddendum: string;
}

// 5-minute in-memory cache keyed by `userId:subjectArea`
interface CacheEntry {
  data: StudentContext;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const REDIS_CACHE_TTL_SEC = 30 * 60; // 30 minutes

export async function invalidateStudentContext(userId: string): Promise<void> {
  // Invalidate all subject variants for this user in memory cache
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) cache.delete(key);
  }
  
  // Invalidate in Redis cache
  const redis = await getRedis();
  if (redis) {
    try {
      const pattern = `student-context:${userId}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error('[student-context] Redis invalidation failed:', err);
    }
  }
}

/** Maps a specific grade (string or number) to the grade bands stored in StateStandard.gradeLevel */
export function gradeToBands(gradeLevel: string): string[] {
  const g = gradeLevel.trim();
  const n = parseInt(g.replace(/\D/g, ''), 10);
  if (g === 'K' || n === 0) return ['K', 'K-5'];
  if (n >= 1 && n <= 5)     return [String(n), 'K-5'];
  if (n >= 6 && n <= 8)     return [String(n), '6-8'];
  if (n >= 9 && n <= 10)    return [String(n), '9-10', '9-12'];
  if (n >= 11 && n <= 12)   return [String(n), '11-12', '9-12'];
  return [g];
}

/**
 * Maps a subject name (from API calls, LangGraph state, etc.) to a User DB field.
 * Returns the field key used in the subject-levels lookup.
 */
export function resolveSubjectKey(subject: string): keyof SubjectLevels | null {
  const s = subject.toLowerCase();
  if (s.includes('math'))                             return 'math';
  if (s.includes('ela') || s.includes('english') || s.includes('reading') || s.includes('writing') || s.includes('language')) return 'ela';
  if (s.includes('science') || s.includes('biology') || s.includes('chemistry') || s.includes('physics')) return 'science';
  if (s.includes('history') || s.includes('social') || s.includes('geography') || s.includes('civics') || s.includes('economics')) return 'history';
  return null;
}

/** Convert an Int subject level to a grade string for prompts and standards queries */
function levelToGradeString(level: number): string {
  if (level <= 0) return 'K';
  if (level >= 11) return '11-12';
  if (level >= 9) return '9-10';
  return String(level);
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
  const cacheKey = `${userId}:${opts?.subjectArea ?? 'all'}`;
  const now = Date.now();
  
  // Layer 1: In-memory cache (fastest)
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  
  // Layer 2: Redis cache (fast, shared across instances)
  const redis = await getRedis();
  if (redis) {
    try {
      const redisKey = `student-context:${cacheKey}`;
      const redisData = await redis.get(redisKey);
      if (redisData && typeof redisData === 'string') {
        const data = JSON.parse(redisData) as StudentContext;
        // Populate in-memory cache
        cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });
        return data;
      }
    } catch (err) {
      console.error('[student-context] Redis read failed:', err);
    }
  }

  // Step 1: fetch user profile including all subject-specific levels
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      gradeLevel: true,
      mathLevel: true,
      elaLevel: true,
      scienceLevel: true,
      historyLevel: true,
      pacingMultiplier: true,
      interests: true,
      learningStyle: true,
      age: true,
      metadata: true,
    },
  });

  const gradeLevel = user?.gradeLevel ?? '3';
  const subjectLevels: SubjectLevels = {
    math:    user?.mathLevel    ?? null,
    ela:     user?.elaLevel     ?? null,
    science: user?.scienceLevel ?? null,
    history: user?.historyLevel ?? null,
  };
  const pacingMultiplier = user?.pacingMultiplier ?? 1.0;

  // Resolve the grade level for THIS specific interaction
  let activeGradeLevel = gradeLevel;
  let activeSubject: string | null = null;

  if (opts?.subjectArea) {
    activeSubject = opts.subjectArea;
    const subjectKey = resolveSubjectKey(opts.subjectArea);
    if (subjectKey && subjectLevels[subjectKey] !== null) {
      activeGradeLevel = levelToGradeString(subjectLevels[subjectKey]!);
    }
  }

  // Step 2: fetch ZPD summary + target standards for the ACTIVE grade level, in parallel
  const [bktSummary, targetStandards] = await Promise.all([
    getZPDSummaryForPrompt(userId, { subjectArea: opts?.subjectArea, limit: 5 }).catch(() => ''),
    fetchTargetStandards(userId, activeGradeLevel),
  ]);

  const name = user?.name ?? 'Explorer';
  const interests = user?.interests ?? [];
  const learningStyle = user?.learningStyle ?? 'EXPEDITION';
  const age = user?.age ?? null;
  const meta = (user?.metadata ?? {}) as Record<string, unknown>;
  const cognitiveProfile = typeof meta.cognitiveProfile === 'string' ? meta.cognitiveProfile : null;

  const parts: string[] = [];

  // Grade level instruction — explicitly states whether this is subject-specific
  if (activeSubject && activeGradeLevel !== gradeLevel) {
    parts.push(
      `SUBJECT-SPECIFIC GRADE LEVEL: This student is currently working at a Grade ${activeGradeLevel} level for ${activeSubject} specifically (their overall grade is ${gradeLevel}). You MUST calibrate your vocabulary, complexity, examples, and scaffolding EXACTLY to Grade ${activeGradeLevel} for ${activeSubject}. Do NOT assume they are at grade ${gradeLevel} for this subject.`
    );
  } else {
    parts.push(
      `GRADE LEVEL: The student is in grade ${activeGradeLevel}. You MUST strictly restrict your vocabulary, math complexity, sentence length, and conceptual depth to this exact grade level. Align to Oklahoma Academic Standards (and Common Core where applicable) for grade ${activeGradeLevel}. Do NOT assume prior knowledge above this level.`
    );
  }

  if (pacingMultiplier !== 1.0) {
    const pace = pacingMultiplier > 1.0
      ? `ACCELERATED — consuming material ${Math.round((pacingMultiplier - 1) * 100)}% faster than standard pace`
      : `DECELERATED — at ${Math.round(pacingMultiplier * 100)}% of standard pace`;
    parts.push(
      `PACING: This student is on an ${pace} track. Adjust the density and depth of each interaction accordingly.`
    );
  }

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

  // SNIPER INJECTION: quietly slip in 3 unmastered grade-level standards for this subject/grade
  if (targetStandards.length > 0) {
    const standardLines = targetStandards
      .map((s, i) => `  ${i + 1}. [${s.subject}] ${s.statement} (${s.code})`)
      .join('\n');
    parts.push(
      `TARGET GRADE-LEVEL STANDARDS TO WEAVE INTO CONVERSATION:\nThe following are official grade ${activeGradeLevel} standards this student has NOT yet mastered. Without making it feel like a test, naturally weave opportunities to address these into your responses, activities, and examples:\n${standardLines}`
    );
  }

  // Inject approved reading list based on ELA level (or overall grade)
  const elaGradeNum = subjectLevels.ela !== null ? subjectLevels.ela : (() => {
    const g = gradeLevel.trim();
    if (g === 'K') return 0;
    const n = parseInt(g);
    return isNaN(n) ? 3 : n;
  })();
  const recommendedBooks = getRecommendedBooks(elaGradeNum, 5);
  if (recommendedBooks.length > 0) {
    const bookList = recommendedBooks
      .map((b) => `  • "${b.title}" by ${b.author}`)
      .join('\n');
    parts.push(
      `APPROVED READING LIST: If you suggest a book or reading assignment, you MUST ONLY choose from this exact curated public-domain list. Do NOT recommend any book outside this list or any copyrighted work:\n${bookList}`
    );
  }

  const systemPromptAddendum = `\n\nCRITICAL STUDENT ADAPTATION RULES — THESE OVERRIDE ALL OTHER DEFAULTS:\n${parts.join('\n')}`;

  const data: StudentContext = {
    name,
    gradeLevel,
    activeGradeLevel,
    activeSubject,
    subjectLevels,
    pacingMultiplier,
    interests,
    learningStyle,
    age,
    cognitiveProfile,
    bktSummary,
    targetStandards,
    systemPromptAddendum,
  };

  // Store in both cache layers
  cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });
  
  // Store in Redis (non-blocking)
  if (redis) {
    const redisKey = `student-context:${cacheKey}`;
    redis.setex(redisKey, REDIS_CACHE_TTL_SEC, JSON.stringify(data)).catch(err => {
      console.error('[student-context] Redis write failed:', err);
    });
  }
  
  return data;
}

