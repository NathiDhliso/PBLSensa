/**
 * Profile Types
 * 
 * Type definitions for user profile data
 */

export type AgeRange = 'Under 18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';

export type EducationLevel = 'high_school' | 'undergraduate' | 'graduate' | 'professional';

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  ageRange?: AgeRange;
  location?: string;
  interests: string[];
  learningStyle?: LearningStyle;
  background?: string;
  educationLevel?: EducationLevel;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  ageRange?: string;
  location?: string;
  interests?: string[];
  learningStyle?: LearningStyle;
  background?: string;
  educationLevel?: EducationLevel;
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
  'Building & Construction',
  'Culinary Arts',
  'Mystery & Detective Stories',
  'Nature & Environment',
  'Fashion & Style',
  'Film & Cinema',
  'Theater & Drama',
  'Dance',
  'Fitness & Health',
  'Gardening',
  'Astronomy',
  'Engineering',
  'Medicine',
  'Law',
  'Economics',
  'Politics',
  'Sociology',
  'Anthropology',
  'Architecture',
  'Robotics',
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

/**
 * Learning style options for select dropdown
 */
export const LEARNING_STYLE_OPTIONS = [
  { value: 'visual', label: 'Visual', description: 'Learn best through images, diagrams, and spatial understanding' },
  { value: 'auditory', label: 'Auditory', description: 'Learn best through listening and verbal instruction' },
  { value: 'kinesthetic', label: 'Kinesthetic', description: 'Learn best through hands-on experience and movement' },
  { value: 'reading-writing', label: 'Reading/Writing', description: 'Learn best through written words and note-taking' },
];

/**
 * Education level options for select dropdown
 */
export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'professional', label: 'Professional' },
];
