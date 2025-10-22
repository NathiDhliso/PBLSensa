/**
 * Concept Map Hook
 * 
 * React Query hook for fetching concept map for a course or document
 */

import { useApi } from './useApi';
import { apiClient } from '@/services/api';
import { ConceptMap } from '@/types';

export function useConceptMap(type: 'course' | 'document' | 'chapter', id: string) {
  const endpoint = type === 'course' 
    ? `/concept-map/course/${id}`
    : type === 'document'
    ? `/concept-map/document/${id}`
    : `/concept-map/chapter/${id}`;

  return useApi<ConceptMap>(
    ['conceptMaps', type, id],
    async () => {
      const response = await apiClient.get<ConceptMap>(endpoint);
      return response.data;
    },
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutes - concept maps change less frequently
    }
  );
}
