/**
 * Profile Types
 * 
 * Type definitions for user profile data
 */

export type AgeRange = 'Under 18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  ageRange?: AgeRange;
  location?: string;
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  ageRange?: string;
  location?: string;
  interests?: string[];
}

export interface UpdateProfileResponse {
  profile: UserProfile;
  message: string;
}

/**
 * Common interest suggestions for autocomplete
 */
export const COMMON_INTERESTS = [
  'Science',
  'Technology',
  'Mathematics',
  'History',
  'Literature',
  'Art',
  'Music',
  'Sports',
  'Travel',
  'Cooking',
  'Photography',
  'Gaming',
  'Reading',
  'Writing',
  'Programming',
  'Design',
  'Business',
  'Psychology',
  'Philosophy',
  'Languages',
];

/**
 * Age range options for select dropdown
 */
export const AGE_RANGE_OPTIONS = [
  { value: 'Under 18', label: 'Under 18' },
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
];
