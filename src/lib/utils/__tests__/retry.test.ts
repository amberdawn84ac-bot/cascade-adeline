import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, RetryPresets } from '../retry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { 
      maxAttempts: 3,
      initialDelayMs: 10,
    });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('timeout'));
    
    await expect(
      withRetry(fn, { maxAttempts: 2, initialDelayMs: 10 })
    ).rejects.toThrow('timeout');
    
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('validation failed'));
    
    await expect(
      withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })
    ).rejects.toThrow('validation failed');
    
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue('success');
    
    const start = Date.now();
    await withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
    });
    const duration = Date.now() - start;
    
    // Should wait ~100ms + ~200ms = ~300ms
    expect(duration).toBeGreaterThanOrEqual(250);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelayMs', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue('success');
    
    const start = Date.now();
    await withRetry(fn, {
      maxAttempts: 2,
      initialDelayMs: 1000,
      maxDelayMs: 50,
    });
    const duration = Date.now() - start;
    
    // Should cap at 50ms, not wait 1000ms
    expect(duration).toBeLessThan(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should call onRetry callback', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue('success');
    
    const onRetry = vi.fn();
    
    await withRetry(fn, {
      maxAttempts: 2,
      initialDelayMs: 10,
      onRetry,
    });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  describe('RetryPresets', () => {
    it('should have AGGRESSIVE preset', () => {
      expect(RetryPresets.AGGRESSIVE).toEqual({
        maxAttempts: 5,
        initialDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      });
    });

    it('should have STANDARD preset', () => {
      expect(RetryPresets.STANDARD).toEqual({
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      });
    });

    it('should have CONSERVATIVE preset', () => {
      expect(RetryPresets.CONSERVATIVE).toEqual({
        maxAttempts: 2,
        initialDelayMs: 2000,
        maxDelayMs: 5000,
        backoffMultiplier: 1.5,
      });
    });

    it('should have FAST_FAIL preset', () => {
      expect(RetryPresets.FAST_FAIL).toEqual({
        maxAttempts: 2,
        initialDelayMs: 500,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
      });
    });
  });
});
