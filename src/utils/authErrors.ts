/**
 * Authentication Error Handling Utilities
 * 
 * Enhanced error transformation and handling for authentication flows.
 * Provides user-friendly messages with actionable suggestions.
 */

/**
 * Enhanced authentication error interface
 */
export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  actionable?: {
    text: string;
    action: string; // Route or action identifier
  };
  retryable: boolean;
  originalError?: any;
}

/**
 * Comprehensive error messages mapping for AWS Cognito errors
 */
export const ERROR_MESSAGES: Record<string, Omit<AuthError, 'originalError'>> = {
  // User not found errors
  'UserNotFoundException': {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    userMessage: 'No account found with this email address.',
    actionable: {
      text: 'Create an account',
      action: '/register'
    },
    retryable: false
  },

  // Authentication errors
  'NotAuthorizedException': {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid credentials',
    userMessage: 'Incorrect email or password. Please try again.',
    actionable: {
      text: 'Reset password',
      action: '/forgot-password'
    },
    retryable: true
  },

  // Email verification errors
  'UserNotConfirmedException': {
    code: 'EMAIL_NOT_VERIFIED',
    message: 'Email not verified',
    userMessage: 'Please verify your email address before logging in.',
    actionable: {
      text: 'Resend verification email',
      action: 'resend-verification'
    },
    retryable: false
  },

  // Code verification errors
  'CodeMismatchException': {
    code: 'INVALID_CODE',
    message: 'Invalid verification code',
    userMessage: 'The verification code you entered is incorrect. Please try again.',
    retryable: true
  },

  'ExpiredCodeException': {
    code: 'CODE_EXPIRED',
    message: 'Verification code expired',
    userMessage: 'Your verification code has expired. Please request a new one.',
    actionable: {
      text: 'Request new code',
      action: 'resend-code'
    },
    retryable: false
  },

  // Rate limiting errors
  'LimitExceededException': {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many attempts',
    userMessage: 'Too many attempts. Please wait a few minutes before trying again.',
    retryable: false
  },

  'TooManyRequestsException': {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests',
    userMessage: 'Too many requests. Please slow down and try again in a moment.',
    retryable: false
  },

  'TooManyFailedAttemptsException': {
    code: 'TOO_MANY_FAILED_ATTEMPTS',
    message: 'Too many failed attempts',
    userMessage: 'Your account has been temporarily locked due to too many failed login attempts. Please try again later or reset your password.',
    actionable: {
      text: 'Reset password',
      action: '/forgot-password'
    },
    retryable: false
  },

  // User exists errors
  'UsernameExistsException': {
    code: 'USER_EXISTS',
    message: 'User already exists',
    userMessage: 'An account with this email already exists.',
    actionable: {
      text: 'Sign in instead',
      action: '/login'
    },
    retryable: false
  },

  // Password errors
  'InvalidPasswordException': {
    code: 'INVALID_PASSWORD',
    message: 'Invalid password',
    userMessage: 'Password does not meet security requirements. It must be at least 8 characters with uppercase, lowercase, numbers, and special characters.',
    retryable: true
  },

  // Parameter errors
  'InvalidParameterException': {
    code: 'INVALID_PARAMETER',
    message: 'Invalid parameter',
    userMessage: 'Invalid input provided. Please check your information and try again.',
    retryable: true
  },

  // Network errors
  'NetworkError': {
    code: 'NETWORK_ERROR',
    message: 'Network error',
    userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
    retryable: true
  },

  // Session errors
  'NotAuthenticatedException': {
    code: 'NOT_AUTHENTICATED',
    message: 'Not authenticated',
    userMessage: 'Your session has expired. Please sign in again.',
    actionable: {
      text: 'Sign in',
      action: '/login'
    },
    retryable: false
  },

  // Token errors
  'TokenExpiredException': {
    code: 'TOKEN_EXPIRED',
    message: 'Token expired',
    userMessage: 'Your session has expired. Please sign in again.',
    actionable: {
      text: 'Sign in',
      action: '/login'
    },
    retryable: false
  },

  // Account status errors
  'UserLambdaValidationException': {
    code: 'VALIDATION_ERROR',
    message: 'Validation error',
    userMessage: 'Unable to complete this action. Please contact support if the problem persists.',
    retryable: false
  },

  'PasswordResetRequiredException': {
    code: 'PASSWORD_RESET_REQUIRED',
    message: 'Password reset required',
    userMessage: 'You must reset your password before continuing.',
    actionable: {
      text: 'Reset password',
      action: '/forgot-password'
    },
    retryable: false
  },

  // MFA errors
  'CodeDeliveryFailureException': {
    code: 'CODE_DELIVERY_FAILED',
    message: 'Code delivery failed',
    userMessage: 'Unable to send verification code. Please try again.',
    retryable: true
  },

  // Generic errors
  'InternalErrorException': {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    userMessage: 'An unexpected error occurred. Please try again later.',
    retryable: true
  },

  'ServiceUnavailableException': {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service unavailable',
    userMessage: 'The service is temporarily unavailable. Please try again in a few moments.',
    retryable: true
  }
};

/**
 * Default error for unknown error types
 */
const DEFAULT_ERROR: Omit<AuthError, 'originalError'> = {
  code: 'UNKNOWN_ERROR',
  message: 'Unknown error',
  userMessage: 'An unexpected error occurred. Please try again.',
  retryable: true
};

/**
 * Transform any error into a structured AuthError
 * 
 * @param error - The error to transform (can be any type)
 * @returns Structured AuthError with user-friendly message
 * 
 * @example
 * try {
 *   await signIn(email, password);
 * } catch (error) {
 *   const authError = transformAuthError(error);
 *   console.log(authError.userMessage);
 * }
 */
export function transformAuthError(error: any): AuthError {
  // Handle null/undefined
  if (!error) {
    return { ...DEFAULT_ERROR, originalError: error };
  }

  // Extract error code from various error formats
  const errorCode = error.code || error.name || error.__type || 'UNKNOWN_ERROR';
  
  // Handle network errors
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return {
      ...ERROR_MESSAGES['NetworkError'],
      originalError: error
    };
  }

  // Get error configuration or use default
  const errorConfig = ERROR_MESSAGES[errorCode] || DEFAULT_ERROR;
  
  return {
    ...errorConfig,
    originalError: error
  };
}

/**
 * Check if an error is retryable
 * 
 * @param error - The error to check
 * @returns True if the operation can be retried
 */
export function isRetryableError(error: AuthError): boolean {
  return error.retryable;
}

/**
 * Get actionable suggestion from error
 * 
 * @param error - The error to get action from
 * @returns Actionable suggestion or null
 */
export function getErrorAction(error: AuthError): AuthError['actionable'] | null {
  return error.actionable || null;
}

/**
 * Format error for logging
 * 
 * @param error - The error to format
 * @returns Formatted error string for logging
 */
export function formatErrorForLogging(error: AuthError): string {
  return `[${error.code}] ${error.message}${error.originalError ? ` - Original: ${error.originalError.message}` : ''}`;
}

/**
 * Check if error indicates user should be logged out
 * 
 * @param error - The error to check
 * @returns True if user should be logged out
 */
export function shouldLogoutUser(error: AuthError): boolean {
  const logoutCodes = [
    'NOT_AUTHENTICATED',
    'TOKEN_EXPIRED',
    'PASSWORD_RESET_REQUIRED'
  ];
  
  return logoutCodes.includes(error.code);
}
