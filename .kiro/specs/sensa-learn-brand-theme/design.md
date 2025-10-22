# Design Document

## Overview

This document outlines the technical design for the Sensa Learn Brand Theme
System - a foundational visual identity framework that provides colors,
gradients, animations, and dark mode support for the application. The design
follows a layered architecture where theme utilities are defined once and
consumed throughout the application via TypeScript constants, CSS variables, and
Tailwind utilities.

### Design Philosophy

1. **Single Source of Truth**: All colors and gradients are defined in
   TypeScript constants and exposed through multiple interfaces (CSS variables,
   Tailwind utilities)
2. **Type Safety**: Full TypeScript support with autocomplete and compile-time
   checking
3. **Performance First**: GPU-accelerated animations, CSS transitions, and
   minimal runtime overhead
4. **Accessibility**: WCAG AAA contrast ratios in both light and dark modes
5. **Developer Experience**: Simple imports, clear naming conventions, and
   comprehensive examples

### Key Design Decisions

- **Purple-tinted dark mode** instead of pure black to maintain brand warmth and
  uniqueness
- **CSS custom properties** for runtime theme switching without JavaScript
  overhead
- **Framer Motion** for declarative animations with spring physics
- **Tailwind CSS** for utility-first styling with theme integration
- **data-theme attribute** for theme switching (more flexible than class-based
  approach)

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│              (Components consume theme utilities)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Theme Utility Layer                        │
│  (Tailwind utilities, CSS classes, Animation presets)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Theme Definition Layer                      │
│     (TypeScript constants, CSS variables, Tailwind config)  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Foundation Layer                          │
│         (React, TypeScript, Tailwind, Framer Motion)        │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── styles/
│   ├── brandColors.ts          # Color and gradient constants
│   └── global.css              # CSS variables and utility classes
├── utils/
│   └── animations.ts           # Framer Motion animation presets
├── components/
│   └── ThemeToggle.tsx         # Theme switcher component
└── App.tsx                     # Root component with theme setup
tailwind.config.js              # Tailwind theme configuration
```

## Components and Interfaces

### 1. Brand Colors Module (src/styles/brandColors.ts)

**Purpose**: Central definition of all brand colors and gradients with
TypeScript typing

**Interface**:

```typescript
export const brandColors: {
  // Light mode colors
  deepAmethyst: string;
  warmCoral: string;
  richPlum: string;
  goldenAmber: string;
  softRose: string;
  sageGreen: string;
  textDark: string;
  textMedium: string;
  textLight: string;

  // Dark mode colors
  dark: {
    bg: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      muted: string;
    };
    accent: {
      amethyst: string;
      coral: string;
      plum: string;
      amber: string;
      rose: string;
      green: string;
    };
    border: {
      default: string;
      emphasis: string;
      muted: string;
    };
  };
};

export const brandGradients: {
  memoryToLearning: string;
  wisdom: string;
  growth: string;
  transformation: string;
  subtleBackground: string;
};

export const darkGradients: {
  memoryToLearning: string;
  wisdom: string;
  growth: string;
  transformation: string;
  subtleBackground: string;
  glowAmethyst: string;
  glowCoral: string;
};

export type BrandColor = keyof typeof brandColors;
export type BrandGradient = keyof typeof brandGradients;
```

**Implementation Notes**:

- Use `as const` assertion for literal type inference
- Export types for autocomplete support
- All colors in hex format for consistency
- Dark mode colors nested under `dark` namespace

### 2. Global Styles (src/styles/global.css)

**Purpose**: Define CSS custom properties and utility classes for theme system

**Structure**:

```css
/* Layer 1: Tailwind imports */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Layer 2: Light mode CSS variables in :root */
:root {
  --color-deep-amethyst: 107 70 193;
  --color-warm-coral: 249 115 22;
  /* ... all light mode colors as RGB triplets ... */
  --gradient-memory-learning: linear-gradient(...);
  /* ... all light mode gradients ... */
}

/* Layer 3: Dark mode CSS variables */
[data-theme="dark"] {
  --color-bg-primary: 26 11 46;
  --color-bg-secondary: 45 27 78;
  /* ... all dark mode colors as RGB triplets ... */
  --gradient-memory-learning: linear-gradient(...);
  /* ... all dark mode gradients ... */
}

/* Layer 4: Smooth theme transitions */
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

/* Layer 5: 3D transform utilities */
.perspective-1000 {
  perspective: 1000px;
}
.transform-style-preserve-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
}

/* Layer 6: Gradient utility classes */
.bg-gradient-memory-learning {
  background: var(--gradient-memory-learning);
}
/* ... other gradient classes ... */

