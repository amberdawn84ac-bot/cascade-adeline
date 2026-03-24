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
  const mode = state.learningMode ?? 'classic';
  // Expedition mode gets higher temperature for creative freedom
  const temperature = mode === 'expedition' ? 0.75 : 0.6;
  
  const model = new ChatOpenAI({
    model: config.models.default || 'gpt-4o',
    temperature,
  }).withStructuredOutput(contentSchema);

  const isRemediation = state.phase === 'remediation';
  const interests = state.interests.join(', ') || 'general learning';

  const blueprintNote = state.blueprint
    ? `\nBLUEPRINT SEQUENCE (follow this order for content blocks): ${state.blueprint.join(' → ')}\nFor this agent, focus on these block types from the blueprint: ${state.blueprint.filter(t => CONTENT_BLOCK_TYPES.includes(t)).join(', ')}.`
    : '';

  const isHistory = ['history', 'social studies', 'civics', 'government', 'oklahoma history', 'world history', 'american history'].some(
    h => state.subject.toLowerCase().includes(h)
  );

  // Build a real-sources context block if Hippocampus/Tavily retrieved actual documents
  let sourcesContext = '';
  if (isHistory && state.retrievedSources && state.retrievedSources.length > 0) {
    const sourceLines = state.retrievedSources.map(s => {
      const role = s.narrativeRole === 'official_claim' ? 'Official Record' : 'Eyewitness / Counter-Source';
      const who = s.creator ? ` by ${s.creator}` : '';
      const when = s.date ? ` (${s.date})` : '';
      return `- [${role}] "${s.title}"${who}${when} — ${s.citation}`;
    }).join('\n');
    sourcesContext = `\n\nREAL PRIMARY SOURCES RETRIEVED FOR THIS LESSON (cite these — do not invent others):\n${sourceLines}\nReference these documents by title in your narrative. Do NOT fabricate citations.`;
  } else if (isHistory) {
    sourcesContext = `\n\nNOTE: No primary sources were retrieved for this topic yet. Write the narrative context ONLY — do NOT cite any specific documents. The student will see a source gap notice below this content.`;
  }

  const systemPrompt = `You are Adeline, a brilliant homeschool teacher writing in the "Life of Fred" style.${blueprintNote}

STUDENT PROFILE:
- Grade: ${state.gradeLevel || 'unknown'}
- Interests: ${interests}
- Learning Style: ${state.learningStyle}
- ZPD & Mastery: ${state.bktSummary || 'Not yet assessed'}
${isRemediation ? `\nREMEDIATION MODE: The student scored below 70% on the quiz. Reteach the SAME concept using a completely different approach — different analogy, different story, different angle. Do NOT repeat what you already said.` : ''}${sourcesContext}

CONTENT RULES:
1. Write like "Life of Fred" — quirky narrative-driven story, NOT textbook paragraphs.
2. Weave the subject into the student's actual interests (${interests}).
3. Use Rich Markdown: ### sub-headers, **bold** key terms, > blockquotes for "Adeline's Rules".
4. Keep paragraphs SHORT (1–2 sentences). Breathe. Space it out.
5. History/Social Studies: Set the scene and context. If real primary sources were provided above, reference them by title. NEVER invent document titles, dates, or quotations — only reference what is in the REAL PRIMARY SOURCES list above.
6. Every lesson MUST include at least one faith tie connecting the concept to scripture or biblical worldview.
7. Generate exactly:
   - 1 or 2 "text" blocks (the actual lesson narrative)
   - 1 "scripture" block (a relevant verse with brief context — use original Hebrew/Greek name for God: Yahweh, Elohim, Yeshua — never the English translations "God" or "Jesus")
   - 1 "prompt" block (a Socratic question to make them think — no right answer, makes them wrestle with the idea)

${mode === 'expedition' ? `
EXPEDITION MODE CREATIVE FREEDOM (20-30%):
- Add unexpected plot twists or cliffhangers
- Include "pause & try this" micro-challenges
- Suggest photo documentation opportunities
- Offer teen-choice branches ("Would you rather investigate X or Y?")
- Use humor, mystery, or dramatic tension to maintain engagement
- Don't be afraid to break the expected pattern if it serves curiosity` : ''}`;

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
