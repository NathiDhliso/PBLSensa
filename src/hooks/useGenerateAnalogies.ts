/**
 * useGenerateAnalogies Hook
 * 
 * React Query mutation hook for generating analogies
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analogyService } from '@/services/analogyService';
import { AnalogyGenerationResponse } from '@/types/analogy';

interface GenerateAnalogiesParams {
  chapterId: string;
  userId: string;
  forceRegenerate?: boolean;
}

export function useGenerateAnalogies() {
  const queryClient = useQueryClient();

  return useMutation<AnalogyGenerationResponse, Error, GenerateAnalogiesParams>({
    mutationFn: ({ chapterId, userId, forceRegenerate = false }) =>
      analogyService.generateAnalogies(chapterId, userId, forceRegenerate),
    onSuccess: (data, variables) => {
      // Invalidate and refetch analogies query
      queryClient.invalidateQueries({
        queryKey: ['analogies', variables.chapterId, variables.userId],
      });
      
      // Set the data in cache
      queryClient.setQueryData(
        ['analogies', variables.chapterId, variables.userId],
        data
      );
    },
  });
}
