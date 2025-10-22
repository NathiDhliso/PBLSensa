# API Integration Layer

This directory contains the API integration layer for Sensa Learn, providing a robust, type-safe connection between the React frontend and the FastAPI backend.

## Architecture Overview

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

## Core Components

### 1. API Client (`api.ts`)

Centralized Axios instance with:
- Automatic JWT token attachment
- Token refresh on 401 errors
- Retry logic with exponential backoff (max 3 retries)
- Request/response logging in development

### 2. Authentication Service (`auth.ts`)

Amazon Cognito integration:
- Sign up, sign in, sign out
- Token management (in-memory for security)
- Automatic token refresh
- Session restoration

### 3. Service Layers

**PBL Service (`pblService.ts`):**
- Course management
- Document upload with SHA256 hashing
- Concept map retrieval
- Processing status polling

**Sensa Learn Service (`sensaService.ts`):**
- Chapter summaries
- Personalized analogies
- User profile management
- Learning progress tracking

### 4. React Hooks

**Generic Hooks:**
- `useApi` - Basic query wrapper
- `useApiMutation` - Mutation wrapper
- `useApiPolling` - Polling with intervals

**Specialized Hooks:**
- `useCourses`, `useCourse`, `useConceptMap`
- `useChapterSummary`, `useChapterAnalogies`
- `useUserProfile`, `useUpdateProfile`
- `useProcessingStatus` (with auto-stop on completion)

## Usage Examples

### Fetching Data

```typescript
import { useCourses } from '@/hooks/useCourses';

function CourseList() {
  const { data: courses, isLoading, error } = useCourses();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {courses?.map(course => (
        <div key={course.id}>{course.name}</div>
      ))}
    </div>
  );
}
```

### Creating Data

```typescript
import { useCreateCourse } from '@/hooks/useCreateCourse';
import { useToast } from '@/contexts/ToastContext';

function CreateCourse() {
  const { mutate, isPending } = useCreateCourse();
  const { showSuccess, showError } = useToast();

  const handleCreate = () => {
    mutate(
      { name: 'New Course', description: 'Description' },
      {
        onSuccess: () => showSuccess('Course created!'),
        onError: (error) => showError(error.message),
      }
    );
  };

  return (
    <button onClick={handleCreate} disabled={isPending}>
      Create
    </button>
  );
}
```

### Authentication

```typescript
import { useAuth } from '@/hooks/useAuth';

function AuthButton() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  if (!isAuthenticated) {
    return (
      <button onClick={() => signIn('email@example.com', 'password')}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <span>Welcome, {user?.email}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Polling Status

```typescript
import { useProcessingStatus } from '@/hooks/useProcessingStatus';

function ProcessingStatus({ taskId }: { taskId: string }) {
  const { data: status } = useProcessingStatus(taskId, {
    pollingInterval: 2000, // Poll every 2 seconds
  });

  return (
    <div>
      <p>Status: {status?.status}</p>
      <p>Progress: {status?.progress}%</p>
    </div>
  );
}
```

## Error Handling

All errors are automatically formatted and can be displayed using the toast system:

```typescript
import { useToast } from '@/contexts/ToastContext';
import { formatError, getToastType } from '@/utils/errorHandler';

function handleError(error: any) {
  const { showToast } = useToast();
  const formatted = formatError(error);
  
  showToast(getToastType(formatted.type), formatted.message, {
    action: formatted.retryable ? {
      label: 'Retry',
      onClick: () => refetch()
    } : undefined
  });
}
```

## Mock API for Development

Enable mock API in `.env.local`:

```bash
VITE_ENABLE_MOCK_API=true
```

Mock data is defined in `mocks/mockData.ts` and simulates:
- Network latency (800ms default)
- All API endpoints
- Error scenarios (configurable)

## Environment Variables

Required variables in `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_ENABLE_MOCK_API=true
VITE_ENABLE_API_LOGGING=true
```

## Caching Strategy

React Query configuration:
- **Stale Time:** 5 minutes (data considered fresh)
- **Cache Time:** 30 minutes (data kept in cache)
- **Refetch on Focus:** Yes
- **Refetch on Reconnect:** Yes
- **Retry:** 3 attempts with exponential backoff

## Security

- Tokens stored in memory (not localStorage)
- Automatic token refresh before expiry
- HTTPS only in production
- Request/response validation

## Troubleshooting

### "Missing environment variables" error
Ensure all required variables are set in `.env.local`

### "Failed to refresh token" error
User session expired - redirect to login

### Network errors
Check API base URL and internet connection

### 429 Rate Limit errors
Wait for the specified retry period

## Testing

Use test helpers from `utils/testHelpers.ts`:

```typescript
import { createTestQueryClient, mockSuccess } from '@/utils/testHelpers';

const queryClient = createTestQueryClient();
const mockData = mockSuccess({ id: '1', name: 'Test' });
```

## Further Reading

- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)
- [AWS Amplify Auth](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/)
