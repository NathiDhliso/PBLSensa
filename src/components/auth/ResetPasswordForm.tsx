/**
 * ResetPasswordForm Component
 * 
 * Enhanced password reset form with:
 * - PasswordInput with strength indicator
 * - Token validation and expiry handling
 * - Success state with auto-redirect to login
 * - Enhanced error handling
 * - Resend code functionality with countdown
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input, LoadingButton, PasswordInput, FormError } from '@/components/ui';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { resetPasswordSchema, ResetPasswordFormData } from '@/utils/validation';
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import type { AuthError } from '@/utils/authErrors';
import { CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmPassword, forgotPassword } = useAuth();
  const { handleError } = useAuthErrorHandler();
  
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const emailFromUrl = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      email: emailFromUrl,
    },
  });

  const newPassword = watch('newPassword');
  const passwordStrength = usePasswordStrength(newPassword);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      // Clear any previous errors
      setAuthError(null);
      
      // Validate password strength
      if (!passwordStrength.isValid) {
        setAuthError({
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet requirements',
          userMessage: 'Please ensure your password meets all the requirements listed below.',
          retryable: true,
        });
        return;
      }
      
      // Show loading state
      setShowSuccess(false);
      
      // Confirm password reset
      await confirmPassword(data.email, data.code, data.newPassword);
      
      // Show success state
      setShowSuccess(true);
      
      // Transition to success screen after brief delay
      setTimeout(() => {
        setIsSuccess(true);
        onSuccess?.();
        
        // Auto-redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { message: 'Password reset successfully! Please sign in with your new password.' }
          });
        }, 2000);
      }, 800);
      
    } catch (error: any) {
      // Handle specific error cases
      const transformedError = handleError(error);
      
      // Check for expired or invalid code
      if (error.code === 'CodeMismatchException' || error.code === 'ExpiredCodeException') {
        transformedError.actionable = {
          text: 'Request new code',
          action: '/forgot-password',
        };
      }
      
      setAuthError(transformedError);
    }
  };

  const handleResendCode = async () => {
    const emailInput = document.getElementById('reset-email') as HTMLInputElement;
    const email = emailInput?.value || emailFromUrl;
    if (!email) {
      setAuthError({
        code: 'MISSING_EMAIL',
        message: 'Email required',
        userMessage: 'Please enter your email address to resend the code.',
        retryable: true,
      });
      return;
    }

    try {
      setIsResending(true);
      setAuthError(null);
      
      await forgotPassword(email);
      
      // Reset countdown
      setCanResend(false);
      setCountdown(60);
      
      // Show success message
      setAuthError({
        code: 'CODE_RESENT',
        message: 'Code resent',
        userMessage: 'A new verification code has been sent to your email.',
        retryable: false,
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setAuthError(null), 3000);
      
    } catch (error: any) {
      const transformedError = handleError(error);
      setAuthError(transformedError);
    } finally {
      setIsResending(false);
    }
  };

  // Success screen
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
            Password Reset Successfully!
          </h3>
          <p className="text-text-medium dark:text-dark-text-secondary">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-text-medium dark:text-dark-text-secondary">
            <p className="flex items-center justify-center gap-2">
              <Clock size={16} />
              <span>Redirecting to login page...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Display form-level errors */}
      {authError && authError.code !== 'CODE_RESENT' && (
        <FormError
          error={authError.userMessage}
          actionable={
            authError.actionable
              ? {
                  text: authError.actionable.text,
                  action: () => {
                    if (authError.actionable?.action.startsWith('/')) {
                      navigate(authError.actionable.action);
                    }
                  },
                }
              : undefined
          }
        />
      )}

      {/* Success message for code resent */}
      {authError && authError.code === 'CODE_RESENT' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-800 dark:text-green-200">
          <p className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{authError.userMessage}</span>
          </p>
        </div>
      )}

      <Input
        {...register('email')}
        id="reset-email"
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        required
        autoComplete="email"
        disabled={isSubmitting}
        aria-describedby={errors.email ? 'email-error' : undefined}
      />

      <div className="space-y-2">
        <Input
          {...register('code')}
          label="Verification Code"
          type="text"
          placeholder="Enter 6-digit code"
          error={errors.code?.message}
          required
          autoComplete="one-time-code"
          disabled={isSubmitting}
          aria-describedby={errors.code ? 'code-error' : 'code-helper'}
        />
        <div className="flex items-center justify-between text-xs">
          <p id="code-helper" className="text-text-medium dark:text-dark-text-secondary">
            Check your email for the verification code
          </p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={!canResend || isResending}
            className="flex items-center gap-1 text-deep-amethyst dark:text-dark-accent-amethyst hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            <RefreshCw size={12} className={isResending ? 'animate-spin' : ''} />
            {isResending ? 'Sending...' : canResend ? 'Resend code' : `Resend in ${countdown}s`}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <PasswordInput
          {...register('newPassword')}
          label="New Password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          required
          autoComplete="new-password"
          showToggle
          showStrength
          disabled={isSubmitting}
        />

        {newPassword && (
          <PasswordRequirements 
            password={newPassword} 
            requirements={passwordStrength.requirements}
          />
        )}
      </div>

      <PasswordInput
        {...register('confirmPassword')}
        label="Confirm New Password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        required
        autoComplete="new-password"
        showToggle
        disabled={isSubmitting}
      />

      <LoadingButton
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Resetting password..."
        successState={showSuccess}
        successText="Password reset!"
        className="w-full"
        disabled={isSubmitting}
      >
        Reset Password
      </LoadingButton>

      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm text-text-medium dark:text-dark-text-secondary hover:text-text-dark dark:hover:text-dark-text-primary transition-colors"
        >
          Back to Login
        </button>
      </div>
    </form>
  );
}
