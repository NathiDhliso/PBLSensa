/**
 * Sensa Learn Animation Presets
 * 
 * This module provides reusable Framer Motion animation presets for consistent
 * motion design throughout the application.
 * 
 * Usage:
 * import { pageTransition, buttonInteraction } from '@/utils/animations';
 * 
 * <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
 */

import { Variants, Transition } from 'framer-motion';


// 1. Page & Component Transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const pageTransitionConfig: Transition = {
  duration: 0.4,
};


// 2. Notification Pop-ups
export const notificationVariants: Variants = {
  initial: { opacity: 0, x: 300, scale: 0.8 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 300, scale: 0.8 },
};


// 3. Looping & Pulsing Animations
export const floatingAnimation = {
  animate: { y: [0, -20, 0] },
  transition: { duration: 4, repeat: Infinity },
};

export const spinnerAnimation = {
  animate: { rotate: 360 },
  transition: { duration: 2, repeat: Infinity, ease: "linear" },
};

export const pulseAnimation = {
  animate: { scale: [1, 1.1, 1] },
  transition: { duration: 2, repeat: Infinity },
};


// 4. 3D Card Flip (controlled by state)
export const cardFlipAnimation = (isFlipped: boolean) => ({
  animate: { rotateY: isFlipped ? 180 : 0 },
  transition: { duration: 0.7 },
});


// 5. Hover & Tap (Micro-interactions)
export const buttonInteraction = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

export const cardHoverInteraction = {
  whileHover: { y: -5, scale: 1.02 },
};


// 6. Dynamic Progress Bars
export const progressBarAnimation = (progress: number, totalSteps: number) => ({
  initial: { width: 0 },
  animate: { width: `${((progress + 1) / totalSteps) * 100}%` },
  transition: { duration: 0.5, ease: "easeOut" },
});


// Fade In Stagger (for lists)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Simple CSS-based animations (for non-Framer Motion components)
export const fadeIn: React.CSSProperties = {
  animation: 'fadeIn 0.3s ease-in',
};

export const slideInRight: React.CSSProperties = {
  animation: 'slideInRight 0.3s ease-out',
};
