'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink } from 'lucide-react';

interface BookTeleportButtonProps {
  title: string;
  bookId: string;
  chapterOrPage?: string;
  className?: string;
}

export function BookTeleportButton({ 
  title, 
  bookId, 
  chapterOrPage,
  className = '' 
}: BookTeleportButtonProps) {
  return (
    <Link href={`/dashboard/bookshelf/${bookId}`}>
      <Button 
        className={`bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold shadow-lg hover:shadow-xl transition-all ${className}`}
      >
        <BookOpen className="w-5 h-5 mr-2" />
        <span className="flex flex-col items-start">
          <span className="text-xs uppercase tracking-wider opacity-90">Open Book:</span>
          <span className="text-sm font-black">
            {title}
            {chapterOrPage && <span className="ml-2 text-xs font-normal">({chapterOrPage})</span>}
          </span>
        </span>
        <ExternalLink className="w-4 h-4 ml-2 opacity-75" />
      </Button>
    </Link>
  );
}
