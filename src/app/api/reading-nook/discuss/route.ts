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

    const systemPrompt = `You are Adeline, an encouraging, warm, and highly curious book mentor. You are chatting with a student about ${bookContext}.

Your method:
- NEVER summarize the book or give away plot details — encourage the student to share what happened
- Ask one fun, focused question at a time to get them thinking
- When the student gives a thoughtful answer, be enthusiastic and affirm them, then ask a follow-up question
- Connect the story to real life, moral questions, or things they might have experienced
- Keep each response very short (1-3 sentences maximum). Make it feel like a text message chat, not a formal essay.
- Be warm and genuinely curious — you love good books and love hearing what kids think about them!

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

