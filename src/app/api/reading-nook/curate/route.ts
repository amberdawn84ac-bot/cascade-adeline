import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { getStudentContext } from '@/lib/learning/student-context';
import prisma from '@/lib/db';
import { loadConfig } from '@/lib/config';

export const maxDuration = 30;

const bookSchema = z.object({
  title: z.string().describe('Exact published book title'),
  author: z.string().describe('Author full name'),
  coverDescription: z.string().describe('2-sentence vivid description of what this book is about'),
  whyYouWillLoveIt: z.string().describe('1-2 sentences connecting this book specifically to the student\'s interests'),
  gutenbergUrl: z.string().nullable().describe('Project Gutenberg URL if this is a public domain book (e.g. https://www.gutenberg.org/ebooks/74), otherwise null'),
});

const curateSchema = z.object({
  books: z.array(bookSchema).length(4).describe('Exactly 4 book recommendations'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const studentCtx = await getStudentContext(user.userId);
    const gradeLevel = studentCtx.gradeLevel;
    const interests = studentCtx.interests;
    const name = studentCtx.name;

    // Parse grade for age-appropriate content
    const gradeNum = (() => {
      const s = gradeLevel.trim().toLowerCase();
      if (s === 'k' || s === 'kindergarten') return 0;
      const rk = s.match(/^k-(\d+)$/); if (rk) return Math.round(parseInt(rk[1]) / 2);
      const r = s.match(/^(\d+)-(\d+)$/); if (r) return Math.round((parseInt(r[1]) + parseInt(r[2])) / 2);
      const n = parseInt(s); return isNaN(n) ? 9 : n;
    })();

    const ageGuard = gradeNum <= 5
      ? `IMPORTANT: ${name} is in elementary school (grade ${gradeNum}). Recommend ONLY picture books, early chapter books, or illustrated non-fiction appropriate for ages ${5 + gradeNum}–${7 + gradeNum}. NO young adult, NO mature themes, NO complex historical trauma. Examples: Magic Tree House, Mercy Watson, Henry and Mudge, Who Was? biographies for kids, National Geographic Kids.`
      : gradeNum <= 8
      ? `IMPORTANT: ${name} is in middle school (grade ${gradeNum}). Recommend middle-grade or early young adult books appropriate for ages ${10 + (gradeNum - 6)}–${13 + (gradeNum - 6)}.`
      : `${name} is in high school (grade ${gradeNum}). You may recommend young adult and classic/contemporary literary fiction.`;

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.8 })
      .withStructuredOutput(curateSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a brilliant living-books librarian. You hand-pick REAL, published books for homeschool students based on their specific interests and grade level.

${studentCtx.systemPromptAddendum}

${ageGuard}

CURATION RULES:
1. Pick books that DIRECTLY connect to their interests: ${interests.length > 0 ? interests.join(', ') : 'general learning'}
2. Vary formats: 1 fiction, 1 non-fiction, 1 biography or history, 1 wild card that surprises them
3. ONLY recommend books you are 100% certain exist with the exact title and author
4. For public domain books on Project Gutenberg, provide the exact URL (format: https://www.gutenberg.org/ebooks/[ID])
   - Common Gutenberg IDs: Treasure Island=120, Tom Sawyer=74, Little Women=514, Secret Garden=113, Wizard of Oz=55, Swiss Family Robinson=11707
5. Do NOT recommend books you are unsure about — accuracy of title and author is non-negotiable`,
      },
      {
        role: 'user',
        content: `Curate 4 books specifically for me. My interests: ${interests.join(', ') || 'open to anything great'}. Grade: ${gradeLevel}.`,
      },
    ]);

    return NextResponse.json(result.books);

  } catch (error) {
    console.error('[ReadingNook/curate] Error:', error);
    return NextResponse.json({ error: 'Failed to curate books', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
