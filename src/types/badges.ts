/**
 * Badge Types
 * 
 * Type definitions for badge system
 */

import type { Badge as BadgeDefinition } from '@/utils/badgeDefinitions';

export type { BadgeDefinition };

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
  progress: number; // 0-100
  isUnlocked: boolean;
}

export interface BadgeProgress {
  badgeId: string;
  currentValue: number;
  requiredValue: number;
  percentage: number; // 0-100
}

export interface UserBadges {
  earned: BadgeWithProgress[];
  locked: BadgeWithProgress[];
  totalPoints: number;
}

export interface BadgeWithProgress extends BadgeDefinition {
  unlockedAt?: string;
  progress?: number; // 0-100 for locked badges
  isUnlocked: boolean;
}

export interface BadgeUnlockEvent {
  badge: BadgeDefinition;
  timestamp: string;
}
