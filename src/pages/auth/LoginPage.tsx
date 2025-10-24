/**
 * LoginPage Component
 * 
 * User login interface with centered card layout
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { LoginForm } from '@/components/auth';
import { LogIn } from 'lucide-react';

export function LoginPage() {
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
              <LogIn size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-2">
              Welcome Back
            </h1>
            <p className="text-text-medium dark:text-dark-text-secondary">
              Sign in to continue your learning journey
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Links */}
          <div className="mt-6 space-y-3 text-center text-sm">
            <Link
              to="/forgot-password"
              className="block text-deep-amethyst dark:text-dark-accent-amethyst hover:underline"
            >
              Forgot password?
            </Link>
            
            <div className="text-text-medium dark:text-dark-text-secondary">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-deep-amethyst dark:text-dark-accent-amethyst font-medium hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
