/**
 * Test Helpers
 * 
 * Utilities for testing API integration
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a fresh query client for testing
 * Disables retries and caching for predictable tests
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wait for a condition to be true
 * Useful for waiting for async updates in tests
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Mock successful API response
 */
export function mockSuccess<T>(data: T): Promise<T> {
  return Promise.resolve(data);
}

/**
 * Mock API error
 */
export function mockError(message: string, statusCode: number = 500): Promise<never> {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  return Promise.reject(error);
}

/**
 * Mock delayed response
 */
export function mockDelayed<T>(data: T, delay: number = 100): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}
