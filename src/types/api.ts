/**
 * API Type Definitions
 * 
 * This module contains TypeScript interfaces for all API entities,
 * requests, and responses used throughout the Sensa Learn application.
 * 
 * These types ensure type safety across the API layer and provide
 * autocomplete support in IDEs.
 */

// ============================================================================
// PBL (Perspective-Based Learning) Types
// ============================================================================

/**
 * Course entity representing a collection of learning materials
 */
export interface Course {
  /** Unique identifier for the course */
  id: string;
  /** Course name/title */
  name: string;
  /** Detailed description of the course */
  description: string;
  /** ISO 8601 timestamp of course creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
  /** Number of documents uploaded to this course */
  document_count: number;
}

/**
 * Document entity representing an uploaded learning material
 */
export interface Document {
  /** Unique identifier for the document */
  id: string;
  /** ID of the course this document belongs to */
  course_id: string;
  courseId?: string; // Alias for course_id
  /** Original filename of the uploaded document */
  filename: string;
  name?: string; // Alias for filename
  /** ISO 8601 timestamp of upload */
  upload_date: string;
  uploadedAt?: string; // Alias for upload_date
  /** Current processing status */
  processing_status: ProcessingStatus['status'];
  status?: ProcessingStatus['status']; // Alias for processing_status
  /** SHA256 hash for deduplication and caching */
  sha256_hash: string;
  /** File size in bytes */
  file_size?: number;
  /** MIME type of the document */
  mime_type?: string;
  /** Number of pages in the document */
  pageCount?: number;
  /** Task ID for processing status tracking */
  taskId?: string;
  /** Error message if processing failed */
  error?: string;
}

/**
 * Concept map structure for a course
 */
export interface ConceptMap {
  /** ID of the course this concept map belongs to */
  course_id: string;
  /** Array of chapters in the course */
  chapters: Chapter[];
  /** Relationships that span across multiple chapters */
  global_relationships: Relationship[];
  /** Timestamp when the concept map was generated */
  generated_at?: string;
}

/**
 * Chapter within a course concept map
 */
export interface Chapter {
  /** Chapter number (1-indexed) */
  chapter_number: number;
  /** Chapter title */
  title: string;
  /** Key concepts/terms in this chapter */
  keywords: Keyword[];
  /** Relationships between keywords within this chapter */
  relationships: Relationship[];
  /** Score indicating exam relevance (0-100) */
  exam_relevance_score: number;
  /** Complexity score for Sensa Learn (0-100) */
  complexity_score?: number;
}

/**
 * Keyword/concept within a chapter
 */
export interface Keyword {
  /** The term or concept name */
  term: string;
  /** Definition or explanation of the term */
  definition: string;
  /** Whether this is a primary concept (vs reference) */
  is_primary: boolean;
  /** Whether this concept is relevant for exams */
  exam_relevant: boolean;
  /** Additional context or notes */
  context?: string;
}

/**
 * Relationship between two keywords/concepts
 */
export interface Relationship {
  /** Source keyword term */
  source: string;
  /** Target keyword term */
  target: string;
  /** Type of relationship (e.g., "causes", "is-a", "part-of") */
  relationship_type: string;
  /** Whether this relationship crosses chapter boundaries */
  is_cross_chapter: boolean;
  /** Strength or confidence of the relationship (0-1) */
  strength?: number;
}

/**
 * Feedback submitted by users
 */
export interface Feedback {
  /** Type of feedback */
  feedback_type: 'concept_map' | 'processing' | 'general';
  /** Course ID if applicable */
  course_id?: string;
  /** User's rating (1-5) */
  rating?: number;
  /** Textual feedback */
  comment: string;
  /** Timestamp of feedback submission */
  submitted_at?: string;
}

// ============================================================================
// Sensa Learn Types
// ============================================================================

/**
 * User profile for personalized learning
 */
export interface UserProfile {
  /** Unique user identifier */
  user_id: string;
  /** User's age range (optional) */
  age_range?: string;
  /** User's location (optional) */
  location?: string;
  /** User's interests (max 10) */
  interests: string[];
  /** ISO 8601 timestamp of profile creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
  /** User's preferred learning style */
  learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
}

