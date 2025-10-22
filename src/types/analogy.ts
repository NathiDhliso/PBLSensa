/**
 * Analogy Types
 * 
 * Type definitions for AI-generated analogies and learning content
 */

export interface Analogy {
  id: string;
  concept: string;
  analogy_text: string;
  based_on_interest: string;
  learning_style_adaptation: string;
  average_rating?: number;
  rating_count: number;
}

export interface MemoryTechnique {
  id: string;
  technique_type: 'acronym' | 'mind_palace' | 'chunking' | 'spaced_repetition';
  technique_text: string;
  application: string;
}

export interface LearningMantra {
  id: string;
  mantra_text: string;
  explanation: string;
}

export interface ComplexityInfo {
  score: number; // 0.0 - 1.0
  level: 'beginner' | 'intermediate' | 'advanced';
  concept_count: number;
  estimated_study_time: number; // minutes
}

export interface AnalogyGenerationResponse {
  analogies: Analogy[];
  memory_techniques: MemoryTechnique[];
  learning_mantras: LearningMantra[];
  complexity: ComplexityInfo;
  cached: boolean;
  generated_at: string;
}

export interface FeedbackRequest {
  user_id: string;
  rating: number; // 1-5
  comment?: string;
}

export interface FeedbackResponse {
  feedback_id: string;
  message: string;
}

export interface FeedbackSummary {
  analogy_id: string;
  average_rating: number;
  rating_count: number;
  rating_distribution: Record<number, number>;
}
