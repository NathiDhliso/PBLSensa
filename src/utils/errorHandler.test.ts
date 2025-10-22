import { describe, it, expect } from 'vitest';
import {
  formatError,
  getToastType,
  shouldShowRetry,
  getRateLimitMessage,
} from './errorHandler';

describe('errorHandler', () => {
  describe('formatError', () => {
    it('should format network errors', () => {
      const error = { statusCode: 0 };
      const result = formatError(error);

      expect(result.type).toBe('network');
      expect(result.retryable).toBe(true);
      expect(result.message).toContain('internet connection');
    });

    it('should format 401 authentication errors', () => {
      const error = { statusCode: 401 };
      const result = formatError(error);

      expect(result.type).toBe('auth');
      expect(result.retryable).toBe(false);
      expect(result.message).toContain('session has expired');
    });

    it('should format 403 forbidden errors', () => {
      const error = { statusCode: 403 };
      const result = formatError(error);

      expect(result.type).toBe('forbidden');
      expect(result.retryable).toBe(false);
      expect(result.message).toContain('permission');
    });

    it('should format 404 not found errors', () => {
      const error = { statusCode: 404 };
      const result = formatError(error);

      expect(result.type).toBe('notFound');
      expect(result.retryable).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should format 429 rate limit errors', () => {
      const error = { statusCode: 429, details: { retry_after: 30 } };
      const result = formatError(error);

      expect(result.type).toBe('rateLimit');
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBe(30);
      expect(result.message).toContain('30 seconds');
    });

    it('should format 500 server errors', () => {
      const error = { statusCode: 500 };
      const result = formatError(error);

      expect(result.type).toBe('server');
      expect(result.retryable).toBe(true);
      expect(result.message).toContain('went wrong');
    });

    it('should format 400 validation errors', () => {
      const error = { statusCode: 400, message: 'Invalid input' };
      const result = formatError(error);

      expect(result.type).toBe('validation');
      expect(result.retryable).toBe(false);
      expect(result.message).toBe('Invalid input');
    });
  });

  describe('getToastType', () => {
    it('should return warning for rate limit errors', () => {
      expect(getToastType('rateLimit')).toBe('warning');
    });

    it('should return warning for validation errors', () => {
      expect(getToastType('validation')).toBe('warning');
    });

    it('should return error for other error types', () => {
      expect(getToastType('network')).toBe('error');
      expect(getToastType('auth')).toBe('error');
      expect(getToastType('server')).toBe('error');
    });
  });

  describe('shouldShowRetry', () => {
    it('should return true for retryable non-rate-limit errors', () => {
      const error = { type: 'network' as const, retryable: true, message: '' };
      expect(shouldShowRetry(error)).toBe(true);
    });

    it('should return false for rate limit errors', () => {
      const error = { type: 'rateLimit' as const, retryable: true, message: '' };
      expect(shouldShowRetry(error)).toBe(false);
    });

    it('should return false for non-retryable errors', () => {
      const error = { type: 'auth' as const, retryable: false, message: '' };
      expect(shouldShowRetry(error)).toBe(false);
    });
  });

  describe('getRateLimitMessage', () => {
    it('should format seconds correctly', () => {
      expect(getRateLimitMessage(30)).toContain('30 seconds');
    });

    it('should format minutes correctly', () => {
      expect(getRateLimitMessage(60)).toContain('1 minute');
      expect(getRateLimitMessage(120)).toContain('2 minutes');
    });
  });
});
