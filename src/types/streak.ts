/**
 * Streak Types
 * 
 * Type definitions for learning streak tracking
 */

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakStartDate: string;
  isAtRisk: boolean;
  updatedAt: string;
}

export interface StreakHistoryEntry {
  date: string;
  activityCount: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  activityType: 'chapter_complete' | 'analogy_viewed' | 'feedback_provided' | 'concept_reviewed';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RecordActivityRequest {
  activityType: ActivityLog['activityType'];
  metadata?: Record<string, any>;
}
