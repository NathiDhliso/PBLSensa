/**
 * BadgeCard Component
 * 
 * Displays a single badge with progress
 */

import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BadgeWithProgress } from '@/types/badges';

interface BadgeCardProps {
  badge: BadgeWithProgress;
  onClick?: () => void;
}

export function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const isLocked = !badge.isUnlocked;
  const progress = badge.progress || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border-2 cursor-pointer transition-all
        ${isLocked 
          ? 'bg-gray-100 dark:bg-dark-bg-secondary border-gray-300 dark:border-dark-border-muted opacity-60' 
          : 'bg-gradient-to-br from-warm-coral/10 to-gentle-sky/10 dark:from-dark-accent-coral/10 dark:to-dark-accent-sky/10 border-warm-coral dark:border-dark-accent-coral shadow-lg'
        }
      `}
      role="button"
      tabIndex={0}
      aria-label={`${badge.name} badge${isLocked ? ' (locked)' : ' (unlocked)'}`}
    >
      {/* Lock Icon for Locked Badges */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <Lock size={16} className="text-gray-400 dark:text-gray-600" />
        </div>
      )}

      {/* Badge Icon */}
      <div className="text-center mb-3">
        <div className={`text-5xl ${isLocked ? 'grayscale' : ''}`}>
          {badge.icon}
        </div>
      </div>

      {/* Badge Name */}
      <h3 className={`text-lg font-bold text-center mb-2 ${
        isLocked 
          ? 'text-gray-600 dark:text-gray-400' 
          : 'text-text-dark dark:text-dark-text-primary'
      }`}>
        {badge.name}
      </h3>

      {/* Badge Description */}
      <p className={`text-sm text-center mb-3 ${
        isLocked 
          ? 'text-gray-500 dark:text-gray-500' 
          : 'text-text-medium dark:text-dark-text-secondary'
      }`}>
        {badge.description}
      </p>

      {/* Progress Bar for Locked Badges */}
      {isLocked && progress > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-dark-bg-primary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-warm-coral to-gentle-sky"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center">
            {badge.requirement.description}
          </p>
        </div>
      )}

      {/* Unlock Date for Earned Badges */}
      {!isLocked && badge.unlockedAt && (
        <p className="text-xs text-text-light dark:text-dark-text-tertiary text-center mt-2">
          Earned {new Date(badge.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}
