import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';
import { LessonBlock, LessonStateType } from '../lessonState';

const mediaSchema = z.object({
  imageSearchTerms: z.array(z.string()).min(2).max(4),
  videoSearchTerms: z.array(z.string()).min(1).max(2),
});

// YouTube search link — renderer should open this in a new tab, not try to embed it
function buildVideoSearchUrl(term: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`;
}

export async function mediaAgent(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const config = loadConfig();
  const model = new ChatOpenAI({
    model: config.models.default || 'gpt-4o-mini',
    temperature: 0.3,
  }).withStructuredOutput(mediaSchema);

  const textBlocks = state.blocks.filter(b => b.type === 'text');
  const lessonSummary = textBlocks.map(b => b.content as string).join(' ').slice(0, 500);

  const result = await model.invoke([
    {
      role: 'system',
      content: `You are generating specific, targeted search terms for visuals to accompany a homeschool lesson.
Rules:
- Image search terms: be SPECIFIC (e.g. "Lascaux cave paintings France ochre pigment" not "cave art")
- Video search terms: prefer primary source documentaries, hands-on demonstrations, or nature videos
- All content must be appropriate for a grade ${state.gradeLevel} student
- Avoid commercial or politically biased content`,
    },
    {
      role: 'user',
      content: `Lesson topic: "${state.topic}" (${state.subject})\nLesson summary: ${lessonSummary}`,
    },
  ]);

  const blocks: LessonBlock[] = [
    // Image blocks: store the search term as content so the renderer can show
    // a labelled link rather than trying to embed a Google search results page.
    ...result.imageSearchTerms.map((term): LessonBlock => ({
      type: 'infographic',
      content: term,
      interactive: {
        url: `https://www.google.com/search?q=${encodeURIComponent(term)}&tbm=isch`,
      } as LessonBlock['interactive'],
      metadata: {
        skills: [state.subject],
        zpd_level: state.gradeLevel,
        agent: 'mediaAgent',
      },
    })),
    // Video blocks: store the search term and a YouTube search URL.
    // The VideoBlock component should render a link-out, not an <iframe>.
    ...result.videoSearchTerms.map((term): LessonBlock => ({
      type: 'video',
      content: term,
      interactive: {
        url: buildVideoSearchUrl(term),
      } as LessonBlock['interactive'],
      metadata: {
        skills: [state.subject],
        zpd_level: state.gradeLevel,
        agent: 'mediaAgent',
      },
    })),
  ];

  console.log(`[mediaAgent] Generated ${blocks.length} media blocks`);

  return { blocks, phase: 'assess' };
}
