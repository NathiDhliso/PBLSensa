/**
 * Authentication Service Wrapper
 * Switches between real Cognito and mock auth based on environment
 */

import { env } from '@/config/env';
import { authService as realAuthService } from './auth';
import { mockAuthService } from './mockAuth';
import type { CognitoUser, UserAttributes } from './auth';

// Export the appropriate service based on environment
export const authService = env.enableMockAuth ? mockAuthService : realAuthService;

// Re-export types
export type { CognitoUser, UserAttributes };
