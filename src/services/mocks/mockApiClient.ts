/**
 * Mock API Client for Development
 * 
 * Simulates API responses with configurable delays and error scenarios
 */

import {
  mockCourses,
  mockDocuments,
  mockConceptMap,
  mockProcessingStatus,
  mockUserProfile,
  mockChapterSummary,
  mockAnalogies,
  mockUploadResponse,
  delay,
} from './mockData';
import {
  Course,
  Document,
  ConceptMap,
  ProcessingStatus,
  UserProfile,
  ChapterSummary,
  AnalogyResponse,
  UploadDocumentResponse,
  UpdateProfileRequest,
  AnalogyFeedback,
  Feedback,
} from '@/types';

/**
 * Mock API configuration
 */
const MOCK_DELAY = 800; // ms
const MOCK_ERROR_RATE = 0; // 0-1 (0 = no errors, 1 = always error)

/**
 * Simulate random errors for testing
 */
function shouldSimulateError(): boolean {
  return Math.random() < MOCK_ERROR_RATE;
}

/**
 * Simulate error response
 */
function simulateError(message: string, statusCode: number = 500): never {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

/**
 * Mock PBL Service
 */
export const mockPblService = {
  async uploadDocument(_courseId: string, _file: File): Promise<UploadDocumentResponse> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to upload document', 500);
    }
    return mockUploadResponse;
  },

  async getProcessingStatus(_taskId: string): Promise<ProcessingStatus> {
    await delay(MOCK_DELAY / 2); // Faster for polling
    if (shouldSimulateError()) {
      simulateError('Failed to get processing status', 500);
    }
    return mockProcessingStatus;
  },

  async getCourses(): Promise<Course[]> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to fetch courses', 500);
    }
    return mockCourses;
  },

  async createCourse(name: string, description: string): Promise<Course> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to create course', 500);
    }
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      document_count: 0,
    };
    return newCourse;
  },

  async getCourse(courseId: string): Promise<Course> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to fetch course', 500);
    }
    const course = mockCourses.find((c) => c.id === courseId);
    if (!course) {
      simulateError('Course not found', 404);
    }
    return course!;
  },

  async getCourseDocuments(courseId: string): Promise<Document[]> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to fetch documents', 500);
    }
    return mockDocuments.filter((d) => d.course_id === courseId);
  },

  async getConceptMap(_courseId: string): Promise<ConceptMap> {
    await delay(MOCK_DELAY * 1.5); // Slower for complex data
    if (shouldSimulateError()) {
      simulateError('Failed to fetch concept map', 500);
    }
    return mockConceptMap;
  },

  async submitFeedback(_feedback: Feedback): Promise<void> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to submit feedback', 500);
    }
  },

  async deleteCourse(_courseId: string): Promise<void> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to delete course', 500);
    }
  },

  async deleteDocument(_documentId: string): Promise<void> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to delete document', 500);
    }
  },
};

/**
 * Mock Sensa Learn Service
 */
export const mockSensaService = {
  async getChapterSummary(_chapterId: string): Promise<ChapterSummary> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to fetch chapter summary', 500);
    }
    return mockChapterSummary;
  },

  async getChapterAnalogies(_chapterId: string): Promise<AnalogyResponse[]> {
    await delay(MOCK_DELAY * 2); // Slower for AI-generated content
    if (shouldSimulateError()) {
      simulateError('Failed to generate analogies', 503);
    }
    return mockAnalogies;
  },

  async getUserProfile(): Promise<UserProfile> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to fetch profile', 500);
    }
    return mockUserProfile;
  },

  async updateProfile(profile: UpdateProfileRequest): Promise<UserProfile> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to update profile', 500);
    }
    return {
      ...mockUserProfile,
      ...profile,
      updated_at: new Date().toISOString(),
    };
  },

  async submitAnalogyFeedback(_feedback: AnalogyFeedback): Promise<void> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to submit feedback', 500);
    }
  },

  async getCourseProgress(_courseId: string): Promise<{
    completed_chapters: string[];
    total_chapters: number;
    completion_percentage: number;
  }> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to fetch progress', 500);
    }
    return {
      completed_chapters: ['chapter-1'],
      total_chapters: 5,
      completion_percentage: 20,
    };
  },

  async markChapterUnderstood(_chapterId: string): Promise<void> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to mark chapter', 500);
    }
  },

  async getRecommendedChapters(_courseId: string): Promise<string[]> {
    await delay(MOCK_DELAY);
    if (shouldSimulateError()) {
      simulateError('Failed to fetch recommendations', 500);
    }
    return ['chapter-2', 'chapter-3'];
  },
};

/**
 * Check if mock API should be used
 */
export function shouldUseMockApi(): boolean {
  return import.meta.env.VITE_ENABLE_MOCK_API === 'true';
}
