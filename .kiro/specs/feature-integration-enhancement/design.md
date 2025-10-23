# Design Document

## Overview

This design document outlines the integration and refinement of existing audio narration, focus music player, and gamification components into a cohesive two-view learning experience. The implementation leverages existing code components and focuses on:

1. **Audio Narration Integration**: Adding audio controls to ConceptCard (PBL) and AnalogyCard (Sensa Learn)
2. **Focus Music Player Positioning**: Ensuring the music player appears only in Sensa Learn view with proper context awareness
3. **Learning Journey Reframing**: Transforming gamification terminology and UI from competitive game mechanics to meaningful milestone tracking
4. **Cross-Component Coordination**: Managing audio priorities and state transitions between components

## Architecture

### Component Hierarchy

```
App
├── MusicPlayerProvider (Context)
│   └── AudioCoordinationService
├── PBL View
│   ├── ConceptCard
│   │   └── AudioNarration (NEW)
│   └── ConceptMapVisualization
└── Sensa Learn View
    ├── AnalogyCard
    │   └── AudioNarration (EXISTING)
    ├── FocusMusicPlayer (EXISTING - needs view awareness)
    └── LearningJourneyTracker (REFACTORED from gamification)
```

### State Management

**Audio Coordination State** (New Context)
```typescript
interface AudioCoordinationState {
  activeNarration: string | null;  // ID of currently playing narration
  musicVolume: number;              // Current music volume (0-1)
  originalMusicVolume: number;      // Volume before ducking
  isDucking: boolean;               // Whether music is currently ducked
}
```

**Music Player Context** (Existing - Enhanced)
```typescript
interface MusicPlayerContextType {
  isExpanded: boolean;
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;                   // NEW
  isVisible: boolean;               // NEW - view-based visibility
  setVolume: (volume: number) => void;  // NEW
  duckVolume: () => void;           // NEW
  restoreVolume: () => void;        // NEW
}
```

## Components and Interfaces

### 1. Audio Narration Integration

#### ConceptCard Enhancement

**Location**: `src/components/pbl/ConceptCard.tsx`

**Changes**:
- Import and integrate `AudioNarration` component
- Add audio controls below concept definition
- Coordinate with music player when narration plays

**Interface**:
```typescript
interface ConceptCardProps {
  concept: Concept;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, term: string, definition: string) => void;
  isSelected?: boolean;
  enableAudio?: boolean;  // NEW - default true
}
```

**Implementation Pattern**:
```typescript
// In ConceptCard component
<AudioNarration
  text={`${concept.term}. ${concept.definition}`}
  contentId={`concept-${concept.id}`}
  onPlay={() => handleNarrationPlay(concept.id)}
  onStop={() => handleNarrationStop()}
/>
```

#### AnalogyCard Enhancement

**Location**: `src/components/sensa/AnalogyCard.tsx`

**Status**: Already has AudioNarration integrated
**Changes**: Add coordination hooks for music ducking

### 2. Audio Coordination Service

**Location**: `src/services/audioCoordinationService.ts` (NEW)

**Purpose**: Manages audio priorities and volume ducking across narration and music

**Key Methods**:
```typescript
class AudioCoordinationService {
  // Start narration - duck music if playing
  startNarration(narrationId: string): void
  
  // Stop narration - restore music volume
  stopNarration(narrationId: string): void
  
  // Duck music volume to 20% of original
  duckMusicVolume(): void
  
  // Restore music to original volume
  restoreMusicVolume(): void
  
  // Check if any narration is active
  isNarrationActive(): boolean
}
```

**Audio Priority Hierarchy**:
1. Audio Narration (highest priority)
2. Milestone Celebrations (visual only when narration active)
3. Background Music (lowest priority, ducked when narration plays)

### 3. Focus Music Player View Awareness

**Location**: `src/components/music/FocusMusicPlayer.tsx`

**Changes**:
- Add view detection logic
- Only render when in Sensa Learn view
- Maintain state across view switches but hide in PBL

**Implementation**:
```typescript
export function FocusMusicPlayer() {
  const location = useLocation();
  const isSensaView = location.pathname.startsWith('/sensa');
  
  // Don't render in PBL view
  if (!isSensaView) {
    return null;
  }
  
  // Existing component logic...
}
```

**View Detection Strategy**:
- Use React Router's `useLocation` hook
- Check pathname for `/sensa` prefix
- Maintain player state in context even when hidden
- Resume playback when returning to Sensa view

### 4. Learning Journey Reframing

#### Terminology Mapping

| Old (Gamification) | New (Learning Journey) |
|-------------------|------------------------|
| Badges | Milestones |
| Points | Progress |
| Leaderboard | (Removed) |
| Achievements | Learning Achievements |
| Streak | Learning Consistency |
| Level Up | Milestone Reached |

#### Component Refactoring

