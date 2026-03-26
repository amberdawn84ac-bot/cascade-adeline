'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { StreamingLessonRenderer } from './lessons/StreamingLessonRenderer';
import { FloatingBeeBubble } from './FloatingBeeBubble';
import { usePathname } from 'next/navigation';
import { useLessonStream } from '@/hooks/useLessonStream';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export function LessonSystemWrapper({ userId }: { userId?: string }) {
  const pathname = usePathname();
  const [lessonOverlayOpen, setLessonOverlayOpen] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const { startLesson, isStreaming, error } = useLessonStream();

  if (!userId) return null;

  // Hide on auth / onboarding pages
  const isAuthPage = pathname.includes('/auth') || pathname.includes('/onboarding');
  if (isAuthPage) return null;

  const handleBlockResponse = (blockId: string, response: unknown) => {
    console.log('[LessonSystemWrapper] Block response:', blockId, response);
  };

  // Step 1: bubble asks for a lesson — open overlay so renderer mounts
  const handleLessonRequest = useCallback((topic: string) => {
    console.log('[LessonSystemWrapper] Lesson requested via bubble:', topic);
    setPendingTopic(topic);
    setLessonOverlayOpen(true);
  }, []);

  const handleLessonStream = (blocks: unknown[]) => {
    blocks.forEach(block =>
      window.__addLessonBlock?.(block as Parameters<NonNullable<typeof window.__addLessonBlock>>[0])
    );
  };

  return (
    <>
      {/* Floating Bee Bubble — always visible on authenticated pages */}
      <FloatingBeeBubble
        userId={userId}
        onLessonStream={handleLessonStream}
        onLessonRequest={handleLessonRequest}
      />

      {/* Full-screen lesson overlay — appears when bubble triggers a lesson */}
      {lessonOverlayOpen && (
        <LessonOverlay
          userId={userId}
          pendingTopic={pendingTopic}
          isStreaming={isStreaming}
          error={error}
          startLesson={startLesson}
          onClose={() => {
            setLessonOverlayOpen(false);
            setPendingTopic(null);
          }}
          onBlockResponse={handleBlockResponse}
        />
      )}
    </>
  );
}

// Separate component so useEffect fires after mount
function LessonOverlay({
  userId,
  pendingTopic,
  isStreaming,
  error,
  startLesson,
  onClose,
  onBlockResponse,
}: {
  userId: string;
  pendingTopic: string | null;
  isStreaming: boolean;
  error: string | null;
  startLesson: (topic: string) => Promise<string | null>;
  onClose: () => void;
  onBlockResponse: (id: string, response: unknown) => void;
}) {
  // Fire stream after this component (and its StreamingLessonRenderer child) has mounted
  useEffect(() => {
    if (!pendingTopic) return;
    console.log('[LessonOverlay] Mounted — starting lesson stream for:', pendingTopic);
    startLesson(pendingTopic).then(savedId => {
      console.log('[LessonOverlay] Lesson stream complete, savedId:', savedId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount only

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFEF7] overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[#BD6809] hover:text-[#2F4731] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {isStreaming && (
          <div className="flex items-center gap-3 py-4 mb-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#BD6809]" />
            <p className="text-[#2F4731]/60 italic text-sm">Adeline is preparing your lesson…</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">Something went wrong: {error}</p>
          </div>
        )}

        <StreamingLessonRenderer userId={userId} onBlockResponse={onBlockResponse} />
      </div>
    </div>
  );
}
