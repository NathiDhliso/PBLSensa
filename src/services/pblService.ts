/**
 * PBL (Perspective-Based Learning) Service
 * 
 * This module provides API methods for PBL features including:
 * - Course management
 * - Document upload and processing
 * - Concept map retrieval
 * - Feedback submission
 * 
 * @example
 * import { pblService } from '@/services/pblService';
 * const courses = await pblService.getCourses();
 */

import { apiClient } from './api';
import {
  Course,
  Document,
  ConceptMap,
  ProcessingStatus,
  Feedback,
  CreateCourseRequest,
  UploadDocumentResponse,
} from '@/types';
import type {
  Concept,
  ConceptValidation,
  ConceptUpdate,
  ValidationResponse,
  Relationship,
  RelationshipCreate,
  StructuresResponse,
  DuplicatesResponse,
  MergeConceptsResponse,
  PBLVisualization,
  NodeUpdate,
  EdgeCreate,

  LayoutChangeResponse,
  ExportVisualizationResponse,
  DeleteResponse,
} from '@/types/pbl';

/**
 * Generate SHA256 hash of a file
 * Used for deduplication and caching
 */
async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * PBL Service
 */
export const pblService = {
  /**
   * Upload a document to a course
   * 
   * @param courseId - ID of the course to upload to
   * @param file - PDF file to upload
   * @param sha256Hash - Optional pre-computed SHA256 hash
   * @returns Promise with task ID for tracking processing status
   * 
   * @example
   * const { task_id } = await pblService.uploadDocument('course-123', pdfFile, hash);
   * // Poll status with task_id
   */
  async uploadDocument(courseId: string, file: File, sha256Hash?: string): Promise<UploadDocumentResponse> {
    try {
      // Validate inputs
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      if (!file) {
        throw new Error('File is required');
      }

      // Generate SHA256 hash if not provided
      const hash = sha256Hash || await generateFileHash(file);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('course_id', courseId);
      formData.append('sha256_hash', hash);

      const response = await apiClient.post<UploadDocumentResponse>(
        '/upload-document',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get processing status for a document upload
   * 
   * @param taskId - Task ID from upload response
   * @returns Promise with current processing status
   * 
   * @example
   * const status = await pblService.getProcessingStatus('task-123');
   * console.log(`Progress: ${status.progress}%`);
   */
  async getProcessingStatus(taskId: string): Promise<ProcessingStatus> {
    try {
      const response = await apiClient.get<ProcessingStatus>(`/status/${taskId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all courses
   * 
   * @returns Promise with array of courses
   * 
   * @example
   * const courses = await pblService.getCourses();
   * courses.forEach(course => console.log(course.name));
   */
  async getCourses(): Promise<Course[]> {
    try {
      const response = await apiClient.get<Course[]>('/courses');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new course
   * 
   * @param name - Course name
   * @param description - Course description
   * @returns Promise with created course
   * 
   * @example
   * const course = await pblService.createCourse(
   *   'Biology 101',
   *   'Introduction to Biology'
   * );
   */
  async createCourse(name: string, description: string): Promise<Course> {
    try {
      const request: CreateCourseRequest = { name, description };
      const response = await apiClient.post<Course>('/courses', request);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a single course by ID
   * 
   * @param courseId - Course ID
   * @returns Promise with course details
   * 
   * @example
   * const course = await pblService.getCourse('course-123');
   */
  async getCourse(courseId: string): Promise<Course> {
    try {
      const response = await apiClient.get<Course>(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all documents for a course
   * 
   * @param courseId - Course ID
   * @returns Promise with array of documents
   * 
   * @example
   * const documents = await pblService.getCourseDocuments('course-123');
   */
  async getCourseDocuments(courseId: string): Promise<Document[]> {
    try {
      const response = await apiClient.get<Document[]>(`/courses/${courseId}/documents`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get concept map for a course
   * 
   * @param courseId - Course ID
   * @returns Promise with concept map structure
   * 
   * @example
   * const conceptMap = await pblService.getConceptMap('course-123');
   * conceptMap.chapters.forEach(chapter => {
   *   console.log(chapter.title, chapter.keywords);
   * });
   */
  async getConceptMap(courseId: string): Promise<ConceptMap> {
    try {
      const response = await apiClient.get<ConceptMap>(`/concept-map/course/${courseId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Submit feedback
   * 
   * @param feedback - Feedback object
   * @returns Promise that resolves when feedback is submitted
   * 
   * @example
   * await pblService.submitFeedback({
   *   feedback_type: 'concept_map',
   *   course_id: 'course-123',
   *   rating: 5,
   *   comment: 'Very helpful!'
   * });
   */
  async submitFeedback(feedback: Feedback): Promise<void> {
    try {
      await apiClient.post('/feedback', feedback);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a course
   * 
   * @param courseId - Course ID
   * @returns Promise that resolves when course is deleted
   * 
   * @example
   * await pblService.deleteCourse('course-123');
   */
  async deleteCourse(courseId: string): Promise<void> {
    try {
      await apiClient.delete(`/courses/${courseId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a document
   * 
   * @param documentId - Document ID
   * @returns Promise that resolves when document is deleted
   * 
   * @example
   * await pblService.deleteDocument('doc-123');
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await apiClient.delete(`/documents/${documentId}`);
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // PBL Concept Management
  // ============================================================================

  /**
   * Get all concepts for a document
   */
  async getConcepts(
    documentId: string,
    validated?: boolean,
    structureType?: string
  ): Promise<Concept[]> {
    try {
      const params = new URLSearchParams();
      if (validated !== undefined) params.append('validated', String(validated));
      if (structureType) params.append('structure_type', structureType);

      const response = await apiClient.get<Concept[]>(
        `/api/pbl/documents/${documentId}/concepts?${params}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Validate concepts (bulk approve/reject/edit)
   */
  async validateConcepts(
    documentId: string,
    validation: ConceptValidation
  ): Promise<ValidationResponse> {
    try {
      const response = await apiClient.post<ValidationResponse>(
        `/api/pbl/documents/${documentId}/concepts/validate`,
        validation
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a single concept
   */
  async getConcept(conceptId: string): Promise<Concept> {
    try {
      const response = await apiClient.get<Concept>(`/api/pbl/concepts/${conceptId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a concept
   */
  async updateConcept(conceptId: string, updates: ConceptUpdate): Promise<Concept> {
    try {
      const response = await apiClient.put<Concept>(
        `/api/pbl/concepts/${conceptId}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a concept
   */
  async deleteConcept(conceptId: string): Promise<DeleteResponse> {
    try {
      const response = await apiClient.delete<DeleteResponse>(
        `/api/pbl/concepts/${conceptId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // PBL Relationships
  // ============================================================================

  /**
   * Get structures (relationships) for a document
   */
  async getStructures(
    documentId: string,
    category?: 'hierarchical' | 'sequential'
  ): Promise<StructuresResponse> {
    try {
      const params = category ? `?category=${category}` : '';
      const response = await apiClient.get<StructuresResponse>(
        `/api/pbl/documents/${documentId}/structures${params}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new relationship
   */
  async createRelationship(relationship: RelationshipCreate): Promise<Relationship> {
    try {
      const response = await apiClient.post<Relationship>(
        '/api/pbl/relationships',
        relationship
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a relationship
   */
  async deleteRelationship(relationshipId: string): Promise<DeleteResponse> {
    try {
      const response = await apiClient.delete<DeleteResponse>(
        `/api/pbl/relationships/${relationshipId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // PBL Deduplication
  // ============================================================================

  /**
   * Get duplicate concepts for a document
   */
  async getDuplicates(documentId: string): Promise<DuplicatesResponse> {
    try {
      const response = await apiClient.get<DuplicatesResponse>(
        `/api/pbl/documents/${documentId}/duplicates`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Merge duplicate concepts
   */
  async mergeConcepts(
    primaryId: string,
    duplicateId: string
  ): Promise<MergeConceptsResponse> {
    try {
      const response = await apiClient.post<MergeConceptsResponse>(
        `/api/pbl/concepts/merge?primary_id=${primaryId}&duplicate_id=${duplicateId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // PBL Visualization
  // ============================================================================

  /**
   * Get or create visualization for a document
   */
  async getVisualization(
    documentId: string,
    userId?: string
  ): Promise<PBLVisualization> {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await apiClient.get<PBLVisualization>(
        `/api/pbl/visualizations/${documentId}${params}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update entire visualization
   */
  async updateVisualization(
    visualizationId: string,
    nodes: any[],
    edges: any[],
    viewport?: any
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.put(
        `/api/pbl/visualizations/${visualizationId}`,
        { nodes, edges, viewport }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a single node
   */
  async updateNode(
    visualizationId: string,
    nodeId: string,
    updates: NodeUpdate
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.put(
        `/api/pbl/visualizations/${visualizationId}/nodes/${nodeId}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new edge
   */
  async createEdge(
    visualizationId: string,
    edge: EdgeCreate
  ): Promise<{ message: string; edge_id: string }> {
    try {
      const response = await apiClient.post(
        `/api/pbl/visualizations/${visualizationId}/edges`,
        edge
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete an edge
   */
  async deleteEdge(
    visualizationId: string,
    edgeId: string
  ): Promise<DeleteResponse> {
    try {
      const response = await apiClient.delete<DeleteResponse>(
        `/api/pbl/visualizations/${visualizationId}/edges/${edgeId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Change visualization layout
   */
  async changeLayout(
    visualizationId: string,
    layoutType: string
  ): Promise<LayoutChangeResponse> {
    try {
      const response = await apiClient.post<LayoutChangeResponse>(
        `/api/pbl/visualizations/${visualizationId}/layout`,
        { layout_type: layoutType }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Export visualization
   */
  async exportVisualization(
    visualizationId: string,
    format: 'json' | 'png' | 'pdf'
  ): Promise<ExportVisualizationResponse> {
    try {
      const response = await apiClient.get<ExportVisualizationResponse>(
        `/api/pbl/visualizations/${visualizationId}/export?format=${format}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
