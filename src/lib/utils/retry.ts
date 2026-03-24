/**
 * Retry utility with exponential backoff for external API calls
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
    if (error?.status >= 500 && error?.status < 600) return true;
    if (error?.message?.includes('timeout')) return true;
    if (error?.message?.includes('network')) return true;
    return false;
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async function with exponential backoff
 * 
 * @example
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxAttempts: 3, initialDelayMs: 1000 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const shouldRetry = opts.retryableErrors(error);
      const isLastAttempt = attempt === opts.maxAttempts;

      if (!shouldRetry || isLastAttempt) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );

      console.warn(
        `[Retry] Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms:`,
        error instanceof Error ? error.message : String(error)
      );

      options.onRetry?.(attempt, error);

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry configuration presets for common scenarios
 */
export const RetryPresets = {
  // For critical operations that must succeed
  AGGRESSIVE: {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  },

  // For normal API calls
  STANDARD: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  },

  // For non-critical operations
  CONSERVATIVE: {
    maxAttempts: 2,
    initialDelayMs: 2000,
    maxDelayMs: 5000,
    backoffMultiplier: 1.5,
  },

  // For quick operations that should fail fast
  FAST_FAIL: {
    maxAttempts: 2,
    initialDelayMs: 500,
    maxDelayMs: 1000,
    backoffMultiplier: 2,
  },
};
