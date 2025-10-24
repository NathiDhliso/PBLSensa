/**
 * Upload Document Hook
 * 
 * React Query mutation hook for uploading documents
 */

import { useApiMutation, invalidateOnSuccess } from './useApi';
import { pblService } from '@/services/pblService';
import { queryKeys } from '@/config/queryClient';
import { UploadDocumentResponse } from '@/types';

interface UploadDocumentVariables {
  courseId: string;
  file: File;
  sha256Hash?: string;
  onProgress?: (progress: number) => void;
}

export function useUploadDocument() {
  return useApiMutation<UploadDocumentResponse, UploadDocumentVariables>(
    ({ courseId, file, sha256Hash, onProgress }) => 
      pblService.uploadDocument(courseId, file, sha256Hash, onProgress),
    {
      onSuccess: (_data, variables) => {
        // Invalidate course documents list
        invalidateOnSuccess(queryKeys.courses.documents(variables.courseId))();
      },
    }
  );
}
