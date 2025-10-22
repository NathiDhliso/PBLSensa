/**
 * Authentication Context
 * 
 * Provides global authentication state and methods throughout the application.
 * Handles automatic token refresh and session restoration.
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authService, CognitoUser, UserAttributes } from '@/services/authWrapper';

/**
 * Authentication context value
 */
interface AuthContextValue {
  /** Current authenticated user */
  user: CognitoUser | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is being loaded */
  isLoading: boolean;
  /** Current error if any */
  error: Error | null;
  /** Sign up a new user */
  signUp: (email: string, password: string, attributes?: Omit<UserAttributes, 'email'>) => Promise<void>;
  /** Confirm sign up with code */
  confirmSignUp: (email: string, code: string) => Promise<void>;
  /** Sign in a user */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign out current user */
  signOut: () => Promise<void>;
  /** Refresh current session */
  refreshSession: () => Promise<void>;
  /** Initiate password reset */
  forgotPassword: (email: string) => Promise<void>;
  /** Confirm password reset */
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  /** Clear current error */
  clearError: () => void;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and methods.
 * 
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Restore session on mount
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        // No active session
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Set up automatic token refresh
   */
  useEffect(() => {
    if (!user) return;

    // Check token expiry every minute
    const interval = setInterval(async () => {
      if (authService.needsRefresh()) {
        try {
          await authService.refreshSession();
        } catch (err) {
          // Token refresh failed - sign out user
          setUser(null);
          setError(new Error('Session expired. Please sign in again.'));
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  /**
   * Sign up a new user
   */
  const signUp = useCallback(async (
    email: string,
    password: string,
    attributes?: Omit<UserAttributes, 'email'>
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signUp(email, password, attributes);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign up');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Confirm sign up with verification code
   */
  const confirmSignUp = useCallback(async (email: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.confirmSignUp(email, code);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to confirm sign up');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign in a user
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const authenticatedUser = await authService.signIn(email, password);
      setUser(authenticatedUser);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign in');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign out');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh current session
   */
  const refreshSession = useCallback(async () => {
    try {
      setError(null);
      await authService.refreshSession();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh session');
      setError(error);
      setUser(null);
      throw error;
    }
  }, []);

  /**
   * Initiate password reset
   */
  const forgotPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.forgotPassword(email);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initiate password reset');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Confirm password reset
   */
  const confirmPassword = useCallback(async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.confirmPassword(email, code, newPassword);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reset password');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    refreshSession,
    forgotPassword,
    confirmPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * 
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth();
 *   
 *   if (!user) {
 *     return <button onClick={() => signIn(email, password)}>Sign In</button>;
 *   }
 *   
 *   return <button onClick={signOut}>Sign Out</button>;
 * }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
