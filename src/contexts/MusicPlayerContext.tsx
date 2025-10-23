/**
 * Music Player Context
 * 
 * Context for managing focus music player state across navigation
 * Enhanced with volume control and ducking for audio coordination
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const DEFAULT_VOLUME = 0.7;
const STORAGE_KEY = 'music-player-volume';

interface MusicPlayerState {
  isExpanded: boolean;
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;
  originalVolume: number;
  isDucked: boolean;
}

interface MusicPlayerContextType extends MusicPlayerState {
  setIsExpanded: (expanded: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrack: (track: string | null) => void;
  setVolume: (volume: number) => void;
  toggleExpanded: () => void;
  stopMusic: () => void;
  duckVolume: () => void;
  restoreVolume: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  // Load saved volume from localStorage
  const getSavedVolume = (): number => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? parseFloat(saved) : DEFAULT_VOLUME;
    } catch {
      return DEFAULT_VOLUME;
    }
  };

  const [state, setState] = useState<MusicPlayerState>({
    isExpanded: false,
    isPlaying: false,
    currentTrack: null,
    volume: getSavedVolume(),
    originalVolume: getSavedVolume(),
    isDucked: false,
  });

  const setIsExpanded = (expanded: boolean) => {
    setState(prev => ({ ...prev, isExpanded: expanded }));
  };

  const setIsPlaying = (playing: boolean) => {
    setState(prev => ({ ...prev, isPlaying: playing }));
  };

  const setCurrentTrack = (track: string | null) => {
    setState(prev => ({ ...prev, currentTrack: track }));
  };

  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({
      ...prev,
      volume: clampedVolume,
      originalVolume: prev.isDucked ? prev.originalVolume : clampedVolume,
    }));
    
    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, clampedVolume.toString());
    } catch (error) {
      console.warn('Failed to save volume preference:', error);
    }
  };

  const toggleExpanded = () => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  const stopMusic = () => {
    setState(prev => ({
      ...prev,
      isExpanded: false,
      isPlaying: false,
      currentTrack: null,
    }));
  };

  /**
   * Duck volume to 20% for audio narration
   */
  const duckVolume = () => {
    setState(prev => {
      if (prev.isDucked) return prev; // Already ducked
      
      return {
        ...prev,
        originalVolume: prev.volume,
        volume: prev.volume * 0.2,
        isDucked: true,
      };
    });
  };

  /**
   * Restore volume to original level
   */
  const restoreVolume = () => {
    setState(prev => {
      if (!prev.isDucked) return prev; // Not ducked
      
      return {
        ...prev,
        volume: prev.originalVolume,
        isDucked: false,
      };
    });
  };

  // Stop music on unmount (logout)
  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        ...state,
        setIsExpanded,
        setIsPlaying,
        setCurrentTrack,
        setVolume,
        toggleExpanded,
        stopMusic,
        duckVolume,
        restoreVolume,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
