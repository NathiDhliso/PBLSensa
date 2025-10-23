/**
 * useAudioNarration Hook
 * 
 * Hook for managing audio narration state and generation
 */

import { useState, useCallback, useEffect } from 'react';
import { audioService } from '@/services/audioService';
import { audioCache } from '@/utils/audioCache';
import type { AudioState } from '@/types/audio';

export function useAudioNarration(text: string, contentId: string) {
  const [state, setState] = useState<AudioState>({
    isLoading: false,
    isPlaying: false,
    error: null,
    audioUrl: null,
    currentTime: 0,
    duration: 0,
  });

  // Generate or retrieve audio
  const generateAudio = useCallback(async () => {
    if (!audioService.isAvailable()) {
      setState(prev => ({
        ...prev,
        error: 'Audio service is not available',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const blob = await audioService.generateSpeech(text, contentId);
      const url = audioCache.createObjectURL(blob);

      setState(prev => ({
        ...prev,
        isLoading: false,
        audioUrl: url,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate audio',
      }));
    }
  }, [text, contentId]);

  // Play audio
  const play = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  // Pause audio
  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Stop audio
  const stop = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
    }));
  }, []);

  // Update time
  const updateTime = useCallback((currentTime: number, duration: number) => {
    setState(prev => ({
      ...prev,
      currentTime,
      duration,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.audioUrl) {
        audioCache.revokeObjectURL(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

  return {
    ...state,
    generateAudio,
    play,
    pause,
    stop,
    updateTime,
  };
}
