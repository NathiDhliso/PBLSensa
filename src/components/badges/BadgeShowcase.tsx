/**
 * BadgeShowcase Component (Learning Journey Display)
 * 
 * Professional display of learning milestones
 * Refactored to use milestone terminology while maintaining backward compatibility
 */

import { useState } from 'react';
import { BadgeCard } from './BadgeCard';
import { BadgeModal } from './BadgeModal';
import type { BadgeWithProgress } from '@/types/badges';

interface BadgeShowcaseProps {
  badges: BadgeWithProgress[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);

  const achievedMilestones = badges.filter(b => b.isUnlocked);
  const inProgressMilestones = badges.filter(b => !b.isUnlocked);

  return (
    <div className="space-y-8">
      {/* Achieved Milestones */}
      {achievedMilestones.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary">
              Achieved Milestones
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary mt-1">
              {achievedMilestones.length} {achievedMilestones.length === 1 ? 'milestone' : 'milestones'} reached in your learning journey
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievedMilestones.map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>
        </div>
      )}

      {/* In Progress Milestones */}
      {inProgressMilestones.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary">
              In Progress
            </h3>
            <p className="text-sm text-text-medium dark:text-dark-text-secondary mt-1">
              Continue learning to unlock these milestones
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {inProgressMilestones.map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Milestone Detail Modal */}
      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}
