/**
 * Select Component
 * 
 * Dropdown select with custom styling and error support.
 */

import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, placeholder, className = '', id, required, ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${selectId}-error`;

    return (
      <div className="w-full">
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-text-dark dark:text-dark-text-primary mb-2"
        >
          {label}
          {required && <span className="text-warm-coral ml-1" aria-label="required">*</span>}
        </label>
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`
              w-full px-4 py-2 pr-10 rounded-lg border
              bg-white dark:bg-dark-bg-secondary
              text-text-dark dark:text-dark-text-primary
              appearance-none cursor-pointer
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
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-medium dark:text-dark-text-secondary"
            size={20}
          />
        </div>
        
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
          <p className="mt-1 text-sm text-text-medium dark:text-dark-text-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
