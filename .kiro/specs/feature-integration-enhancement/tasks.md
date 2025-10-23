# Implementation Plan

- [x] 1. Create Audio Coordination Infrastructure



  - Create AudioCoordinationContext to manage audio priorities and volume ducking
  - Implement volume ducking logic (reduce music to 20% when narration plays)
  - Add coordination hooks for narration start/stop events

  - _Requirements: 4.1, 4.2, 4.3, 4.4_


- [ ] 2. Enhance Music Player Context with Volume Control
  - [ ] 2.1 Add volume state management to MusicPlayerContext
    - Add volume, originalVolume, and isDucking state properties
    - Implement setVolume, duckVolume, and restoreVolume methods

    - Persist volume preferences to localStorage
    - _Requirements: 2.4, 2.6, 4.2_

  - [x] 2.2 Add view-awareness to MusicPlayerContext

    - Add isVisible state property based on current route


    - Implement view detection using useLocation hook
    - Ensure music state persists when switching views

    - _Requirements: 2.1, 2.2_


- [ ] 3. Integrate Audio Narration into ConceptCard
  - [ ] 3.1 Add AudioNarration component to ConceptCard
    - Import AudioNarration component
    - Add audio controls section below concept definition


    - Format narration text as "term. definition"
    - Add enableAudio prop with default true
    - _Requirements: 1.1, 1.3, 1.4_



  - [x] 3.2 Implement narration coordination in ConceptCard

    - Add onPlay handler to notify AudioCoordinationContext
    - Add onStop handler to restore music volume
    - Ensure only one narration plays at a time
    - _Requirements: 4.1, 4.2, 4.5_


- [ ] 4. Enhance AnalogyCard Audio Coordination
  - Add coordination hooks to existing AudioNarration
  - Implement music ducking when narration starts





  - Implement volume restoration when narration stops
  - _Requirements: 1.2, 4.1, 4.2_

- [ ] 5. Implement View-Based Music Player Visibility
  - [x] 5.1 Add route detection to FocusMusicPlayer

    - Import useLocation from react-router-dom
    - Check if pathname starts with '/sensa'
    - Return null if not in Sensa view
    - _Requirements: 2.1, 2.2_






  - [ ] 5.2 Test music player state persistence
    - Verify music continues playing when switching to PBL view (hidden)
    - Verify music resumes display when returning to Sensa view
    - Test volume settings persist across view switches

    - _Requirements: 2.2, 2.6_

- [ ] 6. Create Milestone Definitions
  - [ ] 6.1 Create milestoneDefinitions.ts file
    - Copy structure from badgeDefinitions.ts
    - Rename Badge interface to Milestone

    - Add insightMessage property to Milestone interface
    - Update category names (streak → consistency)
    - _Requirements: 3.1, 3.5, 3.6_

  - [ ] 6.2 Rewrite milestone content with professional language
    - Replace "Week Warrior" with "One Week of Consistent Learning"
    - Replace "Course Master" with "Course Completed"
    - Remove game-like emojis, use professional icons (✓, 📅)
    - Add meaningful insight messages for each milestone
    - _Requirements: 3.1, 3.2, 3.6_

- [ ] 7. Refactor Badge Components to Milestone Components
  - [ ] 7.1 Create MilestoneCard component
    - Copy BadgeCard.tsx to journey/MilestoneCard.tsx
    - Remove game-like visual elements (shiny effects, point displays)
    - Add professional progress indicators
    - Update terminology from "badge" to "milestone"
    - _Requirements: 3.1, 3.3, 3.4_

  - [ ] 7.2 Create LearningJourneyPanel component
    - Copy BadgeShowcase.tsx to journey/LearningJourneyPanel.tsx
    - Replace grid layout with timeline view
    - Show milestones chronologically
    - Emphasize knowledge gained over achievements
    - _Requirements: 3.1, 3.4, 3.5_

  - [ ] 7.3 Create ConsistencyTracker component
    - Copy StreakDisplay.tsx to journey/ConsistencyTracker.tsx
    - Remove fire emoji and game language
    - Implement professional calendar view
    - Focus on habit formation messaging
    - _Requirements: 3.1, 3.6_

- [ ] 8. Create Milestone Celebration Component
  - [ ] 8.1 Implement MilestoneCelebration component
    - Create journey/MilestoneCelebration.tsx
    - Add visual-only animation mode for when narration is active
    - Implement subtle confetti effect using framer-motion
    - Display insight message prominently
    - Add professional design with brand colors
    - _Requirements: 3.2, 3.5, 4.5_

  - [ ] 8.2 Integrate celebration with audio coordination
    - Check if narration is active before showing celebration
    - Use silent mode (visual only) when narration playing
    - Use normal mode with optional sound when no narration
    - _Requirements: 4.3, 4.5_

- [ ] 9. Update Services and Hooks
  - [ ] 9.1 Refactor badgeService to milestoneService
    - Rename badgeService.ts to milestoneService.ts
    - Update API endpoints from /badges to /milestones
    - Update method names and return types
    - _Requirements: 3.1, 3.6_

  - [ ] 9.2 Refactor useBadges to useMilestones hook
    - Rename useBadges.ts to useMilestones.ts
    - Update state management for milestones
    - Update celebration trigger logic
    - _Requirements: 3.1, 3.4_

