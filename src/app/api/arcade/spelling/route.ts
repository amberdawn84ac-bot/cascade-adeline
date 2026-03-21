import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { getStudentContext } from '@/lib/learning/student-context';

const spellingSchema = z.object({
  word: z.string().describe("The spelling word, all lowercase"),
  definition: z.string().describe("A clear, age-appropriate definition"),
  usedInSentence: z.string().describe("A natural sentence using the word in context"),
  partOfSpeech: z.string().describe("noun, verb, adjective, adverb, etc."),
  origin: z.string().describe("Brief word origin or fun etymology fact"),
  hint: z.string().describe("A spelling hint or memory trick for this word"),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json().catch(() => ({}));
    const seenWords: string[] = Array.isArray(body?.seenWords) ? body.seenWords : [];

    const studentCtx = await getStudentContext(user.userId);
    const grade = parseInt((studentCtx.gradeLevel || '5').replace(/\D/g, '')) || 5;
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (grade <= 3) difficulty = 'easy';
    else if (grade <= 6) difficulty = 'medium';
    else difficulty = 'hard';

    const gradeContext = `The student is in grade ${studentCtx.gradeLevel}.`;
    const interestsContext = studentCtx.interests.length
      ? `Their interests include: ${studentCtx.interests.join(', ')}. Try to pick words relevant to their world.`
      : '';
    const avoidContext = seenWords.length > 0
      ? `\nDO NOT use any of these words that have already been given this session: ${seenWords.join(', ')}.`
      : '';

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.9,
    }).withStructuredOutput(spellingSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a spelling bee tutor. ${gradeContext} ${interestsContext}
Generate a single spelling word appropriate for this grade level at ${difficulty} difficulty.
- Easy (K-3): Common everyday words (3-6 letters)
- Medium (4-6): More complex vocabulary (6-9 letters)  
- Hard (7-12): Advanced vocabulary, Latin/Greek roots (8+ letters)
Pick varied, interesting words. Make the sentence vivid and memorable.${avoidContext}`,
      },
      { role: 'user', content: 'Give me a spelling word.' },
    ]);

    return NextResponse.json({ ...result, difficulty });
  } catch (error) {
    console.error('[arcade/spelling]', error);
    return NextResponse.json({ error: 'Failed to generate spelling word' }, { status: 500 });
  }
}

