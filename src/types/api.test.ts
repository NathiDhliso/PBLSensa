import { describe, it, expect } from 'vitest';
import { isErrorResponse, isPaginatedResponse } from './api';

describe('api type guards', () => {
  describe('isErrorResponse', () => {
    it('should return true for error responses', () => {
      const errorResponse = {
        error: 'NotFound',
        message: 'Resource not found',
      };

      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it('should return false for non-error responses', () => {
      const normalResponse = {
        id: '1',
        name: 'Test',
      };

      expect(isErrorResponse(normalResponse)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isErrorResponse(null)).toBeFalsy();
      expect(isErrorResponse(undefined)).toBeFalsy();
    });
  });

  describe('isPaginatedResponse', () => {
    it('should return true for paginated responses', () => {
      const paginatedResponse = {
        items: [{ id: '1' }, { id: '2' }],
        total: 10,
        page: 1,
        page_size: 2,
        total_pages: 5,
        has_next: true,
        has_previous: false,
      };

      expect(isPaginatedResponse(paginatedResponse)).toBe(true);
    });

    it('should return false for non-paginated responses', () => {
      const normalResponse = {
        id: '1',
        name: 'Test',
      };

      expect(isPaginatedResponse(normalResponse)).toBe(false);
    });

    it('should return false if items is not an array', () => {
      const invalidResponse = {
        items: 'not an array',
        total: 10,
      };

      expect(isPaginatedResponse(invalidResponse)).toBe(false);
    });

    it('should return false if total is not a number', () => {
      const invalidResponse = {
        items: [],
        total: 'not a number',
      };

      expect(isPaginatedResponse(invalidResponse)).toBe(false);
    });
  });
});
