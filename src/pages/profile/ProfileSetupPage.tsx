/**
 * ProfileSetupPage Component
 * 
 * Guided profile completion for new users
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useToast } from '@/contexts/ToastContext';
import { ProfileEditForm } from '@/components/profile';
import { ProfileFormData } from '@/utils/validation';
import { UserProfile } from '@/types/profile';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { showToast } = useToast();

  // Create a minimal profile object for the form
  const initialProfile: UserProfile = {
    userId: user?.userId || '',
    email: user?.email || '',
    name: user?.username || '',
    interests: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSave = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      showToast('success', 'Profile completed successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save profile');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen p-4 pt-20"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-deep-amethyst dark:text-dark-accent-amethyst font-medium">
                Step 2 of 2
              </span>
              <span className="text-text-light dark:text-dark-text-tertiary">
                Complete Profile
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-dark-bg-secondary rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-deep-amethyst to-warm-coral rounded-full" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-deep-amethyst to-warm-coral mb-4">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
              Welcome, {user?.username || 'there'}!
            </h1>
            <p className="text-text-medium dark:text-dark-text-secondary">
              Let's personalize your learning experience. Tell us a bit about yourself to get tailored content and recommendations.
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-deep-amethyst/5 dark:bg-dark-accent-amethyst/10 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-text-dark dark:text-dark-text-primary mb-2">
              Why complete your profile?
            </h3>
            <ul className="space-y-1 text-sm text-text-medium dark:text-dark-text-secondary">
              <li>✨ Get personalized analogies based on your interests</li>
              <li>🎯 Receive content recommendations tailored to your age and location</li>
              <li>🚀 Track your learning progress and achievements</li>
            </ul>
          </div>

          {/* Profile Form */}
          <ProfileEditForm
            profile={initialProfile}
            onSave={handleSave}
            onCancel={handleSkip}
            isLoading={isPending}
          />

          {/* Skip Option */}
          <div className="mt-4 text-center">
            <Button
              onClick={handleSkip}
              variant="ghost"
              size="sm"
              disabled={isPending}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
