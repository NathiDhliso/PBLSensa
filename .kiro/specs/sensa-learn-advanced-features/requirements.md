# Requirements Document

## Introduction

This document outlines the requirements for implementing advanced features across both the Sensa Learn and PBL (Perspective-Based Learning) portals. These features enhance the learning experience through audio-visual integration, gamification, progress tracking, and interactive feedback mechanisms. The implementation focuses on creating an immersive, personalized learning environment that motivates users and provides rich feedback loops.

The features are designed to work seamlessly with the existing backend infrastructure and brand theme system, providing a cohesive user experience across both portals.

## Requirements

### Requirement 1: Audio Narration with ElevenLabs Integration

**User Story:** As a learner, I want to hear concepts, analogies, and mantras read aloud in a natural voice, so that I can learn through multiple sensory channels and improve retention.

#### Acceptance Criteria

1. WHEN a user views a concept or analogy THEN they SHALL see a "Listen" button with a speaker icon
2. WHEN a user clicks the "Listen" button THEN the system SHALL call the ElevenLabs API to generate speech
3. WHEN speech is being generated THEN the button SHALL display a loading state
4. WHEN speech is ready THEN the system SHALL play the audio automatically
5. WHEN audio is playing THEN the button SHALL change to "Pause" with a pause icon
6. WHEN a user clicks "Pause" THEN the audio SHALL pause at the current position
7. WHEN a user clicks "Listen" again THEN the audio SHALL resume from the paused position
8. WHEN audio finishes playing THEN the button SHALL return to the "Listen" state
9. WHEN the ElevenLabs API fails THEN the system SHALL display an error message and disable the audio button
10. WHEN audio is generated THEN it SHALL be cached to avoid redundant API calls for the same content

### Requirement 2: Focus Music Integration with Brain.fm

**User Story:** As a learner, I want to play scientifically-designed focus music while studying, so that I can maintain concentration and enhance my learning sessions.

#### Acceptance Criteria

1. WHEN a user is in the Sensa Learn portal THEN they SHALL see a floating music player widget in the bottom-right corner
2. WHEN a user clicks the music player THEN it SHALL expand to show Brain.fm controls
3. WHEN the music player is expanded THEN it SHALL display an embedded Brain.fm widget or iframe
4. WHEN a user starts music THEN it SHALL play in the background without interrupting navigation
5. WHEN a user navigates between pages THEN the music SHALL continue playing seamlessly
6. WHEN a user closes the music player THEN it SHALL minimize to a small icon but continue playing
7. WHEN a user clicks the minimized icon THEN the player SHALL expand again
8. WHEN the Brain.fm integration fails THEN the system SHALL display a fallback message
9. WHEN a user is not in the Sensa Learn portal THEN the music player SHALL not be visible
10. WHEN a user logs out THEN the music SHALL stop playing

### Requirement 3: Progress Dashboard and Visualization

**User Story:** As a learner, I want to see my overall learning progress with visual indicators, so that I can track my achievements and stay motivated.

#### Acceptance Criteria

1. WHEN a user navigates to the Progress Dashboard THEN they SHALL see a circular progress indicator showing course completion percentage
2. WHEN a user views the dashboard THEN they SHALL see a list of all chapters with individual completion status
3. WHEN a user views a chapter THEN they SHALL see its complexity score displayed as "High," "Medium," or "Low"
4. WHEN a user completes a chapter THEN the progress indicator SHALL update in real-time
5. WHEN a user views the dashboard THEN they SHALL see their current learning streak in days
6. WHEN a user views the dashboard THEN they SHALL see all earned badges displayed prominently
7. WHEN a user views the dashboard THEN they SHALL see locked badges with progress indicators
8. WHEN a user hovers over a badge THEN they SHALL see a tooltip with the badge description and unlock requirements
9. WHEN a user earns a new badge THEN they SHALL see a celebratory animation
10. WHEN the dashboard loads THEN all data SHALL be fetched from the backend API

### Requirement 4: Learning Streaks System

**User Story:** As a learner, I want to track consecutive days of learning activity, so that I can build consistent study habits and stay motivated.

#### Acceptance Criteria

1. WHEN a user completes any learning activity THEN the system SHALL record the activity date
2. WHEN a user learns on consecutive days THEN the streak counter SHALL increment
3. WHEN a user misses a day THEN the streak SHALL reset to zero
4. WHEN a user views their streak THEN they SHALL see a flame icon with the number of consecutive days
5. WHEN a user has a streak of 7+ days THEN the flame icon SHALL animate with a glow effect
6. WHEN a user has a streak of 30+ days THEN the flame icon SHALL display in a special gold color
7. WHEN a user views their profile THEN they SHALL see their longest streak record
8. WHEN a user is at risk of breaking their streak THEN they SHALL see a reminder notification
9. WHEN a user breaks a streak THEN they SHALL see an encouraging message to start again
10. WHEN the system calculates streaks THEN it SHALL use the user's local timezone

