import prisma from '@/lib/db';

export async function buildStudentContextPrompt(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gradeLevel: true,
      interests: true,
      learningStyle: true,
      metadata: true,
    },
  });

  if (!user) return '';

  const grade = user.gradeLevel ?? null;
  const interests = user.interests ?? [];
  const style = user.learningStyle ?? null;
  const meta = (user.metadata ?? {}) as Record<string, unknown>;
  const cognitiveProfile = typeof meta.cognitiveProfile === 'string' ? meta.cognitiveProfile : null;

  const parts: string[] = [];

  if (grade) {
    parts.push(
      `GRADE LEVEL: The student is in grade ${grade}. You MUST strictly restrict your vocabulary, math complexity, sentence length, and conceptual depth to this exact grade level. Do NOT assume prior knowledge above this level.`
    );
  }

  if (interests.length > 0) {
    parts.push(
      `INTERESTS: Their passions are: ${interests.join(', ')}. You MUST weave these directly into your analogies, examples, and real-world connections. A student who loves horses should see physics through horse mechanics. A student who loves cooking should see chemistry through the kitchen.`
    );
  }

  if (style) {
    parts.push(
      `LEARNING STYLE: Their learning modality is "${style}". Structure your explanation to perfectly match this. Visual learners get diagrams described. Kinesthetic learners get step-by-step hands-on actions. Auditory learners get rhythm and narrative.`
    );
  }

  if (cognitiveProfile) {
    parts.push(
      `COGNITIVE PROFILE: ${cognitiveProfile}. Use this profile to further shape how you sequence information and how you scaffold complexity.`
    );
  }

  if (parts.length === 0) return '';

  return `\n\nCRITICAL STUDENT ADAPTATION RULES — THESE OVERRIDE ALL OTHER DEFAULTS:\n${parts.join('\n')}`;
}
