# Implementation Plan

This document outlines the step-by-step implementation tasks for the Sensa Learn Brand Theme System. Each task is designed to be discrete, testable, and builds incrementally on previous tasks.

## Task Overview

The implementation is organized into 6 main phases:
1. Project setup and dependencies
2. Color system implementation
3. Animation system implementation
4. Dark mode implementation
5. Theme toggle component
6. Integration and testing

---

## Phase 1: Project Setup

- [x] 1. Set up project structure and install dependencies


  - Create `src/styles/`, `src/utils/`, `src/components/` directories
  - Install dependencies: `npm install framer-motion lucide-react`
  - Verify Tailwind CSS is configured
  - Verify TypeScript is configured with strict mode
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

---

## Phase 2: Color System Implementation



- [x] 2. Implement brand color constants




  - [ ] 2.1 Create `src/styles/brandColors.ts` file
    - Define light mode color constants (deepAmethyst, warmCoral, richPlum, goldenAmber, softRose, sageGreen)
    - Define neutral color constants (textDark, textMedium, textLight)
    - Use exact hex values from design document


    - Apply `as const` assertion for literal type inference

    - _Requirements: 1.1, 1.2, 1.3, 7.1_

  - [ ] 2.2 Add dark mode color constants to brandColors.ts
    - Define dark.bg colors (primary, secondary, tertiary, elevated)
    - Define dark.text colors (primary, secondary, tertiary, muted)


    - Define dark.accent colors (amethyst, coral, plum, amber, rose, green)
    - Define dark.border colors (default, emphasis, muted)
    - Use exact hex values from design document

    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_


  - [ ] 2.3 Add gradient constants to brandColors.ts
    - Define light mode gradients (memoryToLearning, wisdom, growth, transformation, subtleBackground)
    - Define dark mode gradients (memoryToLearning, wisdom, growth, transformation, subtleBackground, glowAmethyst, glowCoral)
    - Use exact gradient strings from design document

    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.8_



  - [ ] 2.4 Export TypeScript types from brandColors.ts
    - Export `BrandColor` type derived from brandColors keys
    - Export `BrandGradient` type derived from brandGradients keys



    - Verify autocomplete works in IDE

    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_




- [x] 3. Implement CSS variables and global styles

  - [ ] 3.1 Create `src/styles/global.css` file
    - Import Tailwind directives (@tailwind base, components, utilities)
    - Define :root selector for light mode variables
    - _Requirements: 5.1, 5.5_



  - [ ] 3.2 Add light mode CSS variables to global.css
    - Convert all light mode colors to RGB triplets in :root



    - Define CSS variables with --color- prefix (e.g., --color-deep-amethyst: 107 70 193)
    - Define gradient CSS variables with --gradient- prefix
    - _Requirements: 1.5, 2.7_




  - [ ] 3.3 Add dark mode CSS variables to global.css
    - Create [data-theme="dark"] selector
    - Convert all dark mode colors to RGB triplets
    - Define CSS variables for backgrounds, text, accents, borders
    - Define dark mode gradient CSS variables
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_




  - [ ] 3.4 Add theme transition styles to global.css
    - Create universal selector (*) with transition properties
    - Transition background-color, color, border-color over 300ms ease
    - _Requirements: 11.5, 13.7, 13.8_




  - [ ] 3.5 Add 3D transform utility classes to global.css
    - Create .perspective-1000 class (perspective: 1000px)


    - Create .transform-style-preserve-3d class
    - Create .backface-hidden class
    - _Requirements: 3.9, 5.3_




  - [ ] 3.6 Add gradient utility classes to global.css
    - Create .bg-gradient-memory-learning class
    - Create .bg-gradient-wisdom class
    - Create .bg-gradient-growth class



    - Create .bg-gradient-transformation class
    - Create .bg-gradient-subtle class
    - _Requirements: 2.6, 5.4_

  - [ ] 3.7 Add dark mode glow effect classes to global.css
    - Create [data-theme="dark"] .glow-amethyst class with box-shadow
    - Create [data-theme="dark"] .glow-coral class with box-shadow
    - _Requirements: 10.9, 12.8_




