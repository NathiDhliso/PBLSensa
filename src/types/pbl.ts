/**
 * PBL (Problem-Based Learning) Types
 * 
 * Type definitions for PBL View features including concepts,
 * relationships, visualizations, and deduplication.
 */

// ============================================================================
// Concept Types
// ============================================================================

export interface Concept {
  id: string;
  document_id: string;
  term: string;
  definition: string;
  source_sentences: string[];
  page_number: number;
  surrounding_concepts: string[];
  structure_type: 'hierarchical' | 'sequential' | 'unclassified' | null;
  importance_score: number;
  validated: boolean;
  created_at: string;
}

export interface ConceptValidation {
  approved: string[];
  rejected: string[];
  edited: ConceptEdit[];
}

export interface ConceptEdit {
  id: string;
  term?: string;
  definition?: string;
}

export interface ConceptUpdate {
  term?: string;
  definition?: string;
  validated?: boolean;
}

// ============================================================================
// Relationship Types
// ============================================================================

export interface Relationship {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: string;
  structure_category: 'hierarchical' | 'sequential' | 'unclassified';
  strength: number;
  validated_by_user: boolean;
  created_at: string;
}

export interface RelationshipCreate {
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: string;
  structure_category: 'hierarchical' | 'sequential' | 'unclassified';
  strength?: number;
}

export interface StructuresResponse {
  hierarchical: Relationship[];
  sequential: Relationship[];
  unclassified: Relationship[];
}

// ============================================================================
// Deduplication Types
// ============================================================================

export interface DuplicatePair {
  primary_id: string;
  primary_term: string;
  duplicate_id: string;
  duplicate_term: string;
  similarity_score: number;
  reason: string;
}

export interface DuplicatesResponse {
  duplicates: DuplicatePair[];
  count: number;
}

export interface MergeConceptsRequest {
  primary_id: string;
  duplicate_id: string;
}

export interface MergeConceptsResponse {
  message: string;
  merged_concept: {
    id: string;
    term: string;
    definition: string;
  };
}

// ============================================================================
// Visualization Types
// ============================================================================

export interface PBLVisualization {
  id: string;
  document_id: string;
  user_id: string | null;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layout_type: LayoutType;
  viewport: Viewport | null;
  created_at: string;
  updated_at: string;
}

export interface DiagramNode {
  id: string;
  concept_id: string;
  label: string;
  position: Point;
  structure_type: 'hierarchical' | 'sequential' | 'unclassified';
  style: NodeStyle;
}

export interface DiagramEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  label: string;
  style: EdgeStyle;
}

export interface Point {
  x: number;
  y: number;
}

export interface NodeStyle {
  shape: 'rectangle' | 'rounded-rectangle' | 'ellipse';
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
}

export interface EdgeStyle {
  type: 'solid' | 'dashed';
  color: string;
  width: number;
  arrow: boolean;
}

export interface Viewport {
  zoom: number;
  pan: Point;
}

export type LayoutType = 'tree' | 'mindmap' | 'flowchart' | 'hybrid';

export interface NodeUpdate {
  label?: string;
  position?: Point;
  style?: Partial<NodeStyle>;
}

export interface EdgeCreate {
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  label?: string;
}

export interface LayoutChangeRequest {
  layout_type: LayoutType;
}

export interface LayoutChangeResponse {
  message: string;
  layout_type: LayoutType;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ExportVisualizationResponse {
  format: 'json' | 'png' | 'pdf';
  data: any;
  message: string;
}

// ============================================================================
// Document Processing Types
// ============================================================================

export interface UploadDocumentRequest {
  file: File;
  user_id: string;
}

export interface ProcessingStatus {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  current_stage?: string;
  progress?: number;
  stages_completed?: string[];
  stages_remaining?: string[];
  estimated_time_remaining?: number;
  error?: string;
  partial_results?: any;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ConceptsResponse {
  concepts: Concept[];
  total: number;
}

export interface ValidationResponse {
  validated_count: number;
  rejected_count: number;
  edited_count: number;
  message: string;
}

export interface DeleteResponse {
  message: string;
  id: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ConceptCardProps {
  concept: Concept;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, updates: ConceptEdit) => void;
  isSelected?: boolean;
}

export interface DuplicateResolverProps {
  duplicates: DuplicatePair[];
  onMerge: (primaryId: string, duplicateId: string) => void;
  onKeepSeparate: (primaryId: string, duplicateId: string) => void;
  isLoading?: boolean;
}

export interface ProcessingStatusProps {
  status: ProcessingStatus;
  onCancel?: () => void;
}

export interface VisualizationControlsProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onExport: (format: 'json' | 'png' | 'pdf') => void;
}
