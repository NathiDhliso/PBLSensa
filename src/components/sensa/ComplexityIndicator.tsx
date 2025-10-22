/**
 * ComplexityIndicator Component
 * 
 * Displays chapter complexity with visual indicators
 */

import { Star, Clock, BookOpen } from 'lucide-react';
import { ComplexityInfo } from '@/types/analogy';

interface ComplexityIndicatorProps {
  complexity: ComplexityInfo;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ComplexityIndicator({ 
  complexity, 
  showDetails = false,
  size = 'md' 
}: ComplexityIndicatorProps) {
  const { score, level, concept_count, estimated_study_time } = complexity;
  
  // Map complexity level to colors
  const colorMap = {
    beginner: {
      bg: 'bg-soft-sage/10 dark:bg-dark-accent-sage/20',
      text: 'text-soft-sage dark:text-dark-accent-sage',
      border: 'border-soft-sage/30 dark:border-dark-accent-sage/30',
    },
    intermediate: {
      bg: 'bg-gentle-sky/10 dark:bg-dark-accent-sky/20',
      text: 'text-gentle-sky dark:text-dark-accent-sky',
      border: 'border-gentle-sky/30 dark:border-dark-accent-sky/30',
    },
    advanced: {
      bg: 'bg-warm-coral/10 dark:bg-dark-accent-coral/20',
      text: 'text-warm-coral dark:text-dark-accent-coral',
      border: 'border-warm-coral/30 dark:border-dark-accent-coral/30',
    },
  };
  
  const colors = colorMap[level];
  
  // Calculate filled stars (out of 5)
  const filledStars = Math.round(score * 5);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };
  
  return (
    <div className="inline-flex flex-col gap-2">
      {/* Complexity Badge */}
      <div 
        className={`
          inline-flex items-center gap-2 rounded-full border
          ${colors.bg} ${colors.border} ${colors.text}
          ${sizeClasses[size]}
          font-medium capitalize
        `}
        title={`Complexity: ${(score * 100).toFixed(0)}%`}
      >
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={size === 'sm' ? 12 : size === 'md' ? 14 : 16}
              className={i < filledStars ? 'fill-current' : 'opacity-30'}
            />
          ))}
        </div>
        <span>{level}</span>
      </div>
      
      {/* Details */}
      {showDetails && (
        <div className="flex items-center gap-3 text-sm text-text-medium dark:text-dark-text-secondary">
          <div className="flex items-center gap-1" title="Number of key concepts">
            <BookOpen size={14} />
            <span>{concept_count} concepts</span>
          </div>
          <div className="flex items-center gap-1" title="Estimated study time">
            <Clock size={14} />
            <span>{estimated_study_time} min</span>
          </div>
        </div>
      )}
    </div>
  );
}
