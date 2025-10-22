/**
 * ProfileEditForm Component
 * 
 * Editable form for updating profile information
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserProfile, AGE_RANGE_OPTIONS, COMMON_INTERESTS, LEARNING_STYLE_OPTIONS, EDUCATION_LEVEL_OPTIONS } from '@/types/profile';
import { Input, Button, Select, TagInput } from '@/components/ui';
import { profileSchema, ProfileFormData } from '@/utils/validation';
import { Save, X, Brain } from 'lucide-react';

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProfileEditForm({ profile, onSave, onCancel, isLoading }: ProfileEditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      ageRange: profile.ageRange || '',
      location: profile.location || '',
      interests: profile.interests || [],
      learningStyle: profile.learningStyle || undefined,
      background: profile.background || '',
      educationLevel: profile.educationLevel || undefined,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: ProfileFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('name')}
        label="Name"
        type="text"
        placeholder="Your name"
        error={errors.name?.message}
        required
        autoComplete="name"
      />

      <Select
        {...register('ageRange')}
        label="Age Range"
        options={AGE_RANGE_OPTIONS}
        placeholder="Select your age range"
        error={errors.ageRange?.message}
      />

      <Input
        {...register('location')}
        label="Location"
        type="text"
        placeholder="City, Country"
        error={errors.location?.message}
        helperText="Optional - helps personalize your learning experience"
        autoComplete="address-level2"
      />

      <Controller
        name="interests"
        control={control}
        render={({ field }) => (
          <TagInput
            label="Interests"
            value={field.value || []}
            onChange={field.onChange}
            suggestions={COMMON_INTERESTS}
            maxTags={20}
            placeholder="Add interests (press Enter)"
            error={errors.interests?.message}
            helperText="Add up to 20 interests to personalize your learning experience"
          />
        )}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} className="text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary">
            Learning Preferences
          </h3>
        </div>
        <p className="text-sm text-text-medium dark:text-dark-text-secondary mb-4">
          Help us personalize your learning experience with AI-generated analogies and memory techniques
        </p>

        <Select
          {...register('learningStyle')}
          label="Learning Style"
          options={LEARNING_STYLE_OPTIONS}
          placeholder="Select your learning style"
          error={errors.learningStyle?.message}
          helperText="How do you learn best?"
        />

        <Select
          {...register('educationLevel')}
          label="Education Level"
          options={EDUCATION_LEVEL_OPTIONS}
          placeholder="Select your education level"
          error={errors.educationLevel?.message}
          className="mt-4"
        />

        <Input
          {...register('background')}
          label="Background"
          type="text"
          placeholder="e.g., Computer Science student, Working professional"
          error={errors.background?.message}
          helperText="Optional - helps tailor analogies to your experience"
          className="mt-4"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          leftIcon={<Save size={20} />}
          isLoading={isSubmitting || isLoading}
          className="flex-1"
        >
          Save Changes
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="lg"
          leftIcon={<X size={20} />}
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
