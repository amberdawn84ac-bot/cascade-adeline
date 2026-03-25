'use client';

import React, { useEffect, useState } from 'react';
import { StreamingLessonRenderer } from './lessons/StreamingLessonRenderer';
import { FloatingBeeBubble } from './FloatingBeeBubble';
import { usePathname } from 'next/navigation';

export function LessonSystemWrapper({ userId }: { userId?: string }) {
  const pathname = usePathname();
  const [showLesson, setShowLesson] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

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
      blocks.forEach(block => window.__addLessonBlock!(block));
    }
  };

  const handleLessonRequest = async (topic: string) => {
    // Trigger lesson streaming from chat request
    console.log('[LessonSystemWrapper] Lesson requested:', topic);
    
    try {
      const response = await fetch('/api/lessons/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentQuery: topic,
          lessonId: `lesson-${Date.now()}`
        })
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'start') {
                  setActiveLessonId(data.threadId);
                } else if (data.type === 'lesson_block') {
                  if (window.__addLessonBlock) {
                    window.__addLessonBlock(data.block);
                  }
                } else if (data.type === 'lesson_metadata') {
                  if (window.__setLessonMetadata) {
                    window.__setLessonMetadata(data.data);
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[LessonSystemWrapper] Error starting lesson:', error);
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
