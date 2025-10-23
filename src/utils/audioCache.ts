/**
 * Audio Cache Utilities
 * 
 * Helper functions for audio caching logic
 */

import { storageService } from '@/services/storageService';

export const audioCache = {
  /**
   * Generate cache key for audio content
   */
  getCacheKey(contentId: string): string {
    return `audio_${contentId}`;
  },

  /**
   * Store audio with automatic cache management
   */
  async store(contentId: string, blob: Blob): Promise<void> {
    await storageService.storeAudio(contentId, blob);
    // Manage cache size after storing
    await storageService.manageCacheSize(100); // 100MB limit
  },

  /**
   * Retrieve cached audio
   */
  async get(contentId: string): Promise<Blob | null> {
    return await storageService.getAudio(contentId);
  },

  /**
   * Check if audio is cached
   */
  async has(contentId: string): Promise<boolean> {
    const blob = await storageService.getAudio(contentId);
    return blob !== null;
  },

  /**
   * Clear all cached audio
   */
  async clear(): Promise<void> {
    await storageService.clearAudioCache();
  },

  /**
   * Create object URL from blob
   */
  createObjectURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  },

  /**
   * Revoke object URL
   */
  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  },
};
