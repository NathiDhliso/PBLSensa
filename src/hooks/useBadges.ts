/**
 * useBadges Hook
 * 
 * Hook for fetching and managing user badges
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { badgeService } from '@/services/badgeService';
import type { BadgeUnlockEvent } from '@/types/badges';

export function useBadges(userId: string) {
  const queryClient = useQueryClient();
  const [unlockEvent, setUnlockEvent] = useState<BadgeUnlockEvent | null>(null);

  // Fetch user badges
  const {
    data: badges,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['badges', userId],
    queryFn: () => badgeService.getUserBadges(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Unlock badge mutation
  const unlockBadge = useMutation({
    mutationFn: (badgeId: string) => badgeService.unlockBadge(userId, badgeId),
    onSuccess: (_, badgeId) => {
      // Invalidate badges query to refetch
      queryClient.invalidateQueries({ queryKey: ['badges', userId] });
      
      // Find the badge definition
      const badge = badges?.earned.find(b => b.id === badgeId) || 
                    badges?.locked.find(b => b.id === badgeId);
      
      if (badge) {
        // Trigger unlock animation
        setUnlockEvent({
          badge,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });

  // Clear unlock event after animation
  const clearUnlockEvent = () => {
    setUnlockEvent(null);
  };

  return {
    badges,
    isLoading,
    error,
    refetch,
    unlockBadge: unlockBadge.mutate,
    isUnlocking: unlockBadge.isPending,
    unlockEvent,
    clearUnlockEvent,
  };
}
