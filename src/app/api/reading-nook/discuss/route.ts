import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getSessionUser } from '@/lib/auth';
import { awardCreditsForActivity, createTranscriptEntryWithCredits } from '@/lib/learning/credit-award';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

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

    // Award credits for reading discussion if this is a meaningful conversation (3+ messages)
    if (messages.length >= 3) {
      // Award credits asynchronously to not block the stream
      awardCreditsForActivity(user.userId, {
        subject: 'English Language Arts',
        activityType: 'reading-discussion',
        activityName: `Reading Discussion: ${bookTitle || 'Book'}`,
        metadata: {
          bookTitle,
          chapter,
          messageCount: messages.length,
        },
        masteryDemonstrated: true,
      }).then(creditResult => {
        createTranscriptEntryWithCredits(
          user.userId,
          `Reading Discussion: ${bookTitle || 'Book'}`,
          'English Language Arts',
          creditResult,
          `Discussed ${bookTitle}${chapter ? ` (${chapter})` : ''} with ${messages.length} thoughtful exchanges`,
          { discussion: { bookTitle, chapter, messageCount: messages.length } }
        );
      }).catch(err => console.error('Failed to award reading discussion credits:', err));
    }

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Discussion API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

