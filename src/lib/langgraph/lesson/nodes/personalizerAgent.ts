import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';
import { LessonBlock, LessonStateType } from '../lessonState';

const personalizerSchema = z.object({
  reflectionPrompt: z.string(),
  badgeName: z.string().optional(),
  okStandards: z.array(z.object({
    blockIndex: z.number(),
    standard: z.string(),
  })).optional(),
});

export async function personalizerAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const config = loadConfig();
  const model = new ChatOpenAI({
    model: config.models.default || 'gpt-4o-mini',
    temperature: 0.6,
  }).withStructuredOutput(personalizerSchema);

  const interests = state.interests.join(', ') || 'learning';
  const allBlockSummary = state.blocks
    .filter(b => b.type === 'text' || b.type === 'hands-on')
    .map(b => typeof b.content === 'string' ? b.content.slice(0, 200) : JSON.stringify(b.content).slice(0, 200))
    .join('\n');

  const result = await model.invoke([
    {
      role: 'system',
      content: `You are personalizing the final reflection for a homeschool student (grade ${state.gradeLevel}).

REFLECTION PROMPT RULES:
- Connect the lesson topic to the student's actual interests: ${interests}
- Ask a faith-integrated question that connects the subject to biblical worldview or character growth
- The question should have NO single right answer — it should make them genuinely wrestle
- Keep it short: 1-2 sentences maximum
- DO NOT start with "How" or "What do you think" — be more creative

BADGE: If this is a remediation session (loopCount > 0) and the student completed the full lesson, award a special perseverance badge. Otherwise award a subject mastery badge.

OK STANDARDS: For each major lesson block (up to 3), assign the most relevant Oklahoma Academic Standard code if applicable (e.g. "OK-Math-6.A.1.2", "OK-ELA-4.W.3.1"). Leave blank if not applicable.`,
    },
    {
      role: 'user',
      content: `Subject: ${state.subject}\nTopic: "${state.topic}"\nStudent interests: ${interests}\nLoop count: ${state.loopCount}\n\nLesson summary:\n${allBlockSummary}`,
    },
  ]);

  const reflectionBlock: LessonBlock = {
    type: 'prompt',
    content: result.reflectionPrompt,
    metadata: {
      skills: [state.subject],
      zpd_level: state.gradeLevel,
      faith_tie: true,
      agent: 'personalizerAgent',
    },
  };

  const masteryAchieved = state.quizScore !== undefined ? state.quizScore >= 70 : true;

  console.log(`[personalizerAgent] masteryAchieved=${masteryAchieved} badgeName=${result.badgeName}`);

  return {
    blocks: [reflectionBlock],
    masteryAchieved,
    phase: 'done',
    metadata: {
      ...state.metadata,
      badgeName: result.badgeName,
      okStandards: result.okStandards,
    },
  };
}
