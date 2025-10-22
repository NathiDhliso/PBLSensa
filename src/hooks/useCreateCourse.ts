/**
 * Create Course Hook
 * 
 * React Query mutation hook for creating courses with mock fallback
 */

import { useApiMutation, invalidateOnSuccess } from './useApi';
import { pblService } from '@/services/pblService';
import { queryKeys } from '@/config/queryClient';
import { Course } from '@/types';
import { createMockCourse } from '@/services/mockData';

interface CreateCourseVariables {
  name: string;
  description: string;
}

export function useCreateCourse() {
  return useApiMutation<Course, CreateCourseVariables>(
    async ({ name, description }) => {
      try {
        return await pblService.createCourse(name, description);
      } catch (error) {
        console.log('[useCreateCourse] API failed, using mock data');
        return await createMockCourse(name, description);
      }
    },
    {
      onSuccess: invalidateOnSuccess(queryKeys.courses.all),
    }
  );
}