- [ ] 10. Create User Preferences System
  - [ ] 10.1 Create audio preferences types
    - Define AudioPreferences interface
    - Add narration, music, and celebration preferences
    - Create preference validation utilities
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 10.2 Implement preferences storage service
    - Create audioPreferencesService.ts
    - Implement localStorage persistence
    - Add API integration for server-side storage
    - Implement preference sync across devices
    - _Requirements: 5.6, 5.7_

  - [ ] 10.3 Create preferences UI components
    - Add audio preferences section to settings page
    - Add narration speed control (0.5x to 2x)
    - Add music volume control
    - Add celebration preferences toggle
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 11. Update Page Components
  - [ ] 11.1 Update ProgressDashboardPage
    - Replace BadgeShowcase with LearningJourneyPanel
    - Update terminology throughout
    - Test milestone display
    - _Requirements: 3.1, 3.4_

  - [ ] 11.2 Update PBLDocumentPage
    - Ensure FocusMusicPlayer is hidden
    - Verify ConceptCard audio narration works
    - Test audio coordination
    - _Requirements: 1.1, 2.2_

  - [ ] 11.3 Update SensaDocumentPage
    - Ensure FocusMusicPlayer is visible
    - Verify AnalogyCard audio coordination
    - Test music ducking behavior
    - _Requirements: 1.2, 2.1, 4.2_

- [ ] 12. Database Migration
  - [ ] 12.1 Create migration for milestone tables
    - Rename user_badges table to user_milestones
    - Rename badge_id column to milestone_id
    - Add insight_viewed and celebration_shown columns
    - Create rollback script
    - _Requirements: 3.1, 3.6_

  - [ ] 12.2 Create audio preferences table
    - Create user_audio_preferences table
    - Add columns for all audio preferences
    - Add foreign key to users table
    - Create rollback script
    - _Requirements: 5.1, 5.2, 5.3, 5.7_

- [ ] 13. Update Backend API Endpoints
  - [ ] 13.1 Rename badge endpoints to milestone endpoints
    - Update route paths from /badges to /milestones
    - Update response models
    - Update database queries
    - Maintain backward compatibility during transition
    - _Requirements: 3.1, 3.6_

  - [ ] 13.2 Create audio preferences endpoints
    - Create GET /api/users/:id/audio-preferences
    - Create PUT /api/users/:id/audio-preferences
    - Add validation for preference values
    - _Requirements: 5.1, 5.7_

- [ ] 14. Integration Testing
  - [ ] 14.1 Test audio narration in both views
    - Test ConceptCard narration in PBL view
    - Test AnalogyCard narration in Sensa view
    - Verify audio generation and playback
    - Test error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 14.2 Test music player view awareness
    - Test music player visible only in Sensa view
    - Test state persistence across view switches
    - Test music continues playing when view switches
    - _Requirements: 2.1, 2.2, 2.6_

  - [ ] 14.3 Test audio coordination
    - Test narration starts → music ducks to 20%
    - Test narration stops → music restores to original volume
    - Test multiple narrations in sequence
    - Test milestone celebration with active narration
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 14.4 Test milestone system
    - Test milestone unlocking
    - Test celebration display
    - Test timeline view
    - Test consistency tracker
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ] 14.5 Test user preferences
    - Test preference saving and loading
    - Test preference application
    - Test cross-device sync
    - Test default values
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7_

- [ ] 15. Accessibility Testing
  - [ ] 15.1 Test audio narration accessibility
    - Test keyboard controls (Space for play/pause)
    - Test ARIA labels on all controls
    - Test screen reader compatibility
    - Test with prefers-reduced-motion
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 15.2 Test music player accessibility
    - Test keyboard navigation
    - Test focus indicators
    - Test volume control with keyboard
    - Test mute shortcut
    - _Requirements: 2.4_

  - [ ] 15.3 Test milestone celebration accessibility
    - Test with prefers-reduced-motion
    - Test keyboard dismissal
    - Test screen reader announcements
    - _Requirements: 3.2, 4.5_

- [ ] 16. Performance Optimization
  - [ ] 16.1 Optimize audio caching
    - Verify audio cache size limits
    - Test cache cleanup on unmount
    - Monitor memory usage
    - _Requirements: 1.3, 1.4_

  - [ ] 16.2 Optimize music player rendering
    - Use React.memo for music player components
    - Minimize re-renders on view switches
    - Test performance with React DevTools
    - _Requirements: 2.2, 2.6_

  - [ ] 16.3 Optimize milestone calculations
    - Memoize milestone progress calculations
    - Cache milestone data
    - Test with large milestone lists
    - _Requirements: 3.4, 3.5_

- [ ] 17. Documentation and Cleanup
  - [ ] 17.1 Update component documentation
    - Document AudioCoordinationContext usage
    - Document MusicPlayerContext enhancements
    - Document milestone component APIs
    - Add usage examples
    - _Requirements: All_

  - [ ] 17.2 Update user-facing documentation
    - Document audio narration features
    - Document focus music player
    - Document learning journey features
    - Create user guide for preferences
    - _Requirements: All_

  - [ ] 17.3 Remove deprecated badge components
    - Delete old badge components after migration
    - Remove unused badge utilities
    - Clean up imports
    - Update tests
    - _Requirements: 3.1, 3.6_

  - [ ] 17.4 Create feature completion summary
    - Document all implemented features
    - List any known limitations
    - Provide deployment checklist
    - Create rollback plan
    - _Requirements: All_
