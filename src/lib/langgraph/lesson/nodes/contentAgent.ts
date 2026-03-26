import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';
import { LessonBlock, LessonStateType } from '../lessonState';
import { safeStructuredInvoke } from '../safeInvoke';

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

function getGradeAdaptation(gradeLevel: string): string {
  const g = gradeLevel?.toLowerCase() || '8';
  const isK2 = g === 'k' || g === 'kindergarten' || g === '1' || g === '2';
  const is35 = g === '3' || g === '4' || g === '5';
  const is68 = g === '6' || g === '7' || g === '8';

  if (isK2) return `GRADE ADAPTATION — K-2 (SPROUTS):
- Use simple, concrete words only. No vocabulary above a 2nd-grade reading level.
- Every concept must connect to something the child can see, touch, or taste.
- Sentences: 8 words max. One idea per sentence.
- Text blocks: 1-2 sentences only.
- Choice blocks: 2 options max, 3-word labels ("Go outside" / "Stay inside").
- NO abstract reasoning, no "consider the implications." Make it a game or story.`;

  if (is35) return `GRADE ADAPTATION — GRADES 3-5 (SEEDLINGS):
- Reading level: 3rd-5th grade. Short paragraphs, common words.
- Use analogies to things kids this age know (sports, animals, cooking, Minecraft).
- Introduce 1-2 new vocabulary words per lesson, define them in plain language.
- Choices: 2-3 options with 1-sentence descriptions.
- Include "what if" wonder questions. No citations or scholarly language.`;

  if (is68) return `GRADE ADAPTATION — GRADES 6-8 (GROWING):
- Reading level: middle school. Can handle 2-3 sentence paragraphs.
- Connect concepts to real-world consequences the student can observe.
- Introduce cause-and-effect thinking. Ask "why does this matter today?"
- Choice blocks: 2-3 substantive options that require real thinking.
- Can include one citation or named primary source if relevant.`;

  return `GRADE ADAPTATION — GRADES 9-12 (OAKS):
- Treat the student as a capable scholar. Use college-prep vocabulary.
- Every claim should be traceable to evidence. Ask "who benefits?" and "what's the trade-off?"
- Require multi-step reasoning in prompts: state position, cite evidence, acknowledge counterargument.
- Choice blocks: 2-3 nuanced options that represent genuine intellectual tensions.
- Faith tie should engage theological depth, not just surface parallels.`;
}

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
    maxTokens: 4096,
  });

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

${getGradeAdaptation(state.gradeLevel)}
${isRemediation ? `\nREMEDIATION MODE: The student scored below 70% on the quiz. Reteach the SAME concept using a completely different approach — different analogy, different examples, different angle. Do NOT repeat what you already said.` : ''}${sourcesContext}

JSON OUTPUT RULES (CRITICAL — NEVER VIOLATE):
0. Output ONLY valid JSON. No text before or after the JSON object.
0. Every string value MUST be properly escaped: use \" for quotes inside strings, \\n for newlines. Never use literal newlines inside JSON string values.
0. Keep EVERY "content" field under 400 characters. If you need more space, split into a second block.
0. Produce exactly 4-6 blocks total — never more than 6.

CONTENT RULES:
1. Create INTERACTIVE, DYNAMIC blocks with CHOICES and BRANCHING — NOT just text.
2. Use inline markdown in text blocks (bold, italic, short headers) — but keep total content concise.
3. Connect to student interests (${interests}) through examples and applications.
4. Keep paragraphs SHORT (1–2 sentences max).
5. History/Social Studies: Present facts and context. If real primary sources were provided above, reference them by title. NEVER invent document titles, dates, or quotations.
6. Every lesson MUST include at least one faith tie connecting the concept to scripture or biblical worldview.
7. Generate a MIX of block types:
   - 1 "text" block (intro, max 300 chars)
   - 1 "choice" block (2-3 short choices with brief labels and 1-sentence descriptions)
   - 1 "branching_path" block (2-3 paths, 1-sentence descriptions)
   - 1 "scripture" block (verse reference + 1 sentence of context — no full quotes)
   - 1 "prompt" block (Socratic question, max 120 chars)

${mode === 'expedition' ? `
EXPEDITION MODE CREATIVE FREEDOM (20-30%):
- Add unexpected plot twists or cliffhangers
- Include "pause & try this" micro-challenges
- Suggest photo documentation opportunities
- Offer teen-choice branches ("Would you rather investigate X or Y?")
- Use humor, mystery, or dramatic tension to maintain engagement
- Don't be afraid to break the expected pattern if it serves curiosity` : ''}`;

  const result = await safeStructuredInvoke(model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate lesson content for: "${state.topic}" (${state.subject})\nDescription: ${state.description || 'Not provided'}` },
  ], contentSchema);

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
      ok_standard: b.ok_standard ?? undefined,
      zpd_level: state.gradeLevel,
      faith_tie: b.faith_tie ?? b.type === 'scripture',
      agent: 'contentAgent',
    },
  }));

  console.log(`[contentAgent] Generated ${blocks.length} blocks`);

  return { blocks, phase: 'media' };
}
