/**
 * BadgeCard Component (Milestone Display)
 * 
 * Displays a learning milestone with professional design
 * Refactored to use milestone terminology while maintaining backward compatibility
 */

import { Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BadgeWithProgress } from '@/types/badges';

interface BadgeCardProps {
  badge: BadgeWithProgress;
  onClick?: () => void;
}

export function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const isLocked = !badge.isUnlocked;
  const progress = badge.progress || 0;
  
  // Use milestone terminology in display
  const displayName = badge.name;
  const displayDescription = badge.description;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border transition-all
        ${isLocked 
          ? 'bg-white dark:bg-dark-bg-secondary border-gray-200 dark:border-dark-border-default cursor-default' 
          : 'bg-white dark:bg-dark-bg-secondary border-soft-sage dark:border-dark-accent-sage shadow-md cursor-pointer'
        }
      `}
      role="button"
      tabIndex={0}
      aria-label={`${displayName} milestone${isLocked ? ' (in progress)' : ' (achieved)'}`}
    >
      {/* Status Icon */}
      <div className="absolute top-3 right-3">
        {isLocked ? (
          <Lock size={18} className="text-gray-300 dark:text-gray-600" />
        ) : (
          <CheckCircle size={18} className="text-soft-sage dark:text-dark-accent-sage" />
        )}
      </div>

      {/* Milestone Icon - Professional, no grayscale */}
      <div className="text-center mb-3">
        <div className={`text-4xl ${isLocked ? 'opacity-40' : 'opacity-100'}`}>
          {badge.icon}
        </div>
      </div>

      {/* Milestone Name */}
      <h3 className={`text-base font-semibold text-center mb-2 ${
        isLocked 
          ? 'text-gray-500 dark:text-gray-400' 
          : 'text-text-dark dark:text-dark-text-primary'
      }`}>
        {displayName}
      </h3>

      {/* Milestone Description */}
      <p className={`text-sm text-center mb-3 ${
        isLocked 
          ? 'text-gray-400 dark:text-gray-500' 
          : 'text-text-medium dark:text-dark-text-secondary'
      }`}>
        {displayDescription}
      </p>

      {/* Professional Progress Bar */}
      {isLocked && progress > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span className="font-medium">Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-bg-primary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-soft-sage dark:bg-dark-accent-sage"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            {badge.requirement.description}
          </p>
        </div>
      )}

      {/* Achievement Date */}
      {!isLocked && badge.unlockedAt && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
          Achieved {new Date(badge.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}
