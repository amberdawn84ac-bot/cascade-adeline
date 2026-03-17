import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { put } from '@vercel/blob';
import { fetchStandardEbooksWithVariations, downloadStandardEbooksEpub } from '@/lib/standard-ebooks';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { bookId } = await req.json();
    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    }

    console.log('[bookshelf/download] JIT fetch requested for bookId:', bookId);

    // Find the book in database
    const book = await prisma.livingBook.findFirst({
      where: {
        OR: [
          { id: bookId },
          { gutenbergId: bookId },
        ],
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found in your bookshelf' },
        { status: 404 }
      );
    }

    // If already downloaded, return existing URL immediately
    if (book.isDownloaded && book.epubFileUrl) {
      console.log('[bookshelf/download] Book already downloaded, returning cached URL');
      return NextResponse.json({
        epubFileUrl: book.epubFileUrl,
        cached: true,
      });
    }

    // WATERFALL ARCHITECTURE: Try Standard Ebooks first (The Boutique), then Gutenberg (The Warehouse)
    
    console.log('[bookshelf/download] Starting Waterfall fetch for:', book.title, 'by', book.author);
    
    let epubBuffer: ArrayBuffer;
    let sourceLibrary: string;
    let coverUrl: string | undefined;

    // STEP 1: Try Standard Ebooks (High-Quality Formatting)
    console.log('[bookshelf/download] STEP 1: Checking Standard Ebooks...');
    const standardEbooksResult = await fetchStandardEbooksWithVariations(book.author, book.title);
    
    if (standardEbooksResult) {
      console.log('[bookshelf/download] ✓ Found on Standard Ebooks! Downloading high-quality edition...');
      try {
        epubBuffer = await downloadStandardEbooksEpub(standardEbooksResult.epubUrl);
        sourceLibrary = 'Standard Ebooks';
        coverUrl = standardEbooksResult.coverUrl;
        console.log('[bookshelf/download] ✓ Standard Ebooks download complete');
      } catch (standardError) {
        console.error('[bookshelf/download] Standard Ebooks download failed, falling back to Gutenberg:', standardError);
        // Fall through to Gutenberg fallback
        epubBuffer = await fetchFromGutenberg(book);
        sourceLibrary = 'Project Gutenberg';
      }
    } else {
      // STEP 2: Fallback to Project Gutenberg
      console.log('[bookshelf/download] ✗ Not available on Standard Ebooks');
      console.log('[bookshelf/download] STEP 2: Falling back to Project Gutenberg...');
      epubBuffer = await fetchFromGutenberg(book);
      sourceLibrary = 'Project Gutenberg';
    }

    // Save to Vercel Blob storage
    const filename = `${book.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.epub`;
    const blobPath = book.gutenbergId 
      ? `books/${book.gutenbergId}/${filename}`
      : `books/${book.id}/${filename}`;
      
    const blob = await put(blobPath, epubBuffer, {
      access: 'public',
      contentType: 'application/epub+zip',
    });

    console.log('[bookshelf/download] Saved to Vercel Blob:', blob.url);

    // Update database record with source library
    await prisma.livingBook.update({
      where: { id: book.id },
      data: {
        isDownloaded: true,
        epubFileUrl: blob.url,
        sourceLibrary,
        ...(coverUrl && { coverUrl }), // Update cover if Standard Ebooks provided one
      },
    });

    console.log('[bookshelf/download] Database updated, JIT fetch complete from:', sourceLibrary);

    return NextResponse.json({
      epubFileUrl: blob.url,
      sourceLibrary,
      cached: false,
    });
  } catch (error) {
    console.error('[bookshelf/download] Error in JIT download:', error);
    return NextResponse.json(
      { 
        error: 'Failed to download book',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to fetch from Project Gutenberg
 */
async function fetchFromGutenberg(book: any): Promise<ArrayBuffer> {
  if (!book.gutenbergId) {
    throw new Error('Book does not have a Gutenberg ID - cannot download');
  }

  console.log('[bookshelf/download] Fetching .epub from Project Gutenberg:', book.gutenbergId);

  // Construct Project Gutenberg .epub URL
  const gutenbergUrl = `https://www.gutenberg.org/ebooks/${book.gutenbergId}.epub.images`;

  try {
    const epubResponse = await fetch(gutenbergUrl, {
      headers: {
        'User-Agent': 'Dear Adeline Educational Platform (contact@dearadeline.com)',
      },
    });

    if (!epubResponse.ok) {
      throw new Error(`Gutenberg fetch failed: ${epubResponse.status}`);
    }

    const epubBuffer = await epubResponse.arrayBuffer();
    console.log('[bookshelf/download] Downloaded .epub from Gutenberg, size:', epubBuffer.byteLength, 'bytes');
    return epubBuffer;
  } catch (fetchError) {
    console.error('[bookshelf/download] Primary Gutenberg URL failed, trying alternative:', fetchError);
    
    // Fallback: Try alternative Gutenberg URL format
    const altUrl = `https://www.gutenberg.org/files/${book.gutenbergId}/${book.gutenbergId}-0.epub`;
    console.log('[bookshelf/download] Trying alternative URL:', altUrl);

    const altResponse = await fetch(altUrl, {
      headers: {
        'User-Agent': 'Dear Adeline Educational Platform (contact@dearadeline.com)',
      },
    });

    if (!altResponse.ok) {
      throw new Error(`Both Gutenberg URLs failed. Primary: ${fetchError}, Alternative: ${altResponse.status}`);
    }

    const epubBuffer = await altResponse.arrayBuffer();
    console.log('[bookshelf/download] Downloaded from alternative Gutenberg URL, size:', epubBuffer.byteLength, 'bytes');
    return epubBuffer;
  }
}
