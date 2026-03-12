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
      justiceTheme: z.object({
        systemicIssue: z.string().describe('What systemic injustice, regulatory capture, or human dignity issue this book exposes or addresses'),
        realWorldConnection: z.string().describe('A current case, clemency campaign, policy fight, or advocacy organization related to this theme (be specific with names)'),
        actionPrompt: z.string().describe('Concrete action the student can take after reading (research a case, write a letter, support a campaign - with specific targets)')
      }).optional().describe('If this book addresses systemic justice, connect it to real-world advocacy'),
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
- Vary genres: mix fiction, narrative non-fiction, adventure, biography as appropriate

CRITICAL JUSTICE CONNECTION DIRECTIVE: Prioritize books that expose systemic injustice, regulatory capture, corporate harm, or human dignity issues. For each book that addresses justice themes, generate a justiceTheme with:
1. The specific systemic issue the book exposes (mass incarceration, environmental racism, worker exploitation, etc.)
2. A REAL current case or campaign related to this theme (name specific people, organizations, or policies)
3. A concrete action prompt with specific targets (e.g., "Research the case of [Name] serving life for non-violent offense", "Write to Senator [Name] about [Policy]", "Support [Organization]'s campaign to [Goal]")

Examples:
- Book about wrongful conviction → Justice theme: Mass incarceration → Real connection: Innocence Project + specific exoneree case → Action: Research their case and write to the parole board
- Book about environmental damage → Justice theme: Corporate pollution → Real connection: Specific EPA case or community fight → Action: Draft FOIA request for local pollution data
- Book about labor rights → Justice theme: Wage theft → Real connection: Current union campaign or policy fight → Action: Write to representative about minimum wage law`,
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

