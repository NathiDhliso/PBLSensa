import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { ReactNode } from 'react';

// Mock the auth service
vi.mock('@/services/auth', () => ({
  authService: {
    getCurrentUser: vi.fn().mockResolvedValue(null),
    signIn: vi.fn().mockResolvedValue({
      userId: 'user-1',
      username: 'test@example.com',
      email: 'test@example.com',
    }),
    signOut: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue(undefined),
    confirmSignUp: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue('new-token'),
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    confirmPassword: vi.fn().mockResolvedValue(undefined),
    needsRefresh: vi.fn().mockReturnValue(false),
  },
}));

describe('AuthContext integration test', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should provide auth context', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('signIn');
    expect(result.current).toHaveProperty('signOut');
  });

  it('should handle sign in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'Test123!');
    });

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear error initially
    expect(result.current.error).toBeNull();

    // Clear error function should work
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