### Requirement 5: Badge System and Achievements

**User Story:** As a learner, I want to earn badges for completing milestones, so that I feel recognized for my progress and stay motivated to continue learning.

#### Acceptance Criteria

1. WHEN a user completes their first chapter THEN they SHALL earn the "First Steps" badge
2. WHEN a user completes an entire course THEN they SHALL earn the "Course Master" badge
3. WHEN a user maintains a 7-day streak THEN they SHALL earn the "Week Warrior" badge
4. WHEN a user maintains a 30-day streak THEN they SHALL earn the "Month Champion" badge
5. WHEN a user provides 10 pieces of feedback THEN they SHALL earn the "Helpful Learner" badge
6. WHEN a user views all analogies in a chapter THEN they SHALL earn the "Analogy Explorer" badge
7. WHEN a user earns a badge THEN they SHALL see a modal with the badge icon, name, and description
8. WHEN a user views locked badges THEN they SHALL see a progress bar showing how close they are to unlocking
9. WHEN a user clicks on a badge THEN they SHALL see detailed information about how to earn it
10. WHEN a user earns a badge THEN the system SHALL save it to their profile via the backend API

### Requirement 6: Visual Exam Relevance Prioritization (PBL)

**User Story:** As a student using PBL, I want exam-relevant keywords to be visually emphasized in concept maps, so that I can focus on the most important information for my studies.

#### Acceptance Criteria

1. WHEN a concept has high exam relevance THEN its node SHALL be larger than standard nodes
2. WHEN a concept has high exam relevance THEN its node SHALL have a glowing orange effect
3. WHEN a concept has high exam relevance THEN the glow SHALL pulse subtly to draw attention
4. WHEN a user hovers over an exam-relevant concept THEN the glow SHALL intensify
5. WHEN a concept has medium exam relevance THEN its node SHALL be standard size with a subtle border
6. WHEN a concept has low exam relevance THEN its node SHALL be standard size without special styling
7. WHEN the concept map loads THEN exam-relevant nodes SHALL be positioned prominently
8. WHEN a user toggles exam relevance filtering THEN only high-relevance concepts SHALL be displayed
9. WHEN a user views the legend THEN they SHALL see an explanation of the visual prioritization system
10. WHEN the backend provides exam relevance scores THEN the frontend SHALL apply the appropriate visual styling

### Requirement 7: Conflict Resolution UI (PBL)

**User Story:** As a student using PBL, I want to see and resolve conflicting information from different documents, so that I can understand discrepancies and choose the most accurate definition.

#### Acceptance Criteria

1. WHEN the system detects conflicting definitions THEN it SHALL display a "Conflict Detected" badge on the concept
2. WHEN a user clicks on a conflicted concept THEN they SHALL see a modal with side-by-side comparison
3. WHEN the conflict modal opens THEN it SHALL display both definitions with their source documents
4. WHEN the conflict modal opens THEN it SHALL display an AI-generated recommendation
5. WHEN a user views the AI recommendation THEN they SHALL see the reasoning behind the suggestion
6. WHEN a user chooses a definition THEN they SHALL be able to select "Source 1," "Source 2," or "Custom"
7. WHEN a user selects "Custom" THEN they SHALL see a text input to write their own definition
8. WHEN a user submits their choice THEN the system SHALL save it via the backend API
9. WHEN a user resolves a conflict THEN the "Conflict Detected" badge SHALL be removed
10. WHEN multiple conflicts exist THEN the user SHALL be able to navigate between them in the modal

### Requirement 8: Interactive Feedback Mechanism (PBL)

**User Story:** As a student using PBL, I want to provide feedback on concepts and keywords, so that I can help improve the accuracy of the concept maps and personalize my learning experience.

#### Acceptance Criteria

1. WHEN a user views a concept detail panel THEN they SHALL see a "Feedback" section with action buttons
2. WHEN a user clicks "Flag as Incorrect" THEN they SHALL see a modal to explain what's wrong
3. WHEN a user submits an incorrect flag THEN the system SHALL send the feedback to the backend API
4. WHEN a user clicks "Suggest Edit" THEN they SHALL see a form to propose changes to the definition
5. WHEN a user submits an edit suggestion THEN the system SHALL save it and display a confirmation message
6. WHEN a user clicks "Add Related Concept" THEN they SHALL see a form to suggest a new related concept
7. WHEN a user submits a related concept THEN the system SHALL create a pending relationship for review
8. WHEN a user provides feedback THEN they SHALL see a "Thank you" message
9. WHEN a user has provided feedback on a concept THEN they SHALL see a "Feedback Submitted" indicator
10. WHEN feedback is submitted THEN it SHALL contribute to the user's "Helpful Learner" badge progress