/**
 * Chapter summary for Sensa Learn
 */
export interface ChapterSummary {
  /** Unique identifier for the chapter */
  chapter_id: string;
  /** Concise summary of the chapter */
  summary: string;
  /** Key concepts covered in the chapter */
  key_concepts: string[];
  /** Complexity score (0-100, higher = more complex) */
  complexity_score: number;
  /** Estimated reading time in minutes */
  estimated_time?: number;
}

/**
 * Analogy response for personalized learning
 */
export interface AnalogyResponse {
  /** Unique identifier for the analogy */
  analogy_id: string;
  /** Chapter this analogy relates to */
  chapter_id: string;
  /** Title of the analogy */
  title: string;
  /** The analogy text (2-3 paragraphs) */
  analogy_text: string;
  /** Learning mantra or key takeaway */
  learning_mantra: string;
  /** Hint about how this was personalized */
  personalization_hint: string;
  /** Timestamp when analogy was generated */
  generated_at?: string;
}

/**
 * Feedback for an analogy
 */
export interface AnalogyFeedback {
  /** ID of the analogy being rated */
  analogy_id: string;
  /** Whether the analogy was helpful */
  helpful: boolean;
  /** Optional comment about the analogy */
  comment?: string;
  /** Timestamp of feedback submission */
  submitted_at?: string;
}

// ============================================================================
// Processing and Status Types
// ============================================================================

/**
 * Processing status for document uploads
 */
export interface ProcessingStatus {
  /** Unique task identifier */
  task_id: string;
  /** Current status of the task */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Progress percentage (0-100) */
  progress: number;
  /** Human-readable status message */
  message: string;
  /** Whether this was a cache hit (faster processing) */
  cache_hit: boolean;
  /** Estimated time remaining in seconds */
  estimated_time_remaining?: number;
  /** Error details if status is 'failed' */
  error?: string;
  /** Timestamp when processing started */
  started_at?: string;
  /** Timestamp when processing completed */
  completed_at?: string;
}

// ============================================================================
// Error and Response Types
// ============================================================================

/**
 * Standard error response from API
 */
export interface ErrorResponse {
  /** Error type/code */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, any>;
  /** HTTP status code */
  status_code?: number;
  /** Timestamp of the error */
  timestamp?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** Validation rule that failed */
  rule?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  page_size: number;
  /** Total number of pages */
  total_pages: number;
  /** Whether there is a next page */
  has_next: boolean;
  /** Whether there is a previous page */
  has_previous: boolean;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request to create a new course
 */
export interface CreateCourseRequest {
  /** Course name */
  name: string;
  /** Course description */
  description: string;
}

/**
 * Request to update user profile
 */
export interface UpdateProfileRequest {
  /** Age range (optional) */
  age_range?: string;
  /** Location (optional) */
  location?: string;
  /** Interests (max 10) */
  interests?: string[];
  /** Learning style preference */
  learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
}

/**
 * Request to upload a document
 */
export interface UploadDocumentRequest {
  /** Course ID to upload to */
  course_id: string;
  /** File to upload */
  file: File;
  /** SHA256 hash of the file */
  sha256_hash: string;
}

/**
 * Response from document upload
 */
export interface UploadDocumentResponse {
  /** Task ID for tracking processing status */
  task_id: string;
  /** Document ID */
  document_id: string;
  /** Processing status */
  status: 'processing' | 'completed' | 'failed';
  /** Whether this was a cache hit */
  cached?: boolean;
  /** Processing time in milliseconds */
  processing_time_ms?: number;
  /** Processing cost in USD */
  cost_usd?: number;
  /** Document type (digital/scanned/hybrid) */
  document_type?: string;
  /** PDF hash */
  pdf_hash?: string;
  /** Processing data */
  data?: any;
  /** Error message if failed */
  error?: string;
  /** Message about the upload */
  message: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Success status */
  success: boolean;
  /** Optional message */
  message?: string;
  /** Timestamp of response */
  timestamp?: string;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return response && typeof response.error === 'string';
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && Array.isArray(response.items) && typeof response.total === 'number';
}
