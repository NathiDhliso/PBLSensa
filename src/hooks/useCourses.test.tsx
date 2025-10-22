import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCourses } from './useCourses';
import { ReactNode } from 'react';

describe('useCourses integration test', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should return query result with correct structure', () => {
    const { result } = renderHook(() => useCourses(), { wrapper });

    // Should have React Query properties
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refetch');
    expect(result.current).toHaveProperty('isFetching');
  });

  it('should have refetch function', () => {
    const { result } = renderHook(() => useCourses(), { wrapper });

    expect(typeof result.current.refetch).toBe('function');
  });
});
