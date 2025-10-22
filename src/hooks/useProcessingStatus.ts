/**
 * Processing Status Hook
 * 
 * React Query hook for polling document processing status
 */

import { useApiPolling } from './useApi';
import { pblService } from '@/services/pblService';
import { queryKeys } from '@/config/queryClient';
import { ProcessingStatus } from '@/types';

interface UseProcessingStatusOptions {
  /** Polling interval in milliseconds (default: 2000) */
  pollingInterval?: number;
  /** Whether to enable polling (default: true) */
  enabled?: boolean;
}

export function useProcessingStatus(
  taskId: string,
  options: UseProcessingStatusOptions = {}
) {
  const { pollingInterval = 2000, enabled = true } = options;

  return useApiPolling<ProcessingStatus>(
    queryKeys.processingStatus.detail(taskId),
    () => pblService.getProcessingStatus(taskId),
    pollingInterval,
    {
      enabled: !!taskId && enabled,
    }
  );
}
