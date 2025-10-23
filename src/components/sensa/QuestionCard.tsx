import React from 'react';
import { HelpCircle, CheckCircle } from 'lucide-react';

interface QuestionCardProps {
  question: {
    id: string;
    question_text: string;
    question_type: string;
    answered: boolean;
    answer_text?: string;
  };
  index: number;
  onAnswerChange?: (answer: string) => void;
  answer?: string;
  readOnly?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onAnswerChange,
  answer,
  readOnly = false,
}) => {
  const getQuestionTypeColor = (type: string) => {
    if (type.includes('hierarchical') || type.includes('classification')) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
    if (type.includes('sequential') || type.includes('process')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    }
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
  };

  const getQuestionTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      question.answered
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Number badge */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
          question.answered
            ? 'bg-green-500 text-white'
            : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
        }`}>
          {question.answered ? <CheckCircle className="w-5 h-5" /> : index + 1}
        </div>
        
        <div className="flex-1">
          {/* Question type badge */}
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getQuestionTypeColor(question.question_type)}`}>
              {getQuestionTypeLabel(question.question_type)}
            </span>
          </div>
          
          {/* Question text */}
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
            {question.question_text}
          </p>
        </div>
      </div>

      {/* Answer section */}
      {!readOnly && onAnswerChange && (
        <div className="mt-3">
          <textarea
            value={answer || question.answer_text || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none"
          />
        </div>
      )}

      {/* Display answer if read-only */}
      {readOnly && question.answer_text && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {question.answer_text}
          </p>
        </div>
      )}
    </div>
  );
};
