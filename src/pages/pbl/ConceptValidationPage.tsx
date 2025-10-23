/**
 * Concept Validation Page
 * 
 * Dedicated page for reviewing and validating extracted concepts
 * before they appear in the concept map.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConceptReviewPanel } from '@/components/pbl/ConceptReviewPanel';

export function ConceptValidationPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  if (!documentId) {
    return <div>Document ID required</div>;
  }

  const handleComplete = () => {
    navigate(`/pbl/document/${documentId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/pbl/document/${documentId}`)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Validate Concepts</h1>
              <p className="text-sm text-gray-600">Review and approve extracted concepts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <ConceptReviewPanel documentId={documentId} onComplete={handleComplete} />
      </div>
    </div>
  );
}
