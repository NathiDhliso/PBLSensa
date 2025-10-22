/**
 * Error Boundary Component
 * 
 * Catches React errors in component tree and displays fallback UI
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console (and future error tracking service)
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle-background dark:bg-gradient-subtle-background p-4">
          <div className="max-w-md w-full bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-soft-rose/10 dark:bg-dark-accent-rose/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-soft-rose dark:text-dark-accent-rose" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary mb-2">
              Something went wrong
            </h2>

            <p className="text-text-medium dark:text-dark-text-secondary mb-6">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>

            <button
              onClick={this.resetError}
              className="
                inline-flex items-center gap-2 px-6 py-3 rounded-lg
                bg-gradient-memory-learning text-white font-medium
                hover:opacity-90 transition-opacity
              "
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <p className="mt-6 text-sm text-text-light dark:text-dark-text-tertiary">
              If the problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
