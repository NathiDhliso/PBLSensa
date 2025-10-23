/**
 * Security Monitoring Service
 * 
 * Handles security-related monitoring including:
 * - Rate limiting for authentication attempts
 * - Security event logging
 * - Login attempt tracking
 * - Suspicious activity detection
 */

export interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'password_change' | 'account_locked';
  timestamp: Date;
  userId?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockUntil?: number;
}

const STORAGE_KEY = 'security_events';
const RATE_LIMIT_KEY = 'rate_limits';

/**
 * Default rate limit configurations
 */
const DEFAULT_RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  registration: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

/**
 * SecurityMonitor Class
 * 
 * Monitors and logs security-related events and enforces rate limiting
 */
export class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private maxStoredEvents = 100;

  constructor() {
    this.loadEvents();
  }

  /**
   * Log a security event
   * 
   * @param event - The security event to log
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(fullEvent);

    // Keep only recent events
    if (this.events.length > this.maxStoredEvents) {
      this.events = this.events.slice(-this.maxStoredEvents);
    }

    this.saveEvents();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Security Event]', fullEvent);
    }
  }

  /**
   * Check if an identifier is rate limited
   * 
   * @param identifier - Email or IP address
   * @param type - Type of operation (login, passwordReset, etc.)
   * @returns True if rate limited, false otherwise
   */
  checkRateLimit(identifier: string, type: keyof typeof DEFAULT_RATE_LIMITS): boolean {
    const config = DEFAULT_RATE_LIMITS[type];
    const record = this.getAttemptRecord(identifier, type);

    // Check if currently blocked
    if (record.blocked && record.blockUntil) {
      if (Date.now() < record.blockUntil) {
        return true; // Still blocked
      } else {
        // Block expired, reset
        this.resetAttempts(identifier, type);
        return false;
      }
    }

    // Check if within rate limit window
    const timeSinceFirst = Date.now() - record.firstAttempt;
    if (timeSinceFirst > config.windowMs) {
      // Window expired, reset
      this.resetAttempts(identifier, type);
      return false;
    }

    // Check attempt count
    return record.count >= config.maxAttempts;
  }

  /**
   * Record an attempt
   * 
   * @param identifier - Email or IP address
   * @param type - Type of operation
   * @param success - Whether the attempt was successful
   */
  recordAttempt(identifier: string, type: keyof typeof DEFAULT_RATE_LIMITS, success: boolean): void {
    if (success) {
      // Reset on successful attempt
      this.resetAttempts(identifier, type);
      return;
    }

    const config = DEFAULT_RATE_LIMITS[type];
    const record = this.getAttemptRecord(identifier, type);

    // Increment attempt count
    record.count++;
    record.lastAttempt = Date.now();

    // Check if should be blocked
    if (record.count >= config.maxAttempts) {
      record.blocked = true;
      record.blockUntil = Date.now() + config.windowMs;

      // Log account locked event
      this.logEvent({
        type: 'account_locked',
        email: identifier,
        metadata: {
          reason: 'rate_limit_exceeded',
          attempts: record.count,
          blockedUntil: new Date(record.blockUntil),
        },
      });
    }

    this.saveAttemptRecord(identifier, type, record);
  }

  /**
   * Get time until rate limit expires
   * 
   * @param identifier - Email or IP address
   * @param type - Type of operation
   * @returns Milliseconds until unblocked, or 0 if not blocked
   */
  getTimeUntilUnblocked(identifier: string, type: keyof typeof DEFAULT_RATE_LIMITS): number {
    const record = this.getAttemptRecord(identifier, type);

    if (record.blocked && record.blockUntil) {
      const remaining = record.blockUntil - Date.now();
      return Math.max(0, remaining);
    }

    return 0;
  }

  /**
   * Get remaining attempts before rate limit
   * 
   * @param identifier - Email or IP address
   * @param type - Type of operation
   * @returns Number of remaining attempts
   */
  getRemainingAttempts(identifier: string, type: keyof typeof DEFAULT_RATE_LIMITS): number {
    const config = DEFAULT_RATE_LIMITS[type];
    const record = this.getAttemptRecord(identifier, type);

    if (record.blocked) {
      return 0;
    }

    return Math.max(0, config.maxAttempts - record.count);
  }

  /**
   * Reset attempts for an identifier
   * 
   * @param identifier - Email or IP address
   * @param type - Type of operation
   */
  resetAttempts(identifier: string, type: keyof typeof DEFAULT_RATE_LIMITS): void {
    const key = this.getRateLimitKey(identifier, type);
    const rateLimits = this.loadRateLimits();
    delete rateLimits[key];
    this.saveRateLimits(rateLimits);
  }

  /**
   * Detect suspicious activity patterns
   * 
   * @param userId - User ID to check
   * @returns True if suspicious activity detected
   */
  detectSuspiciousActivity(userId: string): boolean {
    const recentEvents = this.getRecentEvents(userId, 60 * 60 * 1000); // Last hour

    // Check for multiple failed logins
    const failedLogins = recentEvents.filter(e => e.type === 'failed_login');
    if (failedLogins.length >= 10) {
      return true;
    }

    // Check for rapid login/logout cycles
    const loginLogoutPairs = recentEvents.filter(
      e => e.type === 'login' || e.type === 'logout'
    );
    if (loginLogoutPairs.length >= 20) {
      return true;
    }

    return false;
  }

  /**
   * Get recent events for a user
   * 
   * @param userId - User ID
   * @param timeWindowMs - Time window in milliseconds
   * @returns Array of recent events
   */
  getRecentEvents(userId: string, timeWindowMs: number): SecurityEvent[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.events.filter(
      e => e.userId === userId && new Date(e.timestamp).getTime() > cutoff
    );
  }

  /**
   * Get all events (for admin/debugging)
   * 
   * @returns Array of all stored events
   */
  getAllEvents(): SecurityEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events (for testing/cleanup)
   */
  clearEvents(): void {
    this.events = [];
    this.saveEvents();
  }

  /**
   * Clear all rate limits (for testing/cleanup)
   */
  clearRateLimits(): void {
    localStorage.removeItem(RATE_LIMIT_KEY);
  }

  // Private helper methods

  private getAttemptRecord(identifier: string, type: string): AttemptRecord {
    const key = this.getRateLimitKey(identifier, type);
    const rateLimits = this.loadRateLimits();

    return rateLimits[key] || {
      count: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
      blocked: false,
    };
  }

  private saveAttemptRecord(identifier: string, type: string, record: AttemptRecord): void {
    const key = this.getRateLimitKey(identifier, type);
    const rateLimits = this.loadRateLimits();
    rateLimits[key] = record;
    this.saveRateLimits(rateLimits);
  }

  private getRateLimitKey(identifier: string, type: string): string {
    return `${type}:${identifier}`;
  }

  private loadRateLimits(): Record<string, AttemptRecord> {
    try {
      const data = localStorage.getItem(RATE_LIMIT_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveRateLimits(rateLimits: Record<string, AttemptRecord>): void {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimits));
    } catch (error) {
      console.error('Failed to save rate limits:', error);
    }
  }

  private loadEvents(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.events = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load security events:', error);
      this.events = [];
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save security events:', error);
    }
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();
