/**
 * LoadingButton Component
 * 
 * Enhanced button with loading and success states.
 * Provides visual feedback during async operations.
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, Check } from 'lucide-react';

export interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  successState?: boolean;
  successText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function LoadingButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  successState = false,
  successText,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-base min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-deep-amethyst to-warm-coral
      text-white
      hover:opacity-90 hover:scale-105
      active:scale-95
      focus:ring-deep-amethyst
      dark:focus:ring-dark-accent-amethyst
    `,
    secondary: `
      bg-deep-amethyst dark:bg-dark-accent-amethyst
      text-white
      hover:opacity-90 hover:scale-105
      active:scale-95
      focus:ring-deep-amethyst
      dark:focus:ring-dark-accent-amethyst
    `,
    outline: `
      border-2 border-deep-amethyst dark:border-dark-accent-amethyst
      text-deep-amethyst dark:text-dark-accent-amethyst
      bg-transparent
      hover:bg-deep-amethyst/10 dark:hover:bg-dark-accent-amethyst/10
      active:bg-deep-amethyst/20 dark:active:bg-dark-accent-amethyst/20
      focus:ring-deep-amethyst
      dark:focus:ring-dark-accent-amethyst
    `,
    ghost: `
      text-deep-amethyst dark:text-dark-accent-amethyst
      bg-transparent
      hover:bg-deep-amethyst/10 dark:hover:bg-dark-accent-amethyst/10
      active:bg-deep-amethyst/20 dark:active:bg-dark-accent-amethyst/20
      focus:ring-deep-amethyst
      dark:focus:ring-dark-accent-amethyst
    `,
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  // Determine what to display
  const displayContent = () => {
    if (successState) {
      return (
        <>
          <Check size={iconSize} className="animate-in fade-in zoom-in duration-300" />
          {successText || children}
        </>
      );
    }

    if (isLoading) {
      return (
        <>
          <Loader2 
            size={iconSize} 
            className="animate-spin" 
            aria-hidden="true"
          />
          <span>{loadingText || children}</span>
        </>
      );
    }

    return (
      <>
        {leftIcon}
        {children}
        {rightIcon}
      </>
    );
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading || successState}
      aria-busy={isLoading}
      aria-live="polite"
      {...props}
    >
      {displayContent()}
    </button>
  );
}
