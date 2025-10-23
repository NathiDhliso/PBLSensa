/**
 * Authentication Service
 * 
 * This module handles Amazon Cognito authentication including:
 * - User sign up and confirmation
 * - Sign in and sign out
 * - Token management and refresh
 * - Session restoration
 * - Password reset flow
 * 
 * @example
 * import { authService } from '@/services/auth';
 * await authService.signIn('user@example.com', 'password');
 */

import { Amplify } from 'aws-amplify';
import {
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  type SignUpOutput,
} from 'aws-amplify/auth';
import { env } from '@/config/env';
import { setAuthTokenGetter, setAuthTokenRefresher } from './api';

/**
 * User attributes for sign up
 */
export interface UserAttributes {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

/**
 * Cognito user information
 */
export interface CognitoUser {
  userId: string;
  username: string;
  email?: string;
  attributes?: Record<string, string>;
}

/**
 * Authentication tokens
 */
interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * In-memory token storage
 * More secure than localStorage (not accessible via XSS)
 */
let authTokens: AuthTokens | null = null;

/**
 * Configure AWS Amplify with Cognito settings
 */
function configureAmplify(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.cognitoUserPoolId,
        userPoolClientId: env.cognitoClientId,
      },
    },
  });
}

// Initialize Amplify on module load
configureAmplify();

/**
 * Get current access token
 */
function getAccessToken(): string | null {
  return authTokens?.accessToken || null;
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string> {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    
    if (!session.tokens) {
      throw new Error('No tokens available');
    }

    // Update stored tokens
    authTokens = {
      accessToken: session.tokens.accessToken.toString(),
      idToken: session.tokens.idToken?.toString() || '',
      refreshToken: authTokens?.refreshToken || '', // Keep existing refresh token
      expiresAt: (session.tokens.accessToken.payload.exp || 0) * 1000,
    };

    return authTokens.accessToken;
  } catch (error) {
    // Clear tokens on refresh failure
    authTokens = null;
    throw new Error('Failed to refresh authentication token');
  }
}

// Register token getter and refresher with API client
setAuthTokenGetter(getAccessToken);
setAuthTokenRefresher(refreshAccessToken);

/**
 * Store authentication tokens in memory
 */
function storeTokens(tokens: {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}): void {
  authTokens = {
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken || authTokens?.refreshToken || '',
    expiresAt: tokens.expiresAt,
  };
}

/**
 * Clear stored authentication tokens
 */
function clearTokens(): void {
  authTokens = null;
}

/**
 * Check if current token is expired or about to expire
 */
