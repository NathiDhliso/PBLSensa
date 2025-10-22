/**
 * LearningMantraCard Component
 * 
 * Displays an inspirational learning mantra with explanation
 */

import { Sparkles } from 'lucide-react';
import { LearningMantra } from '@/types/analogy';

interface LearningMantraCardProps {
  mantra: LearningMantra;
  index: number;
}

export function LearningMantraCard({ mantra, index }: LearningMantraCardProps) {
  // Rotate through gradient colors
  const gradients = [
    'from-warm-coral/20 to-gentle-sky/20 dark:from-dark-accent-coral/20 dark:to-dark-accent-sky/20',
    'from-gentle-sky/20 to-soft-sage/20 dark:from-dark-accent-sky/20 dark:to-dark-accent-sage/20',
    'from-soft-sage/20 to-deep-amethyst/20 dark:from-dark-accent-sage/20 dark:to-dark-accent-amethyst/20',
    'from-deep-amethyst/20 to-warm-coral/20 dark:from-dark-accent-amethyst/20 dark:to-dark-accent-coral/20',
  ];
  
  const borders = [
    'border-warm-coral/30 dark:border-dark-accent-coral/30',
    'border-gentle-sky/30 dark:border-dark-accent-sky/30',
    'border-soft-sage/30 dark:border-dark-accent-sage/30',
    'border-deep-amethyst/30 dark:border-dark-accent-amethyst/30',
  ];
  
  const textColors = [
    'text-warm-coral dark:text-dark-accent-coral',
    'text-gentle-sky dark:text-dark-accent-sky',
    'text-soft-sage dark:text-dark-accent-sage',
    'text-deep-amethyst dark:text-dark-accent-amethyst',
  ];
  
  const gradient = gradients[index % gradients.length];
  const border = borders[index % borders.length];
  const textColor = textColors[index % textColors.length];
  
  return (
    <div className={`
      relative rounded-lg p-6 border
      bg-gradient-to-br ${gradient} ${border}
      transition-all hover:shadow-lg hover:scale-[1.02]
      overflow-hidden
    `}>
      {/* Decorative Icon */}
      <div className="absolute top-2 right-2 opacity-10">
        <Sparkles size={48} className={textColor} />
      </div>
      
      {/* Mantra Text */}
      <div className="relative z-10">
        <p className={`
          text-xl font-bold mb-3 leading-tight
          ${textColor}
        `}>
          "{mantra.mantra_text}"
        </p>
        
        {/* Explanation */}
        <p className="text-sm text-text-medium dark:text-dark-text-secondary leading-relaxed">
          {mantra.explanation}
        </p>
      </div>
    </div>
  );
}
