/**
 * useChapterAnalogies Hook
 * 
 * React Query hook for fetching chapter analogies
 */

import { useQuery } from '@tanstack/react-query';
import { analogyService } from '@/services/analogyService';
import { AnalogyGenerationResponse } from '@/types/analogy';
import { CACHE_TIMES, QUERY_KEYS } from '@/config/cacheConfig';

export function useChapterAnalogies(
  chapterId: string,
  userId: string,
  enabled: boolean = true
) {
  return useQuery<AnalogyGenerationResponse, Error>({
    queryKey: [QUERY_KEYS.ANALOGIES, chapterId, userId],
    queryFn: () => analogyService.getAnalogies(chapterId, userId),
    enabled: enabled && !!chapterId && !!userId,
    staleTime: CACHE_TIMES.ANALOGIES,
    retry: 1,
  });
}
