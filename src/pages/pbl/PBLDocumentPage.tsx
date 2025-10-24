/**
 * PBL Document Page
 * 
 * Main page for viewing and interacting with a processed PBL document.
 * Includes concept validation, duplicate resolution, and visualization.
 * Provides integration with Sensa Learn for personalized analogies.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle, GitMerge, Map } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConceptReviewPanel } from '@/components/pbl/ConceptReviewPanel';
import { DuplicateResolver } from '@/components/pbl/DuplicateResolver';
import { ConceptMapVisualization } from '@/components/conceptMap/ConceptMapVisualization';
import { usePBLVisualization } from '@/hooks/usePBLVisualization';
import { usePBLConcepts } from '@/hooks/usePBLConcepts';
import { usePBLDuplicates } from '@/hooks/usePBLDuplicates';

type WorkflowStep = 'validation' | 'deduplication' | 'visualization';

export function PBLDocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('validation');

  console.log('🔍 [PBL Document Page] Rendering with documentId:', documentId);

  const { data: concepts, isLoading: conceptsLoading, error: conceptsError } = usePBLConcepts(documentId!, false);
  const { data: duplicates, isLoading: duplicatesLoading, error: duplicatesError } = usePBLDuplicates(documentId!);
  const { data: visualization, isLoading: visualizationLoading, error: visualizationError } = usePBLVisualization(documentId!);

  console.log('📊 [PBL Document Page] Data Status:', {
    concepts: { data: concepts, loading: conceptsLoading, error: conceptsError },
    duplicates: { data: duplicates, loading: duplicatesLoading, error: duplicatesError },
    visualization: { data: visualization, loading: visualizationLoading, error: visualizationError }
  });

  if (!documentId) {
    console.error('❌ [PBL Document Page] No document ID provided');
    return <div>Document ID required</div>;
  }

  const unvalidatedCount = concepts?.filter((c) => !c.validated).length || 0;
  const duplicateCount = duplicates?.duplicates?.length || 0;

  console.log('📈 [PBL Document Page] Counts:', {
    totalConcepts: concepts?.length || 0,
    unvalidatedCount,
    duplicateCount,
    currentStep
  });

  const handleValidationComplete = () => {
    if (duplicateCount > 0) {
      setCurrentStep('deduplication');
    } else {
      setCurrentStep('visualization');
    }
  };

  const handleDeduplicationComplete = () => {
    setCurrentStep('visualization');
  };

  const handleSwitchToSensa = () => {
    // Navigate to Sensa Learn with document context
    navigate(`/sensa/document/${documentId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/pbl/courses')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Courses
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Document Processing</h1>
                <p className="text-sm text-gray-600">Review and visualize extracted concepts</p>
              </div>
            </div>

            {/* Switch to Sensa Learn Button */}
            {currentStep === 'visualization' && (
              <Button
                onClick={handleSwitchToSensa}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Get Personalized Analogies
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-4">
            <StepIndicator
              icon={<CheckCircle className="w-5 h-5" />}
              label="Validate Concepts"
              isActive={currentStep === 'validation'}
              isComplete={unvalidatedCount === 0}
              onClick={() => setCurrentStep('validation')}
            />
            <div className="h-px flex-1 bg-gray-300" />
            <StepIndicator
              icon={<GitMerge className="w-5 h-5" />}
              label="Resolve Duplicates"
              isActive={currentStep === 'deduplication'}
              isComplete={duplicateCount === 0}
              onClick={() => setCurrentStep('deduplication')}
              badge={duplicateCount > 0 ? duplicateCount : undefined}
            />
            <div className="h-px flex-1 bg-gray-300" />
            <StepIndicator
              icon={<Map className="w-5 h-5" />}
              label="View Concept Map"
              isActive={currentStep === 'visualization'}
              isComplete={!!visualization}
              onClick={() => setCurrentStep('visualization')}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentStep === 'validation' && (
          <ConceptReviewPanel
            documentId={documentId}
            onComplete={handleValidationComplete}
          />
        )}

        {currentStep === 'deduplication' && (
          <DuplicateResolver
            documentId={documentId}
            onComplete={handleDeduplicationComplete}
          />
        )}

        {currentStep === 'visualization' && visualization && (
          <div className="space-y-6">
            {/* Integration Callout */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Ready for Personalized Learning?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Your concept map is ready! Switch to Sensa Learn to get personalized analogies,
                    memory techniques, and learning mantras based on these concepts and your interests.
                  </p>
                  <Button
                    onClick={handleSwitchToSensa}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Switch to Sensa Learn
                  </Button>
                </div>
              </div>
            </div>

            {/* Concept Map */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Concept Map Visualization</h2>
              <div className="h-[600px] border rounded-lg overflow-hidden">
                {visualization && (
                  <ConceptMapVisualization
                    conceptMap={{
                      course_id: documentId,
                      chapters: [], // Transform visualization data to concept map format
                      global_relationships: [],
                    }}
                    layout="hybrid"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
  badge?: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  icon,
  label,
  isActive,
  isComplete,
  onClick,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        isActive
          ? 'bg-blue-100 text-blue-700 font-medium'
          : isComplete
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );
};
