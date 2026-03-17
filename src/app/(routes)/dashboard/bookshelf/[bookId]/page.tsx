'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  readingLevel?: string;
  genre?: string;
  pdfUrl?: string;
  externalUrl?: string;
  chapters?: Array<{
    number: number;
    title: string;
    pageStart?: number;
  }>;
}

export default function BookshelfBookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.bookId as string;
  
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookshelf/${bookId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Book not found in your bookshelf');
          }
          throw new Error('Failed to load book');
        }
        
        const data = await res.json();
        setBook(data);
      } catch (e) {
        console.error('Error loading book:', e);
        setError(e instanceof Error ? e.message : 'Failed to load book');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FF]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-900 font-bold mb-4">{error || 'Book not found'}</p>
              <Link href="/dashboard/reading-nook">
                <Button>Back to Reading Nook</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      {/* Header */}
      <div className="bg-amber-900 text-white p-6 border-b border-amber-800">
        <div className="max-w-6xl mx-auto">
          <Link href="/dashboard/reading-nook">
            <Button variant="ghost" className="text-white hover:bg-amber-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reading Nook
            </Button>
          </Link>
          <div className="flex items-start gap-6">
            {book.coverUrl && (
              <img 
                src={book.coverUrl} 
                alt={book.title}
                className="w-32 h-48 object-cover rounded-lg shadow-lg border-2 border-amber-700"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
              <p className="text-amber-300 text-xl mb-2">by {book.author}</p>
              {book.readingLevel && (
                <span className="inline-block bg-amber-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {book.readingLevel}
                </span>
              )}
              {book.genre && (
                <span className="inline-block bg-amber-800 text-white px-3 py-1 rounded-full text-sm font-bold ml-2">
                  {book.genre}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Description */}
        {book.description && (
          <Card className="border-2 border-amber-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-amber-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                About This Book
              </h2>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Reading Options */}
        <Card className="border-2 border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-emerald-900 mb-4">Start Reading</h2>
            <div className="space-y-3">
              {book.pdfUrl && (
                <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-lg">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Open PDF Reader
                  </Button>
                </a>
              )}
              {book.externalUrl && (
                <a href={book.externalUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Read Online
                  </Button>
                </a>
              )}
              {!book.pdfUrl && !book.externalUrl && (
                <div className="bg-amber-100 border-2 border-amber-300 rounded-lg p-4 text-center">
                  <p className="text-amber-900 font-medium">
                    This book is available in your physical library. Check your bookshelf!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chapters */}
        {book.chapters && book.chapters.length > 0 && (
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Chapters</h2>
              <div className="space-y-2">
                {book.chapters.map((chapter) => (
                  <div 
                    key={chapter.number}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-blue-900">Chapter {chapter.number}</span>
                      <span className="text-blue-700 ml-2">{chapter.title}</span>
                    </div>
                    {chapter.pageStart && (
                      <span className="text-sm text-blue-600">Page {chapter.pageStart}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reading Log Prompt */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-purple-900 mb-3">📝 After Reading</h3>
            <p className="text-sm text-purple-800 mb-4">
              When you finish a chapter or section, head to the Reading Nook to log your narration and earn credits!
            </p>
            <Link href="/dashboard/reading-nook">
              <Button variant="outline" className="border-2 border-purple-300 text-purple-700 hover:bg-purple-100">
                Go to Reading Nook
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
