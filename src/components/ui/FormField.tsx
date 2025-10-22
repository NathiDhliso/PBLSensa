/**
 * FormField Component
 * 
 * Wrapper component for consistent form field layout with label, helper text, and error messages.
 */

import { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}

export function FormField({
  label,
  error,
  helperText,
  required,
  children,
  htmlFor,
}: FormFieldProps) {
  const fieldId = htmlFor || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  return (
    <div className="w-full space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-text-dark dark:text-dark-text-primary"
      >
        {label}
        {required && <span className="text-warm-coral ml-1" aria-label="required">*</span>}
      </label>
      
      <div>
        {children}
      </div>
      
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      
      {!error && helperText && (
        <p
          id={helperId}
          className="text-sm text-text-light dark:text-dark-text-tertiary"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
