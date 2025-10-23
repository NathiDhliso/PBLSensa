/**
 * Audio Types
 * 
 * Type definitions for audio narration system
 */

export interface AudioState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  audioUrl: string | null;
  currentTime: number;
  duration: number;
}

export interface AudioNarrationProps {
  text: string;
  contentId: string;
  autoPlay?: boolean;
  className?: string;
  onNarrationStart?: () => void;
  onNarrationStop?: () => void;
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}

export interface ElevenLabsRequest {
  text: string;
  model_id: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
}

export interface AudioPlayerProps {
  audioUrl: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}
