/**
 * useProfile Hook
 * 
 * Fetches and caches user profile data using React Query with mock fallback
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { UserProfile } from '@/types/profile';
import { getMockProfile } from '@/services/mockData';
import { CACHE_TIMES, QUERY_KEYS } from '@/config/cacheConfig';

/**
 * Fetch user profile from API with mock fallback
 */
async function fetchProfile(): Promise<UserProfile> {
  try {
    // TODO: Get actual user_id from auth context
    const userId = 'user-123'; // Temporary hardcoded user ID
    const response = await apiClient.get<UserProfile>('/profile', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.log('[useProfile] API failed, using mock data');
    return await getMockProfile();
  }
}

/**
 * Hook to fetch user profile data
 * 
 * @example
 * const { data: profile, isLoading, error, refetch } = useProfile();
 */
export function useProfile() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: fetchProfile,
    staleTime: CACHE_TIMES.PROFILE,
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1, // Reduced retries since we have mock fallback
  });
}
