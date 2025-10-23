/**
 * ConfirmEmailPage Component
 * 
 * Email confirmation page for post-registration verification
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { ConfirmEmailForm } from '@/components/auth';
import { Mail } from 'lucide-react';

export function ConfirmEmailPage() {
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
              <Mail size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
              Confirm Your Email
            </h1>
            <p className="text-text-medium dark:text-dark-text-secondary">
              Enter the confirmation code sent to your email
            </p>
          </div>

          {/* Confirmation Form */}
          <ConfirmEmailForm />

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-text-medium dark:text-dark-text-secondary">
            Didn't receive the code?{' '}
            <Link
              to="/register"
              className="text-deep-amethyst dark:text-dark-accent-amethyst font-medium hover:underline"
            >
              Try registering again
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
