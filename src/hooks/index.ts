/**
 * Hooks Index
 * 
 * Central export point for all hooks
 */

// Auth hooks
export { useAuth } from './useAuth';

// Generic API hooks
export { useApi, useApiMutation, useApiPolling, invalidateOnSuccess } from './useApi';

// PBL hooks
export { useCourses } from './useCourses';
export { useCourse } from './useCourse';
export { useCourseDocuments } from './useCourseDocuments';
export { useConceptMap } from './useConceptMap';
export { useProcessingStatus } from './useProcessingStatus';
export { useUploadDocument } from './useUploadDocument';
export { useCreateCourse } from './useCreateCourse';
export { useDeleteCourse } from './useDeleteCourse';

// Sensa Learn hooks
export { useChapterSummary } from './useChapterSummary';
export { useChapterAnalogies } from './useChapterAnalogies';
export { useUserProfile } from './useUserProfile';
export { useUpdateProfile } from './useUpdateProfile';
export { useAnalogyFeedback } from './useAnalogyFeedback';
