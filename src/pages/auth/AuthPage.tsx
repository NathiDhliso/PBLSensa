/**
 * AuthPage Component
 * 
 * Premium 3D interactive authentication experience with:
 * - Real 3D tilt effect following mouse movement
 * - Animated gradient backgrounds with particles
 * - Glassmorphic surfaces with depth
 * - Value proposition showcase
 * - Micro-interactions throughout
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { pageTransition } from '@/utils/animations';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { LogIn, UserPlus, Brain, Map, Zap } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), {
    stiffness: 150,
    damping: 15,
  });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), {
    stiffness: 150,
    damping: 15,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const features = [
    { icon: Brain, title: 'AI-Powered Analogies', color: 'from-purple-500 to-pink-500' },
    { icon: Map, title: 'Visual Concept Maps', color: 'from-blue-500 to-cyan-500' },
    { icon: Zap, title: 'Instant Understanding', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden"
    >
      {/* Animated gradient background with radial overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-deep-amethyst/5 via-transparent to-warm-coral/5 dark:from-deep-amethyst/30 dark:via-deep-amethyst/10 dark:to-warm-coral/10" />
      
      {/* Pulsing radial gradients - more purple in dark mode */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-deep-amethyst/10 dark:bg-deep-amethyst/30 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-warm-coral/10 dark:bg-deep-amethyst/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-96 h-96 rounded-full bg-deep-amethyst/5 dark:bg-deep-amethyst/25 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-deep-amethyst/20 dark:bg-deep-amethyst/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="w-full max-w-6xl relative z-10 flex gap-8 items-center">
        {/* Left Side - Value Proposition (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col gap-6 flex-1">
          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Transform Learning
              <br />
              <span className="bg-gradient-to-r from-deep-amethyst to-warm-coral bg-clip-text text-transparent">
                With AI Power
              </span>
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Turn complex PDFs into interactive concept maps with AI-generated analogies
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ x: 10, scale: 1.02 }}
                className="group p-4 rounded-2xl bg-white/60 dark:bg-dark-bg-tertiary/60 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-6 pt-4"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-deep-amethyst dark:text-white">50K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Learners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-deep-amethyst dark:text-white">1M+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">PDFs Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-deep-amethyst dark:text-white">98%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - 3D Interactive Auth Card */}
        <motion.div
          ref={cardRef}
          className="flex-1 max-w-md mx-auto lg:mx-0"
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Glowing border effect */}
          <div className="relative">
            <motion.div
              className="absolute -inset-0.5 bg-gradient-to-r from-deep-amethyst via-warm-coral to-deep-amethyst rounded-3xl blur opacity-75"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 200%' }}
            />
            
            {/* Main card with glassmorphism */}
            <div className="relative bg-white/80 dark:bg-dark-bg-tertiary/70 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-white/10">
              {/* Glassmorphism Tab Switcher with liquid morphing */}
              <div className="relative mb-8">
                <div className="flex gap-2 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-dark-bg-tertiary/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-lg">
                  {/* Sliding indicator with layoutId for smooth morphing */}
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-deep-amethyst to-warm-coral shadow-md"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                  
                  {/* Sign In Tab */}
                  <button
                    onClick={() => setMode('signin')}
                    className="relative flex-1 py-3 px-4 rounded-xl font-medium transition-colors z-10"
                  >
                    <motion.span
                      className={`flex items-center justify-center gap-2 transition-colors ${
                        mode === 'signin' 
                          ? 'text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      animate={{ scale: mode === 'signin' ? 1 : 0.95 }}
                    >
                      <motion.div
                        animate={{ rotate: mode === 'signin' ? 360 : 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <LogIn size={18} />
                      </motion.div>
                      Sign In
                    </motion.span>
                  </button>
                  
                  {/* Sign Up Tab */}
                  <button
                    onClick={() => setMode('signup')}
                    className="relative flex-1 py-3 px-4 rounded-xl font-medium transition-colors z-10"
                  >
                    <motion.span
                      className={`flex items-center justify-center gap-2 transition-colors ${
                        mode === 'signup' 
                          ? 'text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      animate={{ scale: mode === 'signup' ? 1 : 0.95 }}
                    >
                      <motion.div
                        animate={{ rotate: mode === 'signup' ? 360 : 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <UserPlus size={18} />
                      </motion.div>
                      Sign Up
                    </motion.span>
                  </button>
                </div>
              </div>

              {/* Form Container with crossfade and blur */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {mode === 'signin' ? (
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Sign In Header */}
                      <div className="text-center mb-8">
                        <motion.div
                          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-deep-amethyst to-warm-coral mb-4 shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <LogIn size={32} className="text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          Welcome Back
                        </h1>
                        <p className="text-gray-700 dark:text-gray-300">
                          Continue your learning journey
                        </p>
                      </div>

                      <LoginForm />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Sign Up Header */}
                      <div className="text-center mb-8">
                        <motion.div
                          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-deep-amethyst to-warm-coral mb-4 shadow-lg"
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <UserPlus size={32} className="text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          Create Account
                        </h1>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          Transform your PDFs into interactive concept maps
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <motion.span
                            className="flex items-center gap-1"
                            whileHover={{ scale: 1.1 }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-warm-coral animate-pulse" />
                            AI-Powered
                          </motion.span>
                          <motion.span
                            className="flex items-center gap-1"
                            whileHover={{ scale: 1.1 }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-warm-coral animate-pulse" style={{ animationDelay: '0.2s' }} />
                            Visual Learning
                          </motion.span>
                          <motion.span
                            className="flex items-center gap-1"
                            whileHover={{ scale: 1.1 }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-warm-coral animate-pulse" style={{ animationDelay: '0.4s' }} />
                            Personalized
                          </motion.span>
                        </div>
                      </div>

                      <RegisterForm />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
