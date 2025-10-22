/**
 * Toast Context
 * 
 * Provides global toast notification management
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, ToastProps, ToastType } from '@/components/Toast';

interface ToastContextValue {
  showToast: (type: ToastType, message: string, options?: ToastOptions) => void;
  showSuccess: (message: string, options?: ToastOptions) => void;
  showError: (message: string, options?: ToastOptions) => void;
  showWarning: (message: string, options?: ToastOptions) => void;
  showInfo: (message: string, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, options: ToastOptions = {}) => {
      const id = `toast-${toastId++}`;
      const newToast: ToastProps = {
        id,
        type,
        message,
        duration: options.duration,
        action: options.action,
        onClose: dismissToast,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast('success', message, options);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast('error', message, options);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast('warning', message, options);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast('info', message, options);
    },
    [showToast]
  );

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}
