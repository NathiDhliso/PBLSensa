/**
 * useDeleteCourse Hook
 * 
 * Mutation hook for deleting a course
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pblService } from '@/services/pblService';

/**
 * Hook to delete a course
 * 
 * @example
 * const { mutate: deleteCourse } = useDeleteCourse();
 * deleteCourse(courseId);
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => pblService.deleteCourse(courseId),
    onSuccess: () => {
      // Invalidate courses list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
