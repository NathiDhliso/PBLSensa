/**
 * useFeedback Hook
 * 
 * Hook for managing user feedback submissions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { feedbackService } from '@/services/feedbackService';
import type { FeedbackSubmission } from '@/types/feedback';

// Mock user ID - in production, get from auth context
const MOCK_USER_ID = 'user-1';

/**
 * Hook for submitting feedback
 */
export function useSubmitFeedback(conceptId: string, conceptName: string) {
  const queryClient = useQueryClient();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const mutation = useMutation({
    mutationFn: (submission: Omit<FeedbackSubmission, 'userId' | 'conceptId' | 'conceptName'>) =>
      feedbackService.submitFeedback({
        ...submission,
        userId: MOCK_USER_ID,
        conceptId,
        conceptName,
      }),
    
    onSuccess: (response) => {
      // Invalidate feedback status
      queryClient.invalidateQueries({ queryKey: ['feedbackStatus', conceptId] });
      
      // Invalidate badge progress if updated
      if (response.badgeProgress) {
        queryClient.invalidateQueries({ queryKey: ['badges', MOCK_USER_ID] });
      }
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    },
    
    onError: (error) => {
      console.error('Failed to submit feedback:', error);
    },
  });

  return {
    submitFeedback: mutation.mutate,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    showSuccessMessage,
  };
}

/**
 * Hook for getting feedback status
 */
export function useFeedbackStatus(conceptId: string) {
  const {
    data: status,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['feedbackStatus', conceptId, MOCK_USER_ID],
    queryFn: () => feedbackService.getFeedbackStatus(conceptId, MOCK_USER_ID),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!conceptId,
  });

  return {
    hasFeedback: status?.hasFeedback || false,
    feedbackCount: status?.feedbackCount || 0,
    feedbackTypes: status?.feedbackTypes || [],
    isLoading,
    error,
  };
}

/**
 * Hook for managing feedback modals
 */
export function useFeedbackModals() {
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [relatedModalOpen, setRelatedModalOpen] = useState(false);

  return {
    flagModalOpen,
    editModalOpen,
    relatedModalOpen,
    openFlagModal: () => setFlagModalOpen(true),
    closeFlagModal: () => setFlagModalOpen(false),
    openEditModal: () => setEditModalOpen(true),
    closeEditModal: () => setEditModalOpen(false),
    openRelatedModal: () => setRelatedModalOpen(true),
    closeRelatedModal: () => setRelatedModalOpen(false),
  };
}

/**
 * Hook for getting user's feedback history
 */
export function useUserFeedback() {
  const {
    data: feedback,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userFeedback', MOCK_USER_ID],
    queryFn: () => feedbackService.getUserFeedback(MOCK_USER_ID),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    feedback: feedback || [],
    feedbackCount: feedback?.length || 0,
    isLoading,
    error,
  };
}
