/**
 * Sensa Learn Document Page
 * 
 * Shows personalized analogies and learning content for a specific document.
 * Provides integration back to PBL view to see the objective concept map.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePBLConcepts } from '@/hooks/usePBLConcepts';
import { useSensaAnalogies } from '@/hooks/useSensaAnalogies';

export function SensaDocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const userId = 'user-123'; // TODO: Get from auth context

  const { data: concepts, isLoading: conceptsLoading } = usePBLConcepts(documentId!, true);
  const { analogies, loading: analogiesLoading } = useSensaAnalogies(userId, documentId);

  if (!documentId) {
    return <div>Document ID required</div>;
  }

  const handleSwitchToPBL = () => {
    navigate(`/pbl/document/${documentId}`);
  };

  const conceptsWithAnalogies = concepts?.filter((c) =>
    analogies.some((a) => a.concept_id === c.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/sensa')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Sensa Learn
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Personalized Learning
                </h1>
                <p className="text-sm text-gray-600">Your custom analogies and memory techniques</p>
              </div>
            </div>

            {/* Switch to PBL Button */}
            <Button
              onClick={handleSwitchToPBL}
              variant="outline"
              leftIcon={<Map className="w-4 h-4" />}
            >
              View Concept Map
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Integration Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Connected Learning</h2>
              <p className="text-gray-700 mb-4">
                This view shows personalized analogies for the concepts extracted from your document.
                {conceptsWithAnalogies && conceptsWithAnalogies.length > 0 && (
                  <span className="font-medium text-purple-600">
                    {' '}
                    {conceptsWithAnalogies.length} of {concepts?.length} concepts have analogies.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleSwitchToPBL}
                  variant="outline"
                  size="sm"
                  leftIcon={<Map className="w-4 h-4" />}
                >
                  View Objective Concept Map
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Analogies Content */}
        {conceptsLoading || analogiesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading your personalized content...</p>
          </div>
        ) : analogies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Analogies Yet</h3>
            <p className="text-gray-600 mb-6">
              Start creating personalized analogies for the concepts in this document.
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
              Create Your First Analogy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {analogies.map((analogy) => {
              const concept = concepts?.find((c) => c.id === analogy.concept_id);
              return (
                <div key={analogy.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      {concept && (
                        <div className="mb-3">
                          <span className="text-xs font-medium text-purple-600 uppercase">
                            Concept
                          </span>
                          <h3 className="text-lg font-bold">{concept.term}</h3>
                          <p className="text-sm text-gray-600">{concept.definition}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-medium text-pink-600 uppercase">
                          Your Analogy
                        </span>
                        <p className="text-gray-800 mt-1">{analogy.user_experience_text}</p>
                      </div>
                      {analogy.connection_explanation && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <span className="text-xs font-medium text-purple-700 uppercase">
                            Connection
                          </span>
                          <p className="text-sm text-gray-700 mt-1">
                            {analogy.connection_explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
