/**
 * MemoryTechniqueCard Component
 * 
 * Displays a memory technique with icon and application instructions
 */

import { Brain, Lightbulb, Map, Calendar } from 'lucide-react';
import { MemoryTechnique } from '@/types/analogy';

interface MemoryTechniqueCardProps {
  technique: MemoryTechnique;
}

export function MemoryTechniqueCard({ technique }: MemoryTechniqueCardProps) {
  // Map technique types to icons and colors
  const techniqueConfig = {
    acronym: {
      icon: Lightbulb,
      color: 'text-warm-coral dark:text-dark-accent-coral',
      bg: 'bg-warm-coral/10 dark:bg-dark-accent-coral/20',
      border: 'border-warm-coral/30 dark:border-dark-accent-coral/30',
      label: 'Acronym Method',
    },
    mind_palace: {
      icon: Map,
      color: 'text-gentle-sky dark:text-dark-accent-sky',
      bg: 'bg-gentle-sky/10 dark:bg-dark-accent-sky/20',
      border: 'border-gentle-sky/30 dark:border-dark-accent-sky/30',
      label: 'Mind Palace',
    },
    chunking: {
      icon: Brain,
      color: 'text-soft-sage dark:text-dark-accent-sage',
      bg: 'bg-soft-sage/10 dark:bg-dark-accent-sage/20',
      border: 'border-soft-sage/30 dark:border-dark-accent-sage/30',
      label: 'Chunking',
    },
    spaced_repetition: {
      icon: Calendar,
      color: 'text-deep-amethyst dark:text-dark-accent-amethyst',
      bg: 'bg-deep-amethyst/10 dark:bg-dark-accent-amethyst/20',
      border: 'border-deep-amethyst/30 dark:border-dark-accent-amethyst/30',
      label: 'Spaced Repetition',
    },
  };
  
  const config = techniqueConfig[technique.technique_type];
  const Icon = config.icon;
  
  return (
    <div className={`
      rounded-lg p-5 border
      ${config.bg} ${config.border}
      transition-all hover:shadow-md
    `}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${config.bg}
        `}>
          <Icon size={20} className={config.color} />
        </div>
        <h4 className={`font-semibold ${config.color}`}>
          {config.label}
        </h4>
      </div>
      
      {/* Technique Description */}
      <p className="text-text-dark dark:text-dark-text-primary mb-3 leading-relaxed">
        {technique.technique_text}
      </p>
      
      {/* Application */}
      <div className="pt-3 border-t border-gray-200 dark:border-dark-border-default">
        <p className="text-sm font-medium text-text-medium dark:text-dark-text-secondary mb-1">
          How to apply:
        </p>
        <p className="text-sm text-text-medium dark:text-dark-text-secondary">
          {technique.application}
        </p>
      </div>
    </div>
  );
}
