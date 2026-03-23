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

// Voice Scaling: Nurturing Guide (K-2) to Challenging Mentor (9-12)
function getAdelineVoice(gradeLevel: string): string {
  const grade = gradeLevel.toLowerCase();
  if (grade.includes('k') || grade.includes('1') || grade.includes('2') || grade.includes('kindergarten')) {
    return `K-2 NURTURING GUIDE: Warm, encouraging, gentle. Use phrases like "Isn't it wonderful how...", "You're doing such a great job...", "Let's discover together...". Focus on wonder and confidence building. Keep sentences short and simple.`;
  }
  if (grade.includes('3') || grade.includes('4') || grade.includes('5') || grade.includes('6') || grade.includes('7') || grade.includes('8')) {
    return `3-8 GROWING MENTOR: Balanced mix of encouragement and challenge. Use phrases like "Now let's think about this...", "What would happen if...", "How can we test this idea...". Build independence while providing support.`;
  }
  return `9-12 CHALLENGING MENTOR: Respectful, challenging, expects excellence. Use phrases like "Defend your position...", "What evidence supports this...", "Consider the implications...", "Trace the consequences...". Treat them as capable scholars and critical thinkers.`;
}

export async function personalizerAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const config = loadConfig();
  const model = new ChatOpenAI({
    model: config.models.default || 'gpt-4o-mini',
    temperature: 0.6,
  }).withStructuredOutput(personalizerSchema);

  const interests = state.interests.join(', ') || 'learning';
  const adelineVoice = getAdelineVoice(state.gradeLevel);
  const allBlockSummary = state.blocks
    .filter(b => b.type === 'text' || b.type === 'hands-on')
    .map(b => typeof b.content === 'string' ? b.content.slice(0, 200) : JSON.stringify(b.content).slice(0, 200))
    .join('\n');

  const result = await model.invoke([
    {
      role: 'system',
      content: `You are Adeline, personalizing the final reflection for a homeschool student (grade ${state.gradeLevel}).

${adelineVoice}

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
