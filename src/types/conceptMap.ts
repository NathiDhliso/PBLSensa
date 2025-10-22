/**
 * Concept Map Types
 * 
 * Type definitions for concept map visualization
 */

// Re-export from api.ts for convenience
export type { ConceptMap, Chapter, Keyword, Relationship } from './api';

// Concept is an alias for Keyword with additional UI properties
export interface Concept {
  id: string;
  name: string;
  description: string;
  source_chapter?: string;
  keywords?: string[];
  related_concepts?: string[];
  importance_score?: number;
  is_primary?: boolean;
  exam_relevant?: boolean;
}

export interface ConceptNode {
  id: string;
  label: string;
  description: string;
  chapter: string;
  chapterId: string;
  documentId: string;
  type: 'primary' | 'reference';
  merged?: boolean;
  sourceDocuments?: string[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ConceptLink {
  source: string | ConceptNode;
  target: string | ConceptNode;
  type: 'primary' | 'reference';
  strength?: number;
}

export interface ConceptMapFilters {
  chapters: string[];
  keywords: string;
  documents: string[];
}

export interface ConceptMapViewport {
  x: number;
  y: number;
  scale: number;
}
