// Standard Ebooks API helper for high-quality formatted books
// https://standardebooks.org/

interface StandardEbooksBook {
  title: string;
  author: string;
  url: string;
  epubUrl: string;
  coverUrl?: string;
}

/**
 * Formats author and title into Standard Ebooks URL slug format
 * Example: "Lewis Carroll" + "Alice's Adventures in Wonderland" 
 *   -> "lewis-carroll/alices-adventures-in-wonderland"
 */
export function formatStandardEbooksSlug(author: string, title: string): string {
  const formatPart = (text: string) => {
    return text
      .toLowerCase()
      .replace(/['']/g, '') // Remove apostrophes
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
  };

  const authorSlug = formatPart(author);
  const titleSlug = formatPart(title);
  
  return `${authorSlug}/${titleSlug}`;
}

/**
 * Attempts to fetch a book from Standard Ebooks
 * Returns the epub URL if successful, null if not found
 */
export async function fetchStandardEbooksEpub(
  author: string,
  title: string
): Promise<{ epubUrl: string; coverUrl?: string } | null> {
  try {
    const slug = formatStandardEbooksSlug(author, title);
    const baseUrl = `https://standardebooks.org/ebooks/${slug}`;
    const epubUrl = `${baseUrl}/downloads/${slug.split('/')[1]}.epub`;
    
    console.log('[standard-ebooks] Attempting to fetch:', epubUrl);
    
    // Check if the epub exists by making a HEAD request
    const response = await fetch(epubUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Dear Adeline Educational Platform (contact@dearadeline.com)',
      },
    });
    
    if (response.ok) {
      console.log('[standard-ebooks] ✓ Found high-quality edition');
      
      // Standard Ebooks cover URL format
      const coverUrl = `${baseUrl}/downloads/cover.jpg`;
      
      return {
        epubUrl,
        coverUrl,
      };
    }
    
    console.log('[standard-ebooks] ✗ Not available (404)');
    return null;
  } catch (error) {
    console.error('[standard-ebooks] Error checking availability:', error);
    return null;
  }
}

/**
 * Alternative: Try common variations of the title
 * Standard Ebooks sometimes uses different formatting
 */
export async function fetchStandardEbooksWithVariations(
  author: string,
  title: string
): Promise<{ epubUrl: string; coverUrl?: string } | null> {
  // Try exact match first
  let result = await fetchStandardEbooksEpub(author, title);
  if (result) return result;
  
  // Try without subtitle (everything before a colon)
  if (title.includes(':')) {
    const mainTitle = title.split(':')[0].trim();
    result = await fetchStandardEbooksEpub(author, mainTitle);
    if (result) return result;
  }
  
  // Try without "The" prefix
  if (title.toLowerCase().startsWith('the ')) {
    const titleWithoutThe = title.substring(4);
    result = await fetchStandardEbooksEpub(author, titleWithoutThe);
    if (result) return result;
  }
  
  return null;
}

/**
 * Downloads the epub file from Standard Ebooks
 */
export async function downloadStandardEbooksEpub(epubUrl: string): Promise<ArrayBuffer> {
  console.log('[standard-ebooks] Downloading epub from:', epubUrl);
  
  const response = await fetch(epubUrl, {
    headers: {
      'User-Agent': 'Dear Adeline Educational Platform (contact@dearadeline.com)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download from Standard Ebooks: ${response.status}`);
  }
  
  const buffer = await response.arrayBuffer();
  console.log('[standard-ebooks] Downloaded epub, size:', buffer.byteLength, 'bytes');
  
  return buffer;
}
