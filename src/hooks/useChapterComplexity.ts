/**
 * useChapterComplexity Hook
 * 
 * React Query hook for fetching chapter complexity
 */

import { useQuery } from '@tanstack/react-query';
import { analogyService } from '@/services/analogyService';
import { ComplexityInfo } from '@/types/analogy';

export function useChapterComplexity(chapterId: string, enabled: boolean = true) {
  return useQuery<ComplexityInfo, Error>({
    queryKey: ['complexity', chapterId],
    queryFn: () => analogyService.getComplexity(chapterId),
    enabled: enabled && !!chapterId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
