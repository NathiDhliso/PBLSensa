/**
 * BadgeModal Component
 * 
 * Modal showing badge details
 */

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BadgeWithProgress } from '@/types/badges';

interface BadgeModalProps {
  badge: BadgeWithProgress;
  onClose: () => void;
}

export function BadgeModal({ badge, onClose }: BadgeModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white dark:bg-dark-bg-tertiary rounded-xl shadow-2xl max-w-md w-full p-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-text-medium dark:text-dark-text-secondary" />
          </button>

          {/* Badge Icon */}
          <div className="text-center mb-4">
            <div className={`text-7xl ${!badge.isUnlocked ? 'grayscale' : ''}`}>
              {badge.icon}
            </div>
          </div>

          {/* Badge Name */}
          <h2 className="text-2xl font-bold text-center text-text-dark dark:text-dark-text-primary mb-2">
            {badge.name}
          </h2>

          {/* Badge Category */}
          <p className="text-sm text-center text-text-medium dark:text-dark-text-secondary mb-4 capitalize">
            {badge.category} Badge
          </p>

          {/* Badge Description */}
          <p className="text-center text-text-dark dark:text-dark-text-primary mb-6">
            {badge.description}
          </p>

          {/* Requirement */}
          <div className="bg-gray-50 dark:bg-dark-bg-secondary rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-text-dark dark:text-dark-text-primary mb-2">
              How to Earn:
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary">
              {badge.requirement.description}
            </p>
          </div>

          {/* Progress for Locked Badges */}
          {!badge.isUnlocked && badge.progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-text-medium dark:text-dark-text-secondary mb-2">
                <span>Your Progress</span>
                <span className="font-semibold">{badge.progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-dark-bg-primary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${badge.progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-warm-coral to-gentle-sky"
                />
              </div>
            </div>
          )}

          {/* Unlock Date for Earned Badges */}
          {badge.isUnlocked && badge.unlockedAt && (
            <div className="text-center p-4 bg-gradient-to-r from-warm-coral/10 to-gentle-sky/10 dark:from-dark-accent-coral/10 dark:to-dark-accent-sky/10 rounded-lg">
              <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                Earned on
              </p>
              <p className="text-lg font-semibold text-text-dark dark:text-dark-text-primary">
                {new Date(badge.unlockedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-warm-coral to-gentle-sky text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
