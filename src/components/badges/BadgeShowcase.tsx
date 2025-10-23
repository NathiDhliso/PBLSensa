/**
 * BadgeShowcase Component
 * 
 * Grid display of all badges (earned and locked)
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

  const earnedBadges = badges.filter(b => b.isUnlocked);
  const lockedBadges = badges.filter(b => !b.isUnlocked);

  return (
    <div className="space-y-8">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-text-dark dark:text-dark-text-primary mb-4">
            Earned Badges ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedBadges.map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-text-dark dark:text-dark-text-primary mb-4">
            Locked Badges ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lockedBadges.map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}
