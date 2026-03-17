// Gutendex API helper for Project Gutenberg integration
// https://gutendex.com/

interface GutendexBook {
  id: number;
  title: string;
  authors: Array<{ name: string }>;
  subjects: string[];
  bookshelves: string[];
  formats: Record<string, string>;
  download_count: number;
}

interface GutendexResponse {
  count: number;
  results: GutendexBook[];
}

export async function searchGutendexBooks(query: string): Promise<GutendexBook[]> {
  try {
    const searchUrl = `https://gutendex.com/books/?search=${encodeURIComponent(query)}`;
    console.log('[gutendex] Searching for:', query);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Gutendex API error: ${response.status}`);
    }
    
    const data: GutendexResponse = await response.json();
    console.log('[gutendex] Found', data.count, 'results');
    
    return data.results;
  } catch (error) {
    console.error('[gutendex] Search error:', error);
    return [];
  }
}

export async function getGutendexBook(gutenbergId: string): Promise<GutendexBook | null> {
  try {
    const bookUrl = `https://gutendex.com/books/${gutenbergId}`;
    console.log('[gutendex] Fetching book:', gutenbergId);
    
    const response = await fetch(bookUrl);
    if (!response.ok) {
      throw new Error(`Gutendex API error: ${response.status}`);
    }
    
    const book: GutendexBook = await response.json();
    return book;
  } catch (error) {
    console.error('[gutendex] Fetch error:', error);
    return null;
  }
}

export function extractCoverUrl(book: GutendexBook): string | null {
  // Gutendex provides cover images in formats object
  return book.formats['image/jpeg'] || null;
}

export function extractEpubUrl(book: GutendexBook): string | null {
  // Look for .epub with images first, then fallback to regular .epub
  return (
    book.formats['application/epub+zip'] ||
    book.formats['application/epub'] ||
    null
  );
}

export function categorizeGenre(subjects: string[]): string {
  // Simple genre categorization based on Gutenberg subjects
  const subjectsLower = subjects.map(s => s.toLowerCase()).join(' ');
  
  if (subjectsLower.includes('fiction') || subjectsLower.includes('novel')) {
    return 'Fiction';
  }
  if (subjectsLower.includes('history')) {
    return 'History';
  }
  if (subjectsLower.includes('science')) {
    return 'Science';
  }
  if (subjectsLower.includes('biography') || subjectsLower.includes('autobiography')) {
    return 'Biography';
  }
  if (subjectsLower.includes('poetry')) {
    return 'Poetry';
  }
  if (subjectsLower.includes('children')) {
    return "Children's Literature";
  }
  
  return 'Literature';
}
