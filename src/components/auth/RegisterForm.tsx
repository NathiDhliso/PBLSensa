/**
 * RegisterForm Component
 * 
 * Enhanced registration form with:
 * - Real-time email validation
 * - Password strength indicator
 * - Duplicate email detection
 * - Auto-login after successful registration
 * - Enhanced error handling
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input, LoadingButton, PasswordInput, FormError } from '@/components/ui';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { registerSchema, RegisterFormData } from '@/utils/validation';
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import type { AuthError } from '@/utils/authErrors';
import { CheckCircle } from 'lucide-react';

export function RegisterForm() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { handleError } = useAuthErrorHandler();
  const { checkRateLimit, recordAttempt } = useSecurityMonitor();
  
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const password = watch('password', '');
  const email = watch('email', '');
  const passwordStrength = usePasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    console.log('='.repeat(60));
    console.log('[RegisterForm] 🚀 Starting registration process');
    console.log('[RegisterForm] Form data:', { email: data.email, hasName: !!data.name, hasPassword: !!data.password });
    
    try {
      // Clear any previous errors
      setAuthError(null);
      console.log('[RegisterForm] ✓ Cleared previous errors');
      
      // Check rate limiting for registration
      const isRateLimited = checkRateLimit(data.email, 'registration');
      if (isRateLimited) {
        setAuthError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many registration attempts',
          userMessage: 'You have made too many registration attempts. Please try again later.',
          retryable: false,
        });
        return;
      }
      
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
      
      // Sign up user (only email is sent, name is ignored by auth service)
      await signUp(data.email, data.password);
      
      // Record successful attempt
      recordAttempt(data.email, 'registration', true);
      
      // Show success message and redirect to email confirmation
      setShowSuccess(true);
      
      // Redirect to email confirmation page
      setTimeout(() => {
        navigate('/confirm-email', {
          state: { 
            email: data.email,
            message: 'Account created! Please check your email for the verification code.'
          }
        });
      }, 1500);
      
    } catch (error: any) {
      // Record failed attempt
      recordAttempt(email || '', 'registration', false);
      
      // Handle specific error cases
      const transformedError = handleError(error);
      
      // Check for duplicate email
      if (error.code === 'UsernameExistsException') {
        transformedError.actionable = {
          text: 'Sign in instead',
          action: '/login',
        };
        transformedError.userMessage = 'An account with this email already exists. Please sign in or use a different email.';
      }
      
      setAuthError(transformedError);
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
            Welcome to Sensa Learn!
          </h3>
          <p className="text-text-medium dark:text-dark-text-secondary">
            Your account has been created successfully. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Display form-level errors */}
      {authError && (
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

      <Input
        {...register('name')}
        label="Full Name"
        type="text"
        placeholder="John Doe"
        error={errors.name?.message}
        autoComplete="name"
        disabled={isSubmitting}
        aria-describedby="name-helper"
      />

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

      <div className="space-y-3">
        <PasswordInput
          {...register('password')}
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
          required
          autoComplete="new-password"
          showToggle
          showStrength
          disabled={isSubmitting}
        />

        {password && (
          <PasswordRequirements 
            password={password} 
            requirements={passwordStrength.requirements}
          />
        )}
      </div>

      <PasswordInput
        {...register('confirmPassword')}
        label="Confirm Password"
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
        loadingText="Creating account..."
        successState={showSuccess}
        successText="Account created!"
        className="w-full"
        disabled={isSubmitting}
      >
        Create Account
      </LoadingButton>
    </form>
  );
}
