/**
 * StreakDisplay Component (Learning Consistency Tracker)
 * 
 * Professional display of learning consistency
 * Refactored to use consistency terminology while maintaining backward compatibility
 */

import { Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakDisplayProps {
  days: number;
  longestStreak?: number;
  isAtRisk?: boolean;
}

export function StreakDisplay({ days, longestStreak, isAtRisk = false }: StreakDisplayProps) {
  // Determine color based on consistency level
  const getConsistencyColor = () => {
    if (days >= 30) return 'text-soft-sage dark:text-dark-accent-sage'; // Sage for long consistency
    if (days >= 7) return 'text-gentle-sky dark:text-dark-accent-sky'; // Sky for weekly consistency
    return 'text-warm-coral dark:text-dark-accent-coral'; // Coral for starting
  };

  const consistencyColor = getConsistencyColor();
  const hasHighlight = days >= 7;

  return (
    <div className="flex items-center gap-4">
      {/* Calendar Icon - Professional */}
      <motion.div
        className="relative"
        animate={hasHighlight ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className={`p-3 rounded-xl bg-gradient-to-br ${
          days >= 30 
            ? 'from-soft-sage/10 to-soft-sage/5 dark:from-dark-accent-sage/10 dark:to-dark-accent-sage/5' 
            : days >= 7
            ? 'from-gentle-sky/10 to-gentle-sky/5 dark:from-dark-accent-sky/10 dark:to-dark-accent-sky/5'
            : 'from-warm-coral/10 to-warm-coral/5 dark:from-dark-accent-coral/10 dark:to-dark-accent-coral/5'
        }`}>
          <Calendar
            size={28}
            className={consistencyColor}
          />
        </div>
      </motion.div>

      {/* Consistency Info */}
      <div>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-text-dark dark:text-dark-text-primary">
            {days} {days === 1 ? 'Day' : 'Days'}
          </p>
          {isAtRisk && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <AlertCircle size={18} className="text-warm-coral dark:text-dark-accent-coral" />
            </motion.div>
          )}
        </div>
        <p className="text-sm text-text-medium dark:text-dark-text-secondary">
          Learning Consistency
        </p>
        {longestStreak !== undefined && longestStreak > days && (
          <p className="text-xs text-text-light dark:text-dark-text-tertiary mt-1">
            Personal best: {longestStreak} days
          </p>
        )}
        {isAtRisk && (
          <p className="text-xs text-warm-coral dark:text-dark-accent-coral mt-1">
            Continue learning today to maintain consistency
          </p>
        )}
      </div>
    </div>
  );
}
