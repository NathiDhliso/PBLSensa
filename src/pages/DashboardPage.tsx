/**
 * DashboardPage Component
 * 
 * Main dashboard with navigation and profile completion banner
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileCompletionBanner } from '@/components/profile';
import { Button } from '@/components/ui';
import { LogOut, User, BookOpen } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isProfileIncomplete = profile && (
    !profile.ageRange || 
    !profile.location || 
    !profile.interests || 
    profile.interests.length === 0
  );

  const handleLogout = async () => {
    try {
      await signOut();
      queryClient.clear(); // Clear all cached data
      showToast('success', 'You have been logged out successfully');
      navigate('/login', { replace: true });
    } catch (error: any) {
      showToast('error', error.message || 'Failed to log out');
    }
  };

  const handleCompleteProfile = () => {
    navigate('/profile');
  };

  return (
    <>
      {/* Profile Completion Banner */}
      {isProfileIncomplete && (
        <ProfileCompletionBanner
          onComplete={handleCompleteProfile}
          onDismiss={() => {}}
        />
      )}

      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        className="min-h-screen p-4 pt-20"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header with Logout */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
                Welcome back{user?.username ? `, ${user.username}` : ''}!
              </h1>
              <p className="text-text-medium dark:text-dark-text-secondary">
                Ready to continue your learning journey?
              </p>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="md"
              leftIcon={<LogOut size={20} />}
            >
              Logout
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => navigate('/profile')}
              className="p-6 bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg hover:shadow-xl transition-shadow text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-deep-amethyst/10 dark:bg-dark-accent-amethyst/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User size={24} className="text-deep-amethyst dark:text-dark-accent-amethyst" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-1">
                    My Profile
                  </h3>
                  <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                    View and edit your profile settings
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/courses')}
              className="p-6 bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg hover:shadow-xl transition-shadow text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-warm-coral/10 dark:bg-dark-accent-coral/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen size={24} className="text-warm-coral dark:text-dark-accent-coral" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-1">
                    My Courses
                  </h3>
                  <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                    Manage courses and documents
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/ui-showcase')}
              className="p-6 bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg hover:shadow-xl transition-shadow text-left group border-2 border-dashed border-gray-300 dark:border-gray-600"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-soft-sage/10 dark:bg-dark-accent-sage/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-soft-sage dark:text-dark-accent-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-1">
                    UI Showcase
                  </h3>
                  <p className="text-sm text-text-medium dark:text-dark-text-secondary">
                    View all components and styles
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Main Content */}
          <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-4">
              Getting Started
            </h2>
            <div className="space-y-4 text-text-medium dark:text-dark-text-secondary">
              <p>
                Welcome to Sensa Learn! This is your personalized learning dashboard where you'll be able to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your courses and learning materials</li>
                <li>View interactive concept maps</li>
                <li>Get personalized analogies based on your interests</li>
                <li>Track your learning progress and achievements</li>
              </ul>
              <p className="text-sm italic">
                More features coming soon! The PBL Core Features (Phase 3) will add course management, document uploads, and concept mapping.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
