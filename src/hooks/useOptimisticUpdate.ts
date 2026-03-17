'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  rollbackDelay?: number;
}

/**
 * Hook for optimistic UI updates with automatic rollback on failure
 * Immediately updates UI, then syncs with server in background
 */
export function useOptimisticUpdate<T>(
  initialState: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [state, setState] = useState<T>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const update = useCallback(
    async (
      optimisticValue: T,
      syncFn: () => Promise<T>,
      successMessage?: string,
      errorMessage?: string
    ) => {
      // Store previous state for rollback
      const previousState = state;

      // Immediately update UI (optimistic)
      setState(optimisticValue);
      setIsLoading(true);

      try {
        // Sync with server in background
        const result = await syncFn();
        
        // Update with server response
        setState(result);
        
        if (successMessage) {
          showToast('success', successMessage);
        }
        
        options.onSuccess?.(result);
      } catch (error) {
        // Rollback on failure
        console.error('[OptimisticUpdate] Sync failed, rolling back:', error);
        
        setTimeout(() => {
          setState(previousState);
        }, options.rollbackDelay || 0);

        const message = errorMessage || 'Connection lost. Your progress will sync when you get back to the house.';
        showToast('warning', message);
        
        options.onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [state, showToast, options]
  );

  return {
    state,
    setState,
    update,
    isLoading,
  };
}
