/**
 * ResetPasswordForm Component
 * 
 * Complete password reset with verification code
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Input, Button } from '@/components/ui';
import { resetPasswordSchema, ResetPasswordFormData, getAuthErrorMessage } from '@/utils/validation';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmPassword, forgotPassword } = useAuth();
  const { showToast } = useToast();
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const emailFromUrl = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
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

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await confirmPassword(data.email, data.code, data.newPassword);
      
      showToast('success', 'Password reset successfully!');

      navigate('/login', { replace: true });
      
      onSuccess?.();
    } catch (error: any) {
      showToast('error', getAuthErrorMessage(error));
    }
  };

  const handleResendCode = async () => {
    const emailInput = document.getElementById('reset-email') as HTMLInputElement;
    const email = emailInput?.value || emailFromUrl;
    if (!email) {
      showToast('error', 'Please enter your email address');
      return;
    }

    try {
      await forgotPassword(email);
      showToast('success', 'New code sent to your email');
      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      showToast('error', getAuthErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('email')}
        id="reset-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        required
        autoComplete="email"
      />

      <Input
        {...register('code')}
        label="Verification Code"
        type="text"
        placeholder="Enter 6-digit code"
        error={errors.code?.message}
        required
        helperText="Check your email for the verification code"
        autoComplete="one-time-code"
      />

      <Input
        {...register('newPassword')}
        label="New Password"
        type="password"
        placeholder="••••••••"
        error={errors.newPassword?.message}
        required
        autoComplete="new-password"
      />

      <Input
        {...register('confirmPassword')}
        label="Confirm New Password"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        required
        autoComplete="new-password"
      />

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="flex-1"
        >
          Reset Password
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleResendCode}
          disabled={!canResend}
        >
          {canResend ? 'Resend' : `${countdown}s`}
        </Button>
      </div>
    </form>
  );
}
