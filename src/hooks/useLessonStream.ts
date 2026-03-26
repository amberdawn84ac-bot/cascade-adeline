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
    setIsStreaming(true);
    setError(null);
    setSavedLessonId(null);

    try {
      const response = await fetch('/api/lessons/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentQuery: topic,
          lessonId: lessonId ?? `lesson-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

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
              const block = data.block;
              if (!block.block_id) {
                block.block_id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
              }
              window.__addLessonBlock?.(block);
            } else if (data.type === 'lesson_metadata') {
              window.__setLessonMetadata?.(data.data);
            } else if (data.type === 'lesson_saved') {
              finalLessonId = data.lessonId as string;
              setSavedLessonId(finalLessonId);
            } else if (data.type === 'error') {
              throw new Error(data.error as string);
            }
          } catch (parseErr) {
            // Rethrow real errors; ignore JSON parse glitches on non-data lines
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }

      return finalLessonId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLessonStream] Error:', message);
      return null;
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { isStreaming, error, savedLessonId, startLesson };
}
