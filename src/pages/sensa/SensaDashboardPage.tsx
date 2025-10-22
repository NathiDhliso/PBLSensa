/**
 * Sensa Learn Dashboard Page
 * 
 * Main dashboard for the Sensa Learn portal
 * Shows personalized learning content, analogies, and memory techniques
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Heart, ArrowLeft, BookOpen } from 'lucide-react';
import { useCourses } from '@/hooks';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui';
import { pageTransition } from '@/utils/animations';

export function SensaDashboardPage() {
  const navigate = useNavigate();
  const { data: courses } = useCourses();
  const { data: profile } = useProfile();

  const hasContent = courses && courses.length > 0;
  const hasProfile = profile && profile.interests && profile.interests.length > 0;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen p-4 pt-20"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="md"
              leftIcon={<ArrowLeft size={20} />}
            >
              Back to Portals
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-warm-coral dark:text-dark-accent-coral mb-2">
                Sensa Learn
              </h1>
              <p className="text-text-medium dark:text-dark-text-secondary">
                Your personalized learning companion
              </p>
            </div>
          </div>
        </div>

        {/* Setup Required State */}
        {(!hasContent || !hasProfile) && (
          <div className="bg-gradient-to-br from-warm-coral/10 to-gentle-sky/10 dark:from-dark-accent-coral/10 dark:to-dark-accent-sky/10 rounded-xl p-8 mb-8 border-2 border-dashed border-warm-coral/30 dark:border-dark-accent-coral/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-warm-coral/20 dark:bg-dark-accent-coral/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={24} className="text-warm-coral dark:text-dark-accent-coral" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-text-dark dark:text-dark-text-primary mb-2">
                  Let's Get You Started!
                </h3>
                <p className="text-text-medium dark:text-dark-text-secondary mb-4">
                  Sensa Learn creates personalized analogies and memory techniques based on your PBL content and interests.
                </p>
                <div className="space-y-3">
                  {!hasProfile && (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-dark-bg-tertiary rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-warm-coral/10 dark:bg-dark-accent-coral/20 flex items-center justify-center">
                        <span className="text-warm-coral dark:text-dark-accent-coral font-bold">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-dark dark:text-dark-text-primary">
                          Complete your profile with interests
                        </p>
                        <p className="text-xs text-text-medium dark:text-dark-text-secondary">
                          Tell us what you're passionate about
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate('/profile')}
                        variant="outline"
                        size="sm"
                      >
                        Set Up Profile
                      </Button>
                    </div>
                  )}
                  {!hasContent && (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-dark-bg-tertiary rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-warm-coral/10 dark:bg-dark-accent-coral/20 flex items-center justify-center">
                        <span className="text-warm-coral dark:text-dark-accent-coral font-bold">
                          {!hasProfile ? '2' : '1'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-dark dark:text-dark-text-primary">
                          Upload content in PBL Portal
                        </p>
                        <p className="text-xs text-text-medium dark:text-dark-text-secondary">
                          Add courses and documents to learn from
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate('/pbl')}
                        variant="outline"
                        size="sm"
                        leftIcon={<BookOpen size={16} />}
                      >
                        Go to PBL
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 rounded-full bg-warm-coral/10 dark:bg-dark-accent-coral/20 flex items-center justify-center mb-4">
              <Brain size={24} className="text-warm-coral dark:text-dark-accent-coral" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
              Smart Analogies
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary">
              Complex concepts explained through personalized analogies based on your interests
            </p>
          </div>

          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 rounded-full bg-gentle-sky/10 dark:bg-dark-accent-sky/20 flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-gentle-sky dark:text-dark-accent-sky" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
              Memory Techniques
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary">
              Proven memory strategies tailored to your learning style and content
            </p>
          </div>

          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 rounded-full bg-soft-sage/10 dark:bg-dark-accent-sage/20 flex items-center justify-center mb-4">
              <Heart size={24} className="text-soft-sage dark:text-dark-accent-sage" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
              Learning Mantras
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary">
              Motivational phrases and hints to keep you engaged and focused
            </p>
          </div>
        </div>

        {/* Main Content */}
        {hasContent && hasProfile ? (
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-warm-coral dark:text-dark-accent-coral mb-4">
              Your Learning Journey
            </h2>
            <p className="text-text-medium dark:text-dark-text-secondary mb-6">
              Select a course to view personalized chapter summaries and analogies.
            </p>
            
            {/* Course List */}
            <div className="space-y-3">
              {courses?.map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/sensa/course/${course.id}`)}
                  className="w-full p-4 bg-gray-50 dark:bg-dark-bg-secondary rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-primary transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-dark dark:text-dark-text-primary group-hover:text-warm-coral dark:group-hover:text-dark-accent-coral transition-colors">
                        {course.name}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-text-medium dark:text-dark-text-secondary mt-1">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <div className="text-warm-coral dark:text-dark-accent-coral group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-warm-coral dark:text-dark-accent-coral mb-4">
              How Sensa Learn Works
            </h2>
            <div className="space-y-4 text-text-medium dark:text-dark-text-secondary">
              <p>
                Sensa Learn transforms your PBL content into memorable learning experiences:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personalized Analogies:</strong> Complex concepts explained through things you already know and love</li>
                <li><strong>Chapter Summaries:</strong> Key points distilled for quick review</li>
                <li><strong>Memory Techniques:</strong> Proven strategies to help information stick</li>
                <li><strong>Learning Mantras:</strong> Motivational phrases to keep you engaged</li>
              </ul>
              <div className="mt-6 p-4 bg-warm-coral/10 dark:bg-dark-accent-coral/10 rounded-lg border border-warm-coral/30 dark:border-dark-accent-coral/30">
                <p className="text-sm">
                  <strong className="text-warm-coral dark:text-dark-accent-coral">✨ Example:</strong> If you love cooking and you're learning about chemical reactions, Sensa Learn might explain it through baking chemistry - how ingredients interact like reactants in a lab!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
