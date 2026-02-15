import prisma from '../db';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';

const GRADE_BANDS = ['K-2', '3-5', '6-8', '9-12'];

function pickGradeBand(gradeLevel?: string): string | null {
  if (!gradeLevel) return null;
  const gl = gradeLevel.toUpperCase();
  const found = GRADE_BANDS.find((b) => gl.includes(b.toUpperCase()) || gl === b.toUpperCase());
  return found || null;
}

export async function gapDetector(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const band = pickGradeBand(state.gradeLevel);
  if (!state.userId || !band) return state;

  const expectations = config.grade_expectations?.[band];
  if (!expectations || expectations.length === 0) return state;

  // Sum credits by subject from transcript entries
  const creditsBySubject: Record<string, number> = {};
  const entries = await prisma.transcriptEntry.findMany({
    where: { userId: state.userId },
    select: { mappedSubject: true, creditsEarned: true },
  });
  for (const e of entries) {
    const subj = e.mappedSubject || 'Unknown';
    const val = Number(e.creditsEarned || 0);
    creditsBySubject[subj] = (creditsBySubject[subj] || 0) + (isNaN(val) ? 0 : val);
  }

  const gaps: string[] = [];
  for (const subj of expectations) {
    const credits = creditsBySubject[subj] || 0;
    if (credits < 0.5) gaps.push(subj);
  }

  if (!gaps.length) {
    return {
      ...state,
      metadata: { ...state.metadata, gapDetector: { band, gaps: [] } },
    };
  }

  // Ensure concept records exist and create learning gaps
  for (const subj of gaps) {
    let concept = await prisma.concept.findFirst({ where: { name: subj } });
    if (!concept) {
      concept = await (prisma as any).concept.create({
        data: {
          name: subj,
          description: `${subj} mastery for grade band ${band}`,
          subjectArea: subj,
          tags: [],
          worldviewNote: '',
          sourceType: 'CURATED',
        },
      });
    }
    if (!concept) continue;

    const existingGap = await prisma.learningGap.findFirst({
      where: { conceptId: concept.id, userId: state.userId },
    });

    if (existingGap) {
      await prisma.learningGap.update({ where: { id: existingGap.id }, data: { detectedAt: new Date(), addressed: false } });
    } else {
      await (prisma as any).learningGap.create({
        data: {
          userId: state.userId,
          conceptId: concept.id,
          detectedAt: new Date(),
          severity: 'MODERATE',
          addressed: false,
        },
      });
    }
  }

  // Prepare nudge if aligned with interests
  const interests = state.studentContext?.interests || [];
  const overlap = gaps.filter((g) => interests.some((i) => i.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(i.toLowerCase())));
  const nudge = overlap.length
    ? `I noticed we haven't logged much ${overlap.join(', ')} yet. Want to add a small project to grow there?`
    : `We haven't logged credits for ${gaps.join(', ')}. Want a quick idea to close that gap?`;

  return {
    ...state,
    metadata: {
      ...state.metadata,
      gapDetector: { band, gaps },
      gapNudge: nudge,
    },
  };
}
