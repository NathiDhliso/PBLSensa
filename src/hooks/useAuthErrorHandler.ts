/**
 * useAuthErrorHandler Hook
 * 
 * Provides consistent error handling for authentication operations.
 * Transforms errors, shows toast notifications, and provides actionable feedback.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { 
  transformAuthError, 
  formatErrorForLogging, 
  shouldLogoutUser,
  type AuthError 
} from '@/utils/authErrors';

/**
 * Hook for handling authentication errors consistently
 * 
 * @returns Object with error handling functions
 * 
 * @example
 * function LoginForm() {
 *   const { handleError } = useAuthErrorHandler();
 *   
 *   const onSubmit = async (data) => {
 *     try {
 *       await signIn(data.email, data.password);
 *     } catch (error) {
 *       const authError = handleError(error);
 *       // Error is already displayed to user via toast
 *       // Can use authError for additional handling if needed
 *     }
 *   };
 * }
 */
export function useAuthErrorHandler() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  /**
   * Handle authentication error
   * Transforms error, shows toast, logs for debugging, and handles navigation
   * 
   * @param error - The error to handle
   * @param options - Optional configuration
   * @returns Transformed AuthError
   */
  const handleError = useCallback((
    error: any,
    options?: {
      silent?: boolean; // Don't show toast
      customMessage?: string; // Override user message
      onAction?: () => void; // Custom action handler
    }
  ): AuthError => {
    // Transform error to structured format
    const authError = transformAuthError(error);
    
    // Log error for debugging (in development)
    if (import.meta.env.DEV) {
      console.error('[Auth Error]', formatErrorForLogging(authError));
    }

    // Show toast notification unless silent
    if (!options?.silent) {
      const message = options?.customMessage || authError.userMessage;
      showToast('error', message);
    }

    // Handle automatic logout if needed
    if (shouldLogoutUser(authError)) {
      // Navigate to login after a short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Your session has expired. Please sign in again.' 
          } 
        });
      }, 1500);
    }

    return authError;
  }, [showToast, navigate]);

  /**
   * Handle error with custom action
   * Shows error and provides actionable button
   * 
   * @param error - The error to handle
   * @param onAction - Callback for action button
   * @returns Transformed AuthError
   */
  const handleErrorWithAction = useCallback((
    error: any,
    onAction?: () => void
  ): AuthError => {
    const authError = handleError(error, { silent: true });

    // If error has actionable suggestion, show it
    if (authError.actionable) {
      // Use custom action handler or default navigation
      if (onAction) {
        // Custom action provided
        showToast('error', authError.userMessage);
      } else if (authError.actionable.action.startsWith('/')) {
        // Default action: navigate to suggested route
        showToast('error', authError.userMessage);
      } else {
        // Action is not a route, just show message
        showToast('error', authError.userMessage);
      }
    } else {
      showToast('error', authError.userMessage);
    }

    return authError;
  }, [handleError, showToast]);

  /**
   * Handle network error specifically
   * 
   * @param error - The error to handle
   * @returns Transformed AuthError
   */
  const handleNetworkError = useCallback((error: any): AuthError => {
    return handleError(error, {
      customMessage: 'Unable to connect. Please check your internet connection and try again.'
    });
  }, [handleError]);

  /**
   * Handle validation error
   * 
   * @param error - The error to handle
   * @returns Transformed AuthError
   */
  const handleValidationError = useCallback((error: any): AuthError => {
    return handleError(error, {
      customMessage: 'Please check your input and try again.'
    });
  }, [handleError]);

  return {
    handleError,
    handleErrorWithAction,
    handleNetworkError,
    handleValidationError
  };
}
