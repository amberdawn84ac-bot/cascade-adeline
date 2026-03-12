import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const storySchema = z.object({
  title: z.string().describe("A compelling title for the story"),
  opening: z.string().describe("A rich, engaging opening paragraph (3-5 sentences) that hooks the reader"),
  characterSketch: z.string().describe("A brief, vivid description of the main character"),
  plotHook: z.string().describe("The central conflict or mystery the story will explore"),
  writingTip: z.string().describe("One specific writing craft tip tailored to the student's grade level"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { prompt, genre } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const studentContext = await buildStudentContextPrompt(user.userId);

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.85,
    }).withStructuredOutput(storySchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical rhetoric and literature tutor.${studentContext} Generate a rich, engaging story starter in the ${genre || 'adventure'} genre. Your writing should model excellent craft — vivid imagery, strong verbs, compelling characters. CRITICALLY: adapt the vocabulary complexity, sentence length, and thematic depth to perfectly match the student's grade level. For younger students (K-5): simpler words, shorter sentences, magical/fun themes. For older students (6-12): sophisticated vocabulary, complex themes, literary devices.`,
      },
      { role: 'user', content: `Story prompt: ${prompt}\nGenre: ${genre || 'Adventure'}` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Story generate error:', error);
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}

