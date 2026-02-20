import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { InvestigationBoard } from '@/components/ui/investigation/InvestigationBoard';
import { Share2, Clock } from 'lucide-react';

interface SharePageProps {
  params: { shareId: string };
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = params;

  // Find the share link and verify it's not expired
  const shareLink = await prisma.shareLink.findUnique({
    where: { id: shareId },
    include: {
      investigation: {
        include: {
          sources: true,
        },
      },
      creator: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!shareLink || shareLink.expiresAt < new Date()) {
    notFound();
  }

  const { investigation, creator } = shareLink;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Share2 className="text-teal-600" size={32} />
            <h1 className="text-3xl font-bold text-teal-800" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Shared Investigation
            </h1>
          </div>
          <p className="text-teal-600">
            Shared by <span className="font-bold">{creator.name}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-teal-500 mt-2">
            <Clock size={14} />
            <span>Link expires on {shareLink.expiresAt.toLocaleDateString()}</span>
          </div>
        </header>

        {/* Investigation Board */}
        <div className="max-w-4xl mx-auto">
          <InvestigationBoard
            investigation={investigation}
            isSharedView={true}
            shareId={shareId}
          />
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-teal-600">
          <p className="text-sm">
            This is a shared view of an investigation board.{' '}
            <a href="/" className="underline hover:text-teal-800">
              Start your own investigation with Adeline
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
