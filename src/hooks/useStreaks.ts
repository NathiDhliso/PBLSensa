/**
 * useStreaks Hook
 * 
 * Hook for fetching and managing learning streaks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streakService } from '@/services/streakService';
import type { RecordActivityRequest } from '@/types/streak';

export function useStreaks(userId: string) {
  const queryClient = useQueryClient();

  // Fetch streak data
  const {
    data: streak,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['streak', userId],
    queryFn: () => streakService.getStreak(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour to check at-risk status
    refetchOnWindowFocus: true,
  });

  // Record activity mutation
  const recordActivity = useMutation({
    mutationFn: (data: RecordActivityRequest) =>
      streakService.recordActivity(userId, data),
    onSuccess: (newStreak) => {
      // Update streak data in cache
      queryClient.setQueryData(['streak', userId], newStreak);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['badges', userId] });
    },
  });

  return {
    streak,
    isLoading,
    error,
    refetch,
    recordActivity: recordActivity.mutate,
    isRecording: recordActivity.isPending,
  };
}
