/**
 * PasswordInput Component
 * 
 * Enhanced password input with show/hide toggle and optional strength indicator.
 * Provides accessible password entry with visual feedback.
 */

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  showStrength?: boolean;
  showToggle?: boolean;
  strength?: {
    score: number; // 0-4
    feedback: string[];
  };
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    required, 
    showStrength = false,
    showToggle = true,
    strength,
    className = '', 
    id,
    value,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `password-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const strengthId = `${inputId}-strength`;

    const getStrengthColor = (score: number) => {
      switch (score) {
        case 0:
        case 1:
          return 'bg-red-500';
        case 2:
          return 'bg-orange-500';
        case 3:
          return 'bg-yellow-500';
        case 4:
          return 'bg-green-500';
        default:
          return 'bg-gray-300';
      }
    };

    const getStrengthLabel = (score: number) => {
      switch (score) {
        case 0:
        case 1:
          return 'Weak';
        case 2:
          return 'Fair';
        case 3:
          return 'Good';
        case 4:
          return 'Strong';
        default:
          return '';
      }
    };

    const hasValue = value && String(value).length > 0;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-dark dark:text-dark-text-primary mb-2"
        >
          {label}
          {required && <span className="text-warm-coral ml-1" aria-label="required">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            value={value}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : 
              showStrength && strength ? strengthId : 
              helperText ? helperId : 
              undefined
            }
            className={`
              w-full px-4 py-2 rounded-lg border
              bg-white dark:bg-dark-bg-secondary
              text-text-dark dark:text-dark-text-primary
              placeholder-text-light dark:placeholder-dark-text-muted
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-deep-amethyst dark:focus:ring-dark-accent-amethyst
              disabled:opacity-50 disabled:cursor-not-allowed
              ${showToggle ? 'pr-12' : ''}
              ${error 
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' 
                : 'border-gray-300 dark:border-dark-border-default hover:border-gray-400 dark:hover:border-dark-border-emphasis'
              }
              ${className}
            `}
            {...props}
          />
          
          {showToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-medium dark:text-dark-text-secondary hover:text-text-dark dark:hover:text-dark-text-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>

        {/* Password Strength Indicator */}
        {showStrength && strength && hasValue && (
          <div id={strengthId} className="mt-2" aria-live="polite">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
                  style={{ width: `${(strength.score + 1) * 20}%` }}
                  role="progressbar"
                  aria-valuenow={strength.score}
                  aria-valuemin={0}
                  aria-valuemax={4}
                  aria-label="Password strength"
                />
              </div>
              <span className="text-xs font-medium text-text-medium dark:text-dark-text-secondary min-w-[3rem]">
                {getStrengthLabel(strength.score)}
              </span>
            </div>
            {strength.feedback.length > 0 && (
              <ul className="text-xs text-text-medium dark:text-dark-text-tertiary space-y-1">
                {strength.feedback.map((feedback, index) => (
                  <li key={index}>• {feedback}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
        
        {!error && helperText && (
          <p
            id={helperId}
            className="mt-1 text-sm text-text-light dark:text-dark-text-tertiary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
