import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { LessonBlock, LessonStateType } from '../lessonState';

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
    example: z.string().optional(),
    category: z.string().optional(),
  })).min(2).max(5),
});

export async function assessmentAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.4,
  }).withStructuredOutput(assessmentSchema);

  const textBlocks = state.blocks.filter(b => b.type === 'text');
  const lessonContent = textBlocks.map(b => b.content as string).join('\n\n');

  const result = await model.invoke([
    {
      role: 'system',
      content: `You are creating assessment materials for a homeschool student (grade ${state.gradeLevel}).

Rules:
- Questions must test UNDERSTANDING, not just memorization
- All 4 answer options must be plausible — no trick answers
- Explanations must explain WHY the answer is correct and what the wrong answers miss
- Flashcards cover the key vocabulary and concepts from the lesson
- Language must match grade ${state.gradeLevel} level exactly
- NEVER ask trick questions or penalize creative thinking`,
    },
    {
      role: 'user',
      content: `Create quiz questions and flashcards for this lesson on "${state.topic}" (${state.subject}).\n\nLesson content:\n${lessonContent.slice(0, 2000)}`,
    },
  ]);

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
    },
  }));

  const flashcardBlocks: LessonBlock[] = result.flashcards.map((f): LessonBlock => ({
    type: 'flashcards',
    content: f.term,
    interactive: {
      term: f.term,
      definition: f.definition,
      example: f.example,
      category: f.category || state.subject,
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
