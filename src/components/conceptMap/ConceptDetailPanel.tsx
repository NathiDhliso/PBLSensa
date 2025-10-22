import React from 'react';
import { X, BookOpen, Link as LinkIcon } from 'lucide-react';
import { Concept } from '../../types/conceptMap';
import { Button } from '../ui/Button';

interface ConceptDetailPanelProps {
  concept: Concept;
  onClose: () => void;
  onConceptClick?: (concept: Concept) => void;
}

export const ConceptDetailPanel: React.FC<ConceptDetailPanelProps> = ({
  concept,
  onClose,
}) => {
  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto animate-slide-in-right">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-start justify-between z-10">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white pr-8">
          {concept.name}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Description */}
        {concept.description && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {concept.description}
            </p>
          </div>
        )}

        {/* Source Chapter */}
        {concept.source_chapter && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Source Chapter
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {concept.source_chapter}
            </p>
          </div>
        )}

        {/* Keywords */}
        {concept.keywords && concept.keywords.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {concept.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Concepts */}
        {concept.related_concepts && concept.related_concepts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Related Concepts
            </h3>
            <div className="space-y-2">
              {concept.related_concepts.map((relatedId, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // TODO: Find and navigate to related concept
                    console.log('Navigate to concept:', relatedId);
                  }}
                  className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {relatedId}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Importance Score */}
        {concept.importance_score !== undefined && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Importance
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                  style={{ width: `${concept.importance_score * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(concept.importance_score * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-center"
            onClick={() => {
              // TODO: Navigate to chapter summary in Sensa Learn
              console.log('View in context:', concept.source_chapter);
            }}
          >
            View in Context
          </Button>
        </div>
      </div>
    </div>
  );
};
