import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import prisma from '@/lib/db';

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    categories?: string[];
    averageRating?: number;
    previewLink?: string;
    infoLink?: string;
  };
  accessInfo?: {
    viewability?: string;
    embeddable?: boolean;
    publicDomain?: boolean;
    webReaderLink?: string;
  };
}

const bookRecommendationSchema = z.object({
  searchQueries: z.array(z.string()).length(4).describe('4 specific book search queries based on student interests and grade level'),
  whyRecommendations: z.array(z.string()).length(4).describe('Why each search query matches the student\'s interests'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const studentContext = await buildStudentContextPrompt(user.userId);

    // Get student's grade level for age-appropriate filtering
    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, interests: true }
    });

    const gradeLevel = student?.gradeLevel || 'Middle School';
    const interests = student?.interests || [];

    // Use LLM to generate targeted search queries based on student profile
    const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.7 })
      .withStructuredOutput(bookRecommendationSchema);

    let searchQueries: string[] = [];
    let whyRecommendations: string[] = [];

    try {
      const result = await llm.invoke([
        {
          role: 'system',
          content: `You are Adeline, a classical librarian. Generate 4 specific book search queries for Google Books API based on the student's profile.${studentContext}

RULES:
- Each query should target age-appropriate books for ${gradeLevel} students
- Match queries to their specific interests: ${interests.join(', ')}
- Vary genres: fiction, non-fiction, adventure, biography, science, history
- Use specific keywords that will find real, published books
- Prioritize classic literature and well-regarded contemporary books

Examples of good queries:
- "children's adventure fiction ages 8-12"
- "young adult science fiction space"
- "middle grade historical fiction world war"
- "biography for kids inventors"`,
        },
        {
          role: 'user',
          content: 'Generate 4 book search queries matched to my interests and grade level.',
        },
      ]);

      searchQueries = result.searchQueries;
      whyRecommendations = result.whyRecommendations;
    } catch (llmError) {
      console.error('[ReadingNook/curate] LLM Error, using default queries:', llmError);
      searchQueries = [
        `children's classic literature ages 8-12`,
        `young adult adventure fiction`,
        `middle grade science books`,
        `biography for kids historical figures`
      ];
      whyRecommendations = [
        'Classic literature builds vocabulary and cultural literacy',
        'Adventure stories engage imagination and teach problem-solving',
        'Science books inspire curiosity about the natural world',
        'Biographies show how real people overcame challenges'
      ];
    }

    // Fetch books from Google Books API
    const books = [];
    for (let i = 0; i < searchQueries.length; i++) {
      try {
        const query = encodeURIComponent(searchQueries[i]);
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&orderBy=relevance&printType=books&langRestrict=en`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            const book: GoogleBook = data.items[0];
            books.push({
              title: book.volumeInfo.title,
              author: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
              coverUrl: book.volumeInfo.imageLinks?.thumbnail || book.volumeInfo.imageLinks?.smallThumbnail || null,
              description: book.volumeInfo.description || 'No description available.',
              whyYouWillLoveIt: whyRecommendations[i],
              googleBooksLink: book.volumeInfo.previewLink || book.volumeInfo.infoLink,
              categories: book.volumeInfo.categories || [],
              rating: book.volumeInfo.averageRating,
              isPublicDomain: book.accessInfo?.publicDomain || false,
              webReaderLink: book.accessInfo?.webReaderLink,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch book for query "${searchQueries[i]}":`, error);
      }
    }

    // If we got fewer than 4 books, return what we have
    if (books.length > 0) {
      return NextResponse.json(books);
    }

    // Fallback to curated classics if API fails
    return NextResponse.json([
      {
        title: 'Treasure Island',
        author: 'Robert Louis Stevenson',
        coverUrl: null,
        description: 'A thrilling tale of pirates, buried treasure, and high-seas adventure.',
        whyYouWillLoveIt: 'Classic adventure story with memorable characters and exciting plot twists.',
        googleBooksLink: 'https://www.google.com/books/edition/Treasure_Island/yLs8AAAAYAAJ',
        isPublicDomain: true,
      },
      {
        title: 'Little Women',
        author: 'Louisa May Alcott',
        coverUrl: null,
        description: 'Follow the March sisters through their journey from childhood to adulthood.',
        whyYouWillLoveIt: 'A story of family, ambition, and finding your own path.',
        googleBooksLink: 'https://www.google.com/books/edition/Little_Women/qBIEAAAAYAAJ',
        isPublicDomain: true,
      },
      {
        title: 'The Adventures of Tom Sawyer',
        author: 'Mark Twain',
        coverUrl: null,
        description: 'Tom Sawyer\'s adventures along the Mississippi River.',
        whyYouWillLoveIt: 'Full of humor, friendship, and clever problem-solving.',
        googleBooksLink: 'https://www.google.com/books/edition/The_Adventures_of_Tom_Sawyer/VBQEAAAAYAAJ',
        isPublicDomain: true,
      },
      {
        title: 'The Secret Garden',
        author: 'Frances Hodgson Burnett',
        coverUrl: null,
        description: 'Mary Lennox discovers a hidden garden and transforms herself.',
        whyYouWillLoveIt: 'A beautiful story about healing, nature, and personal growth.',
        googleBooksLink: 'https://www.google.com/books/edition/The_Secret_Garden/KBQEAAAAYAAJ',
        isPublicDomain: true,
      },
    ]);
  } catch (error) {
    console.error('[ReadingNook/curate] Error:', error);
    return NextResponse.json({ error: 'Failed to curate books' }, { status: 500 });
  }
}