### Requirement 9: Immersive Learning Environment (Sensa Learn)

**User Story:** As a learner in Sensa Learn, I want a visually calming and focused environment with animated backgrounds, so that I can study without distractions and maintain a relaxed state of mind.

#### Acceptance Criteria

1. WHEN a user enters the Sensa Learn portal THEN they SHALL see a slowly animated background
2. WHEN the background animates THEN it SHALL use abstract patterns or serene nature scenes
3. WHEN the background animates THEN the animation SHALL be subtle and non-distracting
4. WHEN a user views content THEN the background SHALL provide sufficient contrast for readability
5. WHEN a user switches between light and dark mode THEN the background SHALL adapt appropriately
6. WHEN the background loads THEN it SHALL not impact page load performance
7. WHEN a user has reduced motion preferences THEN the background SHALL be static
8. WHEN a user navigates between pages THEN the background SHALL remain consistent
9. WHEN a user focuses on content THEN the background SHALL fade slightly to reduce distraction
10. WHEN the system detects low-end devices THEN it SHALL use a simpler background animation

### Requirement 10: Enhanced Profile Onboarding

**User Story:** As a new user, I want a guided onboarding experience to set up my learning profile, so that I can receive personalized content from the start.

#### Acceptance Criteria

1. WHEN a new user first logs in THEN they SHALL see a welcome modal with onboarding steps
2. WHEN the onboarding starts THEN the user SHALL see a progress indicator showing steps (e.g., "Step 1 of 4")
3. WHEN the user is on step 1 THEN they SHALL be asked to select their age range
4. WHEN the user is on step 2 THEN they SHALL be asked to select their location or region
5. WHEN the user is on step 3 THEN they SHALL be asked to select their interests from a list of chips
6. WHEN the user is on step 4 THEN they SHALL be asked to take a brief learning style quiz
7. WHEN the user completes all steps THEN their profile SHALL be saved via the backend API
8. WHEN the user skips onboarding THEN they SHALL be able to complete it later from their profile page
9. WHEN the user completes onboarding THEN they SHALL see a congratulatory message
10. WHEN the user has completed onboarding THEN they SHALL not see the welcome modal again

## Privacy and Security Considerations

- **Audio Content**: Audio generated by ElevenLabs should be cached locally to minimize API calls and costs. No audio content should be stored on the server without user consent.
- **Music Integration**: Brain.fm integration should use secure iframe embedding with appropriate CSP headers. No user listening data should be tracked beyond session duration.
- **Progress Data**: All progress, streaks, and badge data should be stored securely in the backend database with proper user authentication.
- **Feedback Data**: User feedback should be anonymized when used for system improvements. Personal identifiers should only be stored for attribution purposes with user consent.
- **Profile Data**: Age range, location, and interests should be stored securely and used only for personalization. Users should be able to update or delete this data at any time.

## Out of Scope

The following items are explicitly **NOT** included in this requirements document:

- Backend API implementation (assumed to exist)
- Payment processing for premium features
- Social sharing of badges or achievements
- Multiplayer or collaborative learning features
- Mobile app development (web-only)
- Offline mode support
- Video content integration
- Live tutoring or chat support
- Content creation tools for educators
- Analytics dashboard for administrators

## Dependencies

- Existing backend API with endpoints for progress, badges, feedback, and conflicts
- ElevenLabs API account and API key
- Brain.fm API account or embeddable widget
- Existing brand theme system (from sensa-learn-brand-theme spec)
- Existing authentication system
- Existing concept map visualization (for PBL features)

## Success Metrics

1. Audio narration is available on 100% of concepts and analogies
2. Focus music player has a 70%+ usage rate among Sensa Learn users
3. Progress dashboard loads in under 2 seconds
4. Learning streaks increase average daily active users by 25%
5. Badge system increases course completion rate by 15%
6. Visual exam relevance reduces study time by 20% (user-reported)
7. Conflict resolution UI resolves 90%+ of detected conflicts
8. Interactive feedback generates 10+ submissions per 100 active users
9. Immersive environment receives 4.5+ star rating in user surveys
10. Profile onboarding completion rate is 80%+ for new users
