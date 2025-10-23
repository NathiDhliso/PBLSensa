/**
 * AudioNarration Component
 * 
 * Wrapper component for audio narration with loading and error states
 */

import { useEffect } from 'react';
import { Volume2, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import { useAudioNarration } from '@/hooks/useAudioNarration';
import type { AudioNarrationProps } from '@/types/audio';

export function AudioNarration({
  text,
  contentId,
  autoPlay = false,
  className = '',
}: AudioNarrationProps) {
  const {
    isLoading,
    error,
    audioUrl,
    generateAudio,
    play,
    pause,
    updateTime,
  } = useAudioNarration(text, contentId);

  // Auto-generate audio if autoPlay is true
  useEffect(() => {
    if (autoPlay && !audioUrl && !isLoading && !error) {
      generateAudio();
    }
  }, [autoPlay, audioUrl, isLoading, error, generateAudio]);

  // Show nothing if audio service is not available
  if (error && error.includes('not available')) {
    return null;
  }

  return (
    <div className={`audio-narration ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-text-medium dark:text-dark-text-secondary">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Generating audio...</span>
        </div>
      )}

      {/* Error State */}
      {error && !error.includes('not available') && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Listen Button (before audio is generated) */}
      {!audioUrl && !isLoading && !error && (
        <motion.button
          onClick={generateAudio}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warm-coral dark:bg-dark-accent-coral text-white hover:shadow-lg transition-shadow"
          aria-label="Listen to audio narration"
        >
          <Volume2 size={18} />
          <span className="text-sm font-medium">Listen</span>
        </motion.button>
      )}

      {/* Audio Player (after audio is generated) */}
      {audioUrl && !error && (
        <AudioPlayer
          audioUrl={audioUrl}
          onPlay={play}
          onPause={pause}
          onTimeUpdate={updateTime}
        />
      )}
    </div>
  );
}
