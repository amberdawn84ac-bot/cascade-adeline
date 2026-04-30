'use client';

import { useCallback, useRef } from 'react';

/**
 * Telemetry event types for GenUI component interactions.
 * These are "fire-and-forget" analytics that update the student's
 * mastery profile and knowledge graph for future session personalization.
 */
export type TelemetryEventType =
  | 'attempt'        // Student made an attempt (correct or incorrect)
  | 'complete'       // Student successfully completed the component
  | 'stuck'          // Student is struggling (multiple failed attempts)
  | 'hint_requested' // Student explicitly requested a hint
  | 'skipped'        // Student skipped the component
  | 'time_spent';    // Passive time tracking

export interface TelemetryEvent {
  type: TelemetryEventType;
  componentType: string;
  componentId: string;
  timestamp: number;
  // Attempt-specific
  correct?: boolean;
  attemptNumber?: number;
  // Completion-specific
  score?: number;
  timeMs?: number;
  // Stuck-specific
  failedAttempts?: number;
  // Pedagogical context
  difficultyLevel?: 'intro' | 'standard' | 'challenge';
  isScaffolded?: boolean;
  // Optional metadata
  metadata?: Record<string, unknown>;
}

interface UseGenUITelemetryOptions {
  /** Debounce rapid events (default: 500ms) */
  debounceMs?: number;
  /** Batch events before sending (default: false) */
  batchEvents?: boolean;
  /** Max batch size before auto-flush (default: 10) */
  maxBatchSize?: number;
}

/**
 * Hook for fire-and-forget telemetry from GenUI components.
 * 
 * This does NOT trigger immediate UI remediation — that's handled by
 * tool calls via experimental_onToolCall in useChat.
 * 
 * Instead, this quietly updates the student's mastery profile in the
 * database so future sessions can personalize component selection.
 * 
 * @example
 * ```tsx
 * const { dispatch } = useGenUITelemetry('quiz-123', 'CalibratedQuiz');
 * 
 * // On successful completion
 * dispatch({ type: 'complete', score: 85, timeMs: 45000 });
 * 
 * // On failed attempt (analytics only — remediation is via tool call)
 * dispatch({ type: 'attempt', correct: false, attemptNumber: 2 });
 * ```
 */
export function useGenUITelemetry(
  componentId: string,
  componentType: string,
  options: UseGenUITelemetryOptions = {}
) {
  const { debounceMs = 500, batchEvents = false, maxBatchSize = 10 } = options;
  
  const batchRef = useRef<TelemetryEvent[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventRef = useRef<string | null>(null);

  const flush = useCallback(async () => {
    if (batchRef.current.length === 0) return;
    
    const events = [...batchRef.current];
    batchRef.current = [];
    
    try {
      await fetch('/api/genui/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // Fire-and-forget — log but don't throw
      console.warn('[useGenUITelemetry] Failed to send telemetry:', error);
    }
  }, []);

  const dispatch = useCallback(
    (event: Omit<TelemetryEvent, 'componentId' | 'componentType' | 'timestamp'>) => {
      const fullEvent: TelemetryEvent = {
        ...event,
        componentId,
        componentType,
        timestamp: Date.now(),
      };

      // Dedupe rapid identical events
      const eventKey = `${event.type}-${event.attemptNumber ?? ''}-${event.correct ?? ''}`;
      if (eventKey === lastEventRef.current) {
        return;
      }
      lastEventRef.current = eventKey;

      if (batchEvents) {
        batchRef.current.push(fullEvent);
        
        if (batchRef.current.length >= maxBatchSize) {
          flush();
        } else if (!debounceTimerRef.current) {
          debounceTimerRef.current = setTimeout(() => {
            flush();
            debounceTimerRef.current = null;
          }, debounceMs);
        }
      } else {
        // Immediate send (still debounced)
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          fetch('/api/genui/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: [fullEvent] }),
          }).catch((err) => {
            console.warn('[useGenUITelemetry] Failed to send telemetry:', err);
          });
          debounceTimerRef.current = null;
        }, debounceMs);
      }
    },
    [componentId, componentType, batchEvents, maxBatchSize, debounceMs, flush]
  );

  return { dispatch, flush };
}

/**
 * Standalone function for components that can't use hooks (e.g., class components).
 * Sends telemetry immediately without debouncing.
 */
export async function sendTelemetry(event: TelemetryEvent): Promise<void> {
  try {
    await fetch('/api/genui/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [event] }),
    });
  } catch (error) {
    console.warn('[sendTelemetry] Failed:', error);
  }
}
