import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { LessonBlock, LessonStateType } from '../lessonState';

const activitySchema = z.object({
  title: z.string(),
  fullInstructions: z.string(),
  supplies: z.array(z.string()),
  photoPrompt: z.string(),
});

const ACTIVITY_BLOCK_TYPES = ['activity', 'interactive_slider', 'diagram_viewer'];

export async function activityAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  if (state.blueprint && !state.blueprint.some(t => ACTIVITY_BLOCK_TYPES.includes(t))) {
    console.log('[activityAgent] Skipped — no activity blocks in blueprint');
    return {};
  }
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.6,
  }).withStructuredOutput(activitySchema);

  const interests = state.interests.join(', ') || 'general';

  const blueprintNote = state.blueprint
    ? `\nBLUEPRINT: ${state.blueprint.join(' → ')}\nThis agent handles: ${state.blueprint.filter(t => ACTIVITY_BLOCK_TYPES.includes(t)).join(', ')}.`
    : '';

  const result = await model.invoke([
    {
      role: 'system',
      content: `You are creating a hands-on activity for a homeschool student (grade ${state.gradeLevel}).${blueprintNote}

ACTIVITY RULES — ZERO VAGUENESS ALLOWED:
- COOKING/BAKING: Write the FULL recipe. Every ingredient with EXACT measurements (e.g. "2¼ cups all-purpose flour", "1 tsp baking soda"). Oven temperature. Exact bake time. Every step in order.
- MATH: Write out ACTUAL problems with real numbers. Full worked examples. 3-5 practice problems with specific numbers.
- SCIENCE: Exact quantities, temperatures, wait times, and observations to make.
- ART/CRAFT: Exact materials with amounts, dimensions, step-by-step motions.
- Universal rule: A student with zero prior knowledge must execute this PERFECTLY using ONLY what is written. If they'd need to look anything up, you failed.

Connect the activity to the student's interests when possible: ${interests}.
The activity must reinforce what was taught in the lesson, not just be "related to the topic."

photoPrompt: A short specific instruction for what the student should photograph to prove completion (e.g. "Take a photo of your finished volcano experiment showing the foam overflow").`,
    },
    {
      role: 'user',
      content: `Create a hands-on activity for the lesson: "${state.topic}" (${state.subject})\nDescription: ${state.description || 'Not provided'}`,
    },
  ]);

  const handsOnBlock: LessonBlock = {
    type: 'hands-on',
    content: JSON.stringify({
      title: result.title,
      fullInstructions: result.fullInstructions,
      supplies: result.supplies,
    }),
    metadata: {
      skills: [state.subject],
      zpd_level: state.gradeLevel,
      agent: 'activityAgent',
    },
  };

  const photoBlock: LessonBlock = {
    type: 'photo',
    content: result.photoPrompt,
    metadata: {
      skills: [state.subject],
      zpd_level: state.gradeLevel,
      agent: 'activityAgent',
    },
  };

  console.log(`[activityAgent] Generated hands-on + photo blocks`);

  return { blocks: [handsOnBlock, photoBlock], phase: 'personalize' };
}
