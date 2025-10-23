/**
 * ConflictResolutionModal Component
 * 
 * Modal for resolving conflicts between different document sources
 */

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConceptConflict } from '@/types/conflict';

interface ConflictResolutionModalProps {
  conflicts: ConceptConflict[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (conflictId: string, selectedSource: 'source1' | 'source2' | 'custom', customDefinition?: string) => void;
  onNavigate: (index: number) => void;
}

export function ConflictResolutionModal({
  conflicts,
  currentIndex,
  isOpen,
  onClose,
  onResolve,
  onNavigate,
}: ConflictResolutionModalProps) {
  const [selectedSource, setSelectedSource] = useState<'source1' | 'source2' | 'custom' | null>(null);
  const [customDefinition, setCustomDefinition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const conflict = conflicts[currentIndex];
  const hasMultipleConflicts = conflicts.length > 1;

  if (!isOpen || !conflict) return null;

  const handleSubmit = async () => {
    if (!selectedSource) return;

    setIsSubmitting(true);
    try {
      await onResolve(
        conflict.conflictId,
        selectedSource,
        selectedSource === 'custom' ? customDefinition : undefined
      );
      // Reset state
      setSelectedSource(null);
      setCustomDefinition('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setSelectedSource(null);
      setCustomDefinition('');
    }
  };

  const handleNext = () => {
    if (currentIndex < conflicts.length - 1) {
      onNavigate(currentIndex + 1);
      setSelectedSource(null);
      setCustomDefinition('');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Resolve Conflict
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {conflict.conceptName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasMultipleConflicts && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentIndex + 1} of {conflicts.length}
                </span>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Source 1 */}
              <div
                className={`
                  border-2 rounded-lg p-4 transition-all cursor-pointer
                  ${selectedSource === 'source1'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }
                `}
                onClick={() => setSelectedSource('source1')}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Source 1
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {conflict.source1.documentName}
                      {conflict.source1.pageNumber && ` (Page ${conflict.source1.pageNumber})`}
                    </p>
                  </div>
                  {selectedSource === 'source1' && (
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {conflict.source1.definition}
                </p>
                {conflict.source1.confidence && (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Confidence: {Math.round(conflict.source1.confidence * 100)}%
                  </div>
                )}
              </div>

              {/* Source 2 */}
              <div
                className={`
                  border-2 rounded-lg p-4 transition-all cursor-pointer
                  ${selectedSource === 'source2'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }
                `}
                onClick={() => setSelectedSource('source2')}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Source 2
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {conflict.source2.documentName}
                      {conflict.source2.pageNumber && ` (Page ${conflict.source2.pageNumber})`}
                    </p>
                  </div>
                  {selectedSource === 'source2' && (
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {conflict.source2.definition}
                </p>
                {conflict.source2.confidence && (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Confidence: {Math.round(conflict.source2.confidence * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* AI Recommendation */}
            {conflict.aiRecommendation && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  AI Recommendation
                </h3>
                <p className="text-purple-800 dark:text-purple-200 mb-2">
                  <strong>Suggested:</strong>{' '}
                  {conflict.aiRecommendation.recommendedSource === 'source1' ? 'Source 1' :
                   conflict.aiRecommendation.recommendedSource === 'source2' ? 'Source 2' :
                   'Custom Definition'}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Reasoning:</strong> {conflict.aiRecommendation.reasoning}
                </p>
                {conflict.aiRecommendation.confidence && (
                  <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                    Confidence: {Math.round(conflict.aiRecommendation.confidence * 100)}%
                  </div>
                )}
              </div>
            )}

            {/* Custom Definition Option */}
            <div
              className={`
                border-2 rounded-lg p-4 transition-all
                ${selectedSource === 'custom'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedSource === 'custom'}
                  onChange={(e) => setSelectedSource(e.target.checked ? 'custom' : null)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Write Custom Definition
                </h3>
              </div>
              <textarea
                value={customDefinition}
                onChange={(e) => {
                  setCustomDefinition(e.target.value);
                  if (e.target.value && selectedSource !== 'custom') {
                    setSelectedSource('custom');
                  }
                }}
                placeholder="Enter your own definition combining the best of both sources..."
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                disabled={selectedSource !== 'custom'}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-2">
              {hasMultipleConflicts && (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === conflicts.length - 1}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedSource || (selectedSource === 'custom' && !customDefinition.trim()) || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Resolve Conflict
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
