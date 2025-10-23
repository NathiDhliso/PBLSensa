import React from 'react';
import { Edit2, Trash2, Star } from 'lucide-react';
import { Button } from '../ui/Button';

interface AnalogyNodeProps {
  analogy: {
    id: string;
    concept_id: string;
    user_experience_text: string;
    connection_explanation?: string;
    strength: number;
    tags: string[];
    type: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onStrengthen?: (newStrength: number) => void;
  compact?: boolean;
}

export const AnalogyNode: React.FC<AnalogyNodeProps> = ({
  analogy,
  onEdit,
  onDelete,
  onStrengthen,
  compact = false,
}) => {
  // Get color based on strength (1-5)
  const getStrengthColor = (strength: number) => {
    if (strength >= 4.5) return 'from-orange-400 to-red-500';
    if (strength >= 3.5) return 'from-yellow-400 to-orange-500';
    if (strength >= 2.5) return 'from-yellow-300 to-yellow-500';
    return 'from-gray-300 to-gray-400';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 4.5) return 'Very Strong';
    if (strength >= 3.5) return 'Strong';
    if (strength >= 2.5) return 'Moderate';
    return 'Weak';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        {/* Strength indicator */}
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getStrengthColor(analogy.strength)} flex items-center justify-center text-white font-bold`}>
          {analogy.tags[0]?.charAt(0).toUpperCase() || 'A'}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {analogy.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {analogy.user_experience_text}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} title="Delete" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getStrengthColor(analogy.strength)} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
            {analogy.tags[0]?.charAt(0).toUpperCase() || 'A'}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              {analogy.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{analogy.strength.toFixed(1)}</span>
              <span className="text-xs">• {getStrengthLabel(analogy.strength)}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} title="Edit analogy">
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} title="Delete analogy" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Experience text */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
          Your Experience
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {analogy.user_experience_text}
        </p>
      </div>
      
      {/* Connection explanation */}
      {analogy.connection_explanation && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
            How It Connects
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            {analogy.connection_explanation}
          </p>
        </div>
      )}
      
      {/* Strength adjuster */}
      {onStrengthen && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
            Adjust Strength
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                onClick={() => onStrengthen(value)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  value <= analogy.strength
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title={`Set strength to ${value}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
