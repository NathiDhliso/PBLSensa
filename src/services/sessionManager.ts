/**
 * Session Management Service
 * 
 * Handles user session lifecycle including:
 * - Activity tracking
 * - Inactivity detection and auto-logout
 * - Cross-tab session synchronization
 * - Remember me token management
 */

export interface SessionConfig {
  inactivityTimeout: number; // milliseconds (default: 30 minutes)
  refreshInterval: number; // milliseconds (default: 1 minute)
  rememberMeDuration: number; // milliseconds (default: 30 days)
}

export interface SessionData {
  userId: string;
  lastActivity: number;
  rememberMe: boolean;
  sessionStart: number;
}

const DEFAULT_CONFIG: SessionConfig = {
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  refreshInterval: 60 * 1000, // 1 minute
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const STORAGE_KEYS = {
  SESSION: 'session_data',
  REMEMBER_TOKEN: 'remember_token',
  LAST_ACTIVITY: 'last_activity',
  SYNC_CHANNEL: 'auth_sync',
} as const;

/**
 * SessionManager Class
 * 
 * Manages user session state, activity tracking, and cross-tab synchronization
 */
export class SessionManager {
  private config: SessionConfig;
  private activityTimer: NodeJS.Timeout | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private onLogout: (() => void) | null = null;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeBroadcastChannel();
  }

  /**
   * Initialize BroadcastChannel for cross-tab communication
   */
  private initializeBroadcastChannel(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(STORAGE_KEYS.SYNC_CHANNEL);
      this.broadcastChannel.onmessage = (event) => {
        this.handleSyncMessage(event.data);
      };
    }
  }

  /**
   * Handle sync messages from other tabs
   */
  private handleSyncMessage(data: any): void {
    if (data.type === 'logout') {
      // Another tab logged out, trigger logout in this tab
      if (this.onLogout) {
        this.onLogout();
      }
    } else if (data.type === 'activity') {
      // Another tab had activity, update last activity time
      this.updateLastActivity(false); // Don't broadcast back
    }
  }

  /**
   * Start session management
   * 
   * @param userId - The user ID
   * @param rememberMe - Whether to enable remember me
   * @param onLogoutCallback - Callback to execute on auto-logout
   */
  startSession(userId: string, rememberMe: boolean, onLogoutCallback: () => void): void {
    this.onLogout = onLogoutCallback;

    // Store session data
    const sessionData: SessionData = {
      userId,
      lastActivity: Date.now(),
      rememberMe,
      sessionStart: Date.now(),
    };

    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    this.updateLastActivity();

    // Handle remember me
    if (rememberMe) {
      this.setRememberMe(userId);
    }

    // Start activity monitoring
    this.setupActivityTracking();
    this.setupInactivityTimer();
  }

  /**
   * End session and cleanup
   */
  endSession(): void {
    // Clear session data
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);

    // Clear timers
    this.clearTimers();

    // Notify other tabs
    this.broadcastLogout();
  }

  /**
   * Clear remember me token
   */
  clearRememberMe(): void {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_TOKEN);
  }

  /**
   * Set remember me token
   */
  private setRememberMe(userId: string): void {
    const token = {
      userId,
      expiresAt: Date.now() + this.config.rememberMeDuration,
    };
    localStorage.setItem(STORAGE_KEYS.REMEMBER_TOKEN, JSON.stringify(token));
  }

  /**
   * Get remember me token if valid
   */
  getRememberMeToken(): { userId: string } | null {
    const tokenStr = localStorage.getItem(STORAGE_KEYS.REMEMBER_TOKEN);
    if (!tokenStr) return null;

    try {
      const token = JSON.parse(tokenStr);
      if (token.expiresAt > Date.now()) {
        return { userId: token.userId };
      } else {
        // Token expired, remove it
        this.clearRememberMe();
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Track user activity
   */
  trackActivity(): void {
    this.updateLastActivity();
    this.resetInactivityTimer();
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(broadcast: boolean = true): void {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());

    // Update session data
    const sessionData = this.getSessionData();
    if (sessionData) {
      sessionData.lastActivity = now;
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    }

    // Broadcast to other tabs
    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'activity', timestamp: now });
    }
  }

  /**
   * Get current session data
   */
  getSessionData(): SessionData | null {
    const dataStr = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    if (!dataStr) return null;

    try {
      return JSON.parse(dataStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is inactive
   */
  checkInactivity(): boolean {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return false;

    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
    return timeSinceActivity >= this.config.inactivityTimeout;
  }

  /**
   * Setup activity tracking listeners
   */
  private setupActivityTracking(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const activityHandler = () => {
      this.trackActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true });
    });

    // Store cleanup function
    (window as any).__sessionCleanup = () => {
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }

  /**
   * Setup inactivity timer
   */
  private setupInactivityTimer(): void {
    this.checkInterval = setInterval(() => {
      if (this.checkInactivity()) {
        this.handleInactivityLogout();
      }
    }, this.config.refreshInterval);
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    // Timer is checked on interval, just update activity time
    this.updateLastActivity();
  }

  /**
   * Handle auto-logout due to inactivity
   */
  private handleInactivityLogout(): void {
    this.clearTimers();
    if (this.onLogout) {
      this.onLogout();
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Cleanup activity listeners
    if ((window as any).__sessionCleanup) {
      (window as any).__sessionCleanup();
      delete (window as any).__sessionCleanup;
    }
  }

  /**
   * Broadcast logout to other tabs
   */
  private broadcastLogout(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'logout' });
    }
  }

  /**
   * Validate session
   */
  async validateSession(): Promise<boolean> {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    // Check if session is still active
    if (this.checkInactivity()) {
      return false;
    }

    return true;
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    this.clearTimers();
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
