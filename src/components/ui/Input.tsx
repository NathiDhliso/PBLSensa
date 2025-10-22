/**
 * Input Component
 * 
 * Reusable text input with validation support, labels, and error messages.
 * Supports all standard HTML input attributes.
 */

import { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, required, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-dark dark:text-dark-text-primary mb-2"
        >
          {label}
          {required && <span className="text-warm-coral ml-1" aria-label="required">*</span>}
        </label>
        
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`
            w-full px-4 py-2 rounded-lg border
            bg-white dark:bg-dark-bg-secondary
            text-text-dark dark:text-dark-text-primary
            placeholder-text-light dark:placeholder-dark-text-muted
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-deep-amethyst dark:focus:ring-dark-accent-amethyst
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error 
              ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' 
              : 'border-gray-300 dark:border-dark-border-default hover:border-gray-400 dark:hover:border-dark-border-emphasis'
            }
            ${className}
          `}
          {...props}
        />
        
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

Input.displayName = 'Input';
