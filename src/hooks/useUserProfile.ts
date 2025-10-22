/**
 * User Profile Hook
 * 
 * React Query hook for fetching user profile
 */

import { useApi } from './useApi';
import { sensaService } from '@/services/sensaService';
import { queryKeys } from '@/config/queryClient';
import { UserProfile } from '@/types';

export function useUserProfile() {
  return useApi<UserProfile>(
    queryKeys.profile.current,
    () => sensaService.getUserProfile(),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes - profile changes infrequently
    }
  );
}
