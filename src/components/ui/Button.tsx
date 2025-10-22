/**
 * Button Component
 * 
 * Reusable button with multiple variants, sizes, loading states, and icon support.
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
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

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
