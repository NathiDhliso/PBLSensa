import React, { useState } from 'react';
import { Star, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface AnalogyFormProps {
  conceptId: string;
  conceptName: string;
  question?: {
    id: string;
    question_text: string;
    answer_text?: string;
  };
  initialData?: {
    experience_text: string;
    strength: number;
    reusable: boolean;
  };
  onSubmit: (data: {
    concept_id: string;
    user_experience_text: string;
    strength: number;
    type: string;
    reusable: boolean;
  }) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export const AnalogyForm: React.FC<AnalogyFormProps> = ({
  conceptId,
  conceptName,
  question,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
}) => {
  const [experienceText, setExperienceText] = useState(
    initialData?.experience_text || question?.answer_text || ''
  );
  const [strength, setStrength] = useState(initialData?.strength || 3);
  const [reusable, setReusable] = useState(initialData?.reusable || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!experienceText.trim()) return;
    
    onSubmit({
      concept_id: conceptId,
      user_experience_text: experienceText,
      strength,
      type: 'experience',
      reusable,
    });
  };

  const getStrengthLabel = (value: number) => {
    if (value >= 4.5) return 'Very Strong';
    if (value >= 3.5) return 'Strong';
    if (value >= 2.5) return 'Moderate';
    if (value >= 1.5) return 'Weak';
    return 'Very Weak';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {mode === 'create' ? 'Create' : 'Edit'} Analogy for "{conceptName}"
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share a personal experience that helps you understand this concept
        </p>
      </div>

      {/* Question context (if provided) */}
      {question && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
            Question:
          </p>
          <p className="text-sm text-purple-800 dark:text-purple-300">
            {question.question_text}
          </p>
        </div>
      )}

      {/* Experience text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Experience
        </label>
        <textarea
          value={experienceText}
          onChange={(e) => setExperienceText(e.target.value)}
          placeholder="Describe a personal experience, memory, or familiar concept that relates to this..."
          rows={6}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Be specific! The more details you include, the more memorable your analogy will be.
        </p>
      </div>

      {/* Strength rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How strong is this connection?
        </label>
        <div className="flex items-center gap-4">
          {/* Star rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStrength(value)}
                className="focus:outline-none transition-transform hover:scale-110"
                disabled={loading}
              >
                <Star
                  className={`w-8 h-8 ${
                    value <= strength
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {/* Label */}
          <div className="text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              {strength.toFixed(1)}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              • {getStrengthLabel(strength)}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Rate how well this experience helps you understand the concept
        </p>
      </div>

      {/* Reusable checkbox */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <input
          type="checkbox"
          id="reusable"
          checked={reusable}
          onChange={(e) => setReusable(e.target.checked)}
          className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          disabled={loading}
        />
        <div className="flex-1">
          <label htmlFor="reusable" className="text-sm font-medium text-blue-900 dark:text-blue-200 cursor-pointer">
            Mark as reusable
          </label>
          <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
            This analogy might help with similar concepts in other documents
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        
        <Button
          type="submit"
          variant="primary"
          disabled={!experienceText.trim() || loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Create' : 'Save'} Analogy
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
