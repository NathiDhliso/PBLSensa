/**
 * Route Constants
 * Centralized route path definitions
 */

export const ROUTES = {
  // Public Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Main Dashboard
  DASHBOARD: '/dashboard',
  PORTAL_SELECTION: '/',
  
  // PBL Portal Routes
  PBL_DASHBOARD: '/pbl',
  PBL_COURSES: '/pbl/courses',
  PBL_COURSE_DETAIL: (courseId: string) => `/pbl/courses/${courseId}`,
  PBL_DOCUMENT: (documentId: string) => `/pbl/document/${documentId}`,
  PBL_DOCUMENT_VALIDATE: (documentId: string) => `/pbl/document/${documentId}/validate`,
  
  // Sensa Learn Portal Routes
  SENSA_DASHBOARD: '/sensa',
  SENSA_COURSE: (courseId: string) => `/sensa/course/${courseId}`,
  SENSA_DOCUMENT: (documentId: string) => `/sensa/document/${documentId}`,
  
  // Shared Routes
  PROFILE: '/profile',
  PROFILE_SETUP: '/profile/setup',
  PROCESSING_STATUS: (taskId: string) => `/processing/${taskId}`,
  CONCEPT_MAP: (documentId: string) => `/concept-map/${documentId}`,
  
  // Progress & Gamification (Optional Features)
  PROGRESS: '/progress',
  
  // Development
  UI_SHOWCASE: '/ui-showcase',
} as const;
