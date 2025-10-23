import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'text_list' | 'multi_select' | 'single_select' | 'yes_no_text';
  options?: string[];
  placeholder?: string;
}

interface OnboardingCategory {
  id: string;
  name: string;
  description: string;
  questions: OnboardingQuestion[];
}

interface ProfileOnboardingProps {
  categories: OnboardingCategory[];
  onComplete: (responses: Record<string, any>) => void;
  onSkip?: () => void;
}

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({
  categories,
  onComplete,
  onSkip
}) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  const currentCategory = categories[currentCategoryIndex];
  const progress = ((currentCategoryIndex + 1) / categories.length) * 100;
  
  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    } else {
      onComplete(responses);
    }
  };
  
  const handleBack = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };
  
  const renderQuestion = (question: OnboardingQuestion) => {
    const value = responses[question.id];
    
    switch (question.question_type) {
      case 'text':
        return (
          <textarea
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     resize-none"
            rows={3}
            placeholder={question.placeholder}
            value={value || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
          />
        );
      
      case 'text_list':
        return (
          <textarea
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     resize-none"
            rows={3}
            placeholder={question.placeholder}
            value={value || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
          />
        );
      
      case 'multi_select':
        return (
          <div className="grid grid-cols-2 gap-3">
            {question.options?.map((option) => {
              const selected = Array.isArray(value) && value.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => {
                    const current = Array.isArray(value) ? value : [];
                    const updated = selected
                      ? current.filter(v => v !== option)
                      : [...current, option];
                    handleResponse(question.id, updated);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 transition-all
                           ${selected
                             ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                             : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                           }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );
      
      case 'single_select':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const selected = value === option;
              return (
                <button
                  key={option}
                  onClick={() => handleResponse(question.id, option)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left
                           ${selected
                             ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                             : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                           }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );
      
      case 'yes_no_text':
        return (
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => handleResponse(question.id, { answer: 'yes', text: '' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all
                         ${value?.answer === 'yes'
                           ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                           : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                         }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleResponse(question.id, { answer: 'no' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all
                         ${value?.answer === 'no'
                           ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                           : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                         }`}
              >
                No
              </button>
            </div>
            {value?.answer === 'yes' && (
              <textarea
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 resize-none"
                rows={3}
                placeholder={question.placeholder}
                value={value.text || ''}
                onChange={(e) => handleResponse(question.id, { ...value, text: e.target.value })}
              />
            )}
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Step {currentCategoryIndex + 1} of {categories.length}
          </span>
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      {/* Category Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCategory.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Category Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {currentCategory.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {currentCategory.description}
            </p>
          </div>
          
          {/* Questions */}
          <div className="space-y-8">
            {currentCategory.questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <label className="block text-lg font-medium text-gray-900 dark:text-white">
                  {question.question_text}
                </label>
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          {currentCategoryIndex > 0 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900
                       dark:hover:text-white transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
        
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white
                   rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all
                   shadow-lg hover:shadow-xl"
        >
          {currentCategoryIndex < categories.length - 1 ? 'Next' : 'Complete'}
        </button>
      </div>
    </div>
  );
};
