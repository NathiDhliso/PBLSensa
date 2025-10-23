/**
 * useUpdateProfile Hook
 * 
 * Mutation hook for updating user profile data via live API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { UpdateProfileRequest, UserProfile } from '@/types/profile';

/**
 * Update user profile via API
 */
async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  // TODO: Get actual user_id from auth context
  const userId = 'user-123'; // Temporary hardcoded user ID
  const response = await apiClient.put<UserProfile>('/profile', data, {
    params: { user_id: userId }
  });
  return response.data;
}

/**
 * Hook to update user profile
 * 
 * @example
 * const { mutate, isPending, error } = useUpdateProfile();
 * mutate({ name: 'John Doe', ageRange: '25-34' });
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      // Update the profile cache with new data
      queryClient.setQueryData(['profile'], profile);
      
      // Invalidate to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
