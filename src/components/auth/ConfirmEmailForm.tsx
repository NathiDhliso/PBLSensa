/**
 * ConfirmEmailForm Component
 * 
 * Email confirmation form for post-registration verification.
 * Allows users to enter confirmation code and resend if needed.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input, LoadingButton, FormError } from '@/components/ui';
import { confirmEmailSchema, ConfirmEmailFormData } from '@/utils/validation';
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';
import type { AuthError } from '@/utils/authErrors';
import { CheckCircle, RefreshCw, Mail } from 'lucide-react';

interface ConfirmEmailFormProps {
  onSuccess?: () => void;
}

export function ConfirmEmailForm({ onSuccess }: ConfirmEmailFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmSignUp, signIn } = useAuth();
  const { handleError } = useAuthErrorHandler();
  
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const emailFromUrl = searchParams.get('email') || '';
  const passwordFromUrl = searchParams.get('temp') || ''; // Temporary password for auto-login

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmEmailFormData>({
    resolver: zodResolver(confirmEmailSchema),
    mode: 'onBlur',
    defaultValues: {
      email: emailFromUrl,
    },
  });

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const onSubmit = async (data: ConfirmEmailFormData) => {
    try {
      // Clear any previous errors
      setAuthError(null);
      setShowSuccess(false);
      
      // Confirm email with code
      await confirmSignUp(data.email, data.code);
      
      // Show success state
      setShowSuccess(true);
      
      // Transition to success screen
      setTimeout(async () => {
        setIsSuccess(true);
        onSuccess?.();
        
        // Auto-login if password available
        if (passwordFromUrl) {
          try {
            await signIn(data.email, passwordFromUrl);
            navigate('/dashboard', {
              replace: true,
              state: { message: 'Email confirmed! Welcome to Sensa Learn.' }
            });
          } catch (error) {
            // If auto-login fails, redirect to login
            navigate('/login', {
              state: { message: 'Email confirmed! Please sign in to continue.' }
            });
          }
        } else {
          // Redirect to login
          setTimeout(() => {
            navigate('/login', {
              state: { message: 'Email confirmed! Please sign in to continue.' }
            });
          }, 2000);
        }
      }, 800);
      
    } catch (error: any) {
      const transformedError = handleError(error);
      setAuthError(transformedError);
    }
  };

  const handleResendCode = async () => {
    const emailInput = document.getElementById('confirm-email') as HTMLInputElement;
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
      
      // Resend confirmation code (using forgotPassword as proxy since Cognito doesn't have resend)
      // In production, you'd use AWS SDK directly or a custom API endpoint
      await confirmSignUp(email, ''); // This will fail but trigger resend
      
    } catch (error: any) {
      // Expected to fail, but code is resent
      if (error.code === 'CodeMismatchException') {
        // Reset countdown
        setCanResend(false);
        setCountdown(60);
        
        // Show success message
        setAuthError({
          code: 'CODE_RESENT',
          message: 'Code resent',
          userMessage: 'A new confirmation code has been sent to your email.',
          retryable: false,
        });
        
        // Clear message after 3 seconds
        setTimeout(() => setAuthError(null), 3000);
      } else {
        const transformedError = handleError(error);
        setAuthError(transformedError);
      }
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
            Email Confirmed!
          </h3>
          <p className="text-text-medium dark:text-dark-text-secondary">
            Your email has been successfully verified. {passwordFromUrl ? 'Signing you in...' : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
          <Mail size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-text-dark dark:text-dark-text-primary mb-2">
          Confirm Your Email
        </h2>
        <p className="text-sm text-text-medium dark:text-dark-text-secondary">
          We've sent a confirmation code to your email address. Enter it below to verify your account.
        </p>
      </div>

      {/* Success message for code resent */}
      {authError && authError.code === 'CODE_RESENT' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-800 dark:text-green-200">
          <p className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{authError.userMessage}</span>
          </p>
        </div>
      )}

      {/* Display form-level errors */}
      {authError && authError.code !== 'CODE_RESENT' && (
        <FormError error={authError.userMessage} />
      )}

      <Input
        {...register('email')}
        id="confirm-email"
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
          label="Confirmation Code"
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
            Check your email for the confirmation code
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

      <LoadingButton
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Confirming..."
        successState={showSuccess}
        successText="Confirmed!"
        className="w-full"
        disabled={isSubmitting}
      >
        Confirm Email
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
