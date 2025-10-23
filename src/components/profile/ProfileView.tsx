/**
 * ProfileView Component
 * 
 * Display user profile information in read-only mode
 */

import { UserProfile } from '@/types/profile';
import { Button } from '@/components/ui';
import { User, Mail, Calendar, MapPin, Tag, Edit } from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onEdit: () => void;
}

export function ProfileView({ profile, onEdit }: ProfileViewProps) {
  // Format learning style for display
  const formatLearningStyle = (style?: string) => {
    if (!style) return 'Not set';
    return style.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('/');
  };

  // Format education level for display
  const formatEducationLevel = (level?: string) => {
    if (!level) return 'Not set';
    return level.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const fields = [
    {
      icon: User,
      label: 'Name',
      value: profile.name,
    },
    {
      icon: Mail,
      label: 'Email',
      value: profile.email,
    },
    {
      icon: Calendar,
      label: 'Age Range',
      value: profile.ageRange || 'Not set',
      isEmpty: !profile.ageRange,
    },
    {
      icon: MapPin,
      label: 'Location',
      value: profile.location || 'Not set',
      isEmpty: !profile.location,
    },
    {
      icon: Tag,
      label: 'Interests',
      value: profile.interests && profile.interests.length > 0 
        ? profile.interests.join(', ') 
        : 'Not set',
      isEmpty: !profile.interests || profile.interests.length === 0,
    },
  ];

  const learningPreferences = [
    {
      label: 'Learning Style',
      value: formatLearningStyle(profile.learningStyle),
      isEmpty: !profile.learningStyle,
    },
    {
      label: 'Education Level',
      value: formatEducationLevel(profile.educationLevel),
      isEmpty: !profile.educationLevel,
    },
    {
      label: 'Background',
      value: profile.background || 'Not set',
      isEmpty: !profile.background,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Basic Profile Fields */}
      <div className="space-y-4">
        {fields.map((field) => {
          const Icon = field.icon;
          return (
            <div
              key={field.label}
              className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border-default"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-deep-amethyst/10 dark:bg-dark-accent-amethyst/20 flex items-center justify-center">
                <Icon size={20} className="text-deep-amethyst dark:text-dark-accent-amethyst" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-medium dark:text-dark-text-secondary mb-1">
                  {field.label}
                </div>
                <div className={`text-base ${
                  field.isEmpty 
                    ? 'text-text-light dark:text-dark-text-tertiary italic' 
                    : 'text-text-dark dark:text-dark-text-primary'
                }`}>
                  {field.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Learning Preferences Section */}
      <div className="border-t border-gray-200 dark:border-dark-border-default pt-6">
        <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-4">
          Learning Preferences
        </h3>
        <div className="space-y-3">
          {learningPreferences.map((pref) => (
            <div
              key={pref.label}
              className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-dark-bg-secondary"
            >
              <span className="text-sm font-medium text-text-medium dark:text-dark-text-secondary">
                {pref.label}
              </span>
              <span className={`text-sm ${
                pref.isEmpty 
                  ? 'text-text-light dark:text-dark-text-tertiary italic' 
                  : 'text-text-dark dark:text-dark-text-primary'
              }`}>
                {pref.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Button */}
      <Button
        onClick={onEdit}
        variant="primary"
        size="lg"
        leftIcon={<Edit size={20} />}
        className="w-full"
      >
        Edit Profile
      </Button>
    </div>
  );
}
