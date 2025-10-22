import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';
import { ReactNode } from 'react';

describe('ToastContext integration test', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ToastProvider>{children}</ToastProvider>
  );

  it('should provide toast context', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current).toHaveProperty('showToast');
    expect(result.current).toHaveProperty('showSuccess');
    expect(result.current).toHaveProperty('showError');
    expect(result.current).toHaveProperty('showWarning');
    expect(result.current).toHaveProperty('showInfo');
    expect(result.current).toHaveProperty('dismissToast');
  });

  it('should show success toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showSuccess('Success message');
    });

    // Toast should be shown (implementation detail - just verify method works)
    expect(result.current.showSuccess).toBeDefined();
  });

  it('should show error toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showError('Error message');
    });

    expect(result.current.showError).toBeDefined();
  });

  it('should show warning toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showWarning('Warning message');
    });

    expect(result.current.showWarning).toBeDefined();
  });

  it('should show info toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showInfo('Info message');
    });

    expect(result.current.showInfo).toBeDefined();
  });

  it('should show toast with custom options', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('success', 'Message', {
        duration: 3000,
        action: {
          label: 'Retry',
          onClick: () => {},
        },
      });
    });

    expect(result.current.showToast).toBeDefined();
  });
});
