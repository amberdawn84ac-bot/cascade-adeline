// Google Books API helper for book metadata
// https://developers.google.com/books/docs/v1/using

interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publishedDate?: string;
    publisher?: string;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    pageCount?: number;
    language?: string;
  };
}

interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBooksVolume[];
}

export interface BookMetadata {
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  publishedDate?: string;
  publisher?: string;
  genre?: string;
  pageCount?: number;
  googleBooksId?: string;
}

/**
 * Search Google Books API for book metadata
 * @param query - Search query (title, author, ISBN, etc.)
 * @param maxResults - Maximum number of results to return (default: 10)
 */
export async function searchGoogleBooks(
  query: string,
  maxResults: number = 10
): Promise<BookMetadata[]> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    const baseUrl = 'https://www.googleapis.com/books/v1/volumes';
    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
      ...(apiKey && { key: apiKey }), // API key is optional but increases rate limits
    });

    console.log('[google-books] Searching for:', query);

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();
    console.log('[google-books] Found', data.totalItems, 'results');

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map((volume) => ({
      title: volume.volumeInfo.title,
      author: volume.volumeInfo.authors?.join(', ') || 'Unknown Author',
      description: volume.volumeInfo.description,
      coverUrl: volume.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://'),
      publishedDate: volume.volumeInfo.publishedDate,
      publisher: volume.volumeInfo.publisher,
      genre: volume.volumeInfo.categories?.[0],
      pageCount: volume.volumeInfo.pageCount,
      googleBooksId: volume.id,
    }));
  } catch (error) {
    console.error('[google-books] Search error:', error);
    return [];
  }
}

/**
 * Get a specific book by Google Books ID
 */
export async function getGoogleBook(volumeId: string): Promise<BookMetadata | null> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    const baseUrl = `https://www.googleapis.com/books/v1/volumes/${volumeId}`;
    const params = new URLSearchParams({
      ...(apiKey && { key: apiKey }),
    });

    console.log('[google-books] Fetching volume:', volumeId);

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const volume: GoogleBooksVolume = await response.json();

    return {
      title: volume.volumeInfo.title,
      author: volume.volumeInfo.authors?.join(', ') || 'Unknown Author',
      description: volume.volumeInfo.description,
      coverUrl: volume.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://'),
      publishedDate: volume.volumeInfo.publishedDate,
      publisher: volume.volumeInfo.publisher,
      genre: volume.volumeInfo.categories?.[0],
      pageCount: volume.volumeInfo.pageCount,
      googleBooksId: volume.id,
    };
  } catch (error) {
    console.error('[google-books] Fetch error:', error);
    return null;
  }
}

/**
 * Search for a specific book by title and author
 */
export async function searchGoogleBooksByTitleAuthor(
  title: string,
  author: string
): Promise<BookMetadata | null> {
  const query = `intitle:${title} inauthor:${author}`;
  const results = await searchGoogleBooks(query, 1);
  return results.length > 0 ? results[0] : null;
}