/* Layer 7: Dark mode specific utilities */
[data-theme="dark"] .glow-amethyst {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}
/* ... other glow effects ... */
```

**Implementation Notes**:

- RGB triplets allow alpha channel with Tailwind's `/ <alpha-value>` syntax
- Universal transition selector for smooth theme changes
- Gradient classes for direct CSS usage without Tailwind
- Glow effects only active in dark mode

### 3. Animation Utilities (src/utils/animations.ts)

**Purpose**: Reusable Framer Motion animation presets for consistent motion
design

**Interface**:

```typescript
import { Transition, Variants } from "framer-motion";

// Page transitions
export const pageTransition: Variants;
export const pageTransitionConfig: Transition;

// Notification animations
export const notificationVariants: Variants;

// Looping animations
export const floatingAnimation: { animate: object; transition: object };
export const spinnerAnimation: { animate: object; transition: object };
export const pulseAnimation: { animate: object; transition: object };

// Interactive animations
export const cardFlipAnimation: (isFlipped: boolean) => object;
export const buttonInteraction: { whileHover: object; whileTap: object };
export const cardHoverInteraction: { whileHover: object };

// Progress animations
export const progressBarAnimation: (
  progress: number,
  totalSteps: number,
) => object;

// List animations
export const staggerContainer: Variants;
export const staggerItem: Variants;
```

**Animation Specifications**:

1. **Page Transitions**:
   - Initial: opacity 0, x 20px (slide from right)
   - Animate: opacity 1, x 0
   - Exit: opacity 0, x -20px (slide to left)
   - Duration: 400ms

2. **Notification Pop-ups**:
   - Initial: opacity 0, x 300px, scale 0.8
   - Animate: opacity 1, x 0, scale 1
   - Exit: opacity 0, x 300px, scale 0.8

3. **Floating Animation**:
   - Y-axis: [0, -20, 0]
   - Duration: 4s
   - Repeat: Infinity

4. **Spinner Animation**:
   - Rotate: 360deg
   - Duration: 2s
   - Repeat: Infinity
   - Easing: linear

5. **Pulse Animation**:
   - Scale: [1, 1.1, 1]
   - Duration: 2s
   - Repeat: Infinity

6. **Card Flip**:
   - RotateY: 0deg (front) / 180deg (back)
   - Duration: 700ms
   - Controlled by isFlipped boolean

7. **Button Interaction**:
   - Hover: scale 1.05
   - Tap: scale 0.95

8. **Card Hover**:
   - Hover: y -5px, scale 1.02

9. **Progress Bar**:
   - Width: 0% → calculated percentage
   - Duration: 500ms
   - Easing: easeOut

10. **Stagger**:
    - Container: stagger children by 100ms
    - Item: fade in from y 20px

### 4. Tailwind Configuration (tailwind.config.js)

**Purpose**: Extend Tailwind with brand colors and configure dark mode

**Configuration Structure**:

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Light mode brand colors
        "deep-amethyst": "rgb(var(--color-deep-amethyst) / <alpha-value>)",
        "warm-coral": "rgb(var(--color-warm-coral) / <alpha-value>)",
        // ... all light colors ...

        // Dark mode colors (nested structure)
        dark: {
          bg: {
            primary: "rgb(var(--color-bg-primary) / <alpha-value>)",
            // ... all bg variants ...
          },
          text: {/* ... */},
          accent: {/* ... */},
          border: {/* ... */},
        },
      },
      backgroundImage: {
        "gradient-memory-learning":
          "linear-gradient(135deg, #6B46C1 0%, #F97316 100%)",
        // ... all gradients ...
      },
    },
  },
  plugins: [],
};
```

**Key Features**:

- Dual dark mode support: `class` and `[data-theme="dark"]`
- RGB with alpha channel support for opacity modifiers
- Nested color structure for dark mode organization
- Gradient definitions in backgroundImage for `bg-gradient-*` utilities

### 5. Theme Toggle Component (src/components/ThemeToggle.tsx)

**Purpose**: Interactive UI component for switching between light and dark modes

**Component Architecture**:

```typescript
interface ThemeToggleProps {
  // No props - fully self-contained
}

interface ThemeState {
  theme: "light" | "dark";
}
```

**State Management**:

- Local state using useState hook
- Persists to localStorage on change
- Reads from localStorage on mount
- Falls back to system preference (prefers-color-scheme)

**DOM Manipulation**:

- Sets `data-theme` attribute on `document.documentElement`
- Triggers CSS variable updates via attribute selector

**Visual Design**:

