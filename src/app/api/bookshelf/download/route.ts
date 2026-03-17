import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { put } from '@vercel/blob';

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

    // JIT MAGIC: Fetch from Project Gutenberg
    if (!book.gutenbergId) {
      return NextResponse.json(
        { error: 'Book does not have a Gutenberg ID - cannot download' },
        { status: 400 }
      );
    }

    console.log('[bookshelf/download] Fetching .epub from Project Gutenberg:', book.gutenbergId);

    // Construct Project Gutenberg .epub URL
    // Format: https://www.gutenberg.org/ebooks/[id].epub.images
    const gutenbergUrl = `https://www.gutenberg.org/ebooks/${book.gutenbergId}.epub.images`;

    try {
      // Fetch the .epub file from Project Gutenberg
      const epubResponse = await fetch(gutenbergUrl, {
        headers: {
          'User-Agent': 'Dear Adeline Educational Platform (contact@dearadeline.com)',
        },
      });

      if (!epubResponse.ok) {
        throw new Error(`Gutenberg fetch failed: ${epubResponse.status}`);
      }

      const epubBuffer = await epubResponse.arrayBuffer();
      console.log('[bookshelf/download] Downloaded .epub, size:', epubBuffer.byteLength, 'bytes');

      // Save to Vercel Blob storage
      const blob = await put(
        `books/${book.gutenbergId}/${book.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.epub`,
        epubBuffer,
        {
          access: 'public',
          contentType: 'application/epub+zip',
        }
      );

      console.log('[bookshelf/download] Saved to Vercel Blob:', blob.url);

      // Update database record
      await prisma.livingBook.update({
        where: { id: book.id },
        data: {
          isDownloaded: true,
          epubFileUrl: blob.url,
        },
      });

      console.log('[bookshelf/download] Database updated, JIT fetch complete');

      return NextResponse.json({
        epubFileUrl: blob.url,
        cached: false,
      });
    } catch (fetchError) {
      console.error('[bookshelf/download] Error fetching from Gutenberg:', fetchError);
      
      // Fallback: Try alternative Gutenberg URL format
      const altUrl = `https://www.gutenberg.org/files/${book.gutenbergId}/${book.gutenbergId}-0.epub`;
      console.log('[bookshelf/download] Trying alternative URL:', altUrl);

      try {
        const altResponse = await fetch(altUrl, {
          headers: {
            'User-Agent': 'Dear Adeline Educational Platform (contact@dearadeline.com)',
          },
        });

        if (!altResponse.ok) {
          throw new Error(`Alternative URL also failed: ${altResponse.status}`);
        }

        const epubBuffer = await altResponse.arrayBuffer();
        console.log('[bookshelf/download] Downloaded from alternative URL, size:', epubBuffer.byteLength, 'bytes');

        const blob = await put(
          `books/${book.gutenbergId}/${book.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.epub`,
          epubBuffer,
          {
            access: 'public',
            contentType: 'application/epub+zip',
          }
        );

        await prisma.livingBook.update({
          where: { id: book.id },
          data: {
            isDownloaded: true,
            epubFileUrl: blob.url,
          },
        });

        return NextResponse.json({
          epubFileUrl: blob.url,
          cached: false,
        });
      } catch (altError) {
        console.error('[bookshelf/download] Alternative URL also failed:', altError);
        return NextResponse.json(
          { 
            error: 'Failed to download book from Project Gutenberg. The book may not be available in .epub format.',
            details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
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
