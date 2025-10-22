/**
 * useAnalogyFeedback Hook
 * 
 * React Query mutation hook for submitting analogy feedback
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analogyService } from '@/services/analogyService';
import { FeedbackRequest, FeedbackResponse } from '@/types/analogy';

interface SubmitFeedbackParams {
  analogyId: string;
  feedback: FeedbackRequest;
}

export function useAnalogyFeedback() {
  const queryClient = useQueryClient();

  return useMutation<FeedbackResponse, Error, SubmitFeedbackParams>({
    mutationFn: ({ analogyId, feedback }) =>
      analogyService.submitFeedback(analogyId, feedback),
    onSuccess: () => {
      // Invalidate feedback queries to refresh ratings
      queryClient.invalidateQueries({
        queryKey: ['analogy-feedback'],
      });
    },
  });
}
