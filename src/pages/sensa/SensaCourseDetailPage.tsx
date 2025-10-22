/**
 * Sensa Course Detail Page
 * 
 * Shows personalized chapter summaries and analogies for a specific course
 */

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { useCourse } from '@/hooks';
import { Button } from '@/components/ui';
import { pageTransition } from '@/utils/animations';

export function SensaCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading, error } = useCourse(courseId!);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-warm-coral dark:text-dark-accent-coral mx-auto mb-4" />
          <p className="text-text-medium dark:text-dark-text-secondary">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
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
              {error?.message || 'Course not found'}
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
      <div className="max-w-4xl mx-auto">
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

        {/* Personalized Learning Content */}
        <div className="space-y-6">
          {/* Chapter Summaries */}
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-warm-coral/10 dark:bg-dark-accent-coral/20 flex items-center justify-center">
                <Brain size={20} className="text-warm-coral dark:text-dark-accent-coral" />
              </div>
              <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary">
                Chapter Summaries
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Chapter 1 */}
              <div className="border-l-4 border-warm-coral dark:border-dark-accent-coral pl-4 py-2">
                <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  Chapter 1: Introduction
                </h3>
                <p className="text-text-medium dark:text-dark-text-secondary mb-3">
                  This chapter introduces the fundamental concepts and provides an overview of the key topics 
                  you'll be learning. It sets the foundation for understanding more complex ideas later.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-warm-coral/10 dark:bg-dark-accent-coral/20 text-warm-coral dark:text-dark-accent-coral rounded-full text-sm">
                    Basics
                  </span>
                  <span className="px-3 py-1 bg-warm-coral/10 dark:bg-dark-accent-coral/20 text-warm-coral dark:text-dark-accent-coral rounded-full text-sm">
                    Overview
                  </span>
                  <span className="px-3 py-1 bg-warm-coral/10 dark:bg-dark-accent-coral/20 text-warm-coral dark:text-dark-accent-coral rounded-full text-sm">
                    Foundation
                  </span>
                </div>
              </div>

              {/* Chapter 2 */}
              <div className="border-l-4 border-gentle-sky dark:border-dark-accent-sky pl-4 py-2">
                <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  Chapter 2: Core Concepts
                </h3>
                <p className="text-text-medium dark:text-dark-text-secondary mb-3">
                  Dive deep into the theoretical foundations and practical applications. This chapter builds 
                  on the introduction and explores the main principles in detail.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gentle-sky/10 dark:bg-dark-accent-sky/20 text-gentle-sky dark:text-dark-accent-sky rounded-full text-sm">
                    Theory
                  </span>
                  <span className="px-3 py-1 bg-gentle-sky/10 dark:bg-dark-accent-sky/20 text-gentle-sky dark:text-dark-accent-sky rounded-full text-sm">
                    Practice
                  </span>
                  <span className="px-3 py-1 bg-gentle-sky/10 dark:bg-dark-accent-sky/20 text-gentle-sky dark:text-dark-accent-sky rounded-full text-sm">
                    Applications
                  </span>
                </div>
              </div>

              {/* Chapter 3 */}
              <div className="border-l-4 border-soft-sage dark:border-dark-accent-sage pl-4 py-2">
                <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  Chapter 3: Advanced Topics
                </h3>
                <p className="text-text-medium dark:text-dark-text-secondary mb-3">
                  Explore real-world applications and advanced techniques. This chapter shows how to apply 
                  what you've learned to solve practical problems.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-soft-sage/10 dark:bg-dark-accent-sage/20 text-soft-sage dark:text-dark-accent-sage rounded-full text-sm">
                    Real-world
                  </span>
                  <span className="px-3 py-1 bg-soft-sage/10 dark:bg-dark-accent-sage/20 text-soft-sage dark:text-dark-accent-sage rounded-full text-sm">
                    Advanced
                  </span>
                  <span className="px-3 py-1 bg-soft-sage/10 dark:bg-dark-accent-sage/20 text-soft-sage dark:text-dark-accent-sage rounded-full text-sm">
                    Problem-solving
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Analogies */}
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gentle-sky/10 dark:bg-dark-accent-sky/20 flex items-center justify-center">
                <Sparkles size={20} className="text-gentle-sky dark:text-dark-accent-sky" />
              </div>
              <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary">
                Custom Analogies
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-gentle-sky/10 to-warm-coral/10 dark:from-dark-accent-sky/10 dark:to-dark-accent-coral/10 rounded-lg border border-gentle-sky/30 dark:border-dark-accent-sky/30">
                <h4 className="font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  💡 Understanding Core Concepts
                </h4>
                <p className="text-text-medium dark:text-dark-text-secondary mb-2">
                  Think of the core concepts like building blocks in LEGO. Each piece (concept) has a specific 
                  shape and purpose, and when you connect them correctly, you can build amazing structures 
                  (solutions to problems).
                </p>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary italic">
                  Based on your interest in: Building & Construction
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-warm-coral/10 to-soft-sage/10 dark:from-dark-accent-coral/10 dark:to-dark-accent-sage/10 rounded-lg border border-warm-coral/30 dark:border-dark-accent-coral/30">
                <h4 className="font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  🎯 Applying Theory to Practice
                </h4>
                <p className="text-text-medium dark:text-dark-text-secondary mb-2">
                  Learning theory without practice is like reading a cookbook without cooking. You might 
                  understand the recipe, but you won't truly know how it tastes or how to adjust it until 
                  you actually make the dish yourself.
                </p>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary italic">
                  Based on your interest in: Cooking & Culinary Arts
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-soft-sage/10 to-gentle-sky/10 dark:from-dark-accent-sage/10 dark:to-dark-accent-sky/10 rounded-lg border border-soft-sage/30 dark:border-dark-accent-sage/30">
                <h4 className="font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  🚀 Advanced Problem Solving
                </h4>
                <p className="text-text-medium dark:text-dark-text-secondary mb-2">
                  Advanced problem-solving is like being a detective. You gather clues (data), form hypotheses 
                  (theories), test them (experiments), and piece together the solution. Each problem is a new 
                  mystery to solve!
                </p>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary italic">
                  Based on your interest in: Mystery & Detective Stories
                </p>
              </div>
            </div>
          </div>

          {/* Memory Techniques */}
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-soft-sage/10 dark:bg-dark-accent-sage/20 flex items-center justify-center">
                <BookOpen size={20} className="text-soft-sage dark:text-dark-accent-sage" />
              </div>
              <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary">
                Memory Techniques
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-soft-sage/5 dark:bg-dark-accent-sage/10 rounded-lg border border-soft-sage/20 dark:border-dark-accent-sage/20">
                <h4 className="font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  🎨 Acronym Method
                </h4>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary mb-2">
                  Create memorable acronyms from key terms. For example, "BASICS" could stand for:
                </p>
                <ul className="text-sm text-text-medium dark:text-dark-text-secondary space-y-1 ml-4">
                  <li><strong>B</strong>uild foundation</li>
                  <li><strong>A</strong>pply concepts</li>
                  <li><strong>S</strong>tudy examples</li>
                  <li><strong>I</strong>ntegrate knowledge</li>
                  <li><strong>C</strong>reate solutions</li>
                  <li><strong>S</strong>ynthesize learning</li>
                </ul>
              </div>

              <div className="p-4 bg-warm-coral/5 dark:bg-dark-accent-coral/10 rounded-lg border border-warm-coral/20 dark:border-dark-accent-coral/20">
                <h4 className="font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  🗺️ Mind Palace Technique
                </h4>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary mb-2">
                  Associate concepts with locations in a familiar place:
                </p>
                <ul className="text-sm text-text-medium dark:text-dark-text-secondary space-y-1 ml-4">
                  <li>• <strong>Front door:</strong> Introduction concepts</li>
                  <li>• <strong>Living room:</strong> Core theories</li>
                  <li>• <strong>Kitchen:</strong> Practical applications</li>
                  <li>• <strong>Bedroom:</strong> Advanced topics</li>
                </ul>
              </div>

              <div className="p-4 bg-gentle-sky/5 dark:bg-dark-accent-sky/10 rounded-lg border border-gentle-sky/20 dark:border-dark-accent-sky/20">
                <h4 className="font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  🔗 Chunking Method
                </h4>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                  Break complex information into smaller, manageable chunks. Group related concepts together 
                  and learn them as units rather than individual pieces. This reduces cognitive load and 
                  improves retention.
                </p>
              </div>

              <div className="p-4 bg-deep-amethyst/5 dark:bg-dark-accent-amethyst/10 rounded-lg border border-deep-amethyst/20 dark:border-dark-accent-amethyst/20">
                <h4 className="font-semibold text-text-dark dark:text-dark-text-primary mb-2">
                  📝 Spaced Repetition
                </h4>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                  Review material at increasing intervals: after 1 day, 3 days, 1 week, 2 weeks, and 1 month. 
                  This technique leverages the spacing effect to move information into long-term memory.
                </p>
              </div>
            </div>
          </div>

          {/* Learning Mantras */}
          <div className="bg-gradient-to-r from-warm-coral/10 to-gentle-sky/10 dark:from-dark-accent-coral/10 dark:to-dark-accent-sky/10 rounded-lg p-6 border border-warm-coral/30 dark:border-dark-accent-coral/30">
            <h3 className="text-xl font-bold text-text-dark dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <Sparkles size={24} className="text-warm-coral dark:text-dark-accent-coral" />
              Your Learning Mantras
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center p-4">
                <p className="text-lg font-semibold text-warm-coral dark:text-dark-accent-coral mb-2">
                  "Progress over perfection"
                </p>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                  Every step forward is a victory
                </p>
              </div>
              <div className="text-center p-4">
                <p className="text-lg font-semibold text-gentle-sky dark:text-dark-accent-sky mb-2">
                  "Connect, don't just collect"
                </p>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                  Link new knowledge to what you know
                </p>
              </div>
              <div className="text-center p-4">
                <p className="text-lg font-semibold text-soft-sage dark:text-dark-accent-sage mb-2">
                  "Practice makes permanent"
                </p>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                  Repetition builds mastery
                </p>
              </div>
              <div className="text-center p-4">
                <p className="text-lg font-semibold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
                  "Teach to truly learn"
                </p>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                  Explaining solidifies understanding
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg p-6">
            <div className="w-12 h-12 rounded-full bg-warm-coral/10 dark:bg-dark-accent-coral/20 flex items-center justify-center mb-4">
              <Brain size={24} className="text-warm-coral dark:text-dark-accent-coral" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
              Chapter Summaries
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary">
              Key concepts distilled into easy-to-understand summaries
            </p>
          </div>

          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg p-6">
            <div className="w-12 h-12 rounded-full bg-gentle-sky/10 dark:bg-dark-accent-sky/20 flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-gentle-sky dark:text-dark-accent-sky" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
              Custom Analogies
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary">
              Complex ideas explained through your personal interests
            </p>
          </div>

          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg p-6">
            <div className="w-12 h-12 rounded-full bg-soft-sage/10 dark:bg-dark-accent-sage/20 flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-soft-sage dark:text-dark-accent-sage" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-2">
              Memory Techniques
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary">
              Proven strategies to help information stick
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
