/**
 * Chapter Summary Hook
 * 
 * React Query hook for fetching chapter summary
 */

import { useApi } from './useApi';
import { sensaService } from '@/services/sensaService';
import { queryKeys } from '@/config/queryClient';
import { ChapterSummary } from '@/types';

export function useChapterSummary(chapterId: string) {
  return useApi<ChapterSummary>(
    queryKeys.chapters.summary(chapterId),
    () => sensaService.getChapterSummary(chapterId),
    {
      enabled: !!chapterId,
      staleTime: 15 * 60 * 1000, // 15 minutes - summaries don't change often
    }
  );
}
