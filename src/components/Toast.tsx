/**
 * Toast Notification Component
 * 
 * Displays toast notifications with auto-dismiss and animations.
 * Uses brand colors and Framer Motion for smooth animations.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { notificationVariants } from '@/utils/animations';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle }> = {
  success: {
    bg: 'bg-sage-green/10 dark:bg-dark-accent-green/10',
    border: 'border-sage-green dark:border-dark-accent-green',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-soft-rose/10 dark:bg-dark-accent-rose/10',
    border: 'border-soft-rose dark:border-dark-accent-rose',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-golden-amber/10 dark:bg-dark-accent-amber/10',
    border: 'border-golden-amber dark:border-dark-accent-amber',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-deep-amethyst/10 dark:bg-dark-accent-amethyst/10',
    border: 'border-deep-amethyst dark:border-dark-accent-amethyst',
    icon: Info,
  },
};

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ id, type, message, duration = 5000, onClose, action }, ref) => {
    const style = toastStyles[type];
    const Icon = style.icon;

    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose(id);
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [id, duration, onClose]);

    return (
      <motion.div
        ref={ref}
        variants={notificationVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`
          flex items-start gap-3 p-4 rounded-lg border-l-4
          ${style.bg} ${style.border}
          shadow-lg backdrop-blur-sm
          min-w-[320px] max-w-[480px]
        `}
      >
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.border.replace('border-', 'text-')}`} />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-dark dark:text-dark-text-primary break-words">
            {message}
          </p>
          
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-deep-amethyst dark:text-dark-accent-amethyst hover:underline"
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-text-medium dark:text-dark-text-secondary hover:text-text-dark dark:hover:text-dark-text-primary transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }
);

Toast.displayName = 'Toast';

/**
 * Toast Container Component
 * 
 * Manages multiple toast notifications
 */

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}
