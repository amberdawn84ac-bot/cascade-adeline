import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';
import { LessonBlock, LessonStateType } from '../lessonState';

const contentSchema = z.object({
  blocks: z.array(z.object({
    type: z.enum(['text', 'scripture', 'prompt', 'choice', 'interactive_concept', 'branching_path']),
    content: z.string(),
    ok_standard: z.string().nullish(),
    faith_tie: z.boolean().nullish(),
    // Interactive fields for choice/branching blocks
    choices: z.array(z.object({
      label: z.string(),
      description: z.string(),
      nextPath: z.string().nullish(),
    })).nullish(),
    // Interactive concept fields
    concept: z.string().nullish(),
    variables: z.array(z.object({
      name: z.string(),
      label: z.string(),
      min: z.number().nullish(),
      max: z.number().nullish(),
      defaultValue: z.number().nullish(),
    })).nullish(),
  })).min(2).max(8),
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

  const systemPrompt = `You are Adeline, a brilliant homeschool teacher creating interactive, visually engaging lessons.${blueprintNote}

STUDENT PROFILE:
- Grade: ${state.gradeLevel || 'unknown'}
- Interests: ${interests}
- Learning Style: ${state.learningStyle}
- ZPD & Mastery: ${state.bktSummary || 'Not yet assessed'}
${isRemediation ? `\nREMEDIATION MODE: The student scored below 70% on the quiz. Reteach the SAME concept using a completely different approach — different analogy, different examples, different angle. Do NOT repeat what you already said.` : ''}${sourcesContext}

CONTENT RULES:
1. Create INTERACTIVE, DYNAMIC blocks with CHOICES and BRANCHING — NOT just text.
2. Use RICH TYPOGRAPHY in text blocks:
   - ### Large headers for major sections
   - #### Smaller headers for subsections
   - **Bold** for key terms, vocabulary, important concepts
   - *Italics* for emphasis, definitions, or examples
   - > Blockquotes for important principles or key takeaways
   - \`Code formatting\` for formulas, equations, or technical terms
   - Lists (bullet and numbered) to break down information
3. Connect to student interests (${interests}) through examples and applications.
4. Keep paragraphs SHORT (1–2 sentences max). Use visual spacing.
5. History/Social Studies: Present facts and context. If real primary sources were provided above, reference them by title. NEVER invent document titles, dates, or quotations — only reference what is in the REAL PRIMARY SOURCES list above.
6. Every lesson MUST include at least one faith tie connecting the concept to scripture or biblical worldview.
7. Generate a MIX of block types:
   - 1 "text" block (intro with rich typography)
   - 1 "choice" block (student picks investigation path, topic focus, or learning approach - include 2-3 choices with labels and descriptions)
   - 1 "interactive_concept" block (adjustable variables to explore the concept - include concept name and 2-3 variables with ranges)
   - 1 "branching_path" block (student decision that affects what they learn next - include 2-3 paths with descriptions)
   - 1 "scripture" block (relevant verse with brief context — use original Hebrew/Greek names: Yahweh, Elohim, Yeshua)
   - 1 "prompt" block (Socratic question to make them think)

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
    type: b.type as any,
    content: b.content,
    interactive: b.choices ? {
      options: b.choices.map(c => c.label),
      guidingQuestions: b.choices.map(c => c.description),
    } : b.variables ? {
      // Interactive concept with adjustable variables
    } : undefined,
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
