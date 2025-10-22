import { describe, it, expect } from 'vitest';
import { queryClient, queryKeys } from './queryClient';

describe('queryClient', () => {
  it('should be configured with correct defaults', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
    expect(defaultOptions.queries?.gcTime).toBe(30 * 60 * 1000);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
    expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
    expect(defaultOptions.queries?.retry).toBe(3);
  });
});

describe('queryKeys', () => {
  it('should generate correct auth keys', () => {
    expect(queryKeys.auth.user).toEqual(['auth', 'user']);
  });

  it('should generate correct course keys', () => {
    expect(queryKeys.courses.all).toEqual(['courses']);
    expect(queryKeys.courses.detail('course-1')).toEqual(['courses', 'course-1']);
    expect(queryKeys.courses.documents('course-1')).toEqual(['courses', 'course-1', 'documents']);
  });

  it('should generate correct concept map keys', () => {
    expect(queryKeys.conceptMaps.detail('course-1')).toEqual(['conceptMaps', 'course-1']);
  });

  it('should generate correct processing status keys', () => {
    expect(queryKeys.processingStatus.detail('task-1')).toEqual(['processingStatus', 'task-1']);
  });

  it('should generate correct chapter keys', () => {
    expect(queryKeys.chapters.summary('chapter-1')).toEqual(['chapters', 'chapter-1', 'summary']);
    expect(queryKeys.chapters.analogies('chapter-1')).toEqual(['chapters', 'chapter-1', 'analogies']);
  });

  it('should generate correct profile keys', () => {
    expect(queryKeys.profile.current).toEqual(['profile']);
  });

  it('should generate correct progress keys', () => {
    expect(queryKeys.progress.course('course-1')).toEqual(['progress', 'course-1']);
  });

  it('should generate correct recommendation keys', () => {
    expect(queryKeys.recommendations.course('course-1')).toEqual(['recommendations', 'course-1']);
  });
});
