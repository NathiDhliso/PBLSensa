/**
 * Badge Service
 * 
 * Service for managing badges and achievements
 */

import axios from 'axios';
import { BADGE_DEFINITIONS, calculateBadgeProgress } from '@/utils/badgeDefinitions';
import type { UserBadges, BadgeProgress, UserBadge } from '@/types/badges';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const badgeService = {
  /**
   * Get all badges for a user (earned and locked)
   */
  async getUserBadges(userId: string): Promise<UserBadges> {
    const response = await api.get(`/api/users/${userId}/badges`);
    return response.data;
  },

  /**
   * Check and update badge progress
   */
  async checkBadgeProgress(
    userId: string,
    badgeId: string,
    currentValue: number
  ): Promise<BadgeProgress> {
    const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
    if (!badge) {
      throw new Error(`Badge ${badgeId} not found`);
    }

    const percentage = calculateBadgeProgress(currentValue, badge.requirement.threshold);

    // If progress reaches 100%, unlock the badge
    if (percentage >= 100) {
      await this.unlockBadge(userId, badgeId);
    }

    return {
      badgeId,
      currentValue,
      requiredValue: badge.requirement.threshold,
      percentage,
    };
  },

  /**
   * Unlock a badge for a user
   */
  async unlockBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const response = await api.post(`/api/users/${userId}/badges/${badgeId}/unlock`);
    return response.data;
  },

  /**
   * Get progress for a specific badge
   */
  async getBadgeProgress(userId: string, badgeId: string): Promise<BadgeProgress> {
    const response = await api.get(`/api/users/${userId}/badges/${badgeId}/progress`);
    return response.data;
  },

  /**
   * Calculate badge progress locally
   */
  calculateProgress(currentValue: number, requiredValue: number): number {
    return calculateBadgeProgress(currentValue, requiredValue);
  },
};
