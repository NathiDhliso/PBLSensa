/**
 * ForgotPasswordForm Component
 * 
 * Enhanced password reset request form with:
 * - LoadingButton with loading states
 * - Enhanced error handling with actionable suggestions
 * - Rate limiting feedback
 * - Improved success state messaging
 * - Email validation feedback
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input, LoadingButton, FormError } from '@/components/ui';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/utils/validation';
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import type { AuthError } from '@/utils/authErrors';
import { CheckCircle, Mail, Clock } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const { forgotPassword } = useAuth();
  const { handleError } = useAuthErrorHandler();
  const { 
    checkRateLimit, 
    recordAttempt,
    getTimeUntilUnblocked,
    getRemainingAttempts,
    formatTimeRemaining 
  } = useSecurityMonitor();
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const emailValue = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // Clear any previous errors
      setAuthError(null);
      
      // Check rate limiting for password reset
      const isRateLimited = checkRateLimit(data.email, 'passwordReset');
      if (isRateLimited) {
        const timeUntilUnblocked = getTimeUntilUnblocked(data.email, 'passwordReset');
        const timeFormatted = formatTimeRemaining(timeUntilUnblocked);
        setAuthError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many password reset attempts',
          userMessage: `Too many password reset requests. Please try again in ${timeFormatted}.`,
          retryable: false,
        });
        return;
      }
      
      // Show loading state
      setShowSuccess(false);
      
      // Request password reset
      await forgotPassword(data.email);
      
      // Record successful attempt
      recordAttempt(data.email, 'passwordReset', true);
      
      // Store email and show success
      setEmail(data.email);
      setShowSuccess(true);
      
      // Transition to success state after brief delay
      setTimeout(() => {
        setIsSuccess(true);
        onSuccess?.();
      }, 800);
      
    } catch (error: any) {
      // Record failed attempt
      recordAttempt(emailValue || '', 'passwordReset', false);
      
      // Handle error with enhanced error handler
      const transformedError = handleError(error);
      setAuthError(transformedError);
    }
  };

  // Get rate limit info for display
  const remainingAttempts = emailValue ? getRemainingAttempts(emailValue, 'passwordReset') : null;
  const showRateLimitWarning = remainingAttempts !== null && remainingAttempts < 3;

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 dark:bg-green-400/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle size={64} className="relative text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold text-text-dark dark:text-dark-text-primary">
            Check your email
          </h3>
          <div className="space-y-2">
            <p className="text-text-medium dark:text-dark-text-secondary">
              We've sent a password reset code to:
            </p>
            <p className="text-lg font-medium text-text-dark dark:text-dark-text-primary flex items-center justify-center gap-2">
              <Mail size={20} />
              {email}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-text-medium dark:text-dark-text-secondary">
            <p className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                The code will expire in <strong>15 minutes</strong>. 
                If you don't see the email, check your spam folder.
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="block">
            <LoadingButton
              variant="primary"
              size="lg"
              className="w-full"
            >
              Enter Reset Code
            </LoadingButton>
          </Link>

          <Link to="/login" className="block">
            <button
              type="button"
              className="w-full text-sm text-text-medium dark:text-dark-text-secondary hover:text-text-dark dark:hover:text-dark-text-primary transition-colors"
            >
              Back to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <p className="text-text-medium dark:text-dark-text-secondary text-sm">
          Enter your email address and we'll send you a code to reset your password.
        </p>
        
        {/* Rate limit info */}
        {showRateLimitWarning && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
            <p className="flex items-center gap-2">
              <Clock size={14} />
              <span>
                {remainingAttempts} password reset request{remainingAttempts !== 1 ? 's' : ''} remaining this hour
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Display form-level errors */}
      {authError && (
        <FormError
          error={authError.userMessage}
          actionable={
            authError.actionable
              ? {
                  text: authError.actionable.text,
                  action: () => {
                    // Handle actionable errors if needed
                  },
                }
              : undefined
          }
        />
      )}

      <Input
        {...register('email')}
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        required
        autoComplete="email"
        disabled={isSubmitting}
        aria-describedby={errors.email ? 'email-error' : undefined}
      />

      <LoadingButton
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Sending code..."
        successState={showSuccess}
        successText="Code sent!"
        className="w-full"
        disabled={isSubmitting}
      >
        Send Reset Code
      </LoadingButton>

      <div className="text-center">
        <Link 
          to="/login"
          className="text-sm text-text-medium dark:text-dark-text-secondary hover:text-text-dark dark:hover:text-dark-text-primary transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
}