**BadgeCard → MilestoneCard**
- Location: `src/components/badges/BadgeCard.tsx` → `src/components/journey/MilestoneCard.tsx`
- Remove game-like visual elements (shiny badges, point counters)
- Add professional progress indicators
- Focus on learning insights

**BadgeShowcase → LearningJourneyPanel**
- Location: `src/components/badges/BadgeShowcase.tsx` → `src/components/journey/LearningJourneyPanel.tsx`
- Replace badge grid with timeline view
- Show milestones chronologically
- Emphasize knowledge gained

**StreakDisplay → ConsistencyTracker**
- Location: `src/components/progress/StreakDisplay.tsx` → `src/components/journey/ConsistencyTracker.tsx`
- Remove fire emoji and game-like language
- Use professional calendar view
- Focus on habit formation

#### Badge Definitions Refactoring

**Location**: `src/utils/badgeDefinitions.ts` → `src/utils/milestoneDefinitions.ts`

**Changes**:
```typescript
// Before
export interface Badge {
  id: string;
  name: string;  // "Week Warrior"
  description: string;
  icon: string;  // "🔥"
  category: 'completion' | 'streak' | 'engagement' | 'mastery';
}

// After
export interface Milestone {
  id: string;
  name: string;  // "One Week of Consistent Learning"
  description: string;  // Focus on learning benefit
  icon: string;  // Professional icon (calendar, checkmark)
  category: 'completion' | 'consistency' | 'engagement' | 'mastery';
  insightMessage: string;  // NEW - what they learned
}
```

**Example Milestone Definitions**:
```typescript
{
  id: 'first-chapter-complete',
  name: 'First Chapter Mastered',
  description: 'You\'ve completed your first chapter',
  icon: '✓',
  category: 'completion',
  insightMessage: 'You\'ve taken the first step in building lasting knowledge',
}
```

### 5. Milestone Celebration Component

**Location**: `src/components/journey/MilestoneCelebration.tsx` (NEW)

**Purpose**: Show meaningful celebrations without audio conflicts

**Features**:
- Visual-only animations when narration is active
- Subtle confetti effect
- Focus on insight message
- Professional design language

**Implementation**:
```typescript
interface MilestoneCelebrationProps {
  milestone: Milestone;
  onClose: () => void;
  silentMode?: boolean;  // True when narration is active
}
```

## Data Models

### Milestone Model

```typescript
interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'completion' | 'consistency' | 'engagement' | 'mastery';
  insightMessage: string;
  requirement: MilestoneRequirement;
  earnedAt?: Date;
}

interface MilestoneRequirement {
  type: 'chapter_complete' | 'course_complete' | 'consistency' | 'feedback_count' | 'analogy_views';
  threshold: number;
  description: string;
}
```

### Audio Coordination State

```typescript
interface AudioCoordinationState {
  activeNarration: string | null;
  musicVolume: number;
  originalMusicVolume: number;
  isDucking: boolean;
  preferences: AudioPreferences;
}

interface AudioPreferences {
  narrationEnabled: boolean;
  narrationSpeed: number;  // 0.5 to 2.0
  musicEnabled: boolean;
  musicVolume: number;
  celebrationSoundsEnabled: boolean;
}
```

## Error Handling

### Audio Service Unavailability

**Strategy**: Graceful degradation
- Hide audio controls if service unavailable
- Show subtle indicator that audio is not available
- Don't block core functionality

**Implementation**:
```typescript
if (!audioService.isAvailable()) {
  return null;  // Don't render audio controls
}
```

### Music Player Errors

**Strategy**: Silent failure with user notification
- Log errors to console
- Show toast notification
- Allow user to retry
- Don't crash the application

### Volume Ducking Failures

**Strategy**: Continue without ducking
- If ducking fails, continue playing both audio sources
- Log warning
- User can manually adjust volumes

## Testing Strategy

### Unit Tests

**Audio Coordination Service**
- Test narration start/stop
- Test volume ducking logic
- Test priority management
- Test state transitions

**Milestone Definitions**
- Test requirement calculations
- Test progress tracking
- Test milestone unlocking logic

### Integration Tests

**Audio + Music Coordination**
- Test narration starts → music ducks
- Test narration stops → music restores
- Test multiple narrations in sequence
- Test view switching with active audio

**View-Based Music Player**
- Test music player visibility in Sensa view
- Test music player hidden in PBL view
- Test state persistence across view switches

### Component Tests

**ConceptCard with Audio**
- Test audio controls render
- Test audio playback
- Test coordination with music player

**Milestone Celebration**
- Test silent mode when narration active
- Test normal mode when no narration
- Test animation timing

## Performance Considerations

### Audio Caching

**Strategy**: Use existing audioCache utility
- Cache generated audio by contentId
- Reuse cached audio on subsequent plays
- Clean up on component unmount

### Music Player State

**Strategy**: Maintain state in context
- Don't recreate player on view switch
- Pause/resume based on visibility
- Minimize re-renders

### Milestone Calculations

