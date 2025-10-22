/**
 * CreateCourseModal Component
 * 
 * Modal for creating a new course
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button, Modal } from '@/components/ui';

const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(100, 'Course name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateCourseModal({ isOpen, onClose, onSubmit, isLoading }: CreateCourseModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: CourseFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Course"
      size="md"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            label="Course Name"
            placeholder="e.g., Introduction to Biology"
            error={errors.name?.message}
            required
            autoFocus
          />

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-text-dark dark:text-dark-text-primary mb-2"
            >
              Description <span className="text-text-light dark:text-dark-text-tertiary">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              placeholder="Brief description of the course..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border-default bg-white dark:bg-dark-bg-secondary text-text-dark dark:text-dark-text-primary placeholder-text-light dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-deep-amethyst dark:focus:ring-dark-accent-amethyst transition-colors"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="flex-1"
            >
              Create Course
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
