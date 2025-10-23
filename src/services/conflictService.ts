/**
 * Conflict Service
 * 
 * Service for managing concept conflicts in PBL
 */

import axios from 'axios';
import type {
  ConceptConflict,
  ConflictResolution,
  ConflictResolutionRequest,
  ConflictListResponse,
} from '@/types/conflict';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const conflictService = {
  /**
   * Get all conflicts for a concept
   */
  async getConflicts(conceptId: string): Promise<ConceptConflict[]> {
    try {
      const response = await api.get(`/api/concepts/${conceptId}/conflicts`);
      return response.data.conflicts || [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // No conflicts found - return empty array
        return [];
      }
      console.error('Failed to fetch conflicts:', error);
      throw new Error('Failed to load conflicts. Please try again.');
    }
  },

  /**
   * Get all conflicts for a course
   */
  async getCourseConflicts(courseId: string): Promise<ConflictListResponse> {
    try {
      const response = await api.get(`/api/courses/${courseId}/conflicts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch course conflicts:', error);
      throw new Error('Failed to load course conflicts. Please try again.');
    }
  },

  /**
   * Get a specific conflict by ID
   */
  async getConflict(conflictId: string): Promise<ConceptConflict> {
    try {
      const response = await api.get(`/api/conflicts/${conflictId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('Conflict not found.');
      }
      console.error('Failed to fetch conflict:', error);
      throw new Error('Failed to load conflict. Please try again.');
    }
  },

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    userId: string,
    request: ConflictResolutionRequest
  ): Promise<ConflictResolution> {
    try {
      const response = await api.post(`/api/conflicts/${request.conflictId}/resolve`, {
        ...request,
        userId,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Conflict not found.');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data.message || 'Invalid resolution data.');
        }
      }
      console.error('Failed to resolve conflict:', error);
      throw new Error('Failed to save resolution. Please try again.');
    }
  },

  /**
   * Dismiss a conflict (mark as not a real conflict)
   */
  async dismissConflict(conflictId: string, userId: string): Promise<void> {
    try {
      await api.post(`/api/conflicts/${conflictId}/dismiss`, { userId });
    } catch (error) {
      console.error('Failed to dismiss conflict:', error);
      throw new Error('Failed to dismiss conflict. Please try again.');
    }
  },

  /**
   * Get AI recommendation for a conflict
   */
  async getAIRecommendation(conflictId: string): Promise<ConceptConflict> {
    try {
      const response = await api.post(`/api/conflicts/${conflictId}/recommend`);
      return response.data;
    } catch (error) {
      console.error('Failed to get AI recommendation:', error);
      throw new Error('Failed to get AI recommendation. Please try again.');
    }
  },
};
