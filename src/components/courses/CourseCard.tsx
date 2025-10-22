/**
 * CourseCard Component
 * 
 * Display card for a course with name, description, and document count
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Trash2, Calendar } from 'lucide-react';
import { Course } from '@/types/api';
import { Button } from '@/components/ui';
import { cardHoverInteraction } from '@/utils/animations';

interface CourseCardProps {
  course: Course;
  onDelete: (courseId: string) => void;
}

export function CourseCard({ course, onDelete }: CourseCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${course.name}"? This will also delete all documents in this course.`)) {
      onDelete(course.id);
    }
  };

  const documentCount = course.document_count || 0;
  const createdDate = new Date(course.created_at).toLocaleDateString();

  return (
    <motion.div
      {...cardHoverInteraction}
      onClick={handleClick}
      className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border border-gray-200 dark:border-dark-border-default"
    >
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-deep-amethyst to-warm-coral flex items-center justify-center">
            <BookOpen size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary line-clamp-1">
              {course.name}
            </h3>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          aria-label="Delete course"
        >
          <Trash2 size={18} />
        </Button>
      </div>

      {/* Description */}
      {course.description && (
        <p className="text-sm text-text-medium dark:text-dark-text-secondary mb-4 line-clamp-2">
          {course.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-sm text-text-light dark:text-dark-text-tertiary">
        <div className="flex items-center gap-1">
          <FileText size={16} />
          <span>{documentCount} {documentCount === 1 ? 'document' : 'documents'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={16} />
          <span>{createdDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
