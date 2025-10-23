# Requirements Document

## Introduction

This feature focuses on integrating and refining existing audio, music, and gamification components to create a cohesive two-view learning experience. The integration prioritizes audio narration as a core accessibility feature across both PBL and Sensa Learn views, strategically positions the focus music player as a Sensa Learn differentiator, and reframes gamification elements into a meaningful "Learning Journey" experience that emphasizes progress and milestones over game-like competition.

## Requirements

### Requirement 1: Audio Narration Integration

**User Story:** As a learner using either PBL or Sensa Learn view, I want audio narration for content cards, so that I can consume information through multiple modalities and improve accessibility.

#### Acceptance Criteria

1. WHEN a user views a ConceptCard in PBL view THEN the system SHALL provide audio narration controls
2. WHEN a user views an AnalogyCard in Sensa Learn view THEN the system SHALL provide audio narration controls
3. WHEN a user activates audio narration THEN the system SHALL play synthesized speech of the card content
4. WHEN audio is playing THEN the system SHALL display playback controls (play, pause, stop, speed adjustment)
5. IF a user has accessibility preferences enabled THEN the system SHALL auto-enable audio narration by default
6. WHEN a user switches between cards THEN the system SHALL stop current narration and allow starting narration for the new card

### Requirement 2: Focus Music Player for Sensa Learn

**User Story:** As a Sensa Learn user, I want background focus music that adapts to content complexity, so that I can maintain concentration and create an immersive learning environment.

#### Acceptance Criteria

1. WHEN a user is in Sensa Learn view THEN the system SHALL display the Focus Music Player widget
2. WHEN a user is in PBL view THEN the system SHALL NOT display the Focus Music Player
3. WHEN content complexity is high THEN the system SHALL suggest appropriate focus music styles
4. WHEN a user activates the music player THEN the system SHALL provide controls for volume, music style selection, and on/off toggle
5. IF a user disables the music player THEN the system SHALL remember this preference for future sessions
6. WHEN a user adjusts volume THEN the system SHALL persist the volume setting across sessions
7. WHEN audio narration is playing THEN the system SHALL automatically duck (lower) music volume

### Requirement 3: Learning Journey Reframing

**User Story:** As a learner, I want to track my learning progress through meaningful milestones and insights, so that I feel motivated by personal growth rather than competitive game mechanics.

#### Acceptance Criteria

1. WHEN the system displays progress tracking THEN it SHALL use "Learning Journey" terminology instead of gamification language
2. WHEN a user completes a significant learning milestone THEN the system SHALL display a meaningful celebration focused on insight moments
3. WHEN the system shows achievements THEN it SHALL NOT display game-like elements such as points, badges with competitive tiers, or leaderboards
4. WHEN a user views their progress THEN the system SHALL display professional progress indicators (completion percentages, milestones reached, concepts mastered)
5. WHEN a user reaches a milestone THEN the system SHALL highlight the learning achievement and knowledge gained
6. IF the system previously used badge/point terminology THEN it SHALL be replaced with milestone/achievement terminology
7. WHEN a user views their learning history THEN the system SHALL emphasize personal growth and understanding over competitive metrics

### Requirement 4: Cross-Component Integration

**User Story:** As a developer, I want the audio narration, music player, and learning journey components to work together seamlessly, so that users experience a cohesive and polished learning environment.

#### Acceptance Criteria

1. WHEN audio narration starts playing THEN the system SHALL automatically reduce music player volume if music is active
2. WHEN audio narration stops THEN the system SHALL restore music player volume to previous level
3. WHEN a user completes a learning milestone THEN the system SHALL coordinate celebration animations without interfering with active audio or music
4. WHEN multiple audio sources are active THEN the system SHALL manage audio priorities (narration > milestone celebrations > background music)
5. IF a user has audio narration enabled THEN milestone celebrations SHALL use visual-only notifications to avoid audio conflicts
6. WHEN a user switches between PBL and Sensa Learn views THEN the system SHALL maintain appropriate audio/music state for each view

### Requirement 5: User Preferences and Accessibility

**User Story:** As a user with specific learning preferences, I want to customize audio, music, and progress display settings, so that I can tailor the experience to my needs.

#### Acceptance Criteria

1. WHEN a user accesses settings THEN the system SHALL provide options to enable/disable audio narration globally
2. WHEN a user accesses settings THEN the system SHALL provide options to set default narration speed
3. WHEN a user accesses Sensa Learn settings THEN the system SHALL provide options to enable/disable focus music by default
4. WHEN a user accesses settings THEN the system SHALL provide options to customize milestone celebration preferences
5. IF a user has accessibility needs THEN the system SHALL respect system-level accessibility preferences
6. WHEN a user changes audio/music preferences THEN the system SHALL apply changes immediately without requiring page refresh
7. WHEN a user's preferences are saved THEN the system SHALL persist them across sessions and devices
