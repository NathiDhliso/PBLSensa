/**
 * TypeScript types for Sensa Learn Two-View System
 */

// ============================================================================
// User Profile Types
// ============================================================================

export interface Background {
  profession?: string;
  education: string[];
  years_experience?: number;
  current_role?: string;
}

export interface Interests {
  hobbies: string[];
  sports: string[];
  creative_activities: string[];
  other: string[];
}

export interface LifeExperiences {
  places_lived: string[];
  places_traveled: string[];
  jobs_held: string[];
  memorable_events: string[];
  challenges_overcome: string[];
}

export interface LearningStyle {
  preferred_metaphors: string[];
  past_successful_analogies: string[];
  learning_pace?: 'fast' | 'moderate' | 'slow';
  preferred_format?: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
}

export interface UserProfile {
  user_id: string;
  background: Background;
  interests: Interests;
  experiences: LifeExperiences;
  learning_style: LearningStyle;
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse extends UserProfile {
  total_analogies?: number;
  reusable_analogies?: number;
  avg_analogy_strength?: number;
}

export interface UpdateProfileRequest {
  background?: Partial<Background>;
  interests?: Partial<Interests>;
  experiences?: Partial<LifeExperiences>;
  learning_style?: Partial<LearningStyle>;
}

// ============================================================================
// Concept Types (Enhanced from Keyword)
// ============================================================================

export interface Concept {
  id: string;
  document_id: string;
  term: string;
  definition: string;
  source_sentences: string[];
  surrounding_concepts: string[];
  page_number?: number;
  is_primary: boolean;
  structure_type?: 'hierarchical' | 'sequential' | 'unclassified';
  importance_score?: number;
  exam_relevance_score?: number;
  created_at: string;
}

export interface Relationship {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: string;
  structure_category?: 'hierarchical' | 'sequential' | 'unclassified';
  strength: number;
  validated_by_user: boolean;
  created_at: string;
}

// ============================================================================
// Question Types
// ============================================================================

export interface Question {
  id: string;
  concept_id: string;
  user_id: string;
  question_text: string;
  question_type: string;
  answered: boolean;
  answer_text?: string;
  created_at: string;
  concept?: Partial<Concept>;
}

export interface GenerateQuestionsRequest {
  concept_id: string;
  user_id: string;
  max_questions?: number;
}

export interface GenerateQuestionsResponse {
  questions: Question[];
  concept_term: string;
  concept_definition: string;
  structure_type?: string;
}

// ============================================================================
// Analogy Types
// ============================================================================

export interface Analogy {
  id: string;
  user_id: string;
  concept_id: string;
  user_experience_text: string;
  connection_explanation?: string;
  strength: number; // 1-5
  type: 'metaphor' | 'experience' | 'scenario' | 'emotion';
  reusable: boolean;
  tags: string[];
  created_at: string;
  last_used?: string;
  usage_count: number;
  concept?: Partial<Concept>;
}

export interface CreateAnalogyRequest {
  concept_id: string;
  user_experience_text: string;
  strength: number;
  type?: 'metaphor' | 'experience' | 'scenario' | 'emotion';
  reusable?: boolean;
}

export interface UpdateAnalogyRequest {
  user_experience_text?: string;
  strength?: number;
  reusable?: boolean;
  tags?: string[];
}

export interface AnalogyStatistics {
  total_analogies: number;
  reusable_analogies: number;
  avg_strength: number;
  most_used_tags: string[];
  most_reused_analogy_id?: string;
  concepts_with_analogies: number;
}

// ============================================================================
// Suggestion Types
// ============================================================================

export interface AnalogyySuggestion {
  analogy_id: string;
  similarity_score: number;
  suggestion_text: string;
  source_concept: string;
  experience_text: string;
  tags: string[];
  strength: number;
}

export interface SuggestionsResponse {
  concept_id: string;
  suggestions: AnalogyySuggestion[];
}

export interface CrossDocumentInsights {
  total_analogies: number;
  reusable_analogies: number;
  reused_count: number;
  most_versatile_analogy_id?: string;
  most_versatile_usage_count: number;
  most_common_domains: string[];
  reuse_rate: number;
}

// ============================================================================
// Onboarding Types
// ============================================================================

export interface OnboardingQuestion {
  id: string;
  category: string;
  question_text: string;
  question_type: 'text' | 'text_list' | 'multi_select' | 'single_select' | 'yes_no_text';
  options?: string[];
  placeholder?: string;
}

export interface OnboardingCategory {
  id: string;
  name: string;
  description: string;
  questions: OnboardingQuestion[];
}

export interface OnboardingData {
  categories: OnboardingCategory[];
  metadata: {
    version: string;
    total_categories: number;
    total_questions: number;
    estimated_time_minutes: number;
  };
}

// ============================================================================
// Visualization Types
// ============================================================================

export type VisualizationMode = 'pbl' | 'sensa_learn';

export interface DiagramNode {
  id: string;
  concept_id: string;
  label: string;
  structure_type: 'hierarchical' | 'sequential';
  position: { x: number; y: number };
  style: NodeStyle;
}

export interface NodeStyle {
  color: string;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  shape: 'rectangle' | 'rounded' | 'circle';
  opacity: number;
}

export interface DiagramEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  label: string;
  style: EdgeStyle;
}

export interface EdgeStyle {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  arrow: boolean;
}

export interface PBLVisualization {
  id: string;
  document_id: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layout: 'tree' | 'mindmap' | 'flowchart' | 'hybrid';
}

export interface SensaLearnVisualization {
  pbl_nodes: DiagramNode[];
  analogy_nodes: AnalogyNode[];
  connections: ConnectionLine[];
}

export interface AnalogyNode {
  id: string;
  analogy_id: string;
  label: string;
  experience_summary: string;
  strength: number;
  tags: string[];
  position: { x: number; y: number };
}

export interface ConnectionLine {
  id: string;
  concept_node_id: string;
  analogy_node_id: string;
  strength: number;
}
