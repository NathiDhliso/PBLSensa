/**
 * useUpdateProfile Hook
 * 
 * Mutation hook for updating user profile data with mock fallback
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { UpdateProfileRequest, UpdateProfileResponse, UserProfile } from '@/types/profile';
import { updateMockProfile } from '@/services/mockData';

/**
 * Update user profile via API with mock fallback
 */
async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  try {
    const response = await apiClient.put<UpdateProfileResponse>('/profile', data);
    return response.data;
  } catch (error) {
    console.log('[useUpdateProfile] API failed, using mock data');
    const updatedProfile = await updateMockProfile(data as Partial<UserProfile>);
    return { 
      profile: updatedProfile,
      message: 'Profile updated successfully (mock data)',
    };
  }
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
    onSuccess: (data) => {
      // Update the profile cache with new data
      queryClient.setQueryData(['profile'], data.profile);
      
      // Invalidate to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
