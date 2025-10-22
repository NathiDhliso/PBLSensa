/**
 * ForgotPasswordPage Component
 * 
 * Password reset initiation page
 */

import { motion } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { ForgotPasswordForm } from '@/components/auth';
import { KeyRound } from 'lucide-react';

export function ForgotPasswordPage() {
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
              <KeyRound size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
              Forgot Password?
            </h1>
            <p className="text-text-medium dark:text-dark-text-secondary">
              No worries, we'll send you reset instructions
            </p>
          </div>

          {/* Forgot Password Form */}
          <ForgotPasswordForm />
        </div>
      </div>
    </motion.div>
  );
}
