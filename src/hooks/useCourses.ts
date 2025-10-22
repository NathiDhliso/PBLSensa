/**
 * Courses Hook
 * 
 * React Query hook for fetching all courses with mock fallback
 */

import { useApi } from './useApi';
import { pblService } from '@/services/pblService';
import { queryKeys } from '@/config/queryClient';
import { Course } from '@/types';
import { getMockCourses } from '@/services/mockData';

export function useCourses() {
  return useApi<Course[]>(
    queryKeys.courses.all,
    async () => {
      try {
        return await pblService.getCourses();
      } catch (error) {
        // Fallback to mock data if API fails
        console.log('[useCourses] API failed, using mock data');
        return await getMockCourses();
      }
    }
  );
}
