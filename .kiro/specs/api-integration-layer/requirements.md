# Requirements Document: API Integration Layer

## Introduction

The API Integration Layer is the foundational infrastructure for Sensa Learn, providing a robust, type-safe connection between the React frontend and the FastAPI backend hosted on AWS Fargate. This layer handles authentication via Amazon Cognito, manages API requests with proper error handling and retry logic, and provides React hooks for seamless data fetching throughout the application.

This is a critical-priority feature as all subsequent features (PBL, Sensa Learn Dashboard, Analogy View) depend on this integration layer to function.

## Requirements

### Requirement 1: API Client Configuration

**User Story:** As a developer, I want a centralized API client configuration, so that all API requests use consistent settings and authentication.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL create an Axios instance with base URL from environment variables
2. WHEN an API request is made THEN the system SHALL automatically attach the Cognito JWT token to the Authorization header
3. WHEN a token is expired THEN the system SHALL automatically refresh the token before retrying the request
4. WHEN an API request fails with a network error THEN the system SHALL retry up to 3 times with exponential backoff
5. IF the retry limit is exceeded THEN the system SHALL display a user-friendly error notification
6. WHEN an API response is received THEN the system SHALL validate the response structure matches expected TypeScript types

### Requirement 2: Amazon Cognito Authentication

**User Story:** As a user, I want to securely sign up, sign in, and manage my session, so that my data is protected and I can access personalized features.

#### Acceptance Criteria

1. WHEN a user signs up THEN the system SHALL create a new Cognito user account with email verification
2. WHEN a user signs in with valid credentials THEN the system SHALL retrieve and store JWT tokens (access, ID, refresh)
3. WHEN a user's session expires THEN the system SHALL automatically refresh the access token using the refresh token
4. WHEN a user signs out THEN the system SHALL clear all stored tokens and redirect to the login page
5. WHEN the application loads THEN the system SHALL check for existing valid tokens and restore the user session
6. IF authentication fails with invalid credentials THEN the system SHALL display a clear error message
7. WHEN a user requests password reset THEN the system SHALL initiate Cognito's forgot password flow

### Requirement 3: Type-Safe API Interfaces

**User Story:** As a developer, I want TypeScript interfaces for all API requests and responses, so that I can catch type errors at compile time and have autocomplete support.

#### Acceptance Criteria

1. WHEN defining API types THEN the system SHALL include interfaces for Course, Document, ConceptMap, and Chapter entities
2. WHEN defining API types THEN the system SHALL include interfaces for UserProfile, AnalogyResponse, and AnalogyFeedback
3. WHEN defining API types THEN the system SHALL include interfaces for ProcessingStatus and ErrorResponse
4. WHEN an API response is received THEN the system SHALL validate it matches the expected interface
5. IF a response doesn't match the expected type THEN the system SHALL log a warning and handle gracefully

### Requirement 4: PBL API Endpoints

**User Story:** As a user, I want to upload documents, create courses, and view concept maps, so that I can use the Perspective-Based Learning features.

#### Acceptance Criteria

1. WHEN a user uploads a document THEN the system SHALL POST to /upload-document with file data and return a task_id
2. WHEN checking processing status THEN the system SHALL GET /status/{task_id} and return current progress
3. WHEN fetching courses THEN the system SHALL GET /courses and return an array of course objects
4. WHEN creating a course THEN the system SHALL POST /courses with course details
5. WHEN fetching course documents THEN the system SHALL GET /courses/{course_id}/documents
6. WHEN fetching a concept map THEN the system SHALL GET /concept-map/course/{course_id}
7. WHEN submitting feedback THEN the system SHALL POST /feedback with user feedback data

### Requirement 5: Sensa Learn API Endpoints

**User Story:** As a user, I want to access chapter summaries, analogies, and manage my learning profile, so that I can use the Sensa Learn personalized learning features.

#### Acceptance Criteria

1. WHEN fetching a chapter summary THEN the system SHALL GET /sensa-learn/chapter/{chapter_id}/summary
2. WHEN fetching chapter analogies THEN the system SHALL GET /sensa-learn/chapter/{chapter_id}/analogies
3. WHEN updating user profile THEN the system SHALL PUT /profile with profile data
4. WHEN submitting analogy feedback THEN the system SHALL POST /feedback/analogy with feedback data
5. WHEN any Sensa Learn endpoint fails THEN the system SHALL provide context-specific error messages

### Requirement 6: React Hooks for Data Fetching

**User Story:** As a developer, I want reusable React hooks for API calls, so that I can easily manage loading states, errors, and data caching in components.

#### Acceptance Criteria

1. WHEN using the useAuth hook THEN the system SHALL provide current user state, loading state, and auth methods
2. WHEN using the useApi hook THEN the system SHALL integrate with React Query for caching and background refetching
3. WHEN an API call is in progress THEN the hook SHALL expose a loading boolean
4. WHEN an API call fails THEN the hook SHALL expose an error object with user-friendly message
5. WHEN an API call succeeds THEN the hook SHALL expose the data with proper TypeScript typing
6. WHEN a component unmounts THEN the system SHALL cancel any pending API requests

### Requirement 7: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when something goes wrong, so that I understand what happened and what I can do about it.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the system SHALL display a toast notification with a retry button
2. WHEN a 401 Unauthorized error occurs THEN the system SHALL redirect to the login page
3. WHEN a 403 Forbidden error occurs THEN the system SHALL display "Access denied" message
4. WHEN a 429 Rate Limit error occurs THEN the system SHALL display a message with retry timer
5. WHEN a 500 Server Error occurs THEN the system SHALL display a generic error with support link
6. WHEN a 400 Bad Request error occurs THEN the system SHALL display validation errors from the response
7. WHEN displaying errors THEN the system SHALL use toast notifications that auto-dismiss after 5 seconds

### Requirement 8: Environment Configuration

**User Story:** As a developer, I want environment-based configuration, so that I can easily switch between development, staging, and production environments.

#### Acceptance Criteria

1. WHEN the application builds THEN the system SHALL load configuration from environment variables
2. WHEN environment variables are missing THEN the system SHALL provide clear error messages during build
3. WHEN in development mode THEN the system SHALL support mock API responses for testing
4. WHEN switching environments THEN the system SHALL use the correct API base URL and Cognito pool
5. IF sensitive credentials are needed THEN the system SHALL never commit them to version control

### Requirement 9: Development and Testing Support

**User Story:** As a developer, I want mock API responses and testing utilities, so that I can develop and test features without depending on the backend.

#### Acceptance Criteria

1. WHEN in development mode THEN the system SHALL provide mock responses for all API endpoints
2. WHEN testing error scenarios THEN the system SHALL allow simulating different error types
3. WHEN testing loading states THEN the system SHALL allow adding artificial delays
4. WHEN writing tests THEN the system SHALL provide utilities to mock API calls
5. WHEN mocking data THEN the system SHALL ensure mock data matches production TypeScript types
