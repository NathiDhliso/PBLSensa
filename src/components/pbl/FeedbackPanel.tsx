/**
 * FeedbackPanel Component
 * 
 * Panel with feedback action buttons for concepts
 */

import { Flag, Edit, Plus, CheckCircle } from 'lucide-react';

interface FeedbackPanelProps {
  conceptId: string;
  conceptName: string;
  hasFeedback?: boolean;
  onFlagIncorrect: () => void;
  onSuggestEdit: () => void;
  onAddRelated: () => void;
}

export function FeedbackPanel({
  hasFeedback = false,
  onFlagIncorrect,
  onSuggestEdit,
  onAddRelated,
}: FeedbackPanelProps) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Help Improve This Concept
        </h3>
        {hasFeedback && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Feedback Submitted
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onFlagIncorrect}
          className="
            flex items-center gap-2 px-3 py-2 text-sm
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-300
            rounded-lg
            hover:bg-gray-50 dark:hover:bg-gray-700
            hover:border-red-300 dark:hover:border-red-700
            hover:text-red-600 dark:hover:text-red-400
            transition-colors
          "
        >
          <Flag className="w-4 h-4" />
          Flag as Incorrect
        </button>
        
        <button
          onClick={onSuggestEdit}
          className="
            flex items-center gap-2 px-3 py-2 text-sm
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-300
            rounded-lg
            hover:bg-gray-50 dark:hover:bg-gray-700
            hover:border-blue-300 dark:hover:border-blue-700
            hover:text-blue-600 dark:hover:text-blue-400
            transition-colors
          "
        >
          <Edit className="w-4 h-4" />
          Suggest Edit
        </button>
        
        <button
          onClick={onAddRelated}
          className="
            flex items-center gap-2 px-3 py-2 text-sm
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-300
            rounded-lg
            hover:bg-gray-50 dark:hover:bg-gray-700
            hover:border-green-300 dark:hover:border-green-700
            hover:text-green-600 dark:hover:text-green-400
            transition-colors
          "
        >
          <Plus className="w-4 h-4" />
          Add Related Concept
        </button>
      </div>
    </div>
  );
}
