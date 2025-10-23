/**
 * Conflict Types
 * 
 * Type definitions for conflict resolution system in PBL
 */

export interface ConflictSource {
  documentId: string;
  documentName: string;
  definition: string;
  pageNumber?: number;
  confidence?: number; // 0-1
}

export interface AIRecommendation {
  recommendedSource: 'source1' | 'source2' | 'custom';
  reasoning: string;
  confidence: number; // 0-1
  suggestedDefinition?: string;
}

export interface ConceptConflict {
  conflictId: string;
  conceptId: string;
  conceptName: string;
  source1: ConflictSource;
  source2: ConflictSource;
  aiRecommendation?: AIRecommendation;
  detectedAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface ConflictResolution {
  conflictId: string;
  conceptId: string;
  selectedSource: 'source1' | 'source2' | 'custom';
  customDefinition?: string;
  resolvedBy: string; // userId
  resolvedAt: string;
  notes?: string;
}

export interface ConflictResolutionRequest {
  conflictId: string;
  selectedSource: 'source1' | 'source2' | 'custom';
  customDefinition?: string;
  notes?: string;
}

export interface ConflictListResponse {
  conflicts: ConceptConflict[];
  totalCount: number;
  pendingCount: number;
  resolvedCount: number;
}
