/**
 * StreakDisplay Component
 * 
 * Displays learning streak with flame icon and animations
 */

import { Flame, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakDisplayProps {
  days: number;
  longestStreak?: number;
  isAtRisk?: boolean;
}

export function StreakDisplay({ days, longestStreak, isAtRisk = false }: StreakDisplayProps) {
  // Determine flame color based on streak length
  const getFlameColor = () => {
    if (days >= 30) return 'text-yellow-500 dark:text-yellow-400'; // Gold
    if (days >= 7) return 'text-orange-500 dark:text-orange-400'; // Orange with glow
    return 'text-orange-500 dark:text-orange-400'; // Standard orange
  };

  const flameColor = getFlameColor();
  const hasGlow = days >= 7;
  const isGold = days >= 30;

  return (
    <div className="flex items-center gap-3">
      {/* Flame Icon */}
      <motion.div
        className="relative"
        animate={hasGlow ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Flame
          size={32}
          className={`${flameColor} ${hasGlow ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : ''}`}
          fill="currentColor"
        />
        {isGold && (
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Flame
              size={32}
              className="text-yellow-300"
              fill="currentColor"
            />
          </motion.div>
        )}
      </motion.div>

      {/* Streak Info */}
      <div>
        <div className="flex items-center gap-2">
          <p className="text-3xl font-bold text-text-dark dark:text-dark-text-primary">
            {days}
          </p>
          {isAtRisk && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <AlertCircle size={20} className="text-orange-500" />
            </motion.div>
          )}
        </div>
        <p className="text-sm text-text-medium dark:text-dark-text-secondary">
          Day Streak {days >= 7 ? '🔥' : ''}
        </p>
        {longestStreak !== undefined && longestStreak > days && (
          <p className="text-xs text-text-light dark:text-dark-text-tertiary">
            Best: {longestStreak} days
          </p>
        )}
        {isAtRisk && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Learn today to keep your streak!
          </p>
        )}
      </div>
    </div>
  );
}
