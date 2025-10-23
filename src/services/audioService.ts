/**
 * Audio Service
 * 
 * Service for generating and caching audio narration using ElevenLabs API
 */

import { audioCache } from '@/utils/audioCache';
import type { ElevenLabsConfig, ElevenLabsRequest } from '@/types/audio';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Get config from environment variables
const config: ElevenLabsConfig = {
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', // Default voice
  modelId: 'eleven_monolingual_v1',
};

export const audioService = {
  /**
   * Generate speech from text using ElevenLabs API
   */
  async generateSpeech(text: string, contentId: string): Promise<Blob> {
    // Check cache first
    const cached = await this.getCachedAudio(contentId);
    if (cached) {
      return cached;
    }

    // Validate API key
    if (!config.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const requestBody: ElevenLabsRequest = {
        text,
        model_id: config.modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      };

      const response = await fetch(
        `${ELEVENLABS_API_URL}/${config.voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': config.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your configuration.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 500) {
          throw new Error('Audio generation failed. Please try again later.');
        } else {
          throw new Error(`Audio generation failed: ${response.statusText}`);
        }
      }

      const blob = await response.blob();

      // Cache the audio
      await this.cacheAudio(contentId, blob);

      return blob;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unable to generate audio. Check your connection.');
    }
  },

  /**
   * Get cached audio blob
   */
  async getCachedAudio(contentId: string): Promise<Blob | null> {
    return await audioCache.get(contentId);
  },

  /**
   * Cache audio blob
   */
  async cacheAudio(contentId: string, blob: Blob): Promise<void> {
    await audioCache.store(contentId, blob);
  },

  /**
   * Clear all cached audio
   */
  async clearCache(): Promise<void> {
    await audioCache.clear();
  },

  /**
   * Check if audio is available (API key configured)
   */
  isAvailable(): boolean {
    return !!config.apiKey;
  },
};
