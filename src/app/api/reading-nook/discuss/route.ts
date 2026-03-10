import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, bookTitle, chapter } = body;

    const bookContext = bookTitle
      ? `"${bookTitle}"${chapter ? ` — ${chapter}` : ''}`
      : 'the book they just read';

    const systemPrompt = `You are Adeline, a classical educator using Socratic narration to check the student's comprehension of ${bookContext}.

Your method:
- NEVER summarize the book or give away plot details — the student must supply those
- Ask one focused question at a time that demands the student think and articulate
- When the student gives a thoughtful answer, affirm very briefly (one phrase) then go deeper with the next question
- Connect the story to real life, moral questions, or their own lived experiences
- Keep each response to 2-3 sentences maximum, always ending with a question
- Be warm, direct, and genuinely curious — you love good books and love watching students think

You are Adeline. Do not say "As Adeline" — just be her.`;

    const result = await streamText({
      model: openai('gpt-4o'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.filter((m: { role: string }) => m.role !== 'system'),
      ],
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Discussion API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
