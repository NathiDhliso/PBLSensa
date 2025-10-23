/**
 * useSessionManager Hook
 * 
 * React hook for integrating SessionManager with authentication context.
 * Handles session lifecycle, activity tracking, and auto-logout.
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '@/services/sessionManager';
import { useToast } from '@/contexts/ToastContext';

export interface UseSessionManagerOptions {
  userId?: string;
  rememberMe?: boolean;
  onLogout: () => Promise<void>;
  enabled?: boolean;
}

/**
 * Hook for managing user session
 * 
 * @param options - Session management options
 * 
 * @example
 * function App() {
 *   const { user, signOut } = useAuth();
 *   
 *   useSessionManager({
 *     userId: user?.id,
 *     rememberMe: user?.rememberMe,
 *     onLogout: signOut,
 *     enabled: !!user
 *   });
 * }
 */
export function useSessionManager({
  userId,
  rememberMe = false,
  onLogout,
  enabled = true,
}: UseSessionManagerOptions) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  /**
   * Handle auto-logout
   */
  const handleAutoLogout = useCallback(async () => {
    try {
      // End session
      sessionManager.endSession();
      
      // Call logout callback
      await onLogout();
      
      // Show notification
      showToast('info', 'You have been logged out due to inactivity.');
      
      // Navigate to login
      navigate('/login', {
        state: { message: 'Your session expired due to inactivity. Please sign in again.' }
      });
    } catch (error) {
      console.error('Error during auto-logout:', error);
    }
  }, [onLogout, navigate, showToast]);

  /**
   * Start session when user logs in
   */
  useEffect(() => {
    if (enabled && userId) {
      sessionManager.startSession(userId, rememberMe, handleAutoLogout);
      
      return () => {
        // Cleanup on unmount (but don't end session)
        // Session will be ended explicitly on logout
      };
    }
  }, [enabled, userId, rememberMe, handleAutoLogout]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (!enabled) {
        sessionManager.destroy();
      }
    };
  }, [enabled]);

  return {
    trackActivity: () => sessionManager.trackActivity(),
    validateSession: () => sessionManager.validateSession(),
    getSessionData: () => sessionManager.getSessionData(),
  };
}
