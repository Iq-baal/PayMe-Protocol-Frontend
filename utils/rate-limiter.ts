/**
 * Client-side rate limiter
 * Prevents abuse and excessive API calls
 */

interface RateLimitConfig {
  max: number;      // Maximum requests
  window: number;   // Time window in milliseconds
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  /**
   * Check if a request can be made
   * @param key - Unique identifier for the rate limit (e.g., 'login', 'search')
   * @param maxRequests - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if request is allowed, false if rate limited
   */
  canMakeRequest(
    key: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove requests outside the time window
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, maxRequests: number, windowMs: number): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < windowMs
    );
    
    return Math.max(0, maxRequests - validRequests.length);
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  getResetTime(key: string, windowMs: number): number {
    const requests = this.requests.get(key) || [];
    
    if (requests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...requests);
    const resetTime = oldestRequest + windowMs;
    const now = Date.now();
    
    return Math.max(0, resetTime - now);
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limits for common operations
export const RATE_LIMITS = {
  // Authentication
  LOGIN_ATTEMPT: { max: 5, window: 300000 },      // 5 attempts per 5 minutes
  CODE_REQUEST: { max: 3, window: 300000 },       // 3 codes per 5 minutes
  CODE_VERIFY: { max: 5, window: 300000 },        // 5 verifications per 5 minutes
  
  // Search and queries
  RECIPIENT_SEARCH: { max: 20, window: 60000 },   // 20 searches per minute
  BALANCE_CHECK: { max: 30, window: 60000 },      // 30 checks per minute
  
  // Transactions
  TRANSACTION: { max: 10, window: 60000 },        // 10 transactions per minute
  TRANSACTION_DAILY: { max: 100, window: 86400000 }, // 100 per day
  
  // Profile updates
  PROFILE_UPDATE: { max: 5, window: 300000 },     // 5 updates per 5 minutes
  
  // General API calls
  API_CALL: { max: 100, window: 60000 },          // 100 calls per minute
} as const;

/**
 * Helper function to check rate limit with predefined config
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const allowed = rateLimiter.canMakeRequest(key, config.max, config.window);
  const remaining = rateLimiter.getRemaining(key, config.max, config.window);
  const resetIn = rateLimiter.getResetTime(key, config.window);
  
  return { allowed, remaining, resetIn };
}

/**
 * Format reset time for user display
 */
export function formatResetTime(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
