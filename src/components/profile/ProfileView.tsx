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

  return (
    <div className="space-y-6">
      {/* Profile Fields */}
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
