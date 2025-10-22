/**
 * Generic API Hook
 * 
 * Provides a React Query wrapper for API calls with:
 * - Automatic loading and error states
 * - Request cancellation on unmount
 * - Type-safe data handling
 * - Caching and background refetching
 * 
 * @example
 * const { data, isLoading, error, refetch } = useApi(
 *   ['courses'],
 *   () => pblService.getCourses()
 * );
 */

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { queryClient } from '@/config/queryClient';

/**
 * Generic query hook
 * 
 * @param queryKey - Unique key for the query
 * @param queryFn - Function that returns a promise with data
 * @param options - Additional React Query options
 * @returns Query result with data, loading, and error states
 * 
 * @example
 * function CourseList() {
 *   const { data: courses, isLoading, error } = useApi(
 *     ['courses'],
 *     () => pblService.getCourses()
 *   );
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>{courses.map(c => c.name)}</div>;
 * }
 */
export function useApi<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<T, Error> {
  return useQuery<T, Error>({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Generic mutation hook
 * 
 * @param mutationFn - Function that performs the mutation
 * @param options - Additional React Query options
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * function CreateCourse() {
 *   const { mutate, isPending, error } = useApiMutation(
 *     (data: { name: string; description: string }) =>
 *       pblService.createCourse(data.name, data.description),
 *     {
 *       onSuccess: () => {
 *         queryClient.invalidateQueries({ queryKey: ['courses'] });
 *       }
 *     }
 *   );
 *   
 *   return (
 *     <button onClick={() => mutate({ name: 'New Course', description: 'Desc' })}>
 *       Create
 *     </button>
 *   );
 * }
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables, unknown>
): UseMutationResult<TData, Error, TVariables, unknown> {
  return useMutation({
    mutationFn,
    ...options,
  });
}

/**
 * Hook for polling data at regular intervals
 * 
 * @param queryKey - Unique key for the query
 * @param queryFn - Function that returns a promise with data
 * @param interval - Polling interval in milliseconds
 * @param options - Additional React Query options
 * @returns Query result with data, loading, and error states
 * 
 * @example
 * function ProcessingStatus({ taskId }: { taskId: string }) {
 *   const { data: status } = useApiPolling(
 *     ['processingStatus', taskId],
 *     () => pblService.getProcessingStatus(taskId),
 *     2000, // Poll every 2 seconds
 *     {
 *       enabled: !!taskId,
 *       // Stop polling when complete
 *       refetchInterval: (data) =>
 *         data?.status === 'completed' || data?.status === 'failed'
 *           ? false
 *           : 2000
 *     }
 *   );
 *   
 *   return <div>Status: {status?.status}</div>;
 * }
 */
export function useApiPolling<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  interval: number,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn' | 'refetchInterval'>
): UseQueryResult<T, Error> {
  return useQuery<T, Error>({
    queryKey,
    queryFn,
    refetchInterval: interval,
    ...options,
  });
}

/**
 * Invalidate queries after mutation
 * Helper function for common pattern of invalidating queries after successful mutation
 * 
 * @param queryKey - Query key to invalidate
 * @returns onSuccess callback for mutation options
 * 
 * @example
 * const { mutate } = useApiMutation(
 *   (data) => pblService.createCourse(data.name, data.description),
 *   {
 *     onSuccess: invalidateOnSuccess(['courses'])
 *   }
 * );
 */
export function invalidateOnSuccess(queryKey: readonly unknown[]) {
  return () => {
    queryClient.invalidateQueries({ queryKey });
  };
}

/**
 * Hook for infinite scroll / pagination
 * 
 * @param queryKey - Unique key for the query
 * @param queryFn - Function that returns paginated data
 * @param options - Additional React Query options
 * @returns Infinite query result
 * 
 * @example
 * function CourseList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage
 *   } = useApiInfinite(
 *     ['courses'],
 *     ({ pageParam = 1 }) => pblService.getCoursesPaginated(pageParam),
 *     {
 *       getNextPageParam: (lastPage) =>
 *         lastPage.has_next ? lastPage.page + 1 : undefined
 *     }
 *   );
 *   
 *   return (
 *     <>
 *       {data?.pages.map(page =>
 *         page.items.map(course => <div key={course.id}>{course.name}</div>)
 *       )}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *     </>
 *   );
 * }
 */
export { useInfiniteQuery as useApiInfinite } from '@tanstack/react-query';

/**
 * Export query client for manual cache manipulation
 */
export { queryClient };
