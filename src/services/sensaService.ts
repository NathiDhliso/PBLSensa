/**
 * Sensa Learn Service
 * 
 * This module provides API methods for Sensa Learn personalized learning features:
 * - Chapter summaries
 * - Personalized analogies
 * - User profile management
 * - Analogy feedback
 * 
 * @example
 * import { sensaService } from '@/services/sensaService';
 * const summary = await sensaService.getChapterSummary('chapter-123');
 */

import { apiClient } from './api';
import {
  ChapterSummary,
  AnalogyResponse,
  UserProfile,
  AnalogyFeedback,
  UpdateProfileRequest,
} from '@/types';

/**
 * Sensa Learn Service
 */
export const sensaService = {
  /**
   * Get chapter summary
   * 
   * @param chapterId - Chapter ID
   * @returns Promise with chapter summary
   * 
   * @example
   * const summary = await sensaService.getChapterSummary('chapter-123');
   * console.log(summary.summary);
   * console.log(`Complexity: ${summary.complexity_score}/100`);
   */
  async getChapterSummary(chapterId: string): Promise<ChapterSummary> {
    try {
      const response = await apiClient.get<ChapterSummary>(
        `/sensa-learn/chapter/${chapterId}/summary`
      );
      return response.data;
    } catch (error: any) {
      // Provide context-specific error message
      if (error.statusCode === 404) {
        throw new Error(`Chapter not found: ${chapterId}`);
      }
      throw new Error(error.message || 'Failed to load chapter summary');
    }
  },

  /**
   * Get personalized analogies for a chapter
   * 
   * @param chapterId - Chapter ID
   * @returns Promise with array of analogies
   * 
   * @example
   * const analogies = await sensaService.getChapterAnalogies('chapter-123');
   * analogies.forEach(analogy => {
   *   console.log(analogy.title);
   *   console.log(analogy.analogy_text);
   *   console.log(analogy.learning_mantra);
   * });
   */
  async getChapterAnalogies(chapterId: string): Promise<AnalogyResponse[]> {
    try {
      const response = await apiClient.get<AnalogyResponse[]>(
        `/sensa-learn/chapter/${chapterId}/analogies`
      );
      return response.data;
    } catch (error: any) {
      // Provide context-specific error message
      if (error.statusCode === 404) {
        throw new Error(`Chapter not found: ${chapterId}`);
      }
      if (error.statusCode === 503) {
        throw new Error('Analogy generation is temporarily unavailable. Please try again later.');
      }
      throw new Error(error.message || 'Failed to load analogies');
    }
  },

  /**
   * Get user profile
   * 
   * @returns Promise with user profile
   * 
   * @example
   * const profile = await sensaService.getUserProfile();
   * console.log(profile.interests);
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>('/profile');
      return response.data;
    } catch (error: any) {
      // Provide context-specific error message
      if (error.statusCode === 404) {
        throw new Error('Profile not found. Please complete your profile setup.');
      }
      throw new Error(error.message || 'Failed to load profile');
    }
  },

  /**
   * Update user profile
   * 
   * @param profile - Profile updates
   * @returns Promise with updated profile
   * 
   * @example
   * const updatedProfile = await sensaService.updateProfile({
   *   age_range: '18-24',
   *   interests: ['biology', 'chemistry', 'physics']
   * });
   */
  async updateProfile(profile: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await apiClient.put<UserProfile>('/profile', profile);
      return response.data;
    } catch (error: any) {
      // Provide context-specific error message
      if (error.statusCode === 400) {
        throw new Error('Invalid profile data. Please check your input.');
      }
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Submit analogy feedback
   * 
   * @param feedback - Analogy feedback
   * @returns Promise that resolves when feedback is submitted
   * 
   * @example
   * await sensaService.submitAnalogyFeedback({
   *   analogy_id: 'analogy-123',
   *   helpful: true,
   *   comment: 'This analogy really helped me understand the concept!'
   * });
   */
  async submitAnalogyFeedback(feedback: AnalogyFeedback): Promise<void> {
    try {
      await apiClient.post('/feedback/analogy', feedback);
    } catch (error: any) {
      // Provide context-specific error message
      if (error.statusCode === 404) {
        throw new Error('Analogy not found');
      }
      throw new Error(error.message || 'Failed to submit feedback');
    }
  },

  /**
   * Get learning progress for a course
   * 
   * @param courseId - Course ID
   * @returns Promise with progress data
   * 
   * @example
   * const progress = await sensaService.getCourseProgress('course-123');
   */
  async getCourseProgress(courseId: string): Promise<{
    completed_chapters: string[];
    total_chapters: number;
    completion_percentage: number;
  }> {
    try {
      const response = await apiClient.get(`/sensa-learn/course/${courseId}/progress`);
      return response.data;
    } catch (error: any) {
      // Provide context-specific error message
      if (error.statusCode === 404) {
        throw new Error(`Course not found: ${courseId}`);
      }
      throw new Error(error.message || 'Failed to load progress');
    }
  },

  /**
   * Mark a chapter as understood
   * 
   * @param chapterId - Chapter ID
   * @returns Promise that resolves when chapter is marked
   * 
   * @example
   * await sensaService.markChapterUnderstood('chapter-123');
   */
  async markChapterUnderstood(chapterId: string): Promise<void> {
    try {
      await apiClient.post(`/sensa-learn/chapter/${chapterId}/understood`);
    } catch (error: any) {
      // Provide context-specific error message
      if (error.statusCode === 404) {
        throw new Error(`Chapter not found: ${chapterId}`);
      }
      throw new Error(error.message || 'Failed to mark chapter as understood');
    }
  },

  /**
   * Get recommended chapters based on user progress
   * 
   * @param courseId - Course ID
   * @returns Promise with array of recommended chapter IDs
   * 
   * @example
   * const recommendations = await sensaService.getRecommendedChapters('course-123');
   */
  async getRecommendedChapters(courseId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>(
        `/sensa-learn/course/${courseId}/recommendations`
      );
      return response.data;
    } catch (error: any) {
      // Provide context-specific error message
      if (error.statusCode === 404) {
        throw new Error(`Course not found: ${courseId}`);
      }
      throw new Error(error.message || 'Failed to load recommendations');
    }
  },
};
