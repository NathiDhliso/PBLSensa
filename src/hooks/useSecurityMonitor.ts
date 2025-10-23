/**
 * useSecurityMonitor Hook
 * 
 * React hook for integrating SecurityMonitor with authentication flows.
 * Provides rate limiting checks and security event logging.
 */

import { useCallback } from 'react';
import { securityMonitor } from '@/services/securityMonitor';

/**
 * Hook for security monitoring
 * 
 * @returns Security monitoring functions
 * 
 * @example
 * function LoginForm() {
 *   const { checkRateLimit, recordAttempt, logSecurityEvent } = useSecurityMonitor();
 *   
 *   const onSubmit = async (data) => {
 *     if (checkRateLimit(data.email, 'login')) {
 *       showError('Too many attempts. Please try again later.');
 *       return;
 *     }
 *     
 *     try {
 *       await signIn(data.email, data.password);
 *       recordAttempt(data.email, 'login', true);
 *       logSecurityEvent({ type: 'login', email: data.email });
 *     } catch (error) {
 *       recordAttempt(data.email, 'login', false);
 *       logSecurityEvent({ type: 'failed_login', email: data.email });
 *     }
 *   };
 * }
 */
export function useSecurityMonitor() {
  /**
   * Check if identifier is rate limited
   */
  const checkRateLimit = useCallback(
    (identifier: string, type: 'login' | 'passwordReset' | 'registration'): boolean => {
      return securityMonitor.checkRateLimit(identifier, type);
    },
    []
  );

  /**
   * Record an authentication attempt
   */
  const recordAttempt = useCallback(
    (identifier: string, type: 'login' | 'passwordReset' | 'registration', success: boolean): void => {
      securityMonitor.recordAttempt(identifier, type, success);
    },
    []
  );

  /**
   * Log a security event
   */
  const logSecurityEvent = useCallback(
    (event: {
      type: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'password_change' | 'account_locked';
      userId?: string;
      email?: string;
      metadata?: Record<string, any>;
    }): void => {
      securityMonitor.logEvent(event);
    },
    []
  );

  /**
   * Get time until rate limit expires
   */
  const getTimeUntilUnblocked = useCallback(
    (identifier: string, type: 'login' | 'passwordReset' | 'registration'): number => {
      return securityMonitor.getTimeUntilUnblocked(identifier, type);
    },
    []
  );

  /**
   * Get remaining attempts before rate limit
   */
  const getRemainingAttempts = useCallback(
    (identifier: string, type: 'login' | 'passwordReset' | 'registration'): number => {
      return securityMonitor.getRemainingAttempts(identifier, type);
    },
    []
  );

  /**
   * Reset attempts for an identifier
   */
  const resetAttempts = useCallback(
    (identifier: string, type: 'login' | 'passwordReset' | 'registration'): void => {
      securityMonitor.resetAttempts(identifier, type);
    },
    []
  );

  /**
   * Detect suspicious activity for a user
   */
  const detectSuspiciousActivity = useCallback((userId: string): boolean => {
    return securityMonitor.detectSuspiciousActivity(userId);
  }, []);

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = useCallback((ms: number): string => {
    const minutes = Math.ceil(ms / 60000);
    if (minutes < 1) {
      return 'less than a minute';
    } else if (minutes === 1) {
      return '1 minute';
    } else if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }
  }, []);

  return {
    checkRateLimit,
    recordAttempt,
    logSecurityEvent,
    getTimeUntilUnblocked,
    getRemainingAttempts,
    resetAttempts,
    detectSuspiciousActivity,
    formatTimeRemaining,
  };
}
