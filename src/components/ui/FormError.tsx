/**
 * FormError Component
 * 
 * Accessible error message display with optional actionable suggestions.
 * Provides clear feedback and guidance for form validation errors.
 */

import { AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface FormErrorProps {
  error: string | null;
  fieldId?: string;
  actionable?: {
    text: string;
    action: () => void;
  };
  className?: string;
}

export function FormError({ error, fieldId, actionable, className = '' }: FormErrorProps) {
  const errorRef = useRef<HTMLDivElement>(null);

  // Announce error to screen readers when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      // Focus management for accessibility
      const errorElement = errorRef.current;
      errorElement.focus();
    }
  }, [error]);

  if (!error) {
    return null;
  }

  const errorId = fieldId ? `${fieldId}-error` : 'form-error';

  return (
    <div
      ref={errorRef}
      id={errorId}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className={`
        flex items-start gap-2 p-3 rounded-lg
        bg-red-50 dark:bg-red-900/20
        border border-red-200 dark:border-red-800
        text-red-800 dark:text-red-200
        animate-in fade-in slide-in-from-top-2 duration-300
        ${className}
      `}
    >
      <AlertCircle 
        size={20} 
        className="flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" 
        aria-hidden="true"
      />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{error}</p>
        
        {actionable && (
          <button
            type="button"
            onClick={actionable.action}
            className="
              mt-2 text-sm font-medium underline
              text-red-700 dark:text-red-300
              hover:text-red-900 dark:hover:text-red-100
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              rounded
            "
          >
            {actionable.text}
          </button>
        )}
      </div>
    </div>
  );
}
