/**
 * Analogy Service
 * 
 * API service for analogy generation and feedback
 */

import axios from 'axios';
import {
  AnalogyGenerationResponse,
  ComplexityInfo,
  FeedbackRequest,
  FeedbackResponse,
  FeedbackSummary,
} from '@/types/analogy';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analogyService = {
  /**
   * Generate analogies for a chapter
   */
  async generateAnalogies(
    chapterId: string,
    userId: string,
    forceRegenerate: boolean = false
  ): Promise<AnalogyGenerationResponse> {
    const response = await api.post(
      `/api/chapters/${chapterId}/generate-analogies`,
      null,
      {
        params: {
          user_id: userId,
          force_regenerate: forceRegenerate,
        },
      }
    );
    return response.data;
  },

  /**
   * Get cached analogies for a chapter
   */
  async getAnalogies(
    chapterId: string,
    userId: string
  ): Promise<AnalogyGenerationResponse> {
    const response = await api.get(`/api/chapters/${chapterId}/analogies`, {
      params: {
        user_id: userId,
      },
    });
    return response.data;
  },

  /**
   * Get complexity info for a chapter
   */
  async getComplexity(chapterId: string): Promise<ComplexityInfo> {
    const response = await api.get(`/api/chapters/${chapterId}/complexity`);
    return response.data;
  },

  /**
   * Submit feedback for an analogy
   */
  async submitFeedback(
    analogyId: string,
    feedback: FeedbackRequest
  ): Promise<FeedbackResponse> {
    const response = await api.post(
      `/api/analogies/${analogyId}/feedback`,
      feedback
    );
    return response.data;
  },

  /**
   * Get feedback summary for an analogy
   */
  async getFeedbackSummary(analogyId: string): Promise<FeedbackSummary> {
    const response = await api.get(`/api/analogies/${analogyId}/feedback`);
    return response.data;
  },
};
