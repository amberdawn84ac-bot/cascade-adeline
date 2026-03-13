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
      gutenbergId: z.number().optional().describe('Project Gutenberg ID number if this book is in the public domain'),
      gutenbergUrl: z.string().optional().describe('Full Project Gutenberg URL to read this book online (e.g., https://www.gutenberg.org/files/1342/1342-h/1342-h.htm)'),
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

    try {
      const result = await llm.invoke([
        {
          role: 'system',
          content: `You are Adeline, a classical librarian with encyclopedic knowledge of children's and young adult literature. Recommend exactly 4 real, published books perfectly matched to this specific student.${studentContext}

RULES:
- PRIORITIZE PUBLIC DOMAIN BOOKS available on Project Gutenberg that can be read online immediately
- For each public domain book, provide the gutenbergId and gutenbergUrl (HTML version preferred, e.g., https://www.gutenberg.org/files/1342/1342-h/1342-h.htm)
- Only recommend books that actually exist and are well-regarded
- Prioritize living books — rich in narrative, character, and ideas over textbooks or dry non-fiction
- Match vocabulary complexity and themes precisely to the student's grade level
- The whyYouWillLoveIt field MUST explicitly reference their specific interests by name
- Vary genres: mix fiction, narrative non-fiction, adventure, biography as appropriate

EXAMPLES OF PUBLIC DOMAIN BOOKS:
- Pride and Prejudice (gutenbergId: 1342, url: https://www.gutenberg.org/files/1342/1342-h/1342-h.htm)
- Treasure Island (gutenbergId: 120, url: https://www.gutenberg.org/files/120/120-h/120-h.htm)
- The Adventures of Tom Sawyer (gutenbergId: 74, url: https://www.gutenberg.org/files/74/74-h/74-h.htm)
- Little Women (gutenbergId: 514, url: https://www.gutenberg.org/files/514/514-h/514-h.htm)
- The Secret Garden (gutenbergId: 113, url: https://www.gutenberg.org/files/113/113-h/113-h.htm)

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
    } catch (llmError) {
      console.error('[ReadingNook/curate] LLM Error, using fallback:', llmError);
      
      const fallbackBooks = [
        {
          title: 'Treasure Island',
          author: 'Robert Louis Stevenson',
          gutenbergId: 120,
          gutenbergUrl: 'https://www.gutenberg.org/files/120/120-h/120-h.htm',
          coverDescription: 'A thrilling tale of pirates, buried treasure, and high-seas adventure. Young Jim Hawkins finds himself caught between mutineers and honest sailors on a dangerous voyage.',
          whyYouWillLoveIt: 'This classic adventure story combines mystery, danger, and moral choices. Perfect for readers who love action-packed narratives with memorable characters like Long John Silver.',
        },
        {
          title: 'Little Women',
          author: 'Louisa May Alcott',
          gutenbergId: 514,
          gutenbergUrl: 'https://www.gutenberg.org/files/514/514-h/514-h.htm',
          coverDescription: 'Follow the March sisters through their journey from childhood to adulthood during the Civil War era. A story of family, ambition, love, and finding your own path.',
          whyYouWillLoveIt: 'Each sister has a distinct personality and dreams. This book explores themes of creativity, independence, and staying true to yourself while navigating family expectations.',
        },
        {
          title: 'The Adventures of Tom Sawyer',
          author: 'Mark Twain',
          gutenbergId: 74,
          gutenbergUrl: 'https://www.gutenberg.org/files/74/74-h/74-h.htm',
          coverDescription: 'Tom Sawyer is a mischievous boy growing up along the Mississippi River. His adventures include witnessing a murder, getting lost in a cave, and hunting for treasure.',
          whyYouWillLoveIt: 'Full of humor, friendship, and clever problem-solving. Tom\'s adventures show both the fun and the moral challenges of growing up.',
        },
        {
          title: 'The Secret Garden',
          author: 'Frances Hodgson Burnett',
          gutenbergId: 113,
          gutenbergUrl: 'https://www.gutenberg.org/files/113/113-h/113-h.htm',
          coverDescription: 'Mary Lennox discovers a hidden, neglected garden on her uncle\'s estate. As she brings the garden back to life, she transforms herself and those around her.',
          whyYouWillLoveIt: 'A beautiful story about healing, nature, and the power of caring for something. Shows how nurturing growth in a garden mirrors personal transformation.',
        },
      ];

      return NextResponse.json(fallbackBooks);
    }
  } catch (error) {
    console.error('[ReadingNook/curate] Error:', error);
    return NextResponse.json({ error: 'Failed to curate books' }, { status: 500 });
  }
}

