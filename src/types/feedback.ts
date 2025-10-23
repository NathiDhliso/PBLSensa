/**
 * Feedback Types
 * 
 * Type definitions for interactive feedback system in PBL
 */

export type FeedbackType = 'flag_incorrect' | 'suggest_edit' | 'add_related_concept';

export type RelationshipType = 'prerequisite' | 'related' | 'opposite' | 'example' | 'application';

export interface FeedbackContent {
  // For flag_incorrect
  explanation?: string;
  
  // For suggest_edit
  currentDefinition?: string;
  suggestedDefinition?: string;
  reasoning?: string;
  
  // For add_related_concept
  relatedConceptName?: string;
  relationshipType?: RelationshipType;
  description?: string;
}

export interface FeedbackSubmission {
  feedbackId?: string;
  conceptId: string;
  conceptName: string;
  userId: string;
  feedbackType: FeedbackType;
  content: FeedbackContent;
  submittedAt?: string;
  status?: 'pending' | 'reviewed' | 'implemented' | 'rejected';
}

export interface FeedbackStatus {
  conceptId: string;
  hasFeedback: boolean;
  feedbackCount: number;
  lastSubmittedAt?: string;
  feedbackTypes: FeedbackType[];
}

export interface FeedbackResponse {
  feedbackId: string;
  message: string;
  badgeProgress?: {
    badgeId: string;
    currentValue: number;
    requiredValue: number;
    percentage: number;
  };
}
