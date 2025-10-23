/**
 * Feedback Service
 * 
 * Service for managing user feedback in PBL
 */

import axios from 'axios';
import DOMPurify from 'dompurify';
import type {
  FeedbackSubmission,
  FeedbackStatus,
  FeedbackResponse,
} from '@/types/feedback';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queue for failed submissions
const failedSubmissions: FeedbackSubmission[] = [];

/**
 * Sanitize user input to prevent XSS attacks
 */
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitize feedback content
 */
function sanitizeFeedbackContent(submission: FeedbackSubmission): FeedbackSubmission {
  const sanitized = { ...submission };
  
  if (sanitized.content.explanation) {
    sanitized.content.explanation = sanitizeInput(sanitized.content.explanation);
  }
  
  if (sanitized.content.suggestedDefinition) {
    sanitized.content.suggestedDefinition = sanitizeInput(sanitized.content.suggestedDefinition);
  }
  
  if (sanitized.content.reasoning) {
    sanitized.content.reasoning = sanitizeInput(sanitized.content.reasoning);
  }
  
  if (sanitized.content.relatedConceptName) {
    sanitized.content.relatedConceptName = sanitizeInput(sanitized.content.relatedConceptName);
  }
  
  if (sanitized.content.description) {
    sanitized.content.description = sanitizeInput(sanitized.content.description);
  }
  
  return sanitized;
}

export const feedbackService = {
  /**
   * Submit feedback
   */
  async submitFeedback(submission: FeedbackSubmission): Promise<FeedbackResponse> {
    // Sanitize input
    const sanitized = sanitizeFeedbackContent(submission);
    
    try {
      const response = await api.post('/api/feedback', sanitized);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('You have already submitted feedback for this concept.');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data.message || 'Invalid feedback data.');
        }
      }
      
      // Queue for retry
      failedSubmissions.push(sanitized);
      console.error('Failed to submit feedback, queued for retry:', error);
      throw new Error('Failed to submit feedback. It will be retried automatically.');
    }
  },

  /**
   * Get feedback status for a concept
   */
  async getFeedbackStatus(conceptId: string, userId: string): Promise<FeedbackStatus> {
    try {
      const response = await api.get(`/api/concepts/${conceptId}/feedback/status`, {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch feedback status:', error);
      // Return default status on error
      return {
        conceptId,
        hasFeedback: false,
        feedbackCount: 0,
        feedbackTypes: [],
      };
    }
  },

  /**
   * Get user's feedback history
   */
  async getUserFeedback(userId: string): Promise<FeedbackSubmission[]> {
    try {
      const response = await api.get(`/api/users/${userId}/feedback`);
      return response.data.feedback || [];
    } catch (error) {
      console.error('Failed to fetch user feedback:', error);
      return [];
    }
  },

  /**
   * Retry failed submissions
   */
  async retryFailedSubmissions(): Promise<void> {
    if (failedSubmissions.length === 0) return;

    const toRetry = [...failedSubmissions];
    failedSubmissions.length = 0; // Clear queue

    for (const submission of toRetry) {
      try {
        await api.post('/api/feedback', submission);
        console.log('Successfully retried feedback submission');
      } catch (error) {
        // Re-queue if still failing
        failedSubmissions.push(submission);
        console.error('Retry failed, re-queued:', error);
      }
    }
  },

  /**
   * Get failed submissions count
   */
  getFailedSubmissionsCount(): number {
    return failedSubmissions.length;
  },
};

// Retry failed submissions every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    feedbackService.retryFailedSubmissions();
  }, 5 * 60 * 1000);
}
