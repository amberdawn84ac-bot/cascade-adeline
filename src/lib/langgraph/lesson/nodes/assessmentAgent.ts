import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { LessonBlock, LessonStateType } from '../lessonState';
import { safeStructuredInvoke } from '../safeInvoke';

const assessmentSchema = z.object({
  quizQuestions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).min(3).max(4),
    correctIndex: z.number().min(0).max(3),
    explanation: z.string(),
  })).min(2).max(4),
  flashcards: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    example: z.string().nullish(),
    category: z.string().nullish(),
  })).min(2).max(5),
});

const ASSESSMENT_BLOCK_TYPES = ['quiz', 'vocab_tooltip'];

export async function assessmentAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  if (state.blueprint && !state.blueprint.some(t => ASSESSMENT_BLOCK_TYPES.includes(t))) {
    console.log('[assessmentAgent] Skipped — no assessment blocks in blueprint');
    return {};
  }
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    maxTokens: 2048,
  });

  const textBlocks = state.blocks.filter(b => b.type === 'text');
  const lessonContent = textBlocks.map(b => b.content as string).join('\n\n');

  const blueprintNote = state.blueprint
    ? `\nBLUEPRINT: ${state.blueprint.join(' → ')}\nThis agent handles: ${state.blueprint.filter(t => ASSESSMENT_BLOCK_TYPES.includes(t)).join(', ')}.`
    : '';

  const result = await safeStructuredInvoke(model, [
    {
      role: 'system',
      content: `You are creating assessment materials for a homeschool student (grade ${state.gradeLevel}).${blueprintNote}
${state.interests?.length ? `Student interests: ${state.interests.join(', ')} — use these as real-world context in answer options where natural.` : ''}

Rules:
- Questions must test UNDERSTANDING, not just memorization
- All 4 answer options must be plausible — no trick answers
- Explanations must explain WHY the answer is correct and what the wrong answers miss (max 100 chars each)
- Flashcards cover the key vocabulary and concepts from the lesson
- Language and complexity MUST match grade ${state.gradeLevel} level
- NEVER ask trick questions or penalize creative thinking
- Difficulty must be appropriate for the student's ZPD: ${state.bktSummary || 'grade level'}
- CRITICAL: Output ONLY valid JSON. Escape all quotes with \\". Keep all strings concise.`,
    },
    {
      role: 'user',
      content: `Create quiz questions and flashcards for this lesson on "${state.topic}" (${state.subject}).\n\nLesson content:\n${lessonContent.slice(0, 1500)}`,
    },
  ], assessmentSchema);

  const quizBlocks: LessonBlock[] = result.quizQuestions.map((q): LessonBlock => ({
    type: 'quiz',
    content: q.question,
    interactive: {
      options: q.options,
      correctIndex: q.correctIndex,
      answer: q.options[q.correctIndex],
      explanation: q.explanation,
    },
    metadata: {
      skills: [state.subject],
      zpd_level: state.gradeLevel,
      agent: 'assessmentAgent',
      conceptId: `${state.subject}:${state.topic}`,
    },
  }));

  const flashcardBlocks: LessonBlock[] = result.flashcards.map((f): LessonBlock => ({
    type: 'flashcards',
    content: f.term,
    interactive: {
      term: f.term,
      definition: f.definition,
      example: f.example ?? undefined,
      category: f.category ?? state.subject,
    },
    metadata: {
      skills: [state.subject],
      zpd_level: state.gradeLevel,
      agent: 'assessmentAgent',
    },
  }));

  const blocks = [...quizBlocks, ...flashcardBlocks];
  console.log(`[assessmentAgent] Generated ${quizBlocks.length} quiz + ${flashcardBlocks.length} flashcard blocks`);

  return { blocks, phase: 'activity' };
}
