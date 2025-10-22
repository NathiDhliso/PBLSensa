/**
 * Analogy Feedback Hook
 * 
 * React Query mutation hook for submitting analogy feedback
 */

import { useApiMutation } from './useApi';
import { sensaService } from '@/services/sensaService';
import { AnalogyFeedback } from '@/types';

export function useAnalogyFeedback() {
  return useApiMutation<void, AnalogyFeedback>(
    (feedback) => sensaService.submitAnalogyFeedback(feedback)
  );
}
