// Simple in-memory throttle for API spam prevention
// For production, consider Redis or Upstash for distributed rate limiting

interface ThrottleEntry {
  timestamp: number;
  count: number;
}

const throttleMap = new Map<string, ThrottleEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  for (const [key, entry] of throttleMap.entries()) {
    if (entry.timestamp < fiveMinutesAgo) {
      throttleMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be throttled
 * @param userId - User ID to throttle
 * @param cooldownMs - Cooldown period in milliseconds (default: 5000ms = 5 seconds)
 * @returns true if request should be blocked, false if allowed
 */
export function isThrottled(userId: string, cooldownMs: number = 5000): boolean {
  const now = Date.now();
  const entry = throttleMap.get(userId);

  if (!entry) {
    // First request - allow it
    throttleMap.set(userId, { timestamp: now, count: 1 });
    return false;
  }

  const timeSinceLastRequest = now - entry.timestamp;

  if (timeSinceLastRequest < cooldownMs) {
    // Too soon - throttle it
    entry.count++;
    console.log(`[throttle] User ${userId} throttled (${entry.count} attempts in ${timeSinceLastRequest}ms)`);
    return true;
  }

  // Cooldown period passed - allow it
  throttleMap.set(userId, { timestamp: now, count: 1 });
  return false;
}

/**
 * Get remaining cooldown time in milliseconds
 */
export function getRemainingCooldown(userId: string, cooldownMs: number = 5000): number {
  const entry = throttleMap.get(userId);
  if (!entry) return 0;

  const now = Date.now();
  const timeSinceLastRequest = now - entry.timestamp;
  const remaining = cooldownMs - timeSinceLastRequest;

  return Math.max(0, remaining);
}

/**
 * Clear throttle for a user (useful for testing or manual override)
 */
export function clearThrottle(userId: string): void {
  throttleMap.delete(userId);
}
