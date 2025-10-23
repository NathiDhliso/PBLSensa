import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { SuggestionCard } from './SuggestionCard';

interface Suggestion {
  analogy_id: string;
  similarity_score: number;
  suggestion_text: string;
  source_concept: string;
  experience_text: string;
  tags: string[];
  strength: number;
}

interface AnalogyySuggestionPanelProps {
  suggestions: Suggestion[];
  onApply: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  loading?: boolean;
}

export const AnalogyySuggestionPanel: React.FC<AnalogyySuggestionPanelProps> = ({
  suggestions,
  onApply,
  onDismiss,
  loading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (suggestionId: string) => {
    setDismissedIds(prev => new Set([...prev, suggestionId]));
    onDismiss(suggestionId);
  };

  const visibleSuggestions = suggestions.filter(
    s => !dismissedIds.has(s.analogy_id)
  );

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border-2 border-blue-300 dark:border-blue-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              From Your Past Learning
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {visibleSuggestions.length} {visibleSuggestions.length === 1 ? 'analogy' : 'analogies'} from previous documents might help
            </p>
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* Info message */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>💡 Smart Suggestion:</strong> These analogies helped you understand similar concepts before. 
              You can apply them directly or use them as inspiration for new analogies.
            </p>
          </div>

          {/* Suggestions */}
          {visibleSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.analogy_id}
              suggestion={suggestion}
              onApply={() => onApply(suggestion.analogy_id)}
              onDismiss={() => handleDismiss(suggestion.analogy_id)}
              loading={loading}
            />
          ))}

          {/* Dismissed count */}
          {dismissedIds.size > 0 && (
            <div className="text-center">
              <button
                onClick={() => setDismissedIds(new Set())}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show {dismissedIds.size} dismissed {dismissedIds.size === 1 ? 'suggestion' : 'suggestions'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
