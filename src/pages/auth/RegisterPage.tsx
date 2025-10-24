/**
 * RegisterPage Component
 * 
 * User registration interface with progress indicator
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { RegisterForm } from '@/components/auth';
import { UserPlus } from 'lucide-react';

export function RegisterPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <div className="p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-deep-amethyst to-warm-coral mb-4">
              <UserPlus size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
              Create Account
            </h1>
            <p className="text-text-medium dark:text-dark-text-secondary mb-3">
              Transform your PDFs into interactive concept maps
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-text-light dark:text-dark-text-tertiary">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warm-coral" />
                AI-Powered Analogies
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warm-coral" />
                Visual Learning
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warm-coral" />
                Personalized
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <RegisterForm />

          {/* Link to Login */}
          <div className="mt-6 text-center text-sm text-text-medium dark:text-dark-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-deep-amethyst dark:text-dark-accent-amethyst font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
