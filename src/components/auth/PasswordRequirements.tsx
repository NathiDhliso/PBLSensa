/**
 * PasswordRequirements Component
 * 
 * Displays password requirements with visual indicators showing which are met.
 * Provides real-time feedback as user types their password.
 */

import { Check, X } from 'lucide-react';
import { PASSWORD_REQUIREMENTS } from '@/utils/validation';

export interface PasswordRequirementsProps {
  password: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  className?: string;
}

export function PasswordRequirements({ 
  password, 
  requirements, 
  className = '' 
}: PasswordRequirementsProps) {
  const requirementsList = [
    { key: 'minLength', label: PASSWORD_REQUIREMENTS[0], met: requirements.minLength },
    { key: 'hasUppercase', label: PASSWORD_REQUIREMENTS[1], met: requirements.hasUppercase },
    { key: 'hasLowercase', label: PASSWORD_REQUIREMENTS[2], met: requirements.hasLowercase },
    { key: 'hasNumber', label: PASSWORD_REQUIREMENTS[3], met: requirements.hasNumber },
    { key: 'hasSpecial', label: PASSWORD_REQUIREMENTS[4], met: requirements.hasSpecial },
  ];

  // Only show if password has been entered
  if (!password || password.length === 0) {
    return null;
  }

  return (
    <div className={`mt-3 ${className}`}>
      <p className="text-xs font-medium text-text-medium dark:text-dark-text-secondary mb-2">
        Password must contain:
      </p>
      <ul className="space-y-1" role="list">
        {requirementsList.map((req) => (
          <li
            key={req.key}
            className="flex items-center gap-2 text-xs"
          >
            {req.met ? (
              <Check 
                size={14} 
                className="text-green-600 dark:text-green-400 flex-shrink-0" 
                aria-label="Requirement met"
              />
            ) : (
              <X 
                size={14} 
                className="text-red-500 dark:text-red-400 flex-shrink-0" 
                aria-label="Requirement not met"
              />
            )}
            <span 
              className={
                req.met 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-text-medium dark:text-dark-text-tertiary'
              }
            >
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