**Strategy**: Memoize expensive calculations
- Cache milestone progress
- Only recalculate on relevant state changes
- Use React.memo for milestone components

## Accessibility

### Audio Narration

- Provide keyboard controls (Space to play/pause)
- ARIA labels for all controls
- Respect prefers-reduced-motion
- Support screen readers

### Music Player

- Keyboard accessible controls
- Clear focus indicators
- Volume control with keyboard
- Mute shortcut (M key)

### Milestone Celebrations

- Respect prefers-reduced-motion
- Provide text alternatives
- Keyboard dismissible
- Screen reader announcements

## Migration Strategy

### Phase 1: Audio Integration (Week 1-2)

1. Create AudioCoordinationService
2. Enhance MusicPlayerContext with volume control
3. Add AudioNarration to ConceptCard
4. Implement coordination hooks in AnalogyCard
5. Test audio ducking behavior

### Phase 2: Music Player View Awareness (Week 2)

1. Add view detection to FocusMusicPlayer
2. Test state persistence across views
3. Verify music stops/resumes correctly

### Phase 3: Learning Journey Reframing (Week 3-4)

1. Create new milestone definitions
2. Refactor BadgeCard → MilestoneCard
3. Refactor BadgeShowcase → LearningJourneyPanel
4. Refactor StreakDisplay → ConsistencyTracker
5. Create MilestoneCelebration component
6. Update all references from "badge" to "milestone"
7. Update database schema if needed
8. Migrate existing user badge data

### Phase 4: Polish and Testing (Week 4)

1. Comprehensive integration testing
2. Accessibility audit
3. Performance optimization
4. User acceptance testing

## Database Schema Changes

### Milestones Table (Renamed from Badges)

```sql
-- Rename table
ALTER TABLE user_badges RENAME TO user_milestones;

-- Update column names
ALTER TABLE user_milestones 
  RENAME COLUMN badge_id TO milestone_id;

-- Add new columns
ALTER TABLE user_milestones
  ADD COLUMN insight_viewed BOOLEAN DEFAULT FALSE,
  ADD COLUMN celebration_shown BOOLEAN DEFAULT FALSE;
```

### Audio Preferences Table (New)

```sql
CREATE TABLE user_audio_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  narration_enabled BOOLEAN DEFAULT TRUE,
  narration_speed DECIMAL(2,1) DEFAULT 1.0,
  music_enabled BOOLEAN DEFAULT TRUE,
  music_volume DECIMAL(3,2) DEFAULT 0.7,
  celebration_sounds_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### Environment Variables

```env
# Audio Service
VITE_AUDIO_SERVICE_ENABLED=true
VITE_AUDIO_CACHE_SIZE_MB=50

# Music Player
VITE_MUSIC_PLAYER_ENABLED=true
VITE_MUSIC_DEFAULT_VOLUME=0.7

# Feature Flags
VITE_LEARNING_JOURNEY_ENABLED=true
VITE_AUDIO_DUCKING_ENABLED=true
```

### Feature Flags

```typescript
export const FEATURE_FLAGS = {
  audioNarration: true,
  focusMusicPlayer: true,
  learningJourney: true,
  audioDucking: true,
  milestoneAnimations: true,
};
```

## Dependencies

### New Dependencies

None - all functionality uses existing libraries

### Existing Dependencies Used

- `framer-motion` - Animations
- `lucide-react` - Icons
- `react-router-dom` - View detection
- `axios` - API calls

## Security Considerations

### Audio Content

- Sanitize text before sending to TTS service
- Validate audio URLs before playback
- Implement rate limiting for audio generation

### User Preferences

- Validate preference values
- Sanitize user input
- Store preferences securely

## Monitoring and Analytics

### Metrics to Track

**Audio Usage**
- Narration play rate
- Average narration duration
- Narration completion rate
- Audio errors

**Music Player Usage**
- Music activation rate
- Average session duration
- Volume adjustment frequency
- View-based usage patterns

**Learning Journey**
- Milestone unlock rate
- Celebration view rate
- Progress tracking engagement
- Consistency metrics

### Logging

```typescript
// Audio events
logger.info('narration_started', { contentId, view });
logger.info('narration_completed', { contentId, duration });
logger.error('narration_failed', { contentId, error });

// Music events
logger.info('music_started', { track, view });
logger.info('music_ducked', { reason: 'narration' });

// Milestone events
logger.info('milestone_unlocked', { milestoneId, userId });
logger.info('milestone_viewed', { milestoneId, userId });
```

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Adaptive Music Selection**
   - AI-driven music style based on content complexity
   - Personalized music preferences learning

2. **Advanced Audio Features**
   - Multiple voice options
   - Language selection
   - Offline audio caching

3. **Enhanced Learning Journey**
   - Learning path visualization
   - Personalized milestone recommendations
   - Social sharing of achievements (opt-in)

4. **Cross-Document Learning Insights**
   - Connect milestones across courses
   - Show knowledge graph growth
   - Highlight concept mastery patterns
