/**
 * API Usage Examples
 * 
 * Demonstrates how to use the API hooks and services
 * This file is for reference only - not used in production
 */

import { useCourses } from '@/hooks/useCourses';
import { useCreateCourse } from '@/hooks/useCreateCourse';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

/**
 * Example 1: Fetching data with loading and error states
 */
export function CoursesListExample() {
  const { data: courses, isLoading, error } = useCourses();

  if (isLoading) {
    return <div>Loading courses...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {courses?.map((course) => (
        <div key={course.id}>
          <h3>{course.name}</h3>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 2: Creating data with mutations
 */
export function CreateCourseExample() {
  const { mutate, isPending } = useCreateCourse();
  const { showSuccess, showError } = useToast();

  const handleCreate = () => {
    mutate(
      {
        name: 'New Course',
        description: 'Course description',
      },
      {
        onSuccess: (course) => {
          showSuccess(`Course "${course.name}" created successfully!`);
        },
        onError: (error) => {
          showError(error.message);
        },
      }
    );
  };

  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Course'}
    </button>
  );
}

/**
 * Example 3: Using authentication
 */
export function AuthExample() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSignIn = async () => {
    try {
      await signIn('user@example.com', 'password');
      showSuccess('Signed in successfully!');
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (!isAuthenticated) {
    return <button onClick={handleSignIn}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

/**
 * Example 4: Polling for status updates
 */
import { useProcessingStatus } from '@/hooks/useProcessingStatus';

export function ProcessingStatusExample({ taskId }: { taskId: string }) {
  const { data: status } = useProcessingStatus(taskId, {
    pollingInterval: 2000, // Poll every 2 seconds
  });

  if (!status) {
    return <div>Loading status...</div>;
  }

  return (
    <div>
      <p>Status: {status.status}</p>
      <p>Progress: {status.progress}%</p>
      {status.estimated_time_remaining && (
        <p>Time remaining: {status.estimated_time_remaining}s</p>
      )}
    </div>
  );
}

/**
 * Example 5: Handling errors with retry
 */
export function ErrorHandlingExample() {
  const { error, refetch, isLoading } = useCourses();

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>{/* Render data */}</div>;
}
