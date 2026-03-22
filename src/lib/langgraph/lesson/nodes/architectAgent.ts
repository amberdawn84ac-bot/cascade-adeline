import { ChatOpenAI } from '@langchain/openai';
import { LessonStateType } from '../lessonState';
import { getAllCodesForSubject } from '@/lib/standards/subjectStandardsMap';

const ALLOWED_BLOCK_TYPES = [
  'title',
  'primary_text',
  'concept_text',
  'vocab_tooltip',
  'diagram_viewer',
  'interactive_slider',
  'quiz',
  'critical_thinking',
  'activity',
  'primary_source',
  'investigation',
] as const;

export type BlueprintBlockType = typeof ALLOWED_BLOCK_TYPES[number];

const CLASSIC_EXAMPLE = [
  'title',
  'concept_text',
  'concept_text',
  'vocab_tooltip',
  'vocab_tooltip',
  'quiz',
  'quiz',
  'activity',
];

const EXPEDITION_EXAMPLE = [
  'title',
  'primary_text',
  'diagram_viewer',
  'primary_text',
  'critical_thinking',
  'interactive_slider',
  'quiz',
  'activity',
];

const HISTORY_NARRATIVE_GAP_EXAMPLE = [
  'title',
  'primary_text',
  'primary_source',
  'investigation',
  'primary_source',
  'critical_thinking',
  'quiz',
  'activity',
];

const HISTORY_SUBJECTS = ['history', 'social studies', 'civics', 'government', 'economics', 'american history', 'world history'];

function isHistorySubject(subject: string): boolean {
  const s = subject.toLowerCase();
  return HISTORY_SUBJECTS.some(h => s.includes(h));
}

export async function architectAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.3,
  });

  const mode = state.learningMode ?? 'classic';
  const interests = state.interests?.join(', ') || 'general';
  const isHistory = isHistorySubject(state.subject);

  if (isHistory) {
    const standardsCodes = getAllCodesForSubject(state.subject);
    console.log(`[architectAgent] History subject — Narrative Gap blueprint, ${standardsCodes.length} standards for "${state.topic}"`);
    return { blueprint: [...HISTORY_NARRATIVE_GAP_EXAMPLE], standardsCodes };
  }

  const systemPrompt = `You are a Curriculum Architect for a homeschool AI tutor named Adeline.

Your ONLY job is to output a JSON array of strings that defines the ideal sequence of lesson blocks for a given subject and learning mode.

LEARNING MODE: "${mode}"
${mode === 'classic'
  ? `CLASSIC MODE: Prioritize direct instruction, structured vocabulary, and formal assessment. Sequence should be: introduce concept → define vocabulary → check understanding → practice. Emphasis on mastery verification.`
  : `EXPEDITION MODE: Prioritize narrative, exploration, and open-ended discovery. Sequence should be: hook with story → explore visually → wrestle with ideas → optional practice. Emphasis on curiosity and connection.`}

SUBJECT: ${state.subject}
TOPIC: ${state.topic}
STUDENT INTERESTS: ${interests}
GRADE: ${state.gradeLevel}

ALLOWED BLOCK TYPES (use ONLY these exact strings):
- "title"             — lesson title/hook headline
- "primary_text"      — narrative-driven story content (expedition style)
- "concept_text"      — direct instructional content (classic style)
- "vocab_tooltip"     — vocabulary term with definition
- "diagram_viewer"    — visual diagram or image concept
- "interactive_slider"— adjustable interactive concept explorer
- "quiz"              — comprehension check question
- "critical_thinking" — open-ended Socratic question, no right answer
- "activity"          — hands-on project or practice task

RULES:
1. Output ONLY a raw JSON array, no markdown, no explanation, no extra keys.
2. Minimum 6 blocks, maximum 12 blocks.
3. Always start with "title". Always end with "activity".
4. ${mode === 'classic' ? 'Include at least 2 "quiz" blocks and 1 "vocab_tooltip".' : 'Include at least 1 "critical_thinking" block and 1 "diagram_viewer".'}
5. Tailor the sequence to reinforce the subject matter of "${state.topic}".

EXAMPLE OUTPUT for ${mode} mode:
${JSON.stringify(mode === 'classic' ? CLASSIC_EXAMPLE : EXPEDITION_EXAMPLE)}`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Design the blueprint for: "${state.topic}" (${state.subject}) in ${mode} mode.` },
  ]);

  let blueprint: string[] = mode === 'classic' ? [...CLASSIC_EXAMPLE] : [...EXPEDITION_EXAMPLE];

  try {
    const text = typeof response.content === 'string' ? response.content.trim() : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed: unknown = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        const filtered = parsed.filter(item =>
          (ALLOWED_BLOCK_TYPES as readonly string[]).includes(item)
        );
        if (filtered.length >= 4) blueprint = filtered;
      }
    }
  } catch {
    console.warn('[architectAgent] Failed to parse blueprint JSON — using default for mode:', mode);
  }

  const standardsCodes = getAllCodesForSubject(state.subject);
  console.log(`[architectAgent] Blueprint (${mode}): ${blueprint.join(' → ')} — ${standardsCodes.length} standards`);
  return { blueprint, standardsCodes };
}
