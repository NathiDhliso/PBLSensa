/**
 * ForgotPasswordForm Component
 * 
 * Request password reset code form
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Input, Button } from '@/components/ui';
import { forgotPasswordSchema, ForgotPasswordFormData, getAuthErrorMessage } from '@/utils/validation';
import { CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data.email);
      setEmail(data.email);
      setIsSuccess(true);
      
      showToast('success', 'Password reset code sent to your email');
      
      onSuccess?.();
    } catch (error: any) {
      showToast('error', getAuthErrorMessage(error));
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle size={64} className="text-green-600 dark:text-green-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-dark dark:text-dark-text-primary">
            Check your email
          </h3>
          <p className="text-text-medium dark:text-dark-text-secondary">
            We've sent a password reset code to <strong>{email}</strong>
          </p>
        </div>

        <Link to={`/reset-password?email=${encodeURIComponent(email)}`}>
          <Button variant="primary" size="lg" className="w-full">
            Enter Reset Code
          </Button>
        </Link>

        <Link to="/login">
          <Button variant="ghost" size="md" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-text-medium dark:text-dark-text-secondary text-sm">
        Enter your email address and we'll send you a code to reset your password.
      </p>

      <Input
        {...register('email')}
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        required
        autoComplete="email"
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full"
      >
        Send Reset Code
      </Button>

      <Link to="/login">
        <Button variant="ghost" size="md" className="w-full">
          Back to Login
        </Button>
      </Link>
    </form>
  );
}
