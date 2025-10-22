/**
 * ProfileCompletionBanner Component
 * 
 * Dismissible banner prompting profile completion
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { AlertCircle, X } from 'lucide-react';

interface ProfileCompletionBannerProps {
  onComplete: () => void;
  onDismiss: () => void;
}

const BANNER_DISMISSED_KEY = 'profile-completion-banner-dismissed';

export function ProfileCompletionBanner({ onComplete, onDismiss }: ProfileCompletionBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const wasDismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (!wasDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-deep-amethyst to-warm-coral text-white shadow-lg"
        >
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <AlertCircle size={24} className="flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Complete your profile for personalized learning</p>
                  <p className="text-sm text-white/90">
                    Add your interests and preferences to get tailored content recommendations
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={onComplete}
                  variant="secondary"
                  size="sm"
                  className="bg-white text-deep-amethyst hover:bg-white/90"
                >
                  Complete Profile
                </Button>
                
                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
