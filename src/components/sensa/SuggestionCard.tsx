import React from 'react';
import { CheckCircle, X, TrendingUp, Tag } from 'lucide-react';
import { Button } from '../ui/Button';

interface SuggestionCardProps {
  suggestion: {
    analogy_id: string;
    similarity_score: number;
    suggestion_text: string;
    source_concept: string;
    experience_text: string;
    tags: string[];
    strength: number;
  };
  onApply: () => void;
  onDismiss: () => void;
  loading?: boolean;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onApply,
  onDismiss,
  loading = false,
}) => {
  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.8) return 'Highly Similar';
    if (score >= 0.6) return 'Moderately Similar';
    return 'Somewhat Similar';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {suggestion.tags[0]?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                From Your Past Learning
              </span>
              <div className={`flex items-center gap-1 text-xs font-medium ${getSimilarityColor(suggestion.similarity_score)}`}>
                <TrendingUp className="w-3 h-3" />
                {(suggestion.similarity_score * 100).toFixed(0)}% match
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {getSimilarityLabel(suggestion.similarity_score)} • Used for "{suggestion.source_concept}"
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          disabled={loading}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Dismiss suggestion"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggestion text */}
      <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">
          💡 {suggestion.suggestion_text}
        </p>
      </div>

      {/* Experience preview */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
          Your Previous Experience:
        </p>
        <blockquote className="text-sm text-gray-700 dark:text-gray-300 italic border-l-4 border-blue-400 pl-3 py-1">
          {suggestion.experience_text.length > 150
            ? `${suggestion.experience_text.substring(0, 150)}...`
            : suggestion.experience_text}
        </blockquote>
      </div>

      {/* Tags and strength */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-3 h-3 text-gray-400" />
          {suggestion.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">{suggestion.strength.toFixed(1)}/5.0</span>
          <span>strength</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-blue-200 dark:border-blue-800">
        <Button
          variant="primary"
          size="sm"
          onClick={onApply}
          disabled={loading}
          className="flex-1"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Apply This Analogy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          disabled={loading}
        >
          Skip
        </Button>
      </div>
    </div>
  );
};
