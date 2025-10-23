/**
 * ExamRelevanceIndicator Component
 * 
 * Visual indicator for exam relevance of concepts in PBL portal
 */

export type ExamRelevance = 'high' | 'medium' | 'low';

interface ExamRelevanceIndicatorProps {
  relevance: ExamRelevance;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ExamRelevanceIndicator({ 
  relevance, 
  showLabel = false,
  size = 'md' 
}: ExamRelevanceIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const config = getRelevanceConfig(relevance);

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          ${config.bgColor}
          ${relevance === 'high' ? 'exam-relevant-glow' : ''}
        `}
        title={`${config.label} exam relevance`}
      />
      {showLabel && (
        <span className={`${labelSizeClasses[size]} font-medium ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Get styling configuration for exam relevance level
 */
export function getRelevanceConfig(relevance: ExamRelevance) {
  const configs = {
    high: {
      label: 'High',
      bgColor: 'bg-orange-500 dark:bg-orange-400',
      textColor: 'text-orange-700 dark:text-orange-400',
      borderColor: 'border-orange-500 dark:border-orange-400',
      glowColor: 'rgba(249, 115, 22, 0.6)', // orange-500
      nodeScale: 1.3,
    },
    medium: {
      label: 'Medium',
      bgColor: 'bg-yellow-500 dark:bg-yellow-400',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      borderColor: 'border-yellow-500 dark:border-yellow-400',
      glowColor: 'rgba(234, 179, 8, 0.4)', // yellow-500
      nodeScale: 1.0,
    },
    low: {
      label: 'Low',
      bgColor: 'bg-gray-400 dark:bg-gray-500',
      textColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-gray-400 dark:border-gray-500',
      glowColor: 'transparent',
      nodeScale: 1.0,
    },
  };

  return configs[relevance];
}

/**
 * Get D3 node styling based on exam relevance
 * Use this function when styling D3 concept map nodes
 */
export function getNodeStyle(relevance: ExamRelevance) {
  const config = getRelevanceConfig(relevance);
  
  return {
    scale: config.nodeScale,
    borderColor: config.borderColor,
    glowColor: config.glowColor,
    shouldGlow: relevance === 'high',
  };
}

/**
 * Determine exam relevance from score (0-1)
 */
export function getRelevanceFromScore(score: number): ExamRelevance {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}
