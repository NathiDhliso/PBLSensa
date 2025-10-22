import { useApi } from './useApi';
import { apiClient } from '../services/api';
import { Document } from '../types/api';

export function useCourseDocuments(courseId: string) {
  return useApi<Document[]>(
    ['courses', courseId, 'documents'],
    async () => {
      const response = await apiClient.get<Document[]>(`/courses/${courseId}/documents`);
      return response.data;
    }
  );
}
