/**
 * AddRelatedConceptModal Component
 * 
 * Modal for suggesting related concepts
 */

import { X, Plus } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RelationshipType } from '@/types/feedback';

interface AddRelatedConceptModalProps {
  isOpen: boolean;
  conceptName: string;
  onClose: () => void;
  onSubmit: (relatedConceptName: string, relationshipType: RelationshipType, description: string) => Promise<void>;
}

const relationshipTypes: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'prerequisite', label: 'Prerequisite', description: 'Must be learned before this concept' },
  { value: 'related', label: 'Related', description: 'Connected or similar concept' },
  { value: 'opposite', label: 'Opposite', description: 'Contrasting or opposing concept' },
  { value: 'example', label: 'Example', description: 'Specific instance of this concept' },
  { value: 'application', label: 'Application', description: 'Practical use of this concept' },
];

export function AddRelatedConceptModal({
  isOpen,
  conceptName,
  onClose,
  onSubmit,
}: AddRelatedConceptModalProps) {
  const [relatedConceptName, setRelatedConceptName] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('related');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!relatedConceptName.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(relatedConceptName, relationshipType, description);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setRelatedConceptName('');
        setRelationshipType('related');
        setDescription('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {showSuccess ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Thank You!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your related concept suggestion has been submitted.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Add Related Concept
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Suggest a concept that should be linked to <strong>{conceptName}</strong>
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Related Concept Name *
                  </label>
                  <input
                    type="text"
                    value={relatedConceptName}
                    onChange={(e) => setRelatedConceptName(e.target.value)}
                    placeholder="Enter concept name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relationship Type *
                  </label>
                  <div className="space-y-2">
                    {relationshipTypes.map((type) => (
                      <label
                        key={type.value}
                        className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="relationshipType"
                          value={type.value}
                          checked={relationshipType === type.value}
                          onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
                          className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {type.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {type.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain how these concepts are related..."
                    className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {description.length}/500
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!relatedConceptName.trim() || !description.trim() || isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Submit Suggestion
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
