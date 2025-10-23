/**
 * AnalogyCard Component
 * 
 * Displays a personalized analogy with rating functionality
 * Enhanced with audio coordination for music ducking
 */

import { useState } from 'react';
import { Sparkles, Star, ThumbsUp } from 'lucide-react';
import { Analogy } from '@/types/analogy';
import { AudioNarration } from '@/components/audio/AudioNarration';
import { useAudioCoordination } from '@/contexts/AudioCoordinationContext';

interface AnalogyCardProps {
  analogy: Analogy;
  onRate?: (rating: number, comment?: string) => Promise<void>;
  isRating?: boolean;
}

export function AnalogyCard({ analogy, onRate, isRating }: AnalogyCardProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);
  const { startNarration, stopNarration } = useAudioCoordination();
  
  const handleRating = async (rating: number) => {
    if (!onRate || hasRated) return;
    
    setSelectedRating(rating);
    try {
      await onRate(rating);
      setHasRated(true);
    } catch (error) {
      setSelectedRating(0);
    }
  };
  
  const displayRating = hoverRating || selectedRating;
  
  return (
    <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg p-6 shadow-lg border border-gray-200 dark:border-dark-border-default transition-all hover:shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-warm-coral to-gentle-sky flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary">
            {analogy.concept}
          </h3>
        </div>
        
        {/* Average Rating Display */}
        {analogy.average_rating && analogy.rating_count > 0 && (
          <div className="flex items-center gap-1 text-sm text-text-medium dark:text-dark-text-secondary">
            <Star size={14} className="fill-warm-coral text-warm-coral" />
            <span>{analogy.average_rating.toFixed(1)}</span>
            <span className="text-xs">({analogy.rating_count})</span>
          </div>
        )}
      </div>
      
      {/* Analogy Text */}
      <p className="text-text-dark dark:text-dark-text-primary leading-relaxed mb-4">
        {analogy.analogy_text}
      </p>
      
      {/* Audio Narration */}
      <div className="mb-4">
        <AudioNarration
          text={analogy.analogy_text}
          contentId={`analogy-${analogy.id}`}
          onNarrationStart={() => startNarration(`analogy-${analogy.id}`)}
          onNarrationStop={() => stopNarration(`analogy-${analogy.id}`)}
        />
      </div>
      
      {/* Interest Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gentle-sky/10 dark:bg-dark-accent-sky/20 text-gentle-sky dark:text-dark-accent-sky text-sm">
          <ThumbsUp size={12} />
          Based on your interest in: {analogy.based_on_interest}
        </span>
      </div>
      
      {/* Learning Style Adaptation */}
      <p className="text-sm text-text-medium dark:text-dark-text-secondary italic mb-4 pl-4 border-l-2 border-warm-coral/30 dark:border-dark-accent-coral/30">
        {analogy.learning_style_adaptation}
      </p>
      
      {/* Rating Section */}
      {onRate && !hasRated && (
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border-default">
          <p className="text-sm text-text-medium dark:text-dark-text-secondary mb-2">
            How helpful was this analogy?
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRating(rating)}
                onMouseEnter={() => setHoverRating(rating)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={isRating}
                className="p-1 hover:scale-110 transition-transform disabled:opacity-50"
                aria-label={`Rate ${rating} stars`}
              >
                <Star
                  size={24}
                  className={
                    rating <= displayRating
                      ? 'fill-warm-coral text-warm-coral'
                      : 'text-gray-300 dark:text-gray-600'
                  }
                />
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Thank You Message */}
      {hasRated && (
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border-default">
          <p className="text-sm text-soft-sage dark:text-dark-accent-sage flex items-center gap-2">
            <ThumbsUp size={16} />
            Thank you for your feedback!
          </p>
        </div>
      )}
    </div>
  );
}
