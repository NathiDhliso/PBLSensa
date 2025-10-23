/**
 * Courses Hook
 * 
 * React Query hook for fetching all courses from live API
 */

import { useApi } from './useApi';
import { pblService } from '@/services/pblService';
import { queryKeys } from '@/config/queryClient';
import { Course } from '@/types';

export function useCourses() {
  return useApi<Course[]>(
    queryKeys.courses.all,
    async () => {
      return await pblService.getCourses();
    }
  );
}
