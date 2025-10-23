/**
 * useConflicts Hook
 * 
 * Hook for managing concept conflicts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { conflictService } from '@/services/conflictService';
import type { ConflictResolutionRequest } from '@/types/conflict';

// Mock user ID - in production, get from auth context
const MOCK_USER_ID = 'user-1';

/**
 * Hook for fetching conflicts for a concept
 */
export function useConceptConflicts(conceptId: string) {
  const {
    data: conflicts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conflicts', conceptId],
    queryFn: () => conflictService.getConflicts(conceptId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!conceptId,
  });

  return {
    conflicts: conflicts || [],
    hasConflicts: (conflicts?.length || 0) > 0,
    conflictCount: conflicts?.length || 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for resolving conflicts
 */
export function useResolveConflict() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);

  const mutation = useMutation({
    mutationFn: (request: ConflictResolutionRequest) =>
      conflictService.resolveConflict(MOCK_USER_ID, request),
    
    onSuccess: () => {
      // Invalidate conflicts query
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      
      // Invalidate concept query to update definition if needed
      queryClient.invalidateQueries({ queryKey: ['concept'] });
      
      // Close modal after successful resolution
      setIsModalOpen(false);
      setCurrentConflictIndex(0);
    },
    
    onError: (error) => {
      console.error('Failed to resolve conflict:', error);
    },
  });

  const openModal = (index: number = 0) => {
    setCurrentConflictIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentConflictIndex(0);
  };

  const navigateToConflict = (index: number) => {
    setCurrentConflictIndex(index);
  };

  const resolveConflict = async (
    conflictId: string,
    selectedSource: 'source1' | 'source2' | 'custom',
    customDefinition?: string
  ) => {
    await mutation.mutateAsync({
      conflictId,
      selectedSource,
      customDefinition,
    });
  };

  return {
    resolveConflict,
    isResolving: mutation.isPending,
    error: mutation.error,
    isModalOpen,
    currentConflictIndex,
    openModal,
    closeModal,
    navigateToConflict,
  };
}

/**
 * Hook for fetching course conflicts
 */
export function useCourseConflicts(courseId: string) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['courseConflicts', courseId],
    queryFn: () => conflictService.getCourseConflicts(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!courseId,
  });

  return {
    conflicts: data?.conflicts || [],
    totalCount: data?.totalCount || 0,
    pendingCount: data?.pendingCount || 0,
    resolvedCount: data?.resolvedCount || 0,
    isLoading,
    error,
    refetch,
  };
}