- [x] 4. Configure Tailwind CSS with brand theme


  - [ ] 4.1 Update tailwind.config.js with dark mode configuration
    - Set darkMode to ['class', '[data-theme="dark"]']
    - Configure content paths for file scanning
    - _Requirements: 4.1, 12.7_



  - [ ] 4.2 Extend Tailwind theme with light mode colors
    - Add all brand colors to theme.extend.colors
    - Use RGB with alpha channel syntax: 'rgb(var(--color-deep-amethyst) / <alpha-value>)'


    - Verify alpha channel modifiers work (e.g., bg-deep-amethyst/50)
    - _Requirements: 1.6, 4.2, 4.3_

  - [x] 4.3 Extend Tailwind theme with dark mode colors


    - Add nested dark color structure to theme.extend.colors
    - Define dark.bg, dark.text, dark.accent, dark.border with RGB syntax
    - Verify dark: prefix utilities work
    - _Requirements: 12.6_




  - [x] 4.4 Extend Tailwind theme with gradient definitions

    - Add all gradients to theme.extend.backgroundImage


    - Use exact gradient strings from design document
    - Verify bg-gradient-* utilities work
    - _Requirements: 2.6, 4.5_




---

## Phase 3: Animation System Implementation

- [ ] 5. Implement Framer Motion animation presets
  - [ ] 5.1 Create `src/utils/animations.ts` file
    - Import Variants and Transition types from framer-motion
    - Add file header comment explaining purpose
    - _Requirements: 3.8, 8.1_



  - [ ] 5.2 Implement page transition animations
    - Define pageTransition variants (initial, animate, exit)
    - Define pageTransitionConfig with duration 0.4s
    - Add inline comments explaining usage


    - _Requirements: 3.1_

  - [x] 5.3 Implement notification pop-up animations


    - Define notificationVariants (slide from right with scale)
    - Set initial: opacity 0, x 300, scale 0.8
    - Set animate: opacity 1, x 0, scale 1
    - _Requirements: 3.2_

  - [x] 5.4 Implement looping animations


    - Define floatingAnimation (y: [0, -20, 0], 4s infinite)

    - Define spinnerAnimation (rotate: 360, 2s infinite linear)
    - Define pulseAnimation (scale: [1, 1.1, 1], 2s infinite)
    - _Requirements: 3.3_

  - [x] 5.5 Implement 3D card flip animation



    - Define cardFlipAnimation function accepting isFlipped boolean
    - Return object with rotateY: 0 or 180 based on isFlipped
    - Set transition duration to 0.7s
    - _Requirements: 3.4_




  - [ ] 5.6 Implement hover and tap micro-interactions
    - Define buttonInteraction (whileHover scale 1.05, whileTap scale 0.95)
    - Define cardHoverInteraction (whileHover y -5, scale 1.02)
    - _Requirements: 3.5_




  - [x] 5.7 Implement progress bar animation

    - Define progressBarAnimation function accepting progress and totalSteps
    - Calculate width percentage: ((progress + 1) / totalSteps) * 100
    - Set transition duration 0.5s with easeOut easing
    - _Requirements: 3.6_

  - [ ] 5.8 Implement stagger animations for lists
    - Define staggerContainer variants (stagger children by 0.1s)
    - Define staggerItem variants (fade in from y: 20)
    - _Requirements: 3.7_





---

## Phase 4: Theme Toggle Component




- [ ] 6. Implement theme switcher component
  - [ ] 6.1 Create `src/components/ThemeToggle.tsx` file
    - Import Moon and Sun icons from lucide-react


    - Import motion from framer-motion

    - Import useState and useEffect from react
    - Define component function with no props



    - _Requirements: 11.6, 11.7_

  - [x] 6.2 Implement theme state management

    - Create theme state using useState<'light' | 'dark'>('light')
    - Define Theme type as 'light' | 'dark'
    - _Requirements: 11.1_

  - [ ] 6.3 Implement theme initialization on mount
    - Create useEffect to run on component mount
    - Check localStorage for saved theme preference

    - Check system preference using window.matchMedia('(prefers-color-scheme: dark)')
    - Set initial theme based on saved preference or system preference
    - Set data-theme attribute on document.documentElement
    - _Requirements: 11.1, 11.2, 11.4_

  - [ ] 6.4 Implement theme toggle function
    - Create toggleTheme function

    - Toggle between 'light' and 'dark'
    - Update state with setTheme
    - Set data-theme attribute on document.documentElement
    - Save theme to localStorage


    - _Requirements: 11.3, 11.4_


  - [ ] 6.5 Implement toggle button UI
    - Create motion.button with gradient background
    - Apply Memory to Learning gradient with theme-appropriate colors
    - Add whileHover scale 1.05 and whileTap scale 0.95

    - Set button dimensions: w-14 h-7 rounded-full
    - _Requirements: 11.8, 11.9, 11.10_

  - [ ] 6.6 Implement animated sliding indicator
    - Create motion.div for sliding indicator

    - Set dimensions: w-5 h-5 rounded-full bg-white
    - Animate x position: 0 for light, 28 for dark
    - Use spring transition (stiffness 500, damping 30)
    - _Requirements: 11.7_


  - [ ] 6.7 Implement theme icons
    - Display Sun icon when theme is 'light'
    - Display Moon icon when theme is 'dark'
    - Set icon size to 14px
    - Apply appropriate colors to icons
    - _Requirements: 11.6, 11.7_


