/**
 * Hook for managing PBL concepts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pblService } from '@/services/pblService';
import type { Concept, ConceptValidation, ConceptUpdate } from '@/types/pbl';

export function usePBLConcepts(
  documentId: string,
  validated?: boolean,
  structureType?: string
) {
  return useQuery({
    queryKey: ['pbl-concepts', documentId, validated, structureType],
    queryFn: () => pblService.getConcepts(documentId, validated, structureType),
    enabled: !!documentId,
  });
}

export function usePBLConcept(conceptId: string) {
  return useQuery({
    queryKey: ['pbl-concept', conceptId],
    queryFn: () => pblService.getConcept(conceptId),
    enabled: !!conceptId,
  });
}

export function useValidateConcepts(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (validation: ConceptValidation) =>
      pblService.validateConcepts(documentId, validation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pbl-concepts', documentId] });
    },
  });
}

export function useUpdateConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conceptId, updates }: { conceptId: string; updates: ConceptUpdate }) =>
      pblService.updateConcept(conceptId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pbl-concept', variables.conceptId] });
      queryClient.invalidateQueries({ queryKey: ['pbl-concepts'] });
    },
  });
}

export function useDeleteConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conceptId: string) => pblService.deleteConcept(conceptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pbl-concepts'] });
    },
  });
}
