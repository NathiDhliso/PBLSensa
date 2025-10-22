/**
 * RegisterForm Component
 * 
 * User registration form with password strength indicator
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Input, Button } from '@/components/ui';
import { registerSchema, RegisterFormData, getAuthErrorMessage, checkPasswordStrength } from '@/utils/validation';
import { Check, X } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const watchedPassword = watch('password', '');
  const passwordStrength = checkPasswordStrength(watchedPassword);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, data.name ? { name: data.name } : undefined);
      
      showToast('success', 'Account created successfully!');

      // Redirect to profile setup
      navigate('/profile/setup', { replace: true });
      
      onSuccess?.();
    } catch (error: any) {
      showToast('error', getAuthErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('name')}
        label="Name"
        type="text"
        placeholder="John Doe"
        error={errors.name?.message}
        helperText="Optional"
        autoComplete="name"
      />

      <Input
        {...register('email')}
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        required
        autoComplete="email"
      />

      <div>
        <Input
          {...register('password')}
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          required
          autoComplete="new-password"
        />
        
        {watchedPassword && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-text-medium dark:text-dark-text-secondary">
                {passwordStrength.feedback}
              </span>
            </div>
            
            <div className="space-y-1">
              {passwordRequirements.map((req) => {
                const met = req.test(watchedPassword);
                return (
                  <div key={req.label} className="flex items-center gap-2 text-xs">
                    {met ? (
                      <Check size={14} className="text-green-600 dark:text-green-400" />
                    ) : (
                      <X size={14} className="text-gray-400 dark:text-dark-text-muted" />
                    )}
                    <span className={met ? 'text-green-600 dark:text-green-400' : 'text-text-light dark:text-dark-text-tertiary'}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Input
        {...register('confirmPassword')}
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        required
        autoComplete="new-password"
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full"
      >
        Create Account
      </Button>
    </form>
  );
}
