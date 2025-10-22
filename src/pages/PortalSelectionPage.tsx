/**
 * Portal Selection Page
 * 
 * Main landing page after login where users choose between:
 * - PBL Portal: Course management, document uploads, concept maps
 * - Sensa Learn Portal: Personalized learning with analogies and memory techniques
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { pageTransition, staggerContainer, staggerItem } from '@/utils/animations';

export function PortalSelectionPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await signOut();
      queryClient.clear();
      showToast('success', 'You have been logged out successfully');
      navigate('/login', { replace: true });
    } catch (error: any) {
      showToast('error', error.message || 'Failed to log out');
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-pink-50 dark:from-dark-bg-primary dark:via-dark-bg-secondary dark:to-[#241539] p-4"
    >
      <div className="max-w-6xl mx-auto pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
              Welcome back{user?.username ? `, ${user.username}` : ''}!
            </h1>
            <p className="text-xl text-text-medium dark:text-dark-text-secondary">
              Choose your learning portal
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              size="md"
              leftIcon={<User size={20} />}
            >
              Profile
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="md"
              leftIcon={<LogOut size={20} />}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Portal Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-2 gap-8 mb-8"
        >
          {/* PBL Portal */}
          <motion.div variants={staggerItem}>
            <button
              onClick={() => navigate('/pbl')}
              className="w-full h-full p-8 bg-white dark:bg-dark-bg-tertiary rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-left group hover:scale-105 border-2 border-transparent hover:border-deep-amethyst dark:hover:border-dark-accent-amethyst"
            >
              <div className="flex flex-col h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-deep-amethyst to-warm-coral flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen size={32} className="text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-3">
                  PBL Portal
                </h2>
                
                <p className="text-text-medium dark:text-dark-text-secondary mb-6 flex-1">
                  Perspective-Based Learning platform for managing courses, uploading documents, and exploring concept maps.
                </p>
                
                <div className="space-y-2 text-sm text-text-medium dark:text-dark-text-secondary">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-deep-amethyst dark:bg-dark-accent-amethyst"></div>
                    <span>Manage courses and documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-deep-amethyst dark:bg-dark-accent-amethyst"></div>
                    <span>Upload and process PDFs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-deep-amethyst dark:bg-dark-accent-amethyst"></div>
                    <span>Explore interactive concept maps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-deep-amethyst dark:bg-dark-accent-amethyst"></div>
                    <span>Track document processing</span>
                  </div>
                </div>

                <div className="mt-6 text-deep-amethyst dark:text-dark-accent-amethyst font-semibold group-hover:translate-x-2 transition-transform">
                  Enter PBL Portal →
                </div>
              </div>
            </button>
          </motion.div>

          {/* Sensa Learn Portal */}
          <motion.div variants={staggerItem}>
            <button
              onClick={() => navigate('/sensa')}
              className="w-full h-full p-8 bg-white dark:bg-dark-bg-tertiary rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-left group hover:scale-105 border-2 border-transparent hover:border-warm-coral dark:hover:border-dark-accent-coral"
            >
              <div className="flex flex-col h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warm-coral to-gentle-sky flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain size={32} className="text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-warm-coral dark:text-dark-accent-coral mb-3">
                  Sensa Learn
                </h2>
                
                <p className="text-text-medium dark:text-dark-text-secondary mb-6 flex-1">
                  Personalized learning experience with custom analogies and memory techniques based on your PBL content.
                </p>
                
                <div className="space-y-2 text-sm text-text-medium dark:text-dark-text-secondary">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-warm-coral dark:bg-dark-accent-coral"></div>
                    <span>Personalized chapter summaries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-warm-coral dark:bg-dark-accent-coral"></div>
                    <span>Custom analogies based on interests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-warm-coral dark:bg-dark-accent-coral"></div>
                    <span>Memory-enhancing techniques</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-warm-coral dark:bg-dark-accent-coral"></div>
                    <span>Learning mantras and hints</span>
                  </div>
                </div>

                <div className="mt-6 text-warm-coral dark:text-dark-accent-coral font-semibold group-hover:translate-x-2 transition-transform">
                  Enter Sensa Learn →
                </div>
              </div>
            </button>
          </motion.div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/50 dark:bg-dark-bg-tertiary/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-dark-border-default"
        >
          <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-3">
            How it works
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-text-medium dark:text-dark-text-secondary">
            <div>
              <p className="font-semibold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
                1. Start with PBL
              </p>
              <p>
                Upload your course materials and documents. The system will process them and create interactive concept maps to help you understand the relationships between concepts.
              </p>
            </div>
            <div>
              <p className="font-semibold text-warm-coral dark:text-dark-accent-coral mb-2">
                2. Enhance with Sensa Learn
              </p>
              <p>
                Once your content is processed, Sensa Learn creates personalized analogies and memory techniques based on your interests and learning style to help you remember better.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
