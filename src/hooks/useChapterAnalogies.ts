/**
 * Chapter Analogies Hook
 * 
 * React Query hook for fetching personalized analogies
 */

import { useApi } from './useApi';
import { sensaService } from '@/services/sensaService';
import { queryKeys } from '@/config/queryClient';
import { AnalogyResponse } from '@/types';

export function useChapterAnalogies(chapterId: string) {
  return useApi<AnalogyResponse[]>(
    queryKeys.chapters.analogies(chapterId),
    () => sensaService.getChapterAnalogies(chapterId),
    {
      enabled: !!chapterId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}
