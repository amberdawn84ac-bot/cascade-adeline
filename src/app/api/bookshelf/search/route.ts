import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { searchGoogleBooks } from '@/lib/google-books';
import { searchGutendexBooks } from '@/lib/gutendex';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    console.log('[bookshelf/search] Searching for:', query);

    // Search Google Books for metadata (title, author, description, cover)
    const googleResults = await searchGoogleBooks(query, 20);

    // Also search Gutendex to find which books have free EPUBs available
    const gutendexResults = await searchGutendexBooks(query);

    // Merge results: Use Google Books metadata, but add gutenbergId if available
    const mergedResults = googleResults.map((googleBook) => {
      // Try to find matching book in Gutendex results
      const gutendexMatch = gutendexResults.find((gutendexBook) => {
        const titleMatch = googleBook.title.toLowerCase().includes(gutendexBook.title.toLowerCase()) ||
                          gutendexBook.title.toLowerCase().includes(googleBook.title.toLowerCase());
        const authorMatch = googleBook.author.toLowerCase().includes(gutendexBook.authors[0]?.name.toLowerCase() || '') ||
                           (gutendexBook.authors[0]?.name.toLowerCase() || '').includes(googleBook.author.toLowerCase());
        return titleMatch && authorMatch;
      });

      return {
        ...googleBook,
        gutenbergId: gutendexMatch?.id.toString(),
        hasFreEpub: !!gutendexMatch,
      };
    });

    console.log('[bookshelf/search] Found', mergedResults.length, 'results');

    return NextResponse.json({
      results: mergedResults,
      count: mergedResults.length,
    });
  } catch (error) {
    console.error('[bookshelf/search] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    );
  }
}
