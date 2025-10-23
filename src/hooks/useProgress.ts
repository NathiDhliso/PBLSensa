import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressService } from '../services/progressService';
import { ProgressData, UpdateProgressRequest } from '../types/progress';

// Mock user ID - in production, get from auth context
const MOCK_USER_ID = 'user-1';

/**
 * Hook for fetching and managing user progress data
 */
export function useProgress() {
  const {
    data: progressData,
    isLoading,
    error,
    refetch
  } = useQuery<ProgressData>({
    queryKey: ['progress', MOCK_USER_ID],
    queryFn: () => progressService.getProgress(MOCK_USER_ID),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  return {
    progressData,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook for updating progress with optimistic updates
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: UpdateProgressRequest) => 
      progressService.updateProgress(MOCK_USER_ID, request),
    
    // Optimistic update
    onMutate: async (request) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['progress', MOCK_USER_ID] });

      // Snapshot previous value
      const previousProgress = queryClient.getQueryData<ProgressData>(['progress', MOCK_USER_ID]);

      // Optimistically update
      if (previousProgress && request.chapterId) {
        queryClient.setQueryData<ProgressData>(['progress', MOCK_USER_ID], (old) => {
          if (!old) return old;

          const updatedChapters = old.chapters.map(chapter => {
            if (chapter.chapterId === request.chapterId) {
              if (request.activityType === 'chapter_complete') {
                return { ...chapter, completed: true, completedAt: new Date().toISOString() };
              } else if (request.activityType === 'analogy_viewed') {
                return { ...chapter, analogiesViewed: chapter.analogiesViewed + 1 };
              }
            }
            return chapter;
          });

          // Recalculate overall completion
          const completedChapters = updatedChapters.filter(c => c.completed).length;
          const overallCompletion = (completedChapters / updatedChapters.length) * 100;

          return {
            ...old,
            overallCompletion,
            chapters: updatedChapters
          };
        });
      }

      return { previousProgress };
    },

    // Rollback on error
    onError: (err, _request, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['progress', MOCK_USER_ID], context.previousProgress);
      }
      console.error('Failed to update progress:', err);
    },

    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', MOCK_USER_ID] });
    },
  });

  return {
    updateProgress: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error
  };
}

/**
 * Hook for fetching chapter-specific progress
 */
export function useChapterProgress(chapterId: string) {
  const { progressData, isLoading, error } = useProgress();

  const chapterProgress = progressData?.chapters.find(
    (chapter) => chapter.chapterId === chapterId
  );

  return {
    chapterProgress,
    isLoading,
    error
  };
}

/**
 * Hook for calculating progress statistics
 */
export function useProgressStats() {
  const { progressData, isLoading, error } = useProgress();

  const stats = {
    totalChapters: progressData?.chapters.length || 0,
    completedChapters: progressData?.chapters.filter(c => c.completed).length || 0,
    inProgressChapters: progressData?.chapters.filter(c => !c.completed && c.analogiesViewed > 0).length || 0,
    notStartedChapters: progressData?.chapters.filter(c => c.analogiesViewed === 0).length || 0,
    overallCompletion: progressData?.overallCompletion || 0,
    totalStudyTime: progressData?.stats.totalStudyTime || 0,
    conceptsLearned: progressData?.stats.conceptsLearned || 0,
    analogiesRated: progressData?.stats.analogiesRated || 0,
    feedbackProvided: progressData?.stats.feedbackProvided || 0,
  };

  return {
    stats,
    isLoading,
    error
  };
}
