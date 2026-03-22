import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';
import { LessonBlock, LessonStateType } from '../lessonState';

const contentSchema = z.object({
  blocks: z.array(z.object({
    type: z.enum(['text', 'scripture', 'prompt']),
    content: z.string(),
    ok_standard: z.string().optional(),
    faith_tie: z.boolean().optional(),
  })).min(2).max(5),
});

const CONTENT_BLOCK_TYPES = ['primary_text', 'concept_text', 'critical_thinking', 'title'];

export async function contentAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  if (state.blueprint && !state.blueprint.some(t => CONTENT_BLOCK_TYPES.includes(t))) {
    console.log('[contentAgent] Skipped — no content blocks in blueprint');
    return {};
  }
  const config = loadConfig();
  const model = new ChatOpenAI({
    model: config.models.default || 'gpt-4o',
    temperature: 0.7,
  }).withStructuredOutput(contentSchema);

  const isRemediation = state.phase === 'remediation';
  const interests = state.interests.join(', ') || 'general learning';

  const blueprintNote = state.blueprint
    ? `\nBLUEPRINT SEQUENCE (follow this order for content blocks): ${state.blueprint.join(' → ')}\nFor this agent, focus on these block types from the blueprint: ${state.blueprint.filter(t => CONTENT_BLOCK_TYPES.includes(t)).join(', ')}.`
    : '';

  const systemPrompt = `You are Adeline, a brilliant homeschool teacher writing in the "Life of Fred" style.${blueprintNote}

STUDENT PROFILE:
- Grade: ${state.gradeLevel || 'unknown'}
- Interests: ${interests}
- Learning Style: ${state.learningStyle}
- ZPD & Mastery: ${state.bktSummary || 'Not yet assessed'}
${isRemediation ? `\nREMEDIATION MODE: The student scored below 70% on the quiz. Reteach the SAME concept using a completely different approach — different analogy, different story, different angle. Do NOT repeat what you already said.` : ''}

CONTENT RULES:
1. Write like "Life of Fred" — quirky narrative-driven story, NOT textbook paragraphs.
2. Weave the subject into the student's actual interests (${interests}).
3. Use Rich Markdown: ### sub-headers, **bold** key terms, > blockquotes for "Adeline's Rules".
4. Keep paragraphs SHORT (1–2 sentences). Breathe. Space it out.
5. History/Social Studies: PRIMARY SOURCES ONLY. Cite actual diaries, letters, court records. Never textbooks. Acknowledge uncomfortable truths — humans repeat mistakes when power goes unchecked.
6. Every lesson MUST include at least one faith tie connecting the concept to scripture or biblical worldview.
7. Generate exactly:
   - 1 or 2 "text" blocks (the actual lesson narrative)
   - 1 "scripture" block (a relevant verse with brief context — use original Hebrew/Greek name for God: Yahweh, Elohim, Yeshua — never the English translations "God" or "Jesus")
   - 1 "prompt" block (a Socratic question to make them think — no right answer, makes them wrestle with the idea)`;

  const result = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate lesson content for: "${state.topic}" (${state.subject})\nDescription: ${state.description || 'Not provided'}` },
  ]);

  const blocks: LessonBlock[] = result.blocks.map(b => ({
    type: b.type,
    content: b.content,
    metadata: {
      skills: [state.subject],
      ok_standard: b.ok_standard,
      zpd_level: state.gradeLevel,
      faith_tie: b.faith_tie ?? b.type === 'scripture',
      agent: 'contentAgent',
    },
  }));

  console.log(`[contentAgent] Generated ${blocks.length} blocks`);

  return { blocks, phase: 'media' };
}
