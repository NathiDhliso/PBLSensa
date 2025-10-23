/**
 * Music Player Context
 * 
 * Context for managing focus music player state across navigation
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MusicPlayerState {
  isExpanded: boolean;
  isPlaying: boolean;
  currentTrack: string | null;
}

interface MusicPlayerContextType extends MusicPlayerState {
  setIsExpanded: (expanded: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrack: (track: string | null) => void;
  toggleExpanded: () => void;
  stopMusic: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MusicPlayerState>({
    isExpanded: false,
    isPlaying: false,
    currentTrack: null,
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

  const toggleExpanded = () => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  const stopMusic = () => {
    setState({
      isExpanded: false,
      isPlaying: false,
      currentTrack: null,
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
        toggleExpanded,
        stopMusic,
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
