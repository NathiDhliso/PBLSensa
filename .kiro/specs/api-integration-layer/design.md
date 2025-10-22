# Design Document: API Integration Layer

## Overview

The API Integration Layer provides a robust, type-safe bridge between the Sensa Learn React frontend and the FastAPI backend. It implements a centralized Axios client with automatic authentication, intelligent retry logic, and comprehensive error handling. The layer exposes React hooks powered by React Query for efficient data fetching, caching, and state management.

**Key Design Principles:**
- **Type Safety First:** All API interactions are fully typed with TypeScript
- **Resilient by Default:** Automatic retries, token refresh, and graceful error handling
- **Developer Experience:** Simple, intuitive hooks that handle complexity internally
- **Performance:** Intelligent caching and request deduplication via React Query
- **Testability:** Mock-friendly architecture for development and testing

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Custom React Hooks                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   useAuth    │  │   useApi     │  │  useCourses  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Query Layer                         │
│         (Caching, Deduplication, Background Sync)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Service Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  authService │  │  pblService  │  │sensaService  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Axios Client Instance                      │
│         (Interceptors, Auth, Retry Logic)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (AWS Fargate)                   │
│              Amazon Cognito (Authentication)                 │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Component** calls custom hook (e.g., `useCourses()`)
2. **React Query** checks cache, returns cached data if fresh
3. **Hook** calls service method (e.g., `pblService.getCourses()`)
4. **Service** uses Axios client to make HTTP request
5. **Request Interceptor** attaches JWT token from auth state
6. **Backend** processes request and returns response
7. **Response Interceptor** handles errors, triggers token refresh if needed
8. **Service** returns typed data to hook
9. **React Query** caches response and updates component
10. **Component** renders with data

### Error Flow

1. **Request fails** (network error, 401, 500, etc.)
2. **Response Interceptor** catches error
3. **If 401:** Attempt token refresh → Retry original request
4. **If network error:** Retry with exponential backoff (max 3 attempts)
5. **If retries exhausted:** Format error message
6. **Service** throws formatted error
7. **Hook** exposes error to component
8. **Component** displays error via toast notification

## Components and Interfaces

### 1. Axios Client (`src/services/api.ts`)

**Purpose:** Centralized HTTP client with authentication and error handling

**Configuration:**
```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Request Interceptor:**
- Retrieves current JWT token from auth state
- Attaches token to `Authorization: Bearer <token>` header
- Logs request details in development mode

**Response Interceptor:**
- Handles successful responses (pass through)
- Catches errors and categorizes by status code
- Implements retry logic for transient failures
- Triggers token refresh on 401 errors
- Formats error messages for user display

**Retry Logic:**
- Max retries: 3
- Backoff strategy: Exponential (1s, 2s, 4s)
- Retryable errors: Network errors, 408, 429, 500, 502, 503, 504
- Non-retryable: 400, 401, 403, 404

### 2. Authentication Service (`src/services/auth.ts`)

**Purpose:** Manages Amazon Cognito authentication flow

**Methods:**

```typescript
interface AuthService {
  signUp(email: string, password: string, attributes?: UserAttributes): Promise<void>;
  confirmSignUp(email: string, code: string): Promise<void>;
  signIn(email: string, password: string): Promise<CognitoUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<CognitoUser | null>;
  refreshToken(): Promise<string>;
  forgotPassword(email: string): Promise<void>;
  confirmPassword(email: string, code: string, newPassword: string): Promise<void>;
}
```

**Token Management:**
- Stores tokens in memory (not localStorage for security)
- Implements automatic token refresh 5 minutes before expiry
- Clears tokens on sign out or 401 errors
- Provides token getter for Axios interceptor

**Session Restoration:**
- On app load, checks for valid Cognito session
- If session exists, retrieves user and tokens
- If session expired, clears state and redirects to login

### 3. Type Definitions (`src/types/api.ts`)

**Purpose:** TypeScript interfaces for all API entities

**Core Entities:**

```typescript
// PBL Types
interface Course {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  document_count: number;
}

interface Document {
  id: string;
  course_id: string;
  filename: string;
  upload_date: string;
  processing_status: ProcessingStatus;
  sha256_hash: string;
}

interface ConceptMap {
  course_id: string;
  chapters: Chapter[];
  global_relationships: Relationship[];
}

interface Chapter {
  chapter_number: number;
  title: string;
  keywords: Keyword[];
  relationships: Relationship[];
  exam_relevance_score: number;
}

interface Keyword {
  term: string;
  definition: string;
  is_primary: boolean;
  exam_relevant: boolean;
}

interface Relationship {
  source: string;
  target: string;
  relationship_type: string;
  is_cross_chapter: boolean;
}

// Sensa Learn Types
interface UserProfile {
  user_id: string;
  age_range?: string;
  location?: string;
  interests: string[];
  created_at: string;
  updated_at: string;
}

interface ChapterSummary {
  chapter_id: string;
  summary: string;
  key_concepts: string[];
  complexity_score: number;
}

