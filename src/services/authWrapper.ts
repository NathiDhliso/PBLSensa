/**
 * Authentication Service Wrapper
 * Uses real AWS Cognito authentication
 */

import { authService as realAuthService } from './auth';
import type { CognitoUser, UserAttributes } from './auth';

// Export the real auth service
export const authService = realAuthService;

// Re-export types
export type { CognitoUser, UserAttributes };
