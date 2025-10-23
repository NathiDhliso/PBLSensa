/**
 * Cache Configuration
 * Centralized cache time constants for React Query
 */

export const CACHE_TIMES = {
  // Default cache time (5 minutes)
  DEFAULT: 5 * 60 * 1000,
  
  // User profile data (rarely changes)
  PROFILE: 30 * 60 * 1000, // 30 minutes
  
  // Content data (moderate changes)
  CONTENT: 10 * 60 * 1000, // 10 minutes
  ANALOGIES: 10 * 60 * 1000, // 10 minutes
  CONCEPT_MAP: 10 * 60 * 1000, // 10 minutes
  
  // Real-time data (frequent changes)
  PROCESSING_STATUS: 1 * 60 * 1000, // 1 minute
  
  // Static data (very rarely changes)
  COURSES: 5 * 60 * 1000, // 5 minutes
  
  // Gamification data (optional features)
  BADGES: 15 * 60 * 1000, // 15 minutes
  STREAKS: 5 * 60 * 1000, // 5 minutes
  PROGRESS: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Query key prefixes for consistent cache invalidation
 */
export const QUERY_KEYS = {
  // PBL Portal
  COURSES: 'courses',
  COURSE: 'course',
  DOCUMENTS: 'documents',
  CONCEPT_MAP: 'concept-map',
  PBL_CONCEPTS: 'pbl-concepts',
  PBL_VISUALIZATION: 'pbl-visualization',
  PBL_DUPLICATES: 'pbl-duplicates',
  PROCESSING_STATUS: 'processing-status',
  
  // Sensa Learn Portal
  ANALOGIES: 'analogies',
  CHAPTER_SUMMARY: 'chapter-summary',
  CHAPTER_COMPLEXITY: 'chapter-complexity',
  
  // User Data
  PROFILE: 'profile',
  
  // Gamification (Optional Features)
  PROGRESS: 'progress',
  BADGES: 'badges',
  STREAK: 'streak',
  
  // Feedback & Conflicts
  FEEDBACK: 'feedback',
  CONFLICTS: 'conflicts',
} as const;
