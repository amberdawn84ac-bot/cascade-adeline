'use client';

import { useState, useCallback } from 'react';

interface UseLessonStreamResult {
  isStreaming: boolean;
  error: string | null;
  savedLessonId: string | null;
  startLesson: (topic: string, lessonId?: string) => Promise<string | null>;
}

/**
 * Shared hook for consuming the /api/lessons/stream SSE endpoint.
 * Handles start → lesson_block → lesson_metadata → lesson_saved → done/error.
 * Calls window.__addLessonBlock and window.__setLessonMetadata as blocks arrive.
 * Returns the saved lessonId (from lesson_saved) so callers can navigate.
 */
export function useLessonStream(): UseLessonStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);

  const startLesson = useCallback(async (topic: string, lessonId?: string): Promise<string | null> => {
    console.log('[useLessonStream] Starting lesson stream for topic:', topic);
    setIsStreaming(true);
    setError(null);
    setSavedLessonId(null);

    try {
      console.log('[useLessonStream] Fetching /api/lessons/stream...');
      const response = await fetch('/api/lessons/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentQuery: topic,
          lessonId: lessonId ?? `lesson-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        console.error('[useLessonStream] Fetch failed with status:', response.status);
        throw new Error(`Stream request failed: ${response.status}`);
      }

      console.log('[useLessonStream] Fetch successful, reading stream...');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalLessonId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'lesson_block') {
              console.log('[useLessonStream] Received lesson_block:', data.block?.type || data.block?.block_type);
              const block = data.block;
              if (!block.block_id) {
                block.block_id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
              }
              if (typeof window.__addLessonBlock === 'function') {
                window.__addLessonBlock(block);
              } else {
                console.warn('[useLessonStream] window.__addLessonBlock not registered!');
              }
            } else if (data.type === 'lesson_metadata') {
              console.log('[useLessonStream] Received lesson_metadata:', data.data);
              if (typeof window.__setLessonMetadata === 'function') {
                window.__setLessonMetadata(data.data);
              } else {
                console.warn('[useLessonStream] window.__setLessonMetadata not registered!');
              }
            } else if (data.type === 'lesson_saved') {
              console.log('[useLessonStream] Lesson saved with ID:', data.lessonId);
              finalLessonId = data.lessonId as string;
              setSavedLessonId(finalLessonId);
            } else if (data.type === 'error') {
              console.error('[useLessonStream] Server error:', data.error);
              throw new Error(data.error as string);
            } else if (data.type === 'start') {
              console.log('[useLessonStream] Stream started, threadId:', data.threadId);
            } else if (data.type === 'agent_start') {
              console.log('[useLessonStream] Agent started:', data.agent);
            } else if (data.type === 'done') {
              console.log('[useLessonStream] Stream complete');
            }
          } catch (parseErr) {
            // Rethrow real errors; ignore JSON parse glitches on non-data lines
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }

      console.log('[useLessonStream] Stream finished, finalLessonId:', finalLessonId);
      return finalLessonId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLessonStream] Error:', err);
      return null;
    } finally {
      console.log('[useLessonStream] Cleaning up, setting isStreaming=false');
      setIsStreaming(false);
    }
  }, []);

  return { isStreaming, error, savedLessonId, startLesson };
}
