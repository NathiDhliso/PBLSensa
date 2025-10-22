# Implementation Plan: API Integration Layer

- [x] 1. Set up project configuration and environment



  - Create `.env.example` with all required environment variables (API_BASE_URL, AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID)
  - Create `src/config/env.ts` with environment validation function
  - Install dependencies: axios, @tanstack/react-query, aws-amplify
  - Configure Vite to load environment variables



  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 2. Implement TypeScript type definitions
  - Create `src/types/api.ts` with all API entity interfaces
  - Define Course, Document, ConceptMap, Chapter, Keyword, Relationship types


  - Define UserProfile, ChapterSummary, AnalogyResponse, AnalogyFeedback types
  - Define ProcessingStatus and ErrorResponse utility types
  - Add JSDoc comments for all interfaces
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Build Axios client with interceptors



  - Create `src/services/api.ts` with Axios instance configuration
  - Implement request interceptor to attach JWT tokens
  - Implement response interceptor for error handling
  - Add retry logic with exponential backoff (max 3 retries)
  - Add request/response logging for development mode
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_



- [ ] 4. Implement Amazon Cognito authentication service
  - Create `src/services/auth.ts` with Cognito integration
  - Implement signUp, confirmSignUp, signIn, signOut methods
  - Implement getCurrentUser and session restoration logic
  - Implement refreshToken with automatic refresh before expiry


  - Implement forgotPassword and confirmPassword methods
  - Add token storage in memory (not localStorage)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

- [ ] 5. Create authentication React hook and context
  - Create `src/hooks/useAuth.ts` with authentication hook
  - Create `src/contexts/AuthContext.tsx` for global auth state
  - Implement automatic token refresh logic


  - Implement session restoration on app load
  - Provide loading and error states
  - _Requirements: 2.5, 6.1_

- [ ] 6. Implement PBL service layer
  - Create `src/services/pblService.ts` with PBL API methods
  - Implement uploadDocument with FormData and SHA256 hash


  - Implement getProcessingStatus for polling
  - Implement getCourses, createCourse, getCourseDocuments
  - Implement getConceptMap
  - Implement submitFeedback
  - Add proper error handling for each method



  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 7. Implement Sensa Learn service layer
  - Create `src/services/sensaService.ts` with Sensa Learn API methods


  - Implement getChapterSummary
  - Implement getChapterAnalogies
  - Implement updateProfile
  - Implement submitAnalogyFeedback
  - Add context-specific error messages
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_



- [ ] 8. Set up React Query configuration
  - Create `src/config/queryClient.ts` with React Query client
  - Configure default cache times (stale: 5min, cache: 30min)
  - Configure retry logic and refetch behavior
  - Add QueryClientProvider to app root
  - _Requirements: 6.2_




- [ ] 9. Create generic useApi hook
  - Create `src/hooks/useApi.ts` as React Query wrapper
  - Implement generic query hook with loading/error states
  - Implement request cancellation on unmount
  - Add TypeScript generics for type safety


  - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 10. Create specialized API hooks for PBL
  - Create `src/hooks/useCourses.ts` for course list
  - Create `src/hooks/useCourse.ts` for single course


  - Create `src/hooks/useConceptMap.ts` for concept map
  - Create `src/hooks/useProcessingStatus.ts` with polling
  - Create `src/hooks/useUploadDocument.ts` mutation hook
  - Create `src/hooks/useCreateCourse.ts` mutation hook
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_



- [ ] 11. Create specialized API hooks for Sensa Learn
  - Create `src/hooks/useChapterSummary.ts`
  - Create `src/hooks/useChapterAnalogies.ts`
  - Create `src/hooks/useUserProfile.ts`
  - Create `src/hooks/useUpdateProfile.ts` mutation hook


  - Create `src/hooks/useAnalogyFeedback.ts` mutation hook
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Implement error handling and toast notifications
  - Create `src/components/Toast.tsx` notification component


  - Create `src/utils/errorHandler.ts` with error categorization
  - Implement toast notification system with auto-dismiss
  - Add retry buttons for retryable errors
  - Add countdown timer for rate limit errors
  - Format error messages for each error type (network, 401, 403, 404, 429, 500, 400)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 13. Create error boundary component




  - Create `src/components/ErrorBoundary.tsx`
  - Implement fallback UI with error message
  - Add reload button
  - Log errors to console
  - _Requirements: 7.1_

- [ ] 14. Create mock API responses for development
  - Create `src/services/mocks/mockData.ts` with sample data
  - Create mock responses for all PBL endpoints


  - Create mock responses for all Sensa Learn endpoints
  - Ensure mock data matches TypeScript types
  - Add configurable delays to simulate network latency
  - _Requirements: 9.1, 9.5_

- [x] 15. Implement mock API client



  - Create `src/services/mocks/mockApiClient.ts`
  - Implement mock methods for all service functions
  - Add error simulation capabilities
  - Add environment-based switching (dev vs prod)
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 16. Create development utilities and examples
  - Create `src/examples/ApiUsageExamples.tsx` with hook usage examples
  - Add JSDoc comments with usage examples to all hooks
  - Create `src/utils/testHelpers.ts` for testing utilities
  - Document common patterns in comments
  - _Requirements: 9.4_

- [ ]* 17. Write unit tests for core functionality
  - Write tests for Axios interceptors (request/response)
  - Write tests for retry logic
  - Write tests for token refresh flow
  - Write tests for error categorization
  - Write tests for each service method
  - Write tests for useAuth hook
  - Write tests for useApi hook
  - _Requirements: 1.6, 2.6, 3.4, 3.5_

- [ ]* 18. Write integration tests
  - Test complete authentication flow (signup → signin → access resource)
  - Test API request flow (component → hook → service → response)
  - Test error handling end-to-end
  - Test cache behavior with React Query
  - _Requirements: 6.2, 7.1_

- [ ] 19. Create API documentation
  - Document all service methods with JSDoc
  - Create README.md in src/services with architecture overview
  - Document environment variable setup
  - Add troubleshooting guide for common issues
  - Create migration guide for future developers
  - _Requirements: 8.1, 8.2_

- [ ] 20. Final integration and validation
  - Integrate API layer with existing app structure
  - Test all hooks in actual components
  - Verify error handling in real scenarios
  - Test with mock API and real backend (if available)
  - Validate TypeScript types across all files
  - Run linter and fix any issues
  - _Requirements: 1.6, 3.4, 6.5_