---

## Phase 5: Root Application Integration

- [ ] 7. Update root App component with theme system
  - [ ] 7.1 Update `src/App.tsx` with imports
    - Import BrowserRouter from react-router-dom
    - Import AnimatePresence from framer-motion
    - Import ThemeToggle component
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 7.2 Implement root container with branded background
    - Create root div with min-h-screen class
    - Apply light mode gradient: bg-gradient-to-br from-purple-50 via-orange-50 to-pink-50
    - Apply dark mode gradient: dark:from-dark-bg-primary dark:via-dark-bg-secondary dark:to-[#241539]
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 7.3 Position theme toggle component
    - Create fixed positioned div: fixed top-4 right-4 z-50
    - Render ThemeToggle component inside
    - _Requirements: 6.5_

  - [ ] 7.4 Set up router with AnimatePresence
    - Wrap routes in BrowserRouter
    - Wrap routes in AnimatePresence with mode="wait"
    - Add comment indicating routes will be added by feature implementations
    - _Requirements: 6.5_

---

## Phase 6: Testing and Verification

- [ ] 8. Verify color system implementation
  - [ ] 8.1 Test light mode colors
    - Open application in browser
    - Verify all brand colors render correctly
    - Check background gradient displays properly
    - Verify text colors have sufficient contrast
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 8.2 Test dark mode colors
    - Toggle to dark mode using theme switcher
    - Verify all dark mode colors render correctly
    - Check purple-tinted backgrounds display properly
    - Verify text colors have sufficient contrast (WCAG AAA)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.10_

  - [ ] 8.3 Test Tailwind utility classes
    - Create test elements with bg-deep-amethyst, text-warm-coral, etc.
    - Verify colors apply correctly
    - Test alpha channel modifiers (bg-deep-amethyst/50)
    - Test dark mode utilities (dark:bg-dark-bg-primary)
    - _Requirements: 1.6, 4.2, 4.3, 4.4, 12.6_

  - [ ] 8.4 Test gradient utilities
    - Create test elements with bg-gradient-memory-learning, etc.
    - Verify gradients render correctly in light mode
    - Verify gradients render correctly in dark mode
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_


- [ ] 9. Verify animation system implementation
  - [ ] 9.1 Test page transition animations
    - Import and apply pageTransition to a test component
    - Verify fade and slide animations work
    - Check transition duration is 400ms
    - _Requirements: 3.1_

  - [ ] 9.2 Test looping animations
    - Apply floatingAnimation to a test element
    - Verify smooth up-down motion over 4 seconds
    - Apply spinnerAnimation and verify 360° rotation
    - Apply pulseAnimation and verify scale effect
    - _Requirements: 3.3_

  - [ ] 9.3 Test interactive animations
    - Apply buttonInteraction to a test button
    - Verify hover scales to 1.05
    - Verify tap scales to 0.95
    - Apply cardHoverInteraction to a test card
    - _Requirements: 3.5_

  - [ ] 9.4 Test 3D card flip animation
    - Create test component with cardFlipAnimation
    - Toggle isFlipped state and verify 180° rotation
    - Check transition duration is 700ms
    - Verify backface-hidden works correctly
    - _Requirements: 3.4, 3.9_

- [ ] 10. Verify theme toggle functionality
  - [ ] 10.1 Test theme switching
    - Click theme toggle button
    - Verify theme switches from light to dark
    - Verify all colors update smoothly
    - Verify transition completes in ~300ms
    - _Requirements: 11.3, 11.5, 13.8_

  - [ ] 10.2 Test theme persistence
    - Set theme to dark mode
    - Reload the page
    - Verify theme is still dark mode
    - Check localStorage contains correct value
    - _Requirements: 11.3_

  - [ ] 10.3 Test system preference detection
    - Clear localStorage
    - Set system preference to dark mode
    - Reload the page
    - Verify application uses dark mode
    - _Requirements: 11.2_

  - [ ] 10.4 Test theme toggle animations
    - Click theme toggle
    - Verify sliding indicator animates smoothly
    - Verify icon changes from Sun to Moon (or vice versa)
    - Check spring physics feel natural
    - _Requirements: 11.7, 11.9, 11.10_


- [ ] 11. Verify TypeScript type safety
  - [ ] 11.1 Test color type exports
    - Import BrandColor type in a test file
    - Verify autocomplete shows all color names
    - Try using invalid color name and verify TypeScript error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 11.2 Test gradient type exports
    - Import BrandGradient type in a test file
    - Verify autocomplete shows all gradient names
    - Try using invalid gradient name and verify TypeScript error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 11.3 Run TypeScript compiler
    - Execute `tsc --noEmit` command
    - Verify zero compilation errors
    - Check that all types are properly inferred
    - _Requirements: 7.5_

- [ ] 12. Verify performance and accessibility
  - [ ] 12.1 Test animation performance
    - Open Chrome DevTools Performance tab
    - Record theme toggle animation
    - Verify frame rate stays above 30fps (target 60fps)
    - Check for layout thrashing or forced reflows
    - _Requirements: 13.3, 13.4, 13.7_

  - [ ] 12.2 Test color contrast ratios
    - Use browser accessibility tools or contrast checker
    - Verify light mode primary text has 15:1 contrast ratio
    - Verify dark mode primary text has 15:1 contrast ratio
    - Verify all text meets WCAG AAA standards
    - _Requirements: 10.10_

  - [ ] 12.3 Test keyboard accessibility
    - Tab to theme toggle button
    - Verify focus indicator is visible
    - Press Enter or Space to toggle theme
    - Verify theme switches correctly
    - _Requirements: 11.9, 11.10_

  - [ ] 12.4 Test browser compatibility
    - Test in Chrome (latest version)
    - Test in Firefox (latest version)
    - Test in Safari (latest version)
    - Test in Edge (latest version)
    - Verify consistent behavior across all browsers
    - _Requirements: 13.1, 13.2, 13.5, 13.6_


---

## Final Checklist

Before marking the implementation complete, verify:

- [ ] ✅ All 6 files created/updated (brandColors.ts, global.css, animations.ts, ThemeToggle.tsx, App.tsx, tailwind.config.js)
- [ ] ✅ All colors match exact hex values from design document
- [ ] ✅ All gradients match exact strings from design document
- [ ] ✅ All animations match exact specifications from design document
- [ ] ✅ Light mode displays correctly with all brand colors
- [ ] ✅ Dark mode displays correctly with purple-tinted backgrounds
- [ ] ✅ Theme toggle switches between modes smoothly
- [ ] ✅ Theme preference persists after page reload
- [ ] ✅ System preference is detected on first load
- [ ] ✅ All Tailwind utilities work (bg-deep-amethyst, dark:bg-dark-bg-primary, etc.)
- [ ] ✅ All animation presets work with Framer Motion
- [ ] ✅ TypeScript compiles with zero errors
- [ ] ✅ No console errors or warnings
- [ ] ✅ WCAG AAA contrast ratios met (15:1 for primary text)
- [ ] ✅ Animations run at 60fps (minimum 30fps)
- [ ] ✅ Theme switching completes in < 300ms
- [ ] ✅ CSS bundle size < 50KB
- [ ] ✅ JavaScript bundle size < 20KB
- [ ] ✅ Works in Chrome, Firefox, Safari, and Edge
- [ ] ✅ Keyboard navigation works for theme toggle
- [ ] ✅ Code follows all style guidelines from design document

---

## Notes for Implementation

### Order of Implementation
The tasks are designed to be completed in order, as each phase builds on the previous one:
1. **Setup** → 2. **Colors** → 3. **Animations** → 4. **Dark Mode** → 5. **Theme Toggle** → 6. **Integration** → 7. **Testing**

### Testing Strategy
- Test each phase immediately after implementation
- Don't wait until the end to test everything
- Use browser DevTools to verify colors, animations, and performance
- Create temporary test components to verify utilities work

### Common Pitfalls to Avoid
- ❌ Don't modify color values - use exact hex codes from design
- ❌ Don't add extra colors or gradients not in the spec
- ❌ Don't create custom animations beyond what's specified
- ❌ Don't use class-based dark mode - use [data-theme="dark"]
- ❌ Don't add business logic or feature code
- ❌ Don't create additional components beyond ThemeToggle

### Success Criteria
The implementation is complete when all tasks are checked off and the final checklist is verified. The theme system should be a rock-solid foundation that other developers can use to build features without worrying about colors, animations, or theme switching.

---

## Ready to Start?

Once you begin implementation, work through the tasks sequentially. Mark each task as complete when:
1. The code is written and follows the specifications exactly
2. The functionality is tested and works correctly
3. There are no TypeScript errors or console warnings
4. The code follows the style guidelines from the design document

Good luck! 🚀

