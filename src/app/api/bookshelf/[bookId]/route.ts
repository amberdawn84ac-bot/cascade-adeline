import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getGutendexBook, extractCoverUrl } from '@/lib/gutendex';

// Hardcoded book catalog for common curriculum books (metadata only)
const BOOK_CATALOG: Record<string, {
  id: string;
  title: string;
  author: string;
  description: string;
  readingLevel: string;
  genre: string;
  gutenbergId?: string;
  pdfUrl?: string;
  externalUrl?: string;
  coverUrl?: string;
  chapters?: Array<{ number: number; title: string; pageStart?: number }>;
}> = {
  'lies-my-teacher-told-me': {
    id: 'lies-my-teacher-told-me',
    title: 'Lies My Teacher Told Me',
    author: 'James W. Loewen',
    description: 'Everything your American history textbook got wrong. This book examines twelve different American history textbooks and concludes that textbook authors propagate factually false, Eurocentric, and mythologized views of history.',
    readingLevel: 'High School / Adult',
    genre: 'History / Non-Fiction',
    externalUrl: 'https://archive.org/details/liesmyteachertol00loew',
    coverUrl: '/books/lies-my-teacher-told-me-cover.jpg',
    chapters: [
      { number: 1, title: 'Handicapped by History: The Process of Hero-Making', pageStart: 11 },
      { number: 2, title: 'The Truth About the First Thanksgiving', pageStart: 67 },
      { number: 3, title: 'The Invisible Man: The Myth of the Lone Ranger', pageStart: 101 },
    ],
  },
  'little-house-on-the-prairie': {
    id: 'little-house-on-the-prairie',
    title: 'Little House on the Prairie',
    author: 'Laura Ingalls Wilder',
    description: 'The classic story of a pioneer family\'s adventures on the Kansas prairie. A vivid account of homesteading life in the 1870s.',
    readingLevel: 'Elementary / Middle School',
    genre: 'Historical Fiction / Autobiography',
    externalUrl: 'https://archive.org/details/littlehouseonpra00wild',
    coverUrl: '/books/little-house-cover.jpg',
    chapters: [
      { number: 1, title: 'Going West', pageStart: 1 },
      { number: 2, title: 'Crossing the Creek', pageStart: 12 },
      { number: 3, title: 'Camp on the High Prairie', pageStart: 23 },
    ],
  },
  'farmer-boy': {
    id: 'farmer-boy',
    title: 'Farmer Boy',
    author: 'Laura Ingalls Wilder',
    description: 'The story of Almanzo Wilder\'s childhood on a prosperous farm in New York State. Detailed descriptions of 19th-century farm life, work, and self-sufficiency.',
    readingLevel: 'Elementary / Middle School',
    genre: 'Historical Fiction / Autobiography',
    externalUrl: 'https://archive.org/details/farmerboy00wild',
    coverUrl: '/books/farmer-boy-cover.jpg',
  },
  'charlotte-web': {
    id: 'charlotte-web',
    title: "Charlotte's Web",
    author: 'E.B. White',
    description: 'The beloved story of a pig named Wilbur and his friendship with a barn spider named Charlotte. A timeless tale about friendship, loyalty, and the cycle of life on a farm.',
    readingLevel: 'Elementary',
    genre: 'Fiction / Children\'s Literature',
    externalUrl: 'https://archive.org/details/charlottesweb00whit',
    coverUrl: '/books/charlottes-web-cover.jpg',
  },
  'people-history-united-states': {
    id: 'people-history-united-states',
    title: "A People's History of the United States",
    author: 'Howard Zinn',
    description: 'American history from the perspective of those outside of political and economic power. Covers Columbus through the Clinton administration, focusing on the experiences of Native Americans, African Americans, women, and laborers.',
    readingLevel: 'High School / Adult',
    genre: 'History / Non-Fiction',
    externalUrl: 'https://archive.org/details/peopleshistoryof00zinn',
    coverUrl: '/books/peoples-history-cover.jpg',
  },
  'narrative-life-frederick-douglass': {
    id: 'narrative-life-frederick-douglass',
    title: 'Narrative of the Life of Frederick Douglass',
    author: 'Frederick Douglass',
    description: 'Frederick Douglass\'s powerful autobiography describing his experiences as an enslaved person and his journey to freedom. A primary source document of immense historical importance.',
    readingLevel: 'Middle School / High School',
    genre: 'Autobiography / Primary Source',
    externalUrl: 'https://archive.org/details/narrativeoflifeo00doug',
    coverUrl: '/books/frederick-douglass-cover.jpg',
  },
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ bookId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const params = await context.params;
    const { bookId } = params;

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    }

    // Check hardcoded catalog first
    const catalogBook = BOOK_CATALOG[bookId];
    if (catalogBook) {
      return NextResponse.json(catalogBook);
    }

    // Check database for user's books
    const dbBook = await prisma.livingBook.findFirst({
      where: {
        userId: user.userId,
        OR: [
          { id: bookId },
          { gutenbergId: bookId },
          { title: { contains: bookId.replace(/-/g, ' '), mode: 'insensitive' } },
        ],
      },
    });

    if (dbBook) {
      return NextResponse.json({
        id: dbBook.id,
        title: dbBook.title,
        author: dbBook.author,
        description: dbBook.description,
        readingLevel: dbBook.readingLevel,
        genre: dbBook.genre,
        gutenbergId: dbBook.gutenbergId,
        isDownloaded: dbBook.isDownloaded,
        epubFileUrl: dbBook.epubFileUrl,
        pdfUrl: dbBook.pdfUrl,
        externalUrl: dbBook.externalUrl,
        coverUrl: dbBook.coverUrl,
      });
    }

    // Book not found
    return NextResponse.json(
      { error: 'Book not found in your bookshelf' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[bookshelf/[bookId]] Error fetching book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    );
  }
}
