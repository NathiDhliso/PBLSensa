/**
 * Course Hook
 * 
 * React Query hook for fetching a single course from live API
 */

import { useApi } from './useApi';
import { pblService } from '@/services/pblService';
import { queryKeys } from '@/config/queryClient';
import { Course } from '@/types';

export function useCourse(courseId: string) {
  return useApi<Course>(
    queryKeys.courses.detail(courseId),
    async () => {
      return await pblService.getCourse(courseId);
    },
    {
      enabled: !!courseId,
    }
  );
}
