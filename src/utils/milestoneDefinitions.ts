/**
 * Milestone Definitions
 * 
 * Learning journey milestones with professional language
 * Focuses on personal growth and knowledge building
 */

export interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'completion' | 'consistency' | 'engagement' | 'mastery';
  insightMessage: string;
  requirement: MilestoneRequirement;
}

export interface MilestoneRequirement {
  type: 'chapter_complete' | 'course_complete' | 'consistency' | 'feedback_count' | 'analogy_views';
  threshold: number;
  description: string;
}

export const MILESTONE_DEFINITIONS: Milestone[] = [
  {
    id: 'first-chapter-complete',
    name: 'First Chapter Mastered',
    description: 'You\'ve completed your first chapter',
    icon: '✓',
    category: 'completion',
    insightMessage: 'You\'ve taken the first step in building lasting knowledge. Every journey begins with a single chapter.',
    requirement: {
      type: 'chapter_complete',
      threshold: 1,
      description: 'Complete 1 chapter',
    },
  },
  {
    id: 'course-completed',
    name: 'Course Completed',
    description: 'You\'ve completed an entire course',
    icon: '📚',
    category: 'completion',
    insightMessage: 'You\'ve demonstrated commitment to deep learning. This knowledge is now part of your foundation.',
    requirement: {
      type: 'course_complete',
      threshold: 1,
      description: 'Complete 1 course',
    },
  },
  {
    id: 'one-week-consistent',
    name: 'One Week of Consistent Learning',
    description: 'You\'ve learned for 7 consecutive days',
    icon: '📅',
    category: 'consistency',
    insightMessage: 'Consistency builds expertise. You\'re developing a sustainable learning habit.',
    requirement: {
      type: 'consistency',
      threshold: 7,
      description: 'Learn for 7 consecutive days',
    },
  },
  {
    id: 'one-month-consistent',
    name: 'One Month of Dedicated Learning',
    description: 'You\'ve maintained learning for 30 consecutive days',
    icon: '🗓️',
    category: 'consistency',
    insightMessage: 'A month of dedication shows true commitment. You\'re building knowledge that lasts.',
    requirement: {
      type: 'consistency',
      threshold: 30,
      description: 'Learn for 30 consecutive days',
    },
  },
  {
    id: 'active-contributor',
    name: 'Active Contributor',
    description: 'You\'ve provided 10 pieces of feedback',
    icon: '💬',
    category: 'engagement',
    insightMessage: 'Your insights help improve the learning experience for everyone. Thank you for contributing.',
    requirement: {
      type: 'feedback_count',
      threshold: 10,
      description: 'Submit 10 feedback items',
    },
  },
  {
    id: 'thorough-learner',
    name: 'Thorough Learner',
    description: 'You\'ve explored all analogies in a chapter',
    icon: '🔎',
    category: 'mastery',
    insightMessage: 'Deep exploration leads to deep understanding. You\'re connecting concepts in meaningful ways.',
    requirement: {
      type: 'analogy_views',
      threshold: 100, // percentage
      description: 'View 100% of analogies in any chapter',
    },
  },
];

/**
 * Get milestone by ID
 */
export function getMilestoneById(id: string): Milestone | undefined {
  return MILESTONE_DEFINITIONS.find(milestone => milestone.id === id);
}

/**
 * Get milestones by category
 */
export function getMilestonesByCategory(category: Milestone['category']): Milestone[] {
  return MILESTONE_DEFINITIONS.filter(milestone => milestone.category === category);
}

/**
 * Calculate milestone progress percentage
 */
export function calculateMilestoneProgress(currentValue: number, requiredValue: number): number {
  return Math.min(100, Math.round((currentValue / requiredValue) * 100));
}

/**
 * Get all milestone categories
 */
export function getMilestoneCategories(): Milestone['category'][] {
  return ['completion', 'consistency', 'engagement', 'mastery'];
}

/**
 * Get milestone category display name
 */
export function getMilestoneCategoryName(category: Milestone['category']): string {
  const names: Record<Milestone['category'], string> = {
    completion: 'Completion',
    consistency: 'Learning Consistency',
    engagement: 'Community Engagement',
    mastery: 'Deep Understanding',
  };
  return names[category];
}
