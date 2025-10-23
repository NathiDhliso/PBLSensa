/**
 * LoginForm Component
 * 
 * Enhanced email/password login form with:
 * - Loading states and visual feedback
 * - Enhanced error handling with actionable suggestions
 * - Form state preservation on errors
 * - Remember Me functionality
 * - Accessibility improvements
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input, LoadingButton, PasswordInput, FormError } from '@/components/ui';
import { loginSchema, LoginFormData } from '@/utils/validation';
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';
import type { AuthError } from '@/utils/authErrors';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { handleError } = useAuthErrorHandler();
  
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Clear any previous errors
      setAuthError(null);
      
      // Sign in user with remember me option
      await signIn(data.email, data.password, rememberMe);
      
      // Store last email for convenience (not sensitive)
      if (rememberMe) {
        localStorage.setItem('lastEmail', data.email);
      } else {
        localStorage.removeItem('lastEmail');
      }
      
      // Show success state briefly before redirect
      setShowSuccess(true);
      
      // Redirect after short delay to show success state
      setTimeout(() => {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        onSuccess?.();
      }, 800);
      
    } catch (error: any) {
      // Handle error with enhanced error handler
      const transformedError = handleError(error);
      setAuthError(transformedError);
      
      // Form state is automatically preserved by react-hook-form
    }
  };

  const handleErrorAction = () => {
    if (authError?.actionable) {
      const action = authError.actionable.action;
      if (action.startsWith('/')) {
        navigate(action);
      } else if (action === 'resend-verification') {
        // Handle resend verification
        const email = getValues('email');
        navigate('/resend-verification', { state: { email } });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Display form-level errors */}
      {authError && (
        <FormError
          error={authError.userMessage}
          actionable={
            authError.actionable
              ? {
                  text: authError.actionable.text,
                  action: handleErrorAction,
                }
              : undefined
          }
        />
      )}

      <Input
        {...register('email')}
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        required
        autoComplete="email"
        disabled={isSubmitting}
        aria-describedby={errors.email ? 'email-error' : undefined}
      />

      <PasswordInput
        {...register('password')}
        label="Password"
        placeholder="••••••••"
        error={errors.password?.message}
        required
        autoComplete="current-password"
        showToggle
        disabled={isSubmitting}
      />

      {/* Remember Me Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="remember-me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={isSubmitting}
          className="
            h-4 w-4 rounded border-gray-300 dark:border-dark-border-default
            text-deep-amethyst dark:text-dark-accent-amethyst
            focus:ring-2 focus:ring-deep-amethyst dark:focus:ring-dark-accent-amethyst
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
        <label
          htmlFor="remember-me"
          className="ml-2 block text-sm text-text-dark dark:text-dark-text-primary"
        >
          Remember me for 30 days
        </label>
      </div>

      <LoadingButton
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Signing in..."
        successState={showSuccess}
        successText="Success!"
        className="w-full"
      >
        Sign In
      </LoadingButton>
    </form>
  );
}
