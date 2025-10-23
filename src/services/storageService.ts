/**
 * Storage Service
 * 
 * Wrapper for IndexedDB operations using idb library
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SensaLearnDB extends DBSchema {
  audio: {
    key: string;
    value: {
      contentId: string;
      blob: Blob;
      cachedAt: number;
      expiresAt: number;
    };
  };
}

const DB_NAME = 'sensa-learn-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SensaLearnDB> | null = null;

async function getDB(): Promise<IDBPDatabase<SensaLearnDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SensaLearnDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create audio store
      if (!db.objectStoreNames.contains('audio')) {
        db.createObjectStore('audio', { keyPath: 'contentId' });
      }
    },
  });

  return dbInstance;
}

export const storageService = {
  /**
   * Store audio blob in IndexedDB
   */
  async storeAudio(contentId: string, blob: Blob, ttlDays: number = 7): Promise<void> {
    try {
      const db = await getDB();
      const now = Date.now();
      const expiresAt = now + (ttlDays * 24 * 60 * 60 * 1000);

      await db.put('audio', {
        contentId,
        blob,
        cachedAt: now,
        expiresAt,
      });
    } catch (error) {
      console.warn('Failed to store audio in IndexedDB:', error);
      // Don't throw - caching is optional
    }
  },

  /**
   * Retrieve audio blob from IndexedDB
   */
  async getAudio(contentId: string): Promise<Blob | null> {
    try {
      const db = await getDB();
      const cached = await db.get('audio', contentId);

      if (!cached) return null;

      // Check expiration
      if (Date.now() > cached.expiresAt) {
        await db.delete('audio', contentId);
        return null;
      }

      return cached.blob;
    } catch (error) {
      console.warn('Failed to retrieve audio from IndexedDB:', error);
      return null;
    }
  },

  /**
   * Delete audio blob from IndexedDB
   */
  async deleteAudio(contentId: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('audio', contentId);
    } catch (error) {
      console.warn('Failed to delete audio from IndexedDB:', error);
    }
  },

  /**
   * Clear all audio cache
   */
  async clearAudioCache(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('audio');
    } catch (error) {
      console.warn('Failed to clear audio cache:', error);
    }
  },

  /**
   * Get cache size and implement LRU eviction if needed
   */
  async manageCacheSize(maxSizeMB: number = 100): Promise<void> {
    try {
      const db = await getDB();
      const allAudio = await db.getAll('audio');

      // Calculate total size
      let totalSize = 0;
      for (const item of allAudio) {
        totalSize += item.blob.size;
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      // If over limit, remove oldest items
      if (totalSize > maxSizeBytes) {
        // Sort by cachedAt (oldest first)
        allAudio.sort((a, b) => a.cachedAt - b.cachedAt);

        // Remove items until under limit
        for (const item of allAudio) {
          if (totalSize <= maxSizeBytes) break;
          await db.delete('audio', item.contentId);
          totalSize -= item.blob.size;
        }
      }
    } catch (error) {
      console.warn('Failed to manage cache size:', error);
    }
  },
};
