/**
 * Sensa Course Detail Page
 * 
 * Shows personalized chapter summaries and analogies for a specific course
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Sparkles, BookOpen, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useCourse, useChapterAnalogies, useGenerateAnalogies, useAnalogyFeedback } from '@/hooks';
import { Button } from '@/components/ui';
import { 
  ComplexityIndicator, 
  AnalogyCard, 
  MemoryTechniqueCard, 
  LearningMantraCard 
} from '@/components/sensa';
import { pageTransition } from '@/utils/animations';

export function SensaCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(courseId!);
  
  // Mock user ID - in production, get from auth context
  const userId = 'user-123';
  
  // Mock chapter ID - in production, allow user to select
  const [selectedChapter, setSelectedChapter] = useState('chapter-1');
  
  // Fetch analogies for selected chapter
  const { 
    data: analogyData, 
    isLoading: analogiesLoading, 
    error: analogiesError,
    refetch: refetchAnalogies
  } = useChapterAnalogies(selectedChapter, userId, !!selectedChapter);
  
  // Generate analogies mutation
  const generateMutation = useGenerateAnalogies();
  
  // Feedback mutation
  const feedbackMutation = useAnalogyFeedback();
  
  const handleGenerateAnalogies = async (forceRegenerate: boolean = false) => {
    try {
      await generateMutation.mutateAsync({
        chapterId: selectedChapter,
        userId,
        forceRegenerate
      });
    } catch (error) {
      console.error('Failed to generate analogies:', error);
    }
  };
  
  const handleRateAnalogy = async (analogyId: string, rating: number, comment?: string) => {
    try {
      await feedbackMutation.mutateAsync({
        analogyId,
        feedback: { user_id: userId, rating, comment }
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-warm-coral dark:text-dark-accent-coral mx-auto mb-4" />
          <p className="text-text-medium dark:text-dark-text-secondary">Loading course...</p>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen p-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate('/sensa')}
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft size={20} />}
            className="mb-6"
          >
            Back to Sensa Learn
          </Button>
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              {courseError?.message || 'Course not found'}
            </p>
            <Button onClick={() => navigate('/sensa')} variant="primary">
              Return to Sensa Learn
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen p-4 pt-20"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/sensa')}
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft size={20} />}
            className="mb-4"
          >
            Back to Sensa Learn
          </Button>
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warm-coral to-gentle-sky flex items-center justify-center flex-shrink-0">
              <Brain size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-coral dark:text-dark-accent-coral mb-2">
                {course.name}
              </h1>
              {course.description && (
                <p className="text-text-medium dark:text-dark-text-secondary">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chapter Selection (Mock - in production, list real chapters) */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-dark dark:text-dark-text-primary mb-3">
            Select Chapter
          </h2>
          <div className="flex gap-3 flex-wrap">
            {['chapter-1', 'chapter-2', 'chapter-3'].map((chapterId) => (
              <button
                key={chapterId}
                onClick={() => setSelectedChapter(chapterId)}
                className={`
                  px-4 py-2 rounded-lg border transition-all
                  ${selectedChapter === chapterId
                    ? 'bg-warm-coral text-white border-warm-coral'
                    : 'bg-white dark:bg-dark-bg-tertiary text-text-dark dark:text-dark-text-primary border-gray-300 dark:border-dark-border-default hover:border-warm-coral'
                  }
                `}
              >
                Chapter {chapterId.split('-')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        {!analogyData && !analogiesLoading && (
          <div className="mb-8 bg-gradient-to-r from-warm-coral/10 to-gentle-sky/10 dark:from-dark-accent-coral/10 dark:to-dark-accent-sky/10 rounded-lg p-6 border border-warm-coral/30 dark:border-dark-accent-coral/30">
            <div className="flex items-center gap-4">
              <Sparkles size={32} className="text-warm-coral dark:text-dark-accent-coral" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-1">
                  Generate Personalized Learning Content
                </h3>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                  Get AI-powered analogies, memory techniques, and learning mantras tailored to your interests
                </p>
              </div>
              <Button
                onClick={() => handleGenerateAnalogies(false)}
                variant="primary"
                size="lg"
                leftIcon={<Sparkles size={20} />}
                isLoading={generateMutation.isPending}
              >
                Generate Content
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {analogiesLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 size={48} className="animate-spin text-warm-coral dark:text-dark-accent-coral mx-auto mb-4" />
              <p className="text-text-medium dark:text-dark-text-secondary">
                Generating personalized content...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {analogiesError && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">
                  Failed to Load Content
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                  {analogiesError.message}
                </p>
                <Button
                  onClick={() => refetchAnalogies()}
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={16} />}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Analogy Content */}
        {analogyData && (
          <div className="space-y-8">
            {/* Complexity Info */}
            <div className="flex items-center justify-between">
              <ComplexityIndicator 
                complexity={analogyData.complexity} 
                showDetails={true}
                size="lg"
              />
              <Button
                onClick={() => handleGenerateAnalogies(true)}
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={16} />}
                isLoading={generateMutation.isPending}
              >
                Regenerate
              </Button>
            </div>

            {/* Personalized Analogies */}
            <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-warm-coral/10 dark:bg-dark-accent-coral/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-warm-coral dark:text-dark-accent-coral" />
                </div>
                <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary">
                  Personalized Analogies
                </h2>
                {analogyData.cached && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gentle-sky/10 dark:bg-dark-accent-sky/20 text-gentle-sky dark:text-dark-accent-sky">
                    Cached
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {analogyData.analogies.map((analogy) => (
                  <AnalogyCard
                    key={analogy.id}
                    analogy={analogy}
                    onRate={(rating, comment) => handleRateAnalogy(analogy.id, rating, comment)}
                    isRating={feedbackMutation.isPending}
                  />
                ))}
              </div>
            </div>

            {/* Memory Techniques */}
            <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-soft-sage/10 dark:bg-dark-accent-sage/20 flex items-center justify-center">
                  <Brain size={20} className="text-soft-sage dark:text-dark-accent-sage" />
                </div>
                <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary">
                  Memory Techniques
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {analogyData.memory_techniques.map((technique) => (
                  <MemoryTechniqueCard
                    key={technique.id}
                    technique={technique}
                  />
                ))}
              </div>
            </div>

            {/* Learning Mantras */}
            <div className="bg-gradient-to-r from-warm-coral/10 to-gentle-sky/10 dark:from-dark-accent-coral/10 dark:to-dark-accent-sky/10 rounded-lg p-6 border border-warm-coral/30 dark:border-dark-accent-coral/30">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles size={24} className="text-warm-coral dark:text-dark-accent-coral" />
                <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary">
                  Your Learning Mantras
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {analogyData.learning_mantras.map((mantra, index) => (
                  <LearningMantraCard
                    key={mantra.id}
                    mantra={mantra}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feature Preview (shown when no analogies) */}
        {!analogyData && !analogiesLoading && !analogiesError && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-warm-coral/10 dark:bg-dark-accent-coral/20 flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-warm-coral dark:text-dark-accent-coral" />
              </div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                Custom Analogies
              </h3>
              <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                Complex ideas explained through your personal interests
              </p>
            </div>

            <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-soft-sage/10 dark:bg-dark-accent-sage/20 flex items-center justify-center mb-4">
                <Brain size={24} className="text-soft-sage dark:text-dark-accent-sage" />
              </div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                Memory Techniques
              </h3>
              <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                Proven strategies to help information stick
              </p>
            </div>

            <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-gentle-sky/10 dark:bg-dark-accent-sky/20 flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-gentle-sky dark:text-dark-accent-sky" />
              </div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                Learning Mantras
              </h3>
              <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                Motivational phrases to keep you inspired
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
