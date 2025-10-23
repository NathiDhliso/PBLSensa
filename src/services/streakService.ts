/**
 * Streak Service
 * 
 * Service for tracking and managing learning streaks
 */

import axios from 'axios';
import type { StreakData, RecordActivityRequest } from '@/types/streak';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const streakService = {
  /**
   * Get user's current streak data
   */
  async getStreak(userId: string): Promise<StreakData> {
    const response = await api.get(`/api/users/${userId}/streak`);
    return response.data;
  },

  /**
   * Record a learning activity
   */
  async recordActivity(userId: string, data: RecordActivityRequest): Promise<StreakData> {
    const response = await api.post(`/api/users/${userId}/activity`, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },

  /**
   * Calculate streak from activity history
   * (Client-side utility for validation/display)
   */
  calculateStreak(activities: { date: string }[]): { current: number; longest: number } {
    if (activities.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Sort by date descending
    const sorted = [...activities].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const activity of sorted) {
      const activityDate = new Date(activity.date);
      activityDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
        lastDate = activityDate;
        continue;
      }

      const daysDiff = Math.floor(
        (lastDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        // Consecutive day
        tempStreak++;
      } else if (daysDiff > 1) {
        // Gap in streak
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      // daysDiff === 0 means same day, don't increment

      lastDate = activityDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Current streak is the temp streak if it includes today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivityDate = new Date(sorted[0].date);
    lastActivityDate.setHours(0, 0, 0, 0);
    
    const daysSinceLastActivity = Math.floor(
      (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    currentStreak = daysSinceLastActivity <= 1 ? tempStreak : 0;

    return { current: currentStreak, longest: longestStreak };
  },

  /**
   * Check if user is at risk of breaking streak
   */
  isAtRisk(lastActivityDate: string): boolean {
    const last = new Date(lastActivityDate);
    last.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysSince = Math.floor(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // At risk if last activity was yesterday (need to do something today)
    return daysSince === 1;
  },
};
