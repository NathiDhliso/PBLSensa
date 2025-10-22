/**
 * Mock Authentication Service
 * For local development without AWS Cognito
 */

import { CognitoUser, UserAttributes } from './auth';

// In-memory user storage
const users = new Map<string, { email: string; password: string; attributes: UserAttributes }>();
let currentUser: CognitoUser | null = null;

// Add a default test user
users.set('test@example.com', {
  email: 'test@example.com',
  password: 'Test123!',
  attributes: {
    email: 'test@example.com',
    name: 'Test User',
  },
});

export const mockAuthService = {
  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, attributes?: Omit<UserAttributes, 'email'>): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (users.has(email)) {
      throw new Error('User already exists');
    }

    users.set(email, {
      email,
      password,
      attributes: {
        email,
        ...attributes,
      },
    });

    // Automatically sign in the user after signup
    currentUser = {
      userId: `mock-${Date.now()}`,
      username: email,
      email: email,
      attributes: {
        email,
        ...attributes,
      },
    };

    // Store in localStorage for persistence
    localStorage.setItem('mockUser', JSON.stringify(currentUser));

    console.log('[Mock Auth] User signed up and auto-signed in:', email);
  },

  /**
   * Confirm sign up (no-op for mock)
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('[Mock Auth] Sign up confirmed:', email);
  },

  /**
   * Sign in a user
   */
  async signIn(email: string, password: string): Promise<CognitoUser> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = users.get(email);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }

    currentUser = {
      userId: `mock-${Date.now()}`,
      username: email,
      email: user.email,
      attributes: user.attributes,
    };

    // Store in localStorage for persistence
    localStorage.setItem('mockUser', JSON.stringify(currentUser));

    console.log('[Mock Auth] User signed in:', email);
    return currentUser;
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    currentUser = null;
    localStorage.removeItem('mockUser');
    console.log('[Mock Auth] User signed out');
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    // Try to restore from localStorage
    const stored = localStorage.getItem('mockUser');
    if (stored) {
      currentUser = JSON.parse(stored);
    }
    return currentUser;
  },

  /**
   * Get access token (mock)
   */
  getAccessToken(): string | null {
    return currentUser ? 'mock-access-token' : null;
  },

  /**
   * Refresh session (no-op for mock)
   */
  async refreshSession(): Promise<void> {
    // No-op for mock
  },

  /**
   * Check if token needs refresh (always false for mock)
   */
  needsRefresh(): boolean {
    return false;
  },

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!users.has(email)) {
      throw new Error('User not found');
    }

    console.log('[Mock Auth] Password reset initiated for:', email);
    console.log('[Mock Auth] Use code: 123456');
  },

  /**
   * Confirm password reset
   */
  async confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = users.get(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (code !== '123456') {
      throw new Error('Invalid verification code');
    }

    user.password = newPassword;
    console.log('[Mock Auth] Password reset for:', email);
  },
};