interface AnalogyResponse {
  analogy_id: string;
  chapter_id: string;
  title: string;
  analogy_text: string;
  learning_mantra: string;
  personalization_hint: string;
}

interface AnalogyFeedback {
  analogy_id: string;
  helpful: boolean;
  comment?: string;
}

// Utility Types
interface ProcessingStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  cache_hit: boolean;
  estimated_time_remaining?: number;
}

interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any>;
}
```

### 4. PBL Service (`src/services/pblService.ts`)

**Purpose:** API methods for Perspective-Based Learning features

**Methods:**

```typescript
interface PBLService {
  uploadDocument(courseId: string, file: File): Promise<{ task_id: string }>;
  getProcessingStatus(taskId: string): Promise<ProcessingStatus>;
  getCourses(): Promise<Course[]>;
  createCourse(name: string, description: string): Promise<Course>;
  getCourseDocuments(courseId: string): Promise<Document[]>;
  getConceptMap(courseId: string): Promise<ConceptMap>;
  submitFeedback(feedback: Feedback): Promise<void>;
}
```

**Implementation Notes:**
- `uploadDocument`: Uses FormData for file upload, includes SHA256 hash
- `getProcessingStatus`: Designed for polling (called every 2 seconds)
- `getConceptMap`: Returns full concept map structure for visualization

### 5. Sensa Learn Service (`src/services/sensaService.ts`)

**Purpose:** API methods for Sensa Learn personalized learning

**Methods:**

```typescript
interface SensaService {
  getChapterSummary(chapterId: string): Promise<ChapterSummary>;
  getChapterAnalogies(chapterId: string): Promise<AnalogyResponse[]>;
  updateProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
  submitAnalogyFeedback(feedback: AnalogyFeedback): Promise<void>;
}
```

### 6. Authentication Hook (`src/hooks/useAuth.ts`)

**Purpose:** React hook for authentication state and methods

**Interface:**

```typescript
interface UseAuthReturn {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

**Implementation:**
- Uses React Context for global auth state
- Automatically refreshes tokens before expiry
- Persists session across page reloads
- Provides loading states for auth operations

### 7. Generic API Hook (`src/hooks/useApi.ts`)

**Purpose:** Generic React Query wrapper for API calls

**Interface:**

```typescript
function useApi<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: UseQueryOptions<T>
): {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Features:**
- Automatic caching with configurable stale time
- Background refetching on window focus
- Request deduplication
- Optimistic updates support
- Pagination and infinite scroll support

### 8. Specialized Hooks

**Purpose:** Domain-specific hooks built on useApi

**Examples:**

```typescript
// PBL Hooks
function useCourses(): UseApiReturn<Course[]>;
function useCourse(courseId: string): UseApiReturn<Course>;
function useConceptMap(courseId: string): UseApiReturn<ConceptMap>;
function useProcessingStatus(taskId: string, options?: { pollingInterval?: number }): UseApiReturn<ProcessingStatus>;

// Sensa Learn Hooks
function useChapterSummary(chapterId: string): UseApiReturn<ChapterSummary>;
function useChapterAnalogies(chapterId: string): UseApiReturn<AnalogyResponse[]>;
function useUserProfile(): UseApiReturn<UserProfile>;

// Mutations
function useUploadDocument(): UseMutationReturn<{ task_id: string }, { courseId: string; file: File }>;
function useCreateCourse(): UseMutationReturn<Course, { name: string; description: string }>;
function useUpdateProfile(): UseMutationReturn<UserProfile, Partial<UserProfile>>;
```

## Data Models

### Token Storage

**In-Memory Storage (Primary):**
```typescript
interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  user: CognitoUser | null;
}
```

**Why In-Memory:**
- More secure (not accessible via XSS)
- Automatically cleared on tab close
- Prevents token theft from localStorage

**Session Restoration:**
- Use Cognito's session management
- Check for valid session on app load
- Retrieve tokens from Cognito if session valid

### React Query Cache Structure

```typescript
{
  'courses': Course[],
  ['course', courseId]: Course,
  ['conceptMap', courseId]: ConceptMap,
  ['processingStatus', taskId]: ProcessingStatus,
  ['chapterSummary', chapterId]: ChapterSummary,
  ['chapterAnalogies', chapterId]: AnalogyResponse[],
  'userProfile': UserProfile,
}
```

**Cache Configuration:**
- Default stale time: 5 minutes
- Cache time: 30 minutes
- Refetch on window focus: true
- Retry failed queries: 3 times

## Error Handling

### Error Categories

1. **Network Errors**
   - Message: "Unable to connect. Please check your internet connection."
   - Action: Retry button
   - Auto-retry: Yes (3 attempts)

2. **Authentication Errors (401)**
   - Message: "Your session has expired. Please sign in again."
   - Action: Redirect to login
   - Auto-retry: Yes (after token refresh)

3. **Authorization Errors (403)**
   - Message: "You don't have permission to access this resource."
   - Action: None
   - Auto-retry: No

4. **Not Found (404)**
   - Message: "The requested resource was not found."
   - Action: None
   - Auto-retry: No

5. **Rate Limit (429)**
   - Message: "Too many requests. Please wait {seconds} seconds."
   - Action: Countdown timer
   - Auto-retry: Yes (after cooldown)

6. **Server Errors (500-504)**
   - Message: "Something went wrong on our end. Please try again."
   - Action: Retry button + support link
   - Auto-retry: Yes (3 attempts)

7. **Validation Errors (400)**
   - Message: Display specific validation errors from response
   - Action: None
   - Auto-retry: No

### Error Display

**Toast Notification Component:**
- Position: Top-right
- Duration: 5 seconds (auto-dismiss)
- Types: error, warning, info, success
- Actions: Retry button, dismiss button
- Animation: Slide in from right

**Error Boundary:**
- Catches React errors in component tree
- Displays fallback UI with error message
- Provides "Reload" button
- Logs errors to console (and future error tracking service)

## Testing Strategy

### Unit Tests

**API Client Tests:**
- Request interceptor attaches correct token
- Response interceptor handles all error types
- Retry logic executes correct number of times
- Token refresh triggers on 401

**Service Tests:**
- Each service method calls correct endpoint
- Request payloads match expected format
- Response data is correctly typed
- Errors are properly thrown

**Hook Tests:**
- useAuth provides correct state and methods
- useApi integrates with React Query correctly
- Specialized hooks call correct service methods
- Loading and error states update correctly

### Integration Tests

**Authentication Flow:**
- Sign up → Confirm → Sign in → Access protected resource
- Token refresh on expiry
- Sign out clears tokens

**API Request Flow:**
- Component → Hook → Service → API → Response → Component update
- Error handling end-to-end
- Cache behavior

### Mock Data

**Development Mocks:**
- Mock responses for all endpoints
- Configurable delays to simulate network latency
- Error simulation for testing error states
- Mock data matches production TypeScript types

**Mock Implementation:**
```typescript
// src/services/mocks/mockApi.ts
export const mockCourses: Course[] = [
  {
    id: '1',
    name: 'Introduction to Biology',
    description: 'Fundamentals of biological sciences',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    document_count: 3,
  },
  // ... more mock data
];

