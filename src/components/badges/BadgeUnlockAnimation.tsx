/**
 * BadgeUnlockAnimation Component
 * 
 * Celebration animation when a badge is unlocked
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { BadgeDefinition } from '@/types/badges';

interface BadgeUnlockAnimationProps {
  badge: BadgeDefinition;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function BadgeUnlockAnimation({
  badge,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: BadgeUnlockAnimationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([]);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      rotation: Math.random() * 360,
    }));
    setConfetti(particles);

    // Auto-close after delay
    if (autoClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Confetti */}
        {confetti.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: '50vw', 
              y: '50vh', 
              scale: 0, 
              opacity: 1,
              rotate: 0 
            }}
            animate={{
              x: `calc(50vw + ${particle.x}vw)`,
              y: `calc(50vh + ${particle.y}vh)`,
              scale: [0, 1, 0.8],
              opacity: [1, 1, 0],
              rotate: particle.rotation,
            }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: `hsl(${Math.random() * 360}, 70%, 60%)`,
            }}
          />
        ))}

        {/* Main Content */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            rotate: 0,
            opacity: 1,
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
          className="relative bg-white dark:bg-dark-bg-tertiary rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
        >
          {/* Sparkles Icon */}
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="inline-block mb-4"
          >
            <Sparkles size={48} className="text-warm-coral dark:text-dark-accent-coral" />
          </motion.div>

          {/* Congratulations */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-text-dark dark:text-dark-text-primary mb-2"
          >
            Congratulations!
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-text-medium dark:text-dark-text-secondary mb-6"
          >
            You've earned a new badge!
          </motion.p>

          {/* Badge Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: [0, 1.3, 1],
              rotate: 0,
            }}
            transition={{ 
              delay: 0.5,
              type: 'spring',
              stiffness: 200,
              damping: 10,
            }}
            className="text-8xl mb-4"
          >
            {badge.icon}
          </motion.div>

          {/* Badge Name */}
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-2xl font-bold text-text-dark dark:text-dark-text-primary mb-2"
          >
            {badge.name}
          </motion.h3>

          {/* Badge Description */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-text-medium dark:text-dark-text-secondary mb-6"
          >
            {badge.description}
          </motion.p>

          {/* Close Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-warm-coral to-gentle-sky text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Awesome!
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
