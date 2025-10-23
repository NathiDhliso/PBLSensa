/**
 * Badge Definitions
 * 
 * All badge definitions with requirements and metadata
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'completion' | 'streak' | 'engagement' | 'mastery';
  requirement: BadgeRequirement;
}

export interface BadgeRequirement {
  type: 'chapter_complete' | 'course_complete' | 'streak' | 'feedback_count' | 'analogy_views';
  threshold: number;
  description: string;
}

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first chapter',
    icon: '👣',
    category: 'completion',
    requirement: {
      type: 'chapter_complete',
      threshold: 1,
      description: 'Complete 1 chapter',
    },
  },
  {
    id: 'course-master',
    name: 'Course Master',
    description: 'Complete an entire course',
    icon: '🎓',
    category: 'completion',
    requirement: {
      type: 'course_complete',
      threshold: 1,
      description: 'Complete 1 course',
    },
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'streak',
    requirement: {
      type: 'streak',
      threshold: 7,
      description: 'Learn for 7 consecutive days',
    },
  },
  {
    id: 'month-champion',
    name: 'Month Champion',
    description: 'Maintain a 30-day learning streak',
    icon: '👑',
    category: 'streak',
    requirement: {
      type: 'streak',
      threshold: 30,
      description: 'Learn for 30 consecutive days',
    },
  },
  {
    id: 'helpful-learner',
    name: 'Helpful Learner',
    description: 'Provide 10 pieces of feedback',
    icon: '💡',
    category: 'engagement',
    requirement: {
      type: 'feedback_count',
      threshold: 10,
      description: 'Submit 10 feedback items',
    },
  },
  {
    id: 'analogy-explorer',
    name: 'Analogy Explorer',
    description: 'View all analogies in a chapter',
    icon: '🔍',
    category: 'mastery',
    requirement: {
      type: 'analogy_views',
      threshold: 100, // percentage
      description: 'View 100% of analogies in any chapter',
    },
  },
];

/**
 * Get badge by ID
 */
export function getBadgeById(id: string): Badge | undefined {
  return BADGE_DEFINITIONS.find(badge => badge.id === id);
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: Badge['category']): Badge[] {
  return BADGE_DEFINITIONS.filter(badge => badge.category === category);
}

/**
 * Calculate badge progress percentage
 */
export function calculateBadgeProgress(currentValue: number, requiredValue: number): number {
  return Math.min(100, Math.round((currentValue / requiredValue) * 100));
}
