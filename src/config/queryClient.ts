/**
 * React Query Configuration
 * 
 * Configures the QueryClient with optimal defaults for:
 * - Caching strategy
 * - Retry logic
 * - Refetch behavior
 * - Error handling
 * 
 * @example
 * import { queryClient } from '@/config/queryClient';
 * // Use in QueryClientProvider
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Time before data is considered stale (5 minutes)
       * Stale data will be refetched in the background
       */
      staleTime: 5 * 60 * 1000,

      /**
       * Time before inactive queries are garbage collected (30 minutes)
       * Cached data remains available during this time
       */
      gcTime: 30 * 60 * 1000,

      /**
       * Refetch queries when window regains focus
       * Ensures data is fresh when user returns to the app
       */
      refetchOnWindowFocus: true,

      /**
       * Refetch queries when network reconnects
       * Ensures data is updated after connection loss
       */
      refetchOnReconnect: true,

      /**
       * Don't refetch on component mount if data is fresh
       * Reduces unnecessary API calls
       */
      refetchOnMount: false,

      /**
       * Retry failed queries 3 times
       * Matches the retry logic in our Axios client
       */
      retry: 3,

      /**
       * Retry delay with exponential backoff
       * Matches the retry strategy in our Axios client
       */
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      /**
       * Don't retry on specific error codes
       * 400, 401, 403, 404 are not transient errors
       */
      retryOnMount: true,
    },
    mutations: {
      /**
       * Retry mutations once
       * Mutations are more sensitive, so we retry less
       */
      retry: 1,

      /**
       * Retry delay for mutations (2 seconds)
       */
      retryDelay: 2000,
    },
  },
});

/**
 * Query keys factory
 * Provides consistent query key structure across the app
 * 
 * @example
 * const coursesQuery = useQuery({
 *   queryKey: queryKeys.courses.all,
 *   queryFn: () => pblService.getCourses()
 * });
 */
export const queryKeys = {
  // Auth keys
  auth: {
    user: ['auth', 'user'] as const,
  },

  // PBL keys
  courses: {
    all: ['courses'] as const,
    detail: (id: string) => ['courses', id] as const,
    documents: (id: string) => ['courses', id, 'documents'] as const,
  },
  conceptMaps: {
    detail: (courseId: string) => ['conceptMaps', courseId] as const,
  },
  processingStatus: {
    detail: (taskId: string) => ['processingStatus', taskId] as const,
  },

  // Sensa Learn keys
  chapters: {
    summary: (chapterId: string) => ['chapters', chapterId, 'summary'] as const,
    analogies: (chapterId: string) => ['chapters', chapterId, 'analogies'] as const,
  },
  profile: {
    current: ['profile'] as const,
  },
  progress: {
    course: (courseId: string) => ['progress', courseId] as const,
  },
  recommendations: {
    course: (courseId: string) => ['recommendations', courseId] as const,
  },
} as const;

/**
 * Invalidate all queries
 * Useful for global refresh or after sign out
 * 
 * @example
 * await invalidateAllQueries();
 */
export async function invalidateAllQueries(): Promise<void> {
  await queryClient.invalidateQueries();
}

/**
 * Clear all query cache
 * Useful after sign out to remove sensitive data
 * 
 * @example
 * clearQueryCache();
 */
export function clearQueryCache(): void {
  queryClient.clear();
}

/**
 * Prefetch a query
 * Useful for optimistic data loading
 * 
 * @example
 * await prefetchQuery(
 *   queryKeys.courses.all,
 *   () => pblService.getCourses()
 * );
 */
export async function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}