- Toggle switch with gradient background
- Animated sliding indicator with spring physics
- Sun icon (light mode) / Moon icon (dark mode)
- Hover: scale 1.05
- Tap: scale 0.95

**Accessibility**:

- Button element with proper semantics
- Icon provides visual feedback
- Smooth transitions for reduced motion users (handled by CSS)

### 6. Root App Component (src/App.tsx)

**Purpose**: Application root with theme setup and branded background

**Component Structure**:

```typescript
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br 
                    from-purple-50 via-orange-50 to-pink-50
                    dark:from-dark-bg-primary dark:via-dark-bg-secondary 
                    dark:to-[#241539]">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Router */}
      <BrowserRouter>
        <AnimatePresence mode="wait">
          {/* Routes will be added by feature implementations */}
        </AnimatePresence>
      </BrowserRouter>
    </div>
  );
}
```

**Key Features**:

- Full viewport height (min-h-screen)
- Branded gradient background with dark mode variant
- Fixed theme toggle in top-right corner
- AnimatePresence for page transition support
- Z-index layering for theme toggle visibility

## Data Models

### Color Model

```typescript
type HexColor = `#${string}`;

interface LightModeColors {
  deepAmethyst: HexColor;
  warmCoral: HexColor;
  richPlum: HexColor;
  goldenAmber: HexColor;
  softRose: HexColor;
  sageGreen: HexColor;
  textDark: HexColor;
  textMedium: HexColor;
  textLight: HexColor;
}

interface DarkModeColors {
  bg: {
    primary: HexColor;
    secondary: HexColor;
    tertiary: HexColor;
    elevated: HexColor;
  };
  text: {
    primary: HexColor;
    secondary: HexColor;
    tertiary: HexColor;
    muted: HexColor;
  };
  accent: {
    amethyst: HexColor;
    coral: HexColor;
    plum: HexColor;
    amber: HexColor;
    rose: HexColor;
    green: HexColor;
  };
  border: {
    default: HexColor;
    emphasis: HexColor;
    muted: HexColor;
  };
}

interface BrandColors extends LightModeColors {
  dark: DarkModeColors;
}
```

### Gradient Model

```typescript
type CSSGradient = `linear-gradient(${string})` | `radial-gradient(${string})`;

interface GradientSet {
  memoryToLearning: CSSGradient;
  wisdom: CSSGradient;
  growth: CSSGradient;
  transformation: CSSGradient;
  subtleBackground: CSSGradient;
}

interface DarkGradientSet extends GradientSet {
  glowAmethyst: CSSGradient;
  glowCoral: CSSGradient;
}
```

### Theme State Model

```typescript
type Theme = "light" | "dark";

interface ThemeState {
  current: Theme;
  systemPreference: Theme;
  userPreference: Theme | null;
}
```

## Error Handling

### CSS Variable Fallbacks

**Issue**: CSS custom properties not supported in older browsers

**Solution**:

- Target modern browsers only (Chrome 49+, Firefox 31+, Safari 9.1+, Edge 15+)
- Document browser requirements in README
- No fallback needed as these browsers have >95% market share

### Theme Persistence Errors

**Issue**: localStorage may be unavailable (private browsing, storage quota)

**Solution**:

```typescript
function saveTheme(theme: Theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch (error) {
    console.warn("Failed to save theme preference:", error);
    // Continue without persistence - theme will reset on reload
  }
}

