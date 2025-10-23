/**
 * FocusMusicPlayer Component
 * 
 * Floating music player widget for Sensa Learn portal
 * Only visible in Sensa Learn view
 */

import { useLocation } from 'react-router-dom';
import { Music, X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { MusicWidget } from './MusicWidget';

export function FocusMusicPlayer() {
  const location = useLocation();
  const { isExpanded, toggleExpanded } = useMusicPlayer();
  
  // Only show in Sensa Learn view
  const isSensaView = location.pathname.startsWith('/sensa');
  
  if (!isSensaView) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Minimized state - circular button
          <motion.button
            key="minimized"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleExpanded}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-warm-coral to-gentle-sky dark:from-dark-accent-coral dark:to-dark-accent-sky text-white shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center"
            aria-label="Open focus music player"
          >
            <Music size={28} />
          </motion.button>
        ) : (
          // Expanded state - widget
          <motion.div
            key="expanded"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-80 bg-white dark:bg-dark-bg-tertiary rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border-default bg-gradient-to-r from-warm-coral/10 to-gentle-sky/10 dark:from-dark-accent-coral/10 dark:to-dark-accent-sky/10">
              <div className="flex items-center gap-2">
                <Music size={20} className="text-warm-coral dark:text-dark-accent-coral" />
                <h3 className="font-semibold text-text-dark dark:text-dark-text-primary">
                  Focus Music
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleExpanded}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-secondary text-text-medium dark:text-dark-text-secondary"
                  aria-label="Minimize music player"
                >
                  <Minimize2 size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleExpanded}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-secondary text-text-medium dark:text-dark-text-secondary"
                  aria-label="Close music player"
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            {/* Widget Content */}
            <div className="p-4">
              <MusicWidget />
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              <p className="text-xs text-text-medium dark:text-dark-text-secondary text-center">
                Powered by Brain.fm
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
