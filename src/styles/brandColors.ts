/**
 * Sensa Learn Brand Colors
 * 
 * This module defines all brand colors and gradients for the Sensa Learn application.
 * Colors are organized into light mode and dark mode palettes.
 * 
 * Usage:
 * import { brandColors, brandGradients, darkGradients } from '@/styles/brandColors';
 */

export const brandColors = {
  // Primary Colors (Memory & Mind)
  deepAmethyst: '#6B46C1',
  warmCoral: '#F97316',
  richPlum: '#7C2D92',
  
  // Secondary Colors (Support & Harmony)
  goldenAmber: '#F59E0B',
  softRose: '#EC4899',
  sageGreen: '#10B981',
  
  // Neutral Colors (Warm grays with purple undertones)
  textDark: '#1f2937',
  textMedium: '#4b5563',
  textLight: '#6b7280',
  
  // Dark Mode Colors ("Twilight Learning" Theme)
  dark: {
    // Backgrounds (Purple-tinted darks)
    bg: {
      primary: '#1a0b2e',      // Deep midnight purple
      secondary: '#2d1b4e',    // Lighter purple-dark
      tertiary: '#3d2963',     // Card/elevated surfaces
      elevated: '#4a3470',     // Hover states
    },
    
    // Text (Softened, warm tints)
    text: {
      primary: '#f3e8ff',      // Soft lavender white
      secondary: '#d4b5f7',    // Muted purple-white
      tertiary: '#b18cd9',     // Dimmer text
      muted: '#8b6db3',        // Disabled/placeholder
    },
    
    // Accent overlays (for gradients on dark)
    accent: {
      amethyst: '#8b5cf6',     // Brighter amethyst for dark mode
      coral: '#fb923c',        // Warmer coral for contrast
      plum: '#a855f7',         // Vibrant plum
      amber: '#fbbf24',        // Golden glow
      rose: '#f472b6',         // Soft rose
      green: '#34d399',        // Bright sage
    },
    
    // Borders & dividers
    border: {
      default: '#4a3470',      // Subtle purple border
      emphasis: '#6b46c1',     // Brand amethyst
      muted: '#2d1b4e',        // Very subtle
    },
  },
} as const;

export const brandGradients = {
  // Primary Gradient: Memory to Learning
  memoryToLearning: 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
  
  // Wisdom: Deepening wisdom and emotional connection
  wisdom: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
  
  // Growth: Illumination leading to growth
  growth: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)',
  
  // Transformation: Complete learning journey
  transformation: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
  
  // Subtle Background
  subtleBackground: 'linear-gradient(135deg, #FAF5FF 0%, #FFF7ED 50%, #FDF2F8 100%)',
} as const;

export const darkGradients = {
  // Dark mode equivalents of brand gradients
  memoryToLearning: 'linear-gradient(135deg, #8b5cf6 0%, #fb923c 100%)',
  wisdom: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #f472b6 100%)',
  growth: 'linear-gradient(135deg, #fbbf24 0%, #34d399 100%)',
  transformation: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 25%, #fb923c 75%, #fbbf24 100%)',
  
  // Dark background gradients (very subtle)
  subtleBackground: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 50%, #241539 100%)',
  
  // Glow effects for dark mode
  glowAmethyst: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
  glowCoral: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 70%)',
} as const;

export type BrandColor = keyof typeof brandColors;
export type BrandGradient = keyof typeof brandGradients;