function loadTheme(): Theme | null {
  try {
    return localStorage.getItem("theme") as Theme | null;
  } catch (error) {
    console.warn("Failed to load theme preference:", error);
    return null; // Fall back to system preference
  }
}
```

### Animation Performance Issues

**Issue**: Animations may be janky on low-end devices

**Solution**:

- Use GPU-accelerated properties only (transform, opacity)
- Respect prefers-reduced-motion media query
- Provide CSS fallback for critical animations

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Type Safety Violations

**Issue**: Invalid color/gradient names passed to utilities

**Solution**:

- Use TypeScript const assertions and derived types
- Export union types for valid values
- Compiler will catch invalid usage at build time

## Testing Strategy

### Unit Tests

**Color Constants**:

- Verify all colors are valid hex codes
- Verify RGB triplets match hex values
- Verify dark mode colors have sufficient contrast

**Animation Presets**:

- Verify all animation objects have required properties
- Verify duration values are reasonable (< 5s)
- Verify easing functions are valid

**Theme Toggle**:

- Verify theme state updates correctly
- Verify localStorage is called with correct values
- Verify DOM attribute is set correctly

### Integration Tests

**Tailwind Integration**:

- Verify all brand colors are available as utilities
- Verify dark mode utilities work with dark: prefix
- Verify gradient utilities generate correct CSS

**CSS Variable Integration**:

- Verify CSS variables are defined in :root
- Verify dark mode variables are defined in [data-theme="dark"]
- Verify variables are accessible via var() function

### Visual Regression Tests

**Color Accuracy**:

- Screenshot light mode with all brand colors
- Screenshot dark mode with all brand colors
- Compare against design mockups

**Animation Smoothness**:

- Record video of page transitions
- Record video of theme toggle animation
- Verify 60fps playback

### Accessibility Tests

**Contrast Ratios**:

- Verify WCAG AAA compliance (7:1 minimum)
- Test with automated tools (axe, Lighthouse)
- Manual verification with color contrast analyzer

**Keyboard Navigation**:

- Verify theme toggle is keyboard accessible
- Verify focus states are visible
- Verify no keyboard traps

### Performance Tests

**Load Time**:

- Measure time to first paint with theme system
- Verify no flash of unstyled content (FOUC)
- Verify CSS bundle size < 50KB

**Runtime Performance**:

- Measure theme toggle transition time (should be < 300ms)
- Verify no layout thrashing during theme change
- Verify animations maintain 60fps

## Implementation Guidelines

### Development Workflow

1. **Setup Phase**:
   - Install dependencies (React, TypeScript, Tailwind, Framer Motion)
   - Create file structure
   - Configure Tailwind

2. **Color System Phase**:
   - Define brandColors.ts with all color constants
   - Create global.css with CSS variables
   - Update tailwind.config.js with color extensions
   - Verify colors in browser dev tools

3. **Animation System Phase**:
   - Create animations.ts with all presets
   - Test each animation in isolation
   - Document usage examples

4. **Dark Mode Phase**:
   - Add dark mode colors to brandColors.ts
   - Add dark mode CSS variables to global.css
   - Create ThemeToggle component
   - Test theme switching

5. **Integration Phase**:
   - Update App.tsx with branded background
   - Add ThemeToggle to App
   - Test complete system
   - Create usage documentation

### Code Style Guidelines

**TypeScript**:

- Use const assertions for literal types
- Export types for public APIs
- Use descriptive variable names
- Add JSDoc comments for complex functions

**CSS**:

- Use kebab-case for class names
- Group related properties
- Add comments for non-obvious values
- Use CSS variables for theme-aware properties

**React**:

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props
- Add prop validation

### Naming Conventions

**Colors**:

- Light mode: camelCase (deepAmethyst, warmCoral)
- Dark mode: nested under `dark` namespace
- CSS variables: kebab-case with prefix (--color-deep-amethyst)
- Tailwind utilities: kebab-case (bg-deep-amethyst)

**Gradients**:

- Descriptive names (memoryToLearning, wisdom)
- CSS variables: kebab-case with prefix (--gradient-memory-learning)
- Tailwind utilities: kebab-case (bg-gradient-memory-learning)

**Animations**:

- Descriptive names (pageTransition, cardFlipAnimation)
- Function names: camelCase
- Export as named exports

## Performance Considerations

### CSS Optimization

**Critical CSS**:

- Inline CSS variables in <head> to prevent FOUC
- Load global.css before component styles
- Use Tailwind's JIT mode for minimal bundle size

**CSS Custom Properties**:

- Define once in :root and [data-theme="dark"]
- No runtime calculation overhead
- Browser-native theme switching

### Animation Performance

**GPU Acceleration**:

- Use transform and opacity only
- Avoid animating layout properties (width, height, top, left)
- Use will-change sparingly for complex animations

**Framer Motion Optimization**:

- Use layout animations for automatic optimization
- Leverage AnimatePresence for exit animations
- Use variants for better performance than inline props

### Bundle Size

**Expected Sizes**:

- brandColors.ts: ~2KB
- animations.ts: ~3KB
- global.css: ~5KB (before Tailwind)
- ThemeToggle.tsx: ~2KB
- Total theme system: ~12KB (uncompressed)

**Optimization Strategies**:

- Tree-shaking for unused exports
- Tailwind purge for unused utilities
- Gzip compression for production

### Runtime Performance

**Theme Switching**:

- CSS variable updates: < 1ms
- DOM attribute change: < 1ms
- Transition animations: 300ms (user-visible)
- Total perceived time: ~300ms

**Animation Frame Rate**:

- Target: 60fps (16.67ms per frame)
- Simple animations: 60fps on all devices
- Complex animations: 30fps minimum on low-end devices

## Security Considerations

### XSS Prevention

**CSS Injection**:

- All colors are hardcoded constants (no user input)
- CSS variables are defined in stylesheet (not inline)
- No dynamic style generation from user data

**localStorage**:

- Only stores theme preference ('light' | 'dark')
- No sensitive data stored
- No risk of XSS through localStorage

### Content Security Policy

**Recommended CSP**:

```
style-src 'self' 'unsafe-inline';
script-src 'self';
```

**Rationale**:

- 'unsafe-inline' required for Tailwind and CSS-in-JS
- No external style sources needed
- All scripts from same origin

### Third-Party Dependencies

**Framer Motion**:

- Well-maintained library with security updates
- No known vulnerabilities
- Regular dependency audits recommended

**Tailwind CSS**:

- Build-time tool (no runtime security concerns)
- No external requests
- Safe for production use

## Accessibility Considerations

### Color Contrast

**WCAG AAA Compliance**:

- Light mode primary text: 15:1 contrast ratio
- Light mode secondary text: 11:1 contrast ratio
- Dark mode primary text: 15:1 contrast ratio
- Dark mode secondary text: 11:1 contrast ratio

**Testing Tools**:

- Chrome DevTools Lighthouse
- axe DevTools
- Manual verification with contrast analyzer

### Motion Preferences

**Reduced Motion Support**:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Implementation**:

- Respect user's system preference
- Disable decorative animations
- Keep functional animations (loading states)

### Keyboard Navigation

**Theme Toggle**:

- Focusable button element
- Visible focus indicator
- Keyboard activation (Enter/Space)

**Focus Management**:

- Logical tab order
- No keyboard traps
- Skip links for navigation

## Deployment Strategy

### Build Process

1. **TypeScript Compilation**:
   - Compile .ts files to .js
   - Generate type declarations (.d.ts)
   - Verify no type errors

2. **CSS Processing**:
   - Process Tailwind with PostCSS
   - Purge unused utilities
   - Minify CSS output

3. **Bundle Optimization**:
   - Tree-shake unused exports
   - Code-split by route (if applicable)
   - Generate source maps for debugging

### Environment Configuration

**Development**:

- Hot module replacement enabled
- Source maps enabled
- No CSS purging
- Verbose error messages

**Production**:

- Minified bundles
- CSS purging enabled
- Source maps optional
- Error tracking integration

### Rollout Plan

**Phase 1: Foundation** (Week 1)

- Deploy color system and CSS variables
- Deploy Tailwind configuration
- Verify no visual regressions

**Phase 2: Animations** (Week 1)

- Deploy animation utilities
- Test performance on target devices
- Verify smooth transitions

**Phase 3: Dark Mode** (Week 2)

- Deploy dark mode colors
- Deploy theme toggle component
- Test theme persistence

**Phase 4: Documentation** (Week 2)

- Create usage examples
- Document best practices
- Train development team

### Monitoring

**Metrics to Track**:

- CSS bundle size
- JavaScript bundle size
- Page load time
- Theme toggle usage
- Dark mode adoption rate

**Error Tracking**:

- localStorage errors
- Animation performance issues
- CSS variable support issues

## Future Enhancements

### Potential Additions (Out of Current Scope)

1. **Additional Theme Variants**:
   - High contrast mode for accessibility
   - Sepia mode for reading comfort
   - Custom theme builder for users

2. **Advanced Animations**:
   - Parallax scrolling effects
   - Particle systems for backgrounds
   - Morphing shape transitions

3. **Color Customization**:
   - User-defined accent colors
   - Color blindness modes
   - Brand color overrides for white-label

4. **Performance Optimizations**:
   - CSS-in-JS for dynamic theming
   - Runtime color generation
   - Adaptive animation quality

5. **Developer Tools**:
   - Theme preview component
   - Color palette generator
   - Animation playground

### Migration Path

**From Current System**:

- All existing code continues to work
- New features opt-in via imports
- No breaking changes to public API

**Deprecation Strategy**:

- Mark old utilities as deprecated
- Provide migration guide
- Support old utilities for 2 major versions

## Conclusion

This design provides a comprehensive, performant, and accessible theme system
for the Sensa Learn application. The architecture prioritizes developer
experience through TypeScript safety, simple imports, and clear documentation,
while maintaining excellent runtime performance through CSS variables and
GPU-accelerated animations.

The purple-tinted dark mode creates a unique "twilight learning" aesthetic that
differentiates Sensa from competitors while maintaining WCAG AAA accessibility
standards. The system is designed to be extended in the future without breaking
existing implementations.

All components are self-contained and can be implemented independently, allowing
for incremental development and testing. The clear separation between theme
definition, utilities, and application code ensures maintainability and
scalability as the application grows.
