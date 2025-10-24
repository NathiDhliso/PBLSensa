import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useUploadDocument } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { validatePDF, formatFileSize, hashFile } from '../../utils/fileProcessing';
import { useNavigate } from 'react-router-dom';

interface UploadDocumentModalProps {
  courseId: string;
  onClose: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  courseId,
  onClose,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [hashProgress, setHashProgress] = useState(0);

  const uploadMutation = useUploadDocument();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    
    const validation = validatePDF(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsHashing(true);
      setError('');

      // Compute SHA256 hash
      const sha256Hash = await hashFile(selectedFile, (progress) => {
        setHashProgress(progress);
      });

      setIsHashing(false);

      // Upload document
      const result = await uploadMutation.mutateAsync({
        courseId,
        file: selectedFile,
        sha256Hash,
      });

      // Show appropriate toast based on cache status
      if (result.cached) {
        showToast(
          'success',
          `Document returned from cache (${Math.round(result.processing_time_ms || 0)}ms)`
        );
      } else {
        const timeMsg = result.processing_time_ms 
          ? ` (${(result.processing_time_ms / 1000).toFixed(1)}s)`
          : '';
        const typeMsg = result.document_type 
          ? ` - ${result.document_type} PDF`
          : '';
        showToast('success', `Document processed successfully${timeMsg}${typeMsg}`);
      }
      
      // Navigate to processing status page
      if (result.task_id) {
        navigate(`/processing/${result.task_id}`);
      }
      
      onClose();
    } catch (err: any) {
      setIsHashing(false);
      setError(err.message || 'Failed to upload document');
      showToast('error', 'Upload failed');
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setError('');
      
      const validation = validatePDF(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Upload Document"
      size="lg"
    >
      <div className="p-6">
        {!selectedFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PDF files only, max 100MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FileText className="w-10 h-10 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isHashing && (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Computing file hash...</span>
                  <span>{Math.round(hashProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${hashProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadMutation.isPending && !isHashing && (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Uploading...</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button variant="ghost" onClick={onClose} disabled={uploadMutation.isPending || isHashing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending || isHashing}
          >
            {isHashing ? 'Hashing...' : uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
