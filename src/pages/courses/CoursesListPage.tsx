/**
 * CoursesListPage Component
 * 
 * Main page displaying list of all courses
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, ArrowLeft } from 'lucide-react';
import { useCourses, useCreateCourse, useDeleteCourse } from '@/hooks';
import { useToast } from '@/contexts/ToastContext';
import { CourseCard } from '@/components/courses/CourseCard';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { Button } from '@/components/ui';
import { pageTransition, staggerContainer, staggerItem } from '@/utils/animations';

export function CoursesListPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: courses, isLoading, error } = useCourses();
  const { mutateAsync: createCourse, isPending: isCreating } = useCreateCourse();
  const { mutate: deleteCourse } = useDeleteCourse();
  const { showToast } = useToast();

  const handleCreateCourse = async (data: { name: string; description?: string }) => {
    try {
      await createCourse({
        name: data.name,
        description: data.description || '',
      });
      showToast('success', 'Course created successfully!');
      setIsCreateModalOpen(false);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create course');
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    deleteCourse(courseId, {
      onSuccess: () => showToast('success', 'Course deleted successfully'),
      onError: (error: any) => showToast('error', error.message || 'Failed to delete course'),
    });
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen p-4 pt-20"
    >
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/pbl')}
          variant="ghost"
          size="md"
          leftIcon={<ArrowLeft size={20} />}
          className="mb-6"
        >
          Back to PBL Portal
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
              My Courses
            </h1>
            <p className="text-text-medium dark:text-dark-text-secondary">
              Organize your learning materials by course
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            size="lg"
            leftIcon={<Plus size={20} />}
          >
            Create Course
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 dark:bg-dark-bg-secondary rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Failed to load courses: {error.message}
            </p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && courses && courses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-deep-amethyst/10 dark:bg-dark-accent-amethyst/20 mb-6">
              <BookOpen size={48} className="text-deep-amethyst dark:text-dark-accent-amethyst" />
            </div>
            <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary mb-2">
              No courses yet
            </h2>
            <p className="text-text-medium dark:text-dark-text-secondary mb-6">
              Create your first course to start organizing your learning materials
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
            >
              Create Your First Course
            </Button>
          </motion.div>
        )}

        {/* Courses Grid */}
        {!isLoading && !error && courses && courses.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {courses.map((course) => (
              <motion.div key={course.id} variants={staggerItem}>
                <CourseCard course={course} onDelete={handleDeleteCourse} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create Course Modal */}
        <CreateCourseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCourse}
          isLoading={isCreating}
        />
      </div>
    </motion.div>
  );
}
