/**
 * Audio Coordination Context
 * 
 * Manages audio priorities and volume ducking across narration and music
 * Priority: Narration > Celebrations > Background Music
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useMusicPlayer } from './MusicPlayerContext';

interface AudioCoordinationState {
  activeNarration: string | null;
  isDucking: boolean;
}

interface AudioCoordinationContextType extends AudioCoordinationState {
  startNarration: (narrationId: string) => void;
  stopNarration: (narrationId: string) => void;
  isNarrationActive: () => boolean;
}

const AudioCoordinationContext = createContext<AudioCoordinationContextType | undefined>(undefined);

const DUCK_VOLUME_MULTIPLIER = 0.2; // Reduce music to 20% when narration plays

export function AudioCoordinationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioCoordinationState>({
    activeNarration: null,
    isDucking: false,
  });

  const musicPlayer = useMusicPlayer();

  /**
   * Start narration - duck music if playing
   */
  const startNarration = useCallback((narrationId: string) => {
    setState(prev => ({
      ...prev,
      activeNarration: narrationId,
      isDucking: true,
    }));

    // Duck music volume if music is playing
    if (musicPlayer.isPlaying) {
      musicPlayer.duckVolume();
    }
  }, [musicPlayer]);

  /**
   * Stop narration - restore music volume
   */
  const stopNarration = useCallback((narrationId: string) => {
    setState(prev => {
      // Only stop if this is the active narration
      if (prev.activeNarration === narrationId) {
        return {
          ...prev,
          activeNarration: null,
          isDucking: false,
        };
      }
      return prev;
    });

    // Restore music volume if it was ducked
    if (state.isDucking && musicPlayer.isPlaying) {
      musicPlayer.restoreVolume();
    }
  }, [state.isDucking, musicPlayer]);

  /**
   * Check if any narration is currently active
   */
  const isNarrationActive = useCallback(() => {
    return state.activeNarration !== null;
  }, [state.activeNarration]);

  return (
    <AudioCoordinationContext.Provider
      value={{
        ...state,
        startNarration,
        stopNarration,
        isNarrationActive,
      }}
    >
      {children}
    </AudioCoordinationContext.Provider>
  );
}

export function useAudioCoordination() {
  const context = useContext(AudioCoordinationContext);
  if (context === undefined) {
    throw new Error('useAudioCoordination must be used within an AudioCoordinationProvider');
  }
  return context;
}

export { DUCK_VOLUME_MULTIPLIER };
