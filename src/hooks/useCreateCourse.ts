/**
 * Create Course Hook
 * 
 * React Query mutation hook for creating courses via live API
 */

import { useApiMutation, invalidateOnSuccess } from './useApi';
import { pblService } from '@/services/pblService';
import { queryKeys } from '@/config/queryClient';
import { Course } from '@/types';

interface CreateCourseVariables {
  name: string;
  description: string;
}

export function useCreateCourse() {
  return useApiMutation<Course, CreateCourseVariables>(
    async ({ name, description }) => {
      return await pblService.createCourse(name, description);
    },
    {
      onSuccess: invalidateOnSuccess(queryKeys.courses.all),
    }
  );
}
