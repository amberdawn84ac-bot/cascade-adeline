'use client';

import React, { useEffect, useState } from 'react';
import { StreamingLessonRenderer } from './lessons/StreamingLessonRenderer';
import { FloatingBeeBubble } from './FloatingBeeBubble';
import { usePathname } from 'next/navigation';

export function LessonSystemWrapper({ userId }: { userId?: string }) {
  const pathname = usePathname();
  const [showLesson, setShowLesson] = useState(false);

  // Show lesson renderer on all authenticated pages except auth/onboarding
  useEffect(() => {
    const shouldShow = userId && !pathname.includes('/auth') && !pathname.includes('/onboarding');
    setShowLesson(!!shouldShow);
  }, [userId, pathname]);

  if (!userId) {
    return null;
  }

  const handleBlockResponse = async (blockId: string, response: any) => {
    // This will be called by StreamingLessonRenderer when student answers
    console.log('[LessonSystemWrapper] Block response:', blockId, response);
  };

  const handleLessonStream = (blocks: any[]) => {
    // Called by FloatingBeeBubble when lesson blocks stream in
    if (window.__addLessonBlock) {
      blocks.forEach(block => window.__addLessonBlock(block));
    }
  };

  return (
    <>
      {/* Floating Bee Bubble - Always visible */}
      <FloatingBeeBubble 
        userId={userId} 
        onLessonStream={handleLessonStream}
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
