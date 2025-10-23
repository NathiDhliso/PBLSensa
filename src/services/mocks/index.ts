/**
 * Mock Services Index
 * Central export point for all mock data and services
 */

// Toggle mocking via environment variable
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// Re-export mock data from existing mockData.ts
export * from '../mockData';

// Future: Split into domain-specific files
// export * from './courses';
// export * from './documents';
// export * from './profiles';
// export * from './concepts';