function isTokenExpired(): boolean {
  if (!authTokens) {
    return true;
  }

  // Consider token expired if it expires in less than 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= authTokens.expiresAt - fiveMinutes;
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Sign up a new user
   * 
   * @param email - User's email address
   * @param password - User's password
   * @param attributes - Additional user attributes
   * @returns Promise that resolves when sign up is successful
   * 
   * @example
   * await authService.signUp('user@example.com', 'SecurePass123!', {
   *   name: 'John Doe'
   * });
   */
  async signUp(
    email: string,
    password: string,
    attributes?: Omit<UserAttributes, 'email'>
  ): Promise<SignUpOutput> {
    console.log('[Auth Service] Starting signup process...');
    console.log('[Auth Service] Email:', email);
    console.log('[Auth Service] Attributes received:', attributes);
    console.log('[Auth Service] Sending only email to Cognito (name ignored)');
    
    try {
      // Only send email during signup to avoid "unauthorized attribute" errors
      // Other attributes like 'name' can be updated after signup
      const signUpParams = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            // Note: 'name' and other attributes are not sent during signup
            // They can be updated later via updateUserAttributes if needed
          },
        },
      };
      
      console.log('[Auth Service] SignUp params:', JSON.stringify(signUpParams, null, 2));
      
      const result = await amplifySignUp(signUpParams);
      
      console.log('[Auth Service] ✅ Signup successful!');
      console.log('[Auth Service] Result:', result);
      console.log('[Auth Service] User confirmed:', result.isSignUpComplete);
      console.log('[Auth Service] Next step:', result.nextStep);

      return result;
    } catch (error: any) {
      console.error('[Auth Service] ❌ Signup failed!');
      console.error('[Auth Service] Error code:', error.code);
      console.error('[Auth Service] Error name:', error.name);
      console.error('[Auth Service] Error message:', error.message);
      console.error('[Auth Service] Full error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  },

  /**
   * Confirm user sign up with verification code
   * 
   * @param email - User's email address
   * @param code - Verification code from email
   * @returns Promise that resolves when confirmation is successful
   * 
   * @example
   * await authService.confirmSignUp('user@example.com', '123456');
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      await amplifyConfirmSignUp({
        username: email,
        confirmationCode: code,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to confirm sign up');
    }
  },

  /**
   * Sign in a user
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise that resolves with user information
   * 
   * @example
   * const user = await authService.signIn('user@example.com', 'SecurePass123!');
   */
  async signIn(email: string, password: string): Promise<CognitoUser> {
    try {
      await amplifySignIn({
        username: email,
        password,
      });

      // Get session tokens
      const session = await fetchAuthSession();
      
      if (!session.tokens) {
        throw new Error('No tokens received');
      }

      // Store tokens
      storeTokens({
        accessToken: session.tokens.accessToken.toString(),
        idToken: session.tokens.idToken?.toString() || '',
        refreshToken: '', // Refresh token is managed by Amplify
        expiresAt: (session.tokens.accessToken.payload.exp || 0) * 1000,
      });

      // Get user information
      const user = await this.getCurrentUser();
      
      if (!user) {
        throw new Error('Failed to get user information');
      }

      return user;
    } catch (error: any) {
      clearTokens();
      throw new Error(error.message || 'Failed to sign in');
    }
  },

  /**
   * Sign out the current user
   * 
   * @returns Promise that resolves when sign out is successful
   * 
   * @example
   * await authService.signOut();
   */
  async signOut(): Promise<void> {
    try {
      await amplifySignOut();
      clearTokens();
    } catch (error: any) {
      // Clear tokens even if sign out fails
      clearTokens();
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  /**
   * Get the currently authenticated user
   * 
   * @returns Promise that resolves with user information or null if not authenticated
   * 
   * @example
   * const user = await authService.getCurrentUser();
   * if (user) {
   *   console.log('Logged in as:', user.email);
   * }
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    try {
      const user = await amplifyGetCurrentUser();
      
      return {
        userId: user.userId,
        username: user.username,
        email: user.signInDetails?.loginId,
      };
    } catch (error) {
      // User not authenticated
      clearTokens();
      return null;
    }
  },

  /**
   * Refresh the current session
   * 
   * @returns Promise that resolves with new access token
   * 
   * @example
   * const newToken = await authService.refreshSession();
   */
  async refreshSession(): Promise<string> {
    return refreshAccessToken();
  },

  /**
   * Check if user is authenticated
   * 
   * @returns Promise that resolves to true if user is authenticated
   * 
   * @example
   * if (await authService.isAuthenticated()) {
   *   // User is logged in
   * }
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Initiate password reset flow
   * 
   * @param email - User's email address
   * @returns Promise that resolves when reset code is sent
   * 
   * @example
   * await authService.forgotPassword('user@example.com');
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await resetPassword({ username: email });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initiate password reset');
    }
  },

  /**
   * Confirm password reset with code
   * 
   * @param email - User's email address
   * @param code - Verification code from email
   * @param newPassword - New password
   * @returns Promise that resolves when password is reset
   * 
   * @example
   * await authService.confirmPassword('user@example.com', '123456', 'NewPass123!');
   */
  async confirmPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  },

  /**
   * Get current access token (for manual API calls)
   * 
   * @returns Current access token or null
   * 
   * @example
   * const token = authService.getToken();
   */
  getToken(): string | null {
    return getAccessToken();
  },

  /**
   * Check if token needs refresh
   * 
   * @returns True if token is expired or about to expire
   */
  needsRefresh(): boolean {
    return isTokenExpired();
  },
};


