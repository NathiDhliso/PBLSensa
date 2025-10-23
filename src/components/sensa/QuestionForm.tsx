import React, { useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  answered: boolean;
  answer_text?: string;
}

interface QuestionFormProps {
  questions: Question[];
  conceptName: string;
  conceptDefinition?: string;
  onSubmit: (answers: { question_id: string; answer_text: string }[]) => void;
  onSkip?: () => void;
  loading?: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  questions,
  conceptName,
  conceptDefinition,
  onSubmit,
  onSkip,
  loading = false,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const answersArray = questions
      .filter(q => answers[q.id]?.trim())
      .map(q => ({
        question_id: q.id,
        answer_text: answers[q.id],
      }));
    
    if (answersArray.length > 0) {
      onSubmit(answersArray);
    }
  };

  const hasAnyAnswer = Object.values(answers).some(a => a?.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Create Your Analogy for "{conceptName}"
            </h3>
            {conceptDefinition && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {conceptDefinition}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>How it works:</strong> Answer one or more questions below based on your personal experiences. 
          Your answers will help create a memorable analogy that connects this concept to something you already know.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Question header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                  {question.question_text}
                </p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                  {question.question_type.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Answer textarea */}
            <textarea
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Share your experience here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none"
              disabled={loading}
            />
          </div>
        ))}
      </div>

      {/* Helper text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
        💡 Tip: The more specific and personal your answers, the stronger your analogy will be!
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        {onSkip && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            disabled={loading}
          >
            Skip for now
          </Button>
        )}
        
        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="submit"
            variant="primary"
            disabled={!hasAnyAnswer || loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Create Analogy
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
