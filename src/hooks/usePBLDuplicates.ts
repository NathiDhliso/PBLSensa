/**
 * Hook for managing PBL concept deduplication
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pblService } from '@/services/pblService';

export function usePBLDuplicates(documentId: string) {
  return useQuery({
    queryKey: ['pbl-duplicates', documentId],
    queryFn: () => pblService.getDuplicates(documentId),
    enabled: !!documentId,
  });
}

export function useMergeConcepts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      primaryId,
      duplicateId,
    }: {
      primaryId: string;
      duplicateId: string;
    }) => pblService.mergeConcepts(primaryId, duplicateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pbl-duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['pbl-concepts'] });
      queryClient.invalidateQueries({ queryKey: ['pbl-visualization'] });
    },
  });
}
