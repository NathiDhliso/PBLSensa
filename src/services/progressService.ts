/**
 * Progress Service
 * 
 * Service for tracking and managing user learning progress
 */

import axios from 'axios';
import type { UserProgress, ChapterProgress, ProgressData, UpdateProgressRequest } from '@/types/progress';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const progressService = {
  /**
   * Get user's overall progress
   */
  async getProgress(userId: string): Promise<ProgressData> {
    const response = await api.get(`/api/users/${userId}/progress`);
    return response.data;
  },

  /**
   * Get progress for a specific chapter
   */
  async getChapterProgress(chapterId: string, userId: string): Promise<ChapterProgress> {
    const response = await api.get(`/api/chapters/${chapterId}/progress`, {
      params: { user_id: userId },
    });
    return response.data;
  },

  /**
   * Update progress (mark chapter complete, log activity, etc.)
   */
  async updateProgress(userId: string, data: UpdateProgressRequest): Promise<UserProgress> {
    const response = await api.post(`/api/users/${userId}/progress`, data);
    return response.data;
  },

  /**
   * Mark chapter as complete
   */
  async markChapterComplete(chapterId: string, userId: string): Promise<ChapterProgress> {
    const response = await api.post(`/api/chapters/${chapterId}/complete`, {
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Calculate overall completion percentage
   */
  calculateOverallCompletion(chapters: ChapterProgress[]): number {
    if (chapters.length === 0) return 0;
    const completed = chapters.filter(ch => ch.completed).length;
    return Math.round((completed / chapters.length) * 100);
  },
};