export const mockApiClient = {
  getCourses: () => Promise.resolve(mockCourses),
  // ... other mock methods
};
```

**Environment-Based Mocking:**
```typescript
// Use mock client in development
const apiClient = import.meta.env.DEV 
  ? mockApiClient 
  : realApiClient;
```

## Environment Configuration

### Required Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://api.sensalearn.com
VITE_API_TIMEOUT=30000

# AWS Cognito Configuration
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX

# Feature Flags (optional)
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_API_LOGGING=true
```

### Environment Files

- `.env.example`: Template with all required variables (committed)
- `.env.local`: Local development overrides (gitignored)
- `.env.production`: Production values (gitignored, set in CI/CD)

### Validation

```typescript
// src/config/env.ts
function validateEnv() {
  const required = [
    'VITE_API_BASE_URL',
    'VITE_AWS_REGION',
    'VITE_COGNITO_USER_POOL_ID',
    'VITE_COGNITO_CLIENT_ID',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

## Performance Considerations

### Request Optimization

1. **Request Deduplication:** React Query prevents duplicate requests for same data
2. **Caching:** Reduce API calls by serving cached data when fresh
3. **Background Refetching:** Update stale data without blocking UI
4. **Pagination:** Implement cursor-based pagination for large lists
5. **Lazy Loading:** Only fetch data when component mounts

### Bundle Size

- Axios: ~13KB gzipped
- React Query: ~12KB gzipped
- AWS Amplify (Cognito): ~50KB gzipped
- Total: ~75KB for API layer

### Network Efficiency

- Use HTTP/2 multiplexing (supported by Axios)
- Compress request/response bodies (gzip)
- Implement request cancellation on component unmount
- Batch multiple requests when possible

## Security Considerations

### Token Security

- Store tokens in memory, not localStorage
- Use httpOnly cookies for refresh tokens (if backend supports)
- Implement token rotation on refresh
- Clear tokens on sign out

### Request Security

- Always use HTTPS in production
- Validate SSL certificates
- Implement CSRF protection (if using cookies)
- Sanitize user input before sending to API

### Error Messages

- Never expose sensitive information in error messages
- Log detailed errors server-side only
- Show generic messages to users
- Avoid leaking API structure in errors

## Future Enhancements

1. **Request Queueing:** Queue requests when offline, sync when online
2. **GraphQL Support:** Migrate to GraphQL for more efficient data fetching
3. **WebSocket Integration:** Real-time updates for processing status
4. **Service Worker:** Cache API responses for offline access
5. **Error Tracking:** Integrate Sentry or similar for error monitoring
6. **Analytics:** Track API performance and error rates
7. **Request Throttling:** Client-side rate limiting to prevent abuse
8. **Optimistic Updates:** Update UI immediately, rollback on error
