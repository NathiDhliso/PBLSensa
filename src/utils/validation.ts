/**
 * Validation Utilities
 * 
 * Zod schemas and validation functions for forms.
 */

import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form validation schema
 */
export const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(6, 'Verification code must be at least 6 characters'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Profile update form validation schema
 */
export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ageRange: z.string().optional(),
  location: z.string().optional(),
  interests: z.array(z.string()).max(20, 'Maximum 20 interests allowed').optional(),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading-writing']).optional(),
  background: z.string().max(500, 'Background must be less than 500 characters').optional(),
  educationLevel: z.enum(['high_school', 'undergraduate', 'graduate', 'professional']).optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Password strength checker
 * Returns a score from 0-4 and feedback
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const strengthMap = {
    0: { feedback: 'Very weak', color: 'bg-red-500' },
    1: { feedback: 'Weak', color: 'bg-orange-500' },
    2: { feedback: 'Fair', color: 'bg-yellow-500' },
    3: { feedback: 'Good', color: 'bg-blue-500' },
    4: { feedback: 'Strong', color: 'bg-green-500' },
    5: { feedback: 'Very strong', color: 'bg-green-600' },
  };

  return {
    score,
    ...strengthMap[score as keyof typeof strengthMap],
  };
}

/**
 * Cognito error message mapping
 * @deprecated Use transformAuthError from @/utils/authErrors instead
 */
export const authErrorMessages: Record<string, string> = {
  'UserNotFoundException': 'No account found with this email',
  'NotAuthorizedException': 'Invalid email or password',
  'UserNotConfirmedException': 'Please verify your email before logging in',
  'CodeMismatchException': 'Invalid verification code',
  'ExpiredCodeException': 'Verification code has expired',
  'LimitExceededException': 'Too many attempts. Please try again later',
  'UsernameExistsException': 'An account with this email already exists',
  'InvalidPasswordException': 'Password does not meet requirements',
  'InvalidParameterException': 'Invalid input. Please check your information',
};

/**
 * Get user-friendly error message from Cognito error
 * @deprecated Use useAuthErrorHandler hook instead for better error handling
 */
export function getAuthErrorMessage(error: any): string {
  const errorCode = error.code || error.name;
  return authErrorMessages[errorCode] || error.message || 'An error occurred. Please try again.';
}

/**
 * Enhanced password requirements for display
 */
export const PASSWORD_REQUIREMENTS = [
  'At least 8 characters long',
  'Contains uppercase letter (A-Z)',
  'Contains lowercase letter (a-z)',
  'Contains number (0-9)',
  'Contains special character (!@#$%^&*)',
];

/**
 * Validate password against requirements
 * Returns which requirements are met
 */
export function validatePasswordRequirements(password: string): {
  requirement: string;
  met: boolean;
}[] {
  return [
    {
      requirement: PASSWORD_REQUIREMENTS[0],
      met: password.length >= 8
    },
    {
      requirement: PASSWORD_REQUIREMENTS[1],
      met: /[A-Z]/.test(password)
    },
    {
      requirement: PASSWORD_REQUIREMENTS[2],
      met: /[a-z]/.test(password)
    },
    {
      requirement: PASSWORD_REQUIREMENTS[3],
      met: /[0-9]/.test(password)
    },
    {
      requirement: PASSWORD_REQUIREMENTS[4],
      met: /[^A-Za-z0-9]/.test(password)
    }
  ];
}

/**
 * Confirm email form validation schema
 */
export const confirmEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string()
    .min(6, 'Confirmation code must be 6 digits')
    .max(6, 'Confirmation code must be 6 digits')
    .regex(/^\d+$/, 'Confirmation code must contain only numbers'),
});

export type ConfirmEmailFormData = z.infer<typeof confirmEmailSchema>;
