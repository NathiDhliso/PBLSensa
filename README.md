# Sensa Learn Brand Theme System

A foundational visual identity framework for the Sensa Learn application, providing colors, gradients, animations, and dark mode support.

## Features

✅ **Brand Color System** - Complete color palette with TypeScript constants and CSS variables
✅ **Dark Mode** - Purple-tinted "twilight learning" theme with WCAG AAA contrast
✅ **Animation Framework** - Reusable Framer Motion presets for consistent motion design
✅ **Theme Switching** - Smooth transitions with localStorage persistence
✅ **Tailwind Integration** - Full utility class support for all brand assets
✅ **Type Safety** - Complete TypeScript support with autocomplete

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual API and Cognito credentials

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Setup

The application requires the following environment variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000  # Your API endpoint
VITE_API_TIMEOUT=30000

# AWS Cognito Configuration
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id

# Feature Flags (optional)
VITE_ENABLE_MOCK_API=true      # Use mock API for development
VITE_ENABLE_API_LOGGING=true   # Enable API request logging
```

**Important:** Never commit `.env.local` to version control. Use `.env.example` as a template.

## Usage Examples

### Using Brand Colors

```tsx
// With Tailwind utilities
<div className="bg-deep-amethyst text-white">
  <h1 className="text-warm-coral">Hello Sensa Learn</h1>
</div>

// With dark mode
<div className="bg-white dark:bg-dark-bg-primary">
  <p className="text-gray-800 dark:text-dark-text-primary">
    This text adapts to the theme
  </p>
</div>
```

### Using Gradients

```tsx
// With Tailwind utilities
<button className="bg-gradient-memory-learning text-white">
  Get Started
</button>

// With CSS class
<div className="bg-gradient-wisdom p-6">
  Content with gradient background
</div>
```

### Using Animations

```tsx
import { motion } from 'framer-motion';
import { buttonInteraction, pageTransition } from '@/utils/animations';

// Button with hover/tap animation
<motion.button {...buttonInteraction}>
  Click Me
</motion.button>

// Page with transition
<motion.div
  variants={pageTransition}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Page content
</motion.div>
```

## Theme System

The theme system uses CSS custom properties and the `data-theme` attribute for switching:

- **Light Mode**: Default theme with soft lavender-peachy backgrounds
- **Dark Mode**: Purple-tinted backgrounds with warm accents ("twilight learning")

The theme toggle is positioned in the top-right corner and persists user preference to localStorage.

## File Structure

```
src/
├── styles/
│   ├── brandColors.ts      # Color and gradient constants
│   └── global.css          # CSS variables and utility classes
├── utils/
│   └── animations.ts       # Framer Motion animation presets
├── components/
│   └── ThemeToggle.tsx     # Theme switcher component
└── App.tsx                 # Root component with theme setup
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

- WCAG AAA contrast ratios (15:1 for primary text)
- Keyboard navigation support
- Respects `prefers-color-scheme` system preference
- Smooth theme transitions

## Next Steps

This theme system is ready to be used by feature implementations. To add new features:

1. Import colors from `@/styles/brandColors`
2. Use Tailwind utilities with brand colors
3. Import animation presets from `@/utils/animations`
4. Build components that respect the theme system

## License

Proprietary - Sensa Learn
