import { Plus } from 'lucide-react';
import { useCourseDocuments } from '../../hooks';
import { Button } from '../ui/Button';
import { DocumentCard } from './DocumentCard';
import { fadeIn } from '../../utils/animations';

interface DocumentsListProps {
  courseId: string;
  onUploadClick: () => void;
}

export const DocumentsList = ({ courseId, onUploadClick }: DocumentsListProps) => {
  const { data: documents, isLoading, error } = useCourseDocuments(courseId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Failed to load documents: {error.message}
        </p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12" style={fadeIn}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
          <Plus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No documents yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upload your first PDF document to get started with concept mapping
        </p>
        <Button onClick={onUploadClick}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>
    );
  }

  return (
    <div style={fadeIn}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Documents ({documents.length})
        </h2>
        <Button onClick={onUploadClick}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="space-y-4">
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
};
