/**
 * Error Handler Utility
 * 
 * Categorizes and formats errors for user-friendly display
 */

export interface FormattedError {
  message: string;
  type: 'network' | 'auth' | 'forbidden' | 'notFound' | 'rateLimit' | 'server' | 'validation' | 'unknown';
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
}

/**
 * Format error for display
 */
export function formatError(error: any): FormattedError {
  // Network errors
  if (!error.statusCode || error.statusCode === 0) {
    return {
      message: 'Unable to connect. Please check your internet connection.',
      type: 'network',
      retryable: true,
    };
  }

  const statusCode = error.statusCode;

  // Authentication errors (401)
  if (statusCode === 401) {
    return {
      message: 'Your session has expired. Please sign in again.',
      type: 'auth',
      statusCode,
      retryable: false,
    };
  }

  // Authorization errors (403)
  if (statusCode === 403) {
    return {
      message: "You don't have permission to access this resource.",
      type: 'forbidden',
      statusCode,
      retryable: false,
    };
  }

  // Not found errors (404)
  if (statusCode === 404) {
    return {
      message: 'The requested resource was not found.',
      type: 'notFound',
      statusCode,
      retryable: false,
    };
  }

  // Rate limit errors (429)
  if (statusCode === 429) {
    const retryAfter = error.details?.retry_after || 60;
    return {
      message: `Too many requests. Please wait ${retryAfter} seconds.`,
      type: 'rateLimit',
      statusCode,
      retryable: true,
      retryAfter,
    };
  }

  // Server errors (500-504)
  if (statusCode >= 500 && statusCode < 600) {
    return {
      message: 'Something went wrong on our end. Please try again.',
      type: 'server',
      statusCode,
      retryable: true,
    };
  }

  // Validation errors (400)
  if (statusCode === 400) {
    return {
      message: error.message || 'Invalid request. Please check your input.',
      type: 'validation',
      statusCode,
      retryable: false,
    };
  }

  // Unknown errors
  return {
    message: error.message || 'An unexpected error occurred.',
    type: 'unknown',
    statusCode,
    retryable: false,
  };
}

/**
 * Get toast type from error type
 */
export function getToastType(errorType: FormattedError['type']): 'error' | 'warning' {
  if (errorType === 'rateLimit' || errorType === 'validation') {
    return 'warning';
  }
  return 'error';
}

/**
 * Check if error should show retry button
 */
export function shouldShowRetry(error: FormattedError): boolean {
  return error.retryable && error.type !== 'rateLimit';
}

/**
 * Get countdown message for rate limit
 */
export function getRateLimitMessage(retryAfter: number): string {
  if (retryAfter < 60) {
    return `Please wait ${retryAfter} seconds before trying again.`;
  }
  const minutes = Math.ceil(retryAfter / 60);
  return `Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
}
