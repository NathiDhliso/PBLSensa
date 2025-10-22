/**
 * API Client Configuration
 * 
 * This module provides a centralized Axios instance with:
 * - Automatic JWT token attachment
 * - Intelligent retry logic with exponential backoff
 * - Comprehensive error handling
 * - Request/response logging in development
 * 
 * @example
 * import { apiClient } from '@/services/api';
 * const response = await apiClient.get('/courses');
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env, isDevelopment } from '@/config/env';
import { ErrorResponse } from '@/types';

/**
 * Maximum number of retry attempts for failed requests
 */
const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (in milliseconds)
 */
const RETRY_DELAY = 1000;

/**
 * HTTP status codes that should trigger a retry
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Create the Axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get the current authentication token
 * This will be implemented by the auth service
 */
let getAuthToken: (() => string | null) | null = null;

/**
 * Set the function to retrieve the current auth token
 * Called by the auth service during initialization
 */
export function setAuthTokenGetter(getter: () => string | null): void {
  getAuthToken = getter;
}

/**
 * Refresh the authentication token
 * This will be implemented by the auth service
 */
let refreshAuthToken: (() => Promise<string>) | null = null;

/**
 * Set the function to refresh the auth token
 * Called by the auth service during initialization
 */
export function setAuthTokenRefresher(refresher: () => Promise<string>): void {
  refreshAuthToken = refresher;
}

/**
 * Request interceptor to attach JWT token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get current token
    const token = getAuthToken?.();

    // Attach token to Authorization header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development mode
    if (isDevelopment && env.enableApiLogging) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    if (isDevelopment && env.enableApiLogging) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling and retries
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response in development mode
    if (isDevelopment && env.enableApiLogging) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: number; _retryCount?: number };

    // Log error in development mode
    if (isDevelopment && env.enableApiLogging) {
      console.error('[API Response Error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && refreshAuthToken && !originalRequest._retry) {
      originalRequest._retry = 1;

      try {
        // Attempt to refresh the token
        const newToken = await refreshAuthToken();

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Token refresh failed - user needs to re-authenticate
        // This will be handled by the auth service (redirect to login)
        return Promise.reject(refreshError);
      }
    }

    // Handle retryable errors with exponential backoff
    if (shouldRetry(error, originalRequest)) {
      const retryCount = originalRequest._retryCount || 0;
      originalRequest._retryCount = retryCount + 1;

      // Calculate delay with exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, retryCount);

      if (isDevelopment && env.enableApiLogging) {
        console.log(`[API Retry] Attempt ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry the request
      return apiClient(originalRequest);
    }

    // Format error for consistent handling
    const formattedError = formatError(error);
    return Promise.reject(formattedError);
  }
);

/**
 * Determine if a request should be retried
 */
function shouldRetry(error: AxiosError, config?: AxiosRequestConfig & { _retryCount?: number }): boolean {
  // Don't retry if max retries reached
  const retryCount = config?._retryCount || 0;
  if (retryCount >= MAX_RETRIES) {
    return false;
  }

  // Don't retry if no config (shouldn't happen, but safety check)
  if (!config) {
    return false;
  }

  // Retry on network errors
  if (!error.response) {
    return true;
  }

  // Retry on specific status codes
  if (RETRYABLE_STATUS_CODES.includes(error.response.status)) {
    return true;
  }

  return false;
}

/**
 * Format error for consistent error handling
 */
function formatError(error: AxiosError<ErrorResponse>): Error & { statusCode?: number; details?: any } {
  const formattedError = new Error() as Error & { statusCode?: number; details?: any };

  if (error.response) {
    // Server responded with error status
    const data = error.response.data;

    formattedError.message = data?.message || getDefaultErrorMessage(error.response.status);
    formattedError.statusCode = error.response.status;
    formattedError.details = data?.details;
  } else if (error.request) {
    // Request made but no response received
    formattedError.message = 'Unable to connect to the server. Please check your internet connection.';
    formattedError.statusCode = 0;
  } else {
    // Error setting up the request
    formattedError.message = error.message || 'An unexpected error occurred.';
  }

  return formattedError;
}

/**
 * Get default error message based on status code
 */
function getDefaultErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to access this resource.";
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Something went wrong on our end. Please try again.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Export the configured Axios instance
 */
export { apiClient };

/**
 * Export types for external use
 */
export type { AxiosError, AxiosResponse, AxiosRequestConfig };
