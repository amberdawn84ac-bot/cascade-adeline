import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const booksSchema = z.object({
  books: z.array(
    z.object({
      title: z.string().describe('The exact published title of the book'),
      author: z.string().describe('The author\'s full name'),
      coverDescription: z.string().describe('2-sentence vivid description of the book\'s world and tone'),
      whyYouWillLoveIt: z.string().describe('2-3 sentences explicitly tying this book to the student\'s specific interests and grade level'),
    })
  ).length(4),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const studentContext = await buildStudentContextPrompt(user.userId);

    const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.8 })
      .withStructuredOutput(booksSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical librarian with encyclopedic knowledge of children's and young adult literature. Recommend exactly 4 real, published books perfectly matched to this specific student.${studentContext}

RULES:
- Only recommend books that actually exist and are well-regarded
- Prioritize living books — rich in narrative, character, and ideas over textbooks or dry non-fiction
- Match vocabulary complexity and themes precisely to the student's grade level
- The whyYouWillLoveIt field MUST explicitly reference their specific interests by name
- Vary genres: mix fiction, narrative non-fiction, adventure, biography as appropriate`,
      },
      {
        role: 'user',
        content: 'Recommend 4 books perfectly matched to my interests and grade level.',
      },
    ]);

    return NextResponse.json(result.books);
  } catch (error) {
    console.error('[ReadingNook/curate] Error:', error);
    return NextResponse.json({ error: 'Failed to curate books' }, { status: 500 });
  }
}

