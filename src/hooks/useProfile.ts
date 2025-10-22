/**
 * useProfile Hook
 * 
 * Fetches and caches user profile data using React Query with mock fallback
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { UserProfile } from '@/types/profile';
import { getMockProfile } from '@/services/mockData';

/**
 * Fetch user profile from API with mock fallback
 */
async function fetchProfile(): Promise<UserProfile> {
  try {
    const response = await apiClient.get<UserProfile>('/profile');
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
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1, // Reduced retries since we have mock fallback
  });
}
