/**
 * Course Hook
 * 
 * React Query hook for fetching a single course with mock fallback
 */

import { useApi } from './useApi';
import { pblService } from '@/services/pblService';
import { queryKeys } from '@/config/queryClient';
import { Course } from '@/types';
import { getMockCourse } from '@/services/mockData';

export function useCourse(courseId: string) {
  return useApi<Course>(
    queryKeys.courses.detail(courseId),
    async () => {
      try {
        return await pblService.getCourse(courseId);
      } catch (error) {
        console.log('[useCourse] API failed, using mock data');
        const mockCourse = await getMockCourse(courseId);
        if (!mockCourse) throw new Error('Course not found');
        return mockCourse;
      }
    },
    {
      enabled: !!courseId,
    }
  );
}
