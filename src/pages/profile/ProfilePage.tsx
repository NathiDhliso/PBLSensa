/**
 * ProfilePage Component
 * 
 * Main profile management page with view/edit mode toggle
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { useProfile } from '@/hooks/useProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useToast } from '@/contexts/ToastContext';
import { ProfileView, ProfileEditForm } from '@/components/profile';
import { ProfileFormData } from '@/utils/validation';
import { User, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export function ProfilePage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { showToast } = useToast();

  const handleSave = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      showToast('success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
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
        {/* Back Button */}
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          size="md"
          leftIcon={<ArrowLeft size={20} />}
          className="mb-6"
        >
          Back to Dashboard
        </Button>

        <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-deep-amethyst to-warm-coral flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst">
                {isEditing ? 'Edit Profile' : 'My Profile'}
              </h1>
              <p className="text-text-medium dark:text-dark-text-secondary">
                {isEditing 
                  ? 'Update your personal information' 
                  : 'Manage your account settings and preferences'
                }
              </p>
            </div>
          </div>

          {/* Content */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={48} className="animate-spin text-deep-amethyst dark:text-dark-accent-amethyst mb-4" />
              <p className="text-text-medium dark:text-dark-text-secondary">Loading profile...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle size={48} className="text-red-600 dark:text-red-400 mb-4" />
              <p className="text-text-dark dark:text-dark-text-primary mb-4">
                Failed to load profile
              </p>
              <Button onClick={() => refetch()} variant="primary">
                Try Again
              </Button>
            </div>
          )}

          {profile && (
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProfileEditForm
                    profile={profile}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isLoading={isPending}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProfileView
                    profile={profile}
                    onEdit={() => setIsEditing(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}
