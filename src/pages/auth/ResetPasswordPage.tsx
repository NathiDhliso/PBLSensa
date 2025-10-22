/**
 * ResetPasswordPage Component
 * 
 * Password reset completion page with verification code
 */

import { motion } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { ResetPasswordForm } from '@/components/auth';
import { Lock } from 'lucide-react';

export function ResetPasswordPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-deep-amethyst to-warm-coral mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
              Reset Password
            </h1>
            <p className="text-text-medium dark:text-dark-text-secondary">
              Enter the code from your email and choose a new password
            </p>
          </div>

          {/* Reset Password Form */}
          <ResetPasswordForm />
        </div>
      </div>
    </motion.div>
  );
}
