/**
 * In-Memory Sliding Window Rate Limiter
 * Guards authentication endpoints against brute-force credential stuffing and password guessing.
 */

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  lockedUntil: number | null;
}

class AuthRateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  private lockoutDurationMs: number;

  constructor(
    maxAttempts = 5,
    windowMinutes = 15,
    lockoutMinutes = 15
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMinutes * 60 * 1000;
    this.lockoutDurationMs = lockoutMinutes * 60 * 1000;

    // Periodically prune stale entries to prevent memory leak
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }
  }

  /**
   * Check if a request from this identifier (IP or email) is allowed to attempt login.
   */
  check(identifier: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      return { allowed: true, remainingAttempts: this.maxAttempts, retryAfterSeconds: 0 };
    }

    // Check if account/IP is locked
    if (record.lockedUntil && now < record.lockedUntil) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds,
      };
    }

    // Window expired: reset
    if (now - record.firstAttemptTime > this.windowMs) {
      this.attempts.delete(identifier);
      return { allowed: true, remainingAttempts: this.maxAttempts, retryAfterSeconds: 0 };
    }

    const remainingAttempts = Math.max(0, this.maxAttempts - record.count);
    return {
      allowed: record.count < this.maxAttempts,
      remainingAttempts,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Record a failed login attempt. If threshold exceeded, lock out the identifier.
   */
  recordFailure(identifier: string): { locked: boolean; retryAfterSeconds: number; remainingAttempts: number } {
    const now = Date.now();
    let record = this.attempts.get(identifier);

    if (!record || now - record.firstAttemptTime > this.windowMs) {
      record = {
        count: 1,
        firstAttemptTime: now,
        lockedUntil: null,
      };
      this.attempts.set(identifier, record);
      return { locked: false, retryAfterSeconds: 0, remainingAttempts: this.maxAttempts - 1 };
    }

    record.count += 1;

    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutDurationMs;
      const retryAfterSeconds = Math.ceil(this.lockoutDurationMs / 1000);
      return { locked: true, retryAfterSeconds, remainingAttempts: 0 };
    }

    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: Math.max(0, this.maxAttempts - record.count),
    };
  }

  /**
   * Record a successful login: immediately reset attempt counter for the identifier.
   */
  recordSuccess(identifier: string): void {
    this.attempts.delete(identifier);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (
        (!record.lockedUntil || now > record.lockedUntil) &&
        now - record.firstAttemptTime > this.windowMs
      ) {
        this.attempts.delete(key);
      }
    }
  }
}

// Global singleton instance for authentication endpoints
export const authRateLimiter = new AuthRateLimiter(5, 15, 15);
