/**
 * PBL Dashboard Page
 * 
 * Main dashboard for the PBL (Perspective-Based Learning) portal
 * Shows courses, recent uploads, and quick actions
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Upload, Map, ArrowLeft, Plus } from 'lucide-react';
import { useCourses } from '@/hooks';
import { Button } from '@/components/ui';
import { pageTransition } from '@/utils/animations';

export function PBLDashboardPage() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();

  const courseCount = courses?.length || 0;
  const documentCount = courses?.reduce((sum, course) => sum + (course.document_count || 0), 0) || 0;

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
              <h1 className="text-4xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
                PBL Portal
              </h1>
              <p className="text-text-medium dark:text-dark-text-secondary">
                Manage your courses and learning materials
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-medium dark:text-dark-text-secondary">
                Total Courses
              </h3>
              <BookOpen size={20} className="text-deep-amethyst dark:text-dark-accent-amethyst" />
            </div>
            <p className="text-3xl font-bold text-text-dark dark:text-dark-text-primary">
              {isLoading ? '...' : courseCount}
            </p>
          </div>

          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-medium dark:text-dark-text-secondary">
                Documents Uploaded
              </h3>
              <Upload size={20} className="text-warm-coral dark:text-dark-accent-coral" />
            </div>
            <p className="text-3xl font-bold text-text-dark dark:text-dark-text-primary">
              {isLoading ? '...' : documentCount}
            </p>
          </div>

          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-medium dark:text-dark-text-secondary">
                Concept Maps
              </h3>
              <Map size={20} className="text-soft-sage dark:text-dark-accent-sage" />
            </div>
            <p className="text-3xl font-bold text-text-dark dark:text-dark-text-primary">
              {isLoading ? '...' : courseCount}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/pbl/courses')}
            className="p-6 bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-deep-amethyst/10 dark:bg-dark-accent-amethyst/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen size={24} className="text-deep-amethyst dark:text-dark-accent-amethyst" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-1">
                  Manage Courses
                </h3>
                <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                  View, create, and organize your courses
                </p>
              </div>
              <div className="text-deep-amethyst dark:text-dark-accent-amethyst group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/pbl/courses')}
            className="p-6 bg-gradient-to-br from-deep-amethyst to-warm-coral rounded-lg shadow-lg hover:shadow-xl transition-shadow text-left group text-white"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  Create New Course
                </h3>
                <p className="text-sm text-white/80">
                  Start organizing new learning materials
                </p>
              </div>
              <div className="group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-4">
            Getting Started with PBL
          </h2>
          <div className="space-y-4 text-text-medium dark:text-dark-text-secondary">
            <p>
              The PBL Portal helps you organize and understand your learning materials through:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Course Management:</strong> Organize materials by subject or topic</li>
              <li><strong>Document Processing:</strong> Upload PDFs and let AI extract key concepts</li>
              <li><strong>Concept Maps:</strong> Visualize relationships between ideas</li>
              <li><strong>Smart Organization:</strong> Automatic categorization and tagging</li>
            </ul>
            <div className="mt-6 p-4 bg-gentle-sky/10 dark:bg-dark-accent-sky/10 rounded-lg border border-gentle-sky/30 dark:border-dark-accent-sky/30">
              <p className="text-sm">
                <strong className="text-gentle-sky dark:text-dark-accent-sky">💡 Tip:</strong> Once you've uploaded documents here, head to <strong>Sensa Learn</strong> to get personalized analogies and memory techniques based on your content!
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
