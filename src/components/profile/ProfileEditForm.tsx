/**
 * ProfileEditForm Component
 * 
 * Editable form for updating profile information
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserProfile, AGE_RANGE_OPTIONS, COMMON_INTERESTS } from '@/types/profile';
import { Input, Button, Select, TagInput } from '@/components/ui';
import { profileSchema, ProfileFormData } from '@/utils/validation';
import { Save, X } from 'lucide-react';

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
            maxTags={10}
            placeholder="Add interests (press Enter)"
            error={errors.interests?.message}
          />
        )}
      />

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
