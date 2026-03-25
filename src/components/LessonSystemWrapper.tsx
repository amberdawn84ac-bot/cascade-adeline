'use client';

import React, { useEffect, useState } from 'react';
import { StreamingLessonRenderer } from './lessons/StreamingLessonRenderer';
import { FloatingBeeBubble } from './FloatingBeeBubble';
import { usePathname } from 'next/navigation';
import { useLessonStream } from '@/hooks/useLessonStream';

export function LessonSystemWrapper({ userId }: { userId?: string }) {
  const pathname = usePathname();
  const [showLesson, setShowLesson] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const { startLesson } = useLessonStream();

  // Show lesson renderer on all authenticated pages except auth/onboarding
  useEffect(() => {
    const shouldShow = userId && !pathname.includes('/auth') && !pathname.includes('/onboarding');
    setShowLesson(!!shouldShow);
  }, [userId, pathname]);

  if (!userId) {
    return null;
  }

  const handleBlockResponse = async (blockId: string, response: unknown) => {
    console.log('[LessonSystemWrapper] Block response:', blockId, response);
  };

  const handleLessonStream = (blocks: unknown[]) => {
    // Called by FloatingBeeBubble when lesson blocks arrive via AI SDK data stream
    blocks.forEach(block => window.__addLessonBlock?.(block as Parameters<NonNullable<typeof window.__addLessonBlock>>[0]));
  };

  const handleLessonRequest = async (topic: string) => {
    console.log('[LessonSystemWrapper] Lesson requested:', topic);
    const savedId = await startLesson(topic);
    if (savedId) {
      setActiveLessonId(savedId);
    }
  };

  return (
    <>
      {/* Floating Bee Bubble - Always visible */}
      <FloatingBeeBubble
        userId={userId}
        onLessonStream={handleLessonStream}
        onLessonRequest={handleLessonRequest}
      />

      {/* Streaming Lesson Renderer - Main content area */}
      {showLesson && (
        <StreamingLessonRenderer
          userId={userId}
          onBlockResponse={handleBlockResponse}
        />
      )}
    </>
  );
}
