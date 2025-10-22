/**
 * useChapterAnalogies Hook
 * 
 * React Query hook for fetching chapter analogies
 */

import { useQuery } from '@tanstack/react-query';
import { analogyService } from '@/services/analogyService';
import { AnalogyGenerationResponse } from '@/types/analogy';

export function useChapterAnalogies(
  chapterId: string,
  userId: string,
  enabled: boolean = true
) {
  return useQuery<AnalogyGenerationResponse, Error>({
    queryKey: ['analogies', chapterId, userId],
    queryFn: () => analogyService.getAnalogies(chapterId, userId),
    enabled: enabled && !!chapterId && !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
}
