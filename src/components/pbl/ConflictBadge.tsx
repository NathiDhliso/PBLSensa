/**
 * ConflictBadge Component
 * 
 * Badge indicator for concepts with conflicts
 */

import { AlertTriangle } from 'lucide-react';

interface ConflictBadgeProps {
  conflictCount: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ConflictBadge({ conflictCount, onClick, size = 'md' }: ConflictBadgeProps) {
  if (conflictCount === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center gap-2
        bg-orange-100 dark:bg-orange-900/30
        text-orange-700 dark:text-orange-400
        border border-orange-300 dark:border-orange-700
        rounded-full font-medium
        hover:bg-orange-200 dark:hover:bg-orange-900/50
        transition-colors
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
      title={`${conflictCount} conflict${conflictCount > 1 ? 's' : ''} detected`}
    >
      <AlertTriangle className={iconSizes[size]} />
      <span>
        {conflictCount} Conflict{conflictCount > 1 ? 's' : ''}
      </span>
    </button>
  );
}
