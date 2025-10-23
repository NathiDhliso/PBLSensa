# Design Document

## Overview

This document outlines the technical design for implementing advanced features across the Sensa Learn and PBL portals. The design builds upon the existing architecture, including the brand theme system, analogy generation backend, and profile management infrastructure.

### Design Philosophy

1. **Progressive Enhancement**: Features degrade gracefully when third-party services are unavailable
2. **Performance First**: Minimize API calls through intelligent caching and lazy loading
3. **User-Centric**: Prioritize user experience with smooth animations and clear feedback
4. **Modular Architecture**: Each feature is self-contained and can be developed independently
5. **Accessibility**: All features meet WCAG AA standards minimum

### Key Design Decisions

- **ElevenLabs Integration**: Client-side API calls with audio blob caching in IndexedDB
- **Brain.fm Integration**: Iframe-based widget with postMessage communication
- **Progress Tracking**: Real-time updates using React Query with optimistic updates
- **Gamification**: Badge system with celebration animations using Framer Motion
- **Conflict Resolution**: Modal-based UI with side-by-side comparison layout
- **Feedback System**: Inline forms with immediate visual confirmation

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Feature Components                       │
│  (AudioNarration, FocusMusicPlayer, ProgressDashboard, etc.) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  (audioService, progressService, badgeService, etc.)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  State Management Layer                      │
│     (React Query hooks, Context providers)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API & Storage Layer                       │
│         (Backend API, IndexedDB, localStorage)               │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── components/
│   ├── audio/
│   │   ├── AudioNarration.tsx
│   │   └── AudioPlayer.tsx
│   ├── music/
│   │   ├── FocusMusicPlayer.tsx
│   │   └── MusicWidget.tsx
│   ├── progress/
│   │   ├── ProgressDashboard.tsx
│   │   ├── ProgressCircle.tsx
│   │   ├── StreakDisplay.tsx
│   │   └── BadgeShowcase.tsx
│   ├── badges/
│   │   ├── BadgeCard.tsx
│   │   ├── BadgeModal.tsx
│   │   └── BadgeUnlockAnimation.tsx
│   ├── pbl/
│   │   ├── ConflictResolutionModal.tsx
│   │   ├── FeedbackPanel.tsx
│   │   └── ExamRelevanceIndicator.tsx
│   └── onboarding/
│       ├── OnboardingWizard.tsx
│       └── OnboardingStep.tsx
├── services/
│   ├── audioService.ts
│   ├── progressService.ts
│   ├── badgeService.ts
│   ├── feedbackService.ts
│   └── storageService.ts
├── hooks/
│   ├── useAudioNarration.ts
│   ├── useProgress.ts
│   ├── useStreaks.ts
│   ├── useBadges.ts
│   └── useFeedback.ts
├── types/
│   ├── audio.ts
│   ├── progress.ts
│   ├── badges.ts
│   └── feedback.ts
└── utils/
    ├── audioCache.ts
    └── badgeDefinitions.ts
```


## Components and Interfaces

### 1. Audio Narration System

#### AudioNarration Component

**Purpose**: Provides text-to-speech functionality for concepts and analogies

**Interface**:
```typescript
interface AudioNarrationProps {
  text: string;
  contentId: string; // For caching
  autoPlay?: boolean;
  className?: string;
}

interface AudioState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  audioUrl: string | null;
  currentTime: number;
  duration: number;
}
```

**Implementation Details**:
- Uses ElevenLabs API for speech generation
- Caches audio blobs in IndexedDB with contentId as key
- Displays loading spinner during generation
- Shows play/pause button with icon animation
- Includes progress bar for playback position
- Handles errors with user-friendly messages

#### audioService

**Purpose**: Manages ElevenLabs API calls and audio caching

**Interface**:
```typescript
interface AudioService {
  generateSpeech(text: string, contentId: string): Promise<Blob>;
  getCachedAudio(contentId: string): Promise<Blob | null>;
  cacheAudio(contentId: string, blob: Blob): Promise<void>;
  clearCache(): Promise<void>;
}

interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}
```

**API Integration**:
```typescript
// ElevenLabs API call
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
Headers:
  xi-api-key: {API_KEY}
  Content-Type: application/json
Body:
  {
    "text": string,
    "model_id": "eleven_monolingual_v1",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }
Response: audio/mpeg blob
```

**Caching Strategy**:
- Use IndexedDB for audio blob storage
- Cache key: `audio_${contentId}`
- TTL: 7 days
- Max cache size: 100MB
- LRU eviction when limit reached


### 2. Focus Music Player

#### FocusMusicPlayer Component

**Purpose**: Embeds Brain.fm music player for background focus music

**Interface**:
```typescript
interface FocusMusicPlayerProps {
  isVisible: boolean; // Only show in Sensa Learn portal
}

interface MusicPlayerState {
  isExpanded: boolean;
  isPlaying: boolean;
  currentTrack: string | null;
  error: string | null;
}
```

**Implementation Details**:
- Fixed position in bottom-right corner (z-index: 40)
- Minimized state: 60x60px circular button with music icon
- Expanded state: 320x200px widget with iframe
- Smooth expand/collapse animation using Framer Motion
- Persists playing state across navigation
- Uses Brain.fm embeddable widget or iframe

**Brain.fm Integration**:
```typescript
// Option 1: Iframe embed
<iframe
  src="https://brain.fm/widget?token={API_TOKEN}&activity=focus"
  width="100%"
  height="200"
  frameBorder="0"
  allow="autoplay"
/>

// Option 2: postMessage API
window.postMessage({
  type: 'BRAINFM_PLAY',
  activity: 'focus'
}, 'https://brain.fm');
```

**State Persistence**:
- Store player state in React Context
- Persist across route changes
- Stop playback on logout
- Resume on return to Sensa Learn portal


### 3. Progress Dashboard System

#### ProgressDashboard Component

**Purpose**: Displays comprehensive learning progress with visualizations

**Interface**:
```typescript
interface ProgressDashboardProps {
  userId: string;
}

interface ProgressData {
  overallCompletion: number; // 0-100
  chapters: ChapterProgress[];
  streak: StreakData;
  badges: Badge[];
  stats: LearningStats;
}

interface ChapterProgress {
  chapterId: string;
  chapterName: string;
  courseId: string;
  courseName: string;
  completed: boolean;
  completedAt?: string;
  complexity: 'High' | 'Medium' | 'Low';
  analogiesViewed: number;
  totalAnalogies: number;
}

interface LearningStats {
  totalStudyTime: number; // minutes
  conceptsLearned: number;
  analogiesRated: number;
  feedbackProvided: number;
}
```

**Layout Structure**:
```
┌─────────────────────────────────────────────────────┐
│  Progress Dashboard                                  │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Overall  │  │  Streak  │  │  Badges  │          │
│  │ Progress │  │  Display │  │  Count   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────┤
│  Chapter Progress List                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ ✓ Chapter 1: Introduction    [Medium] 100% │   │
│  │ ○ Chapter 2: Advanced Topics [High]    60% │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Badge Showcase                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                      │
│  │ 🏆 │ │ 🔥 │ │ 📚 │ │ 🔒 │                      │
│  └────┘ └────┘ └────┘ └────┘                      │
└─────────────────────────────────────────────────────┘
```

#### ProgressCircle Component

**Purpose**: Animated circular progress indicator

**Interface**:
```typescript
interface ProgressCircleProps {
  percentage: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
}
```

**Implementation**:
- SVG-based circular progress bar
- Animated stroke-dashoffset using Framer Motion
- Gradient stroke color from brand theme
- Center label showing percentage
- Smooth animation on value change


### 4. Learning Streaks System

#### StreakDisplay Component

**Purpose**: Shows current learning streak with visual flair

**Interface**:
```typescript
interface StreakDisplayProps {
  days: number;
  longestStreak?: number;
  isAtRisk?: boolean; // True if user hasn't learned today
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakHistory: StreakHistoryEntry[];
}

interface StreakHistoryEntry {
  date: string;
  activityCount: number;
}
```

**Visual Design**:
- Flame icon (🔥) with animated glow for 7+ day streaks
- Gold flame for 30+ day streaks
- Pulsing animation for active streaks
- Warning indicator when at risk of breaking streak
- Tooltip showing longest streak

**Streak Calculation Logic**:
```typescript
function calculateStreak(activities: Activity[]): StreakData {
  // Sort activities by date descending
  // Check consecutive days in user's timezone
  // Reset if gap > 24 hours
  // Return current and longest streak
}
```

**Backend API**:
```typescript
GET /api/users/{userId}/streak
Response: {
  current_streak: number,
  longest_streak: number,
  last_activity_date: string,
  is_at_risk: boolean
}

POST /api/users/{userId}/activity
Body: {
  activity_type: 'chapter_complete' | 'analogy_viewed' | 'feedback_provided',
  timestamp: string
}
```


### 5. Badge System

#### Badge Data Model

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  category: 'completion' | 'streak' | 'engagement' | 'mastery';
  requirement: BadgeRequirement;
  unlockedAt?: string;
  progress?: number; // 0-100 for locked badges
}

interface BadgeRequirement {
  type: 'chapter_complete' | 'course_complete' | 'streak' | 'feedback_count' | 'analogy_views';
  threshold: number;
  description: string;
}

interface UserBadges {
  earned: Badge[];
  locked: Badge[];
  totalPoints: number;
}
```

#### Badge Definitions

```typescript
export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first chapter',
    icon: '👣',
    category: 'completion',
    requirement: {
      type: 'chapter_complete',
      threshold: 1,
      description: 'Complete 1 chapter'
    }
  },
  {
    id: 'course-master',
    name: 'Course Master',
    description: 'Complete an entire course',
    icon: '🎓',
    category: 'completion',
    requirement: {
      type: 'course_complete',
      threshold: 1,
      description: 'Complete 1 course'
    }
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'streak',
    requirement: {
      type: 'streak',
      threshold: 7,
      description: 'Learn for 7 consecutive days'
    }
  },
  {
    id: 'month-champion',
    name: 'Month Champion',
    description: 'Maintain a 30-day learning streak',
    icon: '👑',
    category: 'streak',
    requirement: {
      type: 'streak',
      threshold: 30,
      description: 'Learn for 30 consecutive days'
    }
  },
  {
    id: 'helpful-learner',
    name: 'Helpful Learner',
    description: 'Provide 10 pieces of feedback',
    icon: '💡',
    category: 'engagement',
    requirement: {
      type: 'feedback_count',
      threshold: 10,
      description: 'Submit 10 feedback items'
    }
  },
  {
    id: 'analogy-explorer',
    name: 'Analogy Explorer',
    description: 'View all analogies in a chapter',
    icon: '🔍',
    category: 'mastery',
    requirement: {
      type: 'analogy_views',
      threshold: 100, // percentage
      description: 'View 100% of analogies in any chapter'
    }
  }
];
```

#### BadgeUnlockAnimation Component

**Purpose**: Celebratory animation when user earns a badge

**Interface**:
```typescript
interface BadgeUnlockAnimationProps {
  badge: Badge;
  onClose: () => void;
}
```

**Animation Sequence**:
1. Modal fades in with backdrop blur
2. Badge icon scales up from 0 to 1.2 with bounce
3. Confetti particles burst from center
4. Badge name and description fade in
5. "Congratulations!" message appears
6. Auto-close after 5 seconds or manual close

**Framer Motion Variants**:
```typescript
const badgeUnlockVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: {
    scale: [0, 1.2, 1],
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15
    }
  }
};
```


### 6. Visual Exam Relevance Prioritization (PBL)

#### ExamRelevanceIndicator Component

**Purpose**: Visual styling for exam-relevant concepts in concept maps

**Interface**:
```typescript
interface ExamRelevanceIndicatorProps {
  relevance: 'high' | 'medium' | 'low';
  conceptName: string;
}

interface ConceptNodeStyle {
  radius: number;
  glowIntensity: number;
  borderWidth: number;
  color: string;
}
```

**Styling Rules**:
```typescript
const EXAM_RELEVANCE_STYLES = {
  high: {
    radius: 25, // 25% larger than standard
    glowIntensity: 0.6,
    borderWidth: 3,
    color: '#F97316', // warm-coral
    animation: 'pulse-glow 2s ease-in-out infinite'
  },
  medium: {
    radius: 20,
    glowIntensity: 0,
    borderWidth: 2,
    color: '#F59E0B', // golden-amber
    animation: 'none'
  },
  low: {
    radius: 20,
    glowIntensity: 0,
    borderWidth: 1,
    color: '#6B7280', // text-light
    animation: 'none'
  }
};
```

**D3.js Integration**:
```typescript
// In ConceptMapVisualization.tsx
node.append('circle')
  .attr('r', d => {
    const relevance = d.concept.exam_relevance || 'low';
    return EXAM_RELEVANCE_STYLES[relevance].radius;
  })
  .attr('class', d => {
    const relevance = d.concept.exam_relevance || 'low';
    return relevance === 'high' ? 'exam-relevant-glow' : '';
  })
  .attr('stroke', d => {
    const relevance = d.concept.exam_relevance || 'low';
    return EXAM_RELEVANCE_STYLES[relevance].color;
  })
  .attr('stroke-width', d => {
    const relevance = d.concept.exam_relevance || 'low';
    return EXAM_RELEVANCE_STYLES[relevance].borderWidth;
  });
```

**CSS Animations**:
```css
.exam-relevant-glow {
  filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.6));
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.8));
  }
}

.exam-relevant-glow:hover {
  filter: drop-shadow(0 0 16px rgba(249, 115, 22, 0.9));
}
```


### 7. Conflict Resolution UI (PBL)

#### ConflictResolutionModal Component

**Purpose**: Side-by-side comparison of conflicting definitions with AI recommendation

**Interface**:
```typescript
interface ConflictResolutionModalProps {
  conflict: ConceptConflict;
  onResolve: (resolution: ConflictResolution) => Promise<void>;
  onClose: () => void;
}

interface ConceptConflict {
  conceptId: string;
  conceptName: string;
  source1: ConflictSource;
  source2: ConflictSource;
  aiRecommendation: AIRecommendation;
}

interface ConflictSource {
  definition: string;
  documentId: string;
  documentName: string;
  confidence: number; // 0-1
  extractedAt: string;
}

interface AIRecommendation {
  preferredSource: 'source1' | 'source2' | 'neither';
  reasoning: string;
  suggestedDefinition?: string;
  confidence: number; // 0-1
}

interface ConflictResolution {
  choice: 'source1' | 'source2' | 'custom';
  customDefinition?: string;
  reasoning?: string;
}
```

**Layout Structure**:
```
┌─────────────────────────────────────────────────────┐
│  Conflict Detected: [Concept Name]            [X]   │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   Source 1       │  │   Source 2       │        │
│  │  [Document A]    │  │  [Document B]    │        │
│  │                  │  │                  │        │
│  │  Definition...   │  │  Definition...   │        │
│  │                  │  │                  │        │
│  │  [Select This]   │  │  [Select This]   │        │
│  └──────────────────┘  └──────────────────┘        │
├─────────────────────────────────────────────────────┤
│  🤖 AI Recommendation                               │
│  We recommend Source 1 because...                   │
│  Confidence: 85%                                    │
├─────────────────────────────────────────────────────┤
│  ✏️ Or write your own definition:                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Text area for custom definition]           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Cancel]                    [Submit Resolution]   │
└─────────────────────────────────────────────────────┘
```

**Backend API**:
```typescript
GET /api/concepts/{conceptId}/conflicts
Response: {
  conflicts: ConceptConflict[]
}

POST /api/concepts/{conceptId}/resolve-conflict
Body: {
  conflict_id: string,
  resolution: ConflictResolution
}
Response: {
  success: boolean,
  updated_concept: Concept
}
```


### 8. Interactive Feedback Mechanism (PBL)

#### FeedbackPanel Component

**Purpose**: Inline feedback options for concepts in PBL portal

**Interface**:
```typescript
interface FeedbackPanelProps {
  conceptId: string;
  conceptName: string;
  onFeedbackSubmitted?: () => void;
}

interface FeedbackSubmission {
  conceptId: string;
  userId: string;
  feedbackType: 'incorrect' | 'edit_suggestion' | 'add_related';
  content: FeedbackContent;
  timestamp: string;
}

interface FeedbackContent {
  // For 'incorrect' type
  incorrectReason?: string;
  
  // For 'edit_suggestion' type
  suggestedDefinition?: string;
  editReason?: string;
  
  // For 'add_related' type
  relatedConceptName?: string;
  relationshipType?: 'prerequisite' | 'related' | 'example';
  relationshipDescription?: string;
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Concept: [Name]                                    │
│  Definition: [Text...]                              │
├─────────────────────────────────────────────────────┤
│  💬 Feedback                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ [🚩 Flag as Incorrect]                      │   │
│  │ [✏️ Suggest Edit]                            │   │
│  │ [➕ Add Related Concept]                     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Feedback Modals**:

1. **Flag as Incorrect Modal**:
```
┌─────────────────────────────────────────────────────┐
│  Flag Concept as Incorrect                     [X]  │
├─────────────────────────────────────────────────────┤
│  What's wrong with this concept?                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Text area for explanation]                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Cancel]                          [Submit Flag]   │
└─────────────────────────────────────────────────────┘
```

2. **Suggest Edit Modal**:
```
┌─────────────────────────────────────────────────────┐
│  Suggest Edit                                  [X]  │
├─────────────────────────────────────────────────────┤
│  Current Definition:                                │
│  [Read-only text showing current definition]        │
│                                                     │
│  Your Suggested Definition:                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Text area for new definition]              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Reason for Change:                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Text area for reasoning]                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Cancel]                      [Submit Suggestion]  │
└─────────────────────────────────────────────────────┘
```

3. **Add Related Concept Modal**:
```
┌─────────────────────────────────────────────────────┐
│  Add Related Concept                           [X]  │
├─────────────────────────────────────────────────────┤
│  Related Concept Name:                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Text input]                                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Relationship Type:                                 │
│  ○ Prerequisite  ○ Related  ○ Example              │
│                                                     │
│  Description:                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Text area]                                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Cancel]                      [Submit Suggestion]  │
└─────────────────────────────────────────────────────┘
```

**Backend API**:
```typescript
POST /api/concepts/{conceptId}/feedback
Body: FeedbackSubmission
Response: {
  feedback_id: string,
  message: string,
  badge_progress?: {
    helpful_learner: number // progress toward badge
  }
}

GET /api/concepts/{conceptId}/feedback-status
Response: {
  has_feedback: boolean,
  feedback_count: number,
  last_feedback_at?: string
}
```


### 9. Immersive Learning Environment (Sensa Learn)

#### ImmersiveLearningEnvironment Component

**Purpose**: Animated background for Sensa Learn portal

**Interface**:
```typescript
interface ImmersiveLearningEnvironmentProps {
  children: ReactNode;
  backgroundType?: 'abstract' | 'nature' | 'minimal';
}

interface BackgroundConfig {
  animationDuration: number;
  particleCount: number;
  colorScheme: string[];
  intensity: 'low' | 'medium' | 'high';
}
```

**Implementation Options**:

1. **Abstract Patterns** (Default):
   - Slowly morphing gradient blobs
   - Subtle particle system
   - CSS animations for performance

2. **Nature Scenes**:
   - Parallax scrolling clouds
   - Gentle wave animations
   - Seasonal themes

3. **Minimal**:
   - Static gradient
   - No animations (for reduced motion)

**CSS Implementation**:
```css
.immersive-background {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.gradient-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gradient-blob {
    animation: none;
  }
}
```

**Performance Considerations**:
- Use CSS transforms (GPU-accelerated)
- Limit particle count on low-end devices
- Detect device capabilities and adjust
- Provide static fallback

**Device Detection**:
```typescript
function getBackgroundIntensity(): 'low' | 'medium' | 'high' {
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  
  if (memory < 4 || cores < 4) return 'low';
  if (memory < 8 || cores < 8) return 'medium';
  return 'high';
}
```


### 10. Enhanced Profile Onboarding

#### OnboardingWizard Component

**Purpose**: Multi-step guided onboarding for new users

**Interface**:
```typescript
interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (profile: Partial<UserProfile>) => Promise<void>;
  onSkip: () => void;
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  data: Partial<UserProfile>;
  isSubmitting: boolean;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  validation?: (data: any) => boolean;
}
```

**Onboarding Steps**:

1. **Welcome Step**:
   - Welcome message
   - Brief explanation of personalization
   - "Let's Get Started" button

2. **Age Range Step**:
   - Dropdown with age ranges
   - Optional field
   - Skip button available

3. **Location Step**:
   - Text input for location/region
   - Optional field
   - Autocomplete suggestions

4. **Interests Step**:
   - Chip selection interface
   - Predefined interest chips
   - Custom interest input
   - Minimum 3 interests recommended

5. **Learning Style Quiz Step**:
   - 4-5 quick questions
   - Visual, Auditory, Kinesthetic, Reading/Writing
   - Results shown immediately

6. **Completion Step**:
   - Summary of selections
   - Congratulations message
   - "Start Learning" button

**Layout Structure**:
```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐   │
│  │ Step 2 of 6                                 │   │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│  │                                             │   │
│  │  Select Your Age Range                      │   │
│  │  This helps us personalize your content    │   │
│  │                                             │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ [Dropdown: Select age range...]     │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  [Skip]              [Back]     [Next]     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Interest Chip Selection**:
```typescript
interface InterestChipProps {
  interest: string;
  isSelected: boolean;
  onToggle: () => void;
}

// Visual design
<button
  className={`
    px-4 py-2 rounded-full border-2 transition-all
    ${isSelected 
      ? 'bg-warm-coral text-white border-warm-coral' 
      : 'bg-white text-text-dark border-gray-300 hover:border-warm-coral'
    }
  `}
  onClick={onToggle}
>
  {interest}
  {isSelected && <Check size={16} className="ml-2" />}
</button>
```

**Learning Style Quiz**:
```typescript
const LEARNING_STYLE_QUESTIONS = [
  {
    id: 'q1',
    question: 'When learning something new, I prefer to:',
    options: [
      { value: 'visual', label: 'See diagrams and charts' },
      { value: 'auditory', label: 'Listen to explanations' },
      { value: 'kinesthetic', label: 'Try it hands-on' },
      { value: 'reading-writing', label: 'Read detailed instructions' }
    ]
  },
  // ... more questions
];

function calculateLearningStyle(answers: string[]): LearningStyle {
  // Count occurrences of each style
  // Return most common style
}
```

**State Persistence**:
```typescript
// Save progress to localStorage
function saveOnboardingProgress(data: Partial<UserProfile>) {
  localStorage.setItem('onboarding_progress', JSON.stringify(data));
}

// Resume from saved progress
function loadOnboardingProgress(): Partial<UserProfile> | null {
  const saved = localStorage.getItem('onboarding_progress');
  return saved ? JSON.parse(saved) : null;
}

// Clear on completion
function clearOnboardingProgress() {
  localStorage.removeItem('onboarding_progress');
}
```


## Data Models

### Progress Data Model

```typescript
interface UserProgress {
  userId: string;
  overallCompletion: number; // 0-100
  totalStudyTime: number; // minutes
  conceptsLearned: number;
  chaptersCompleted: number;
  coursesCompleted: number;
  lastActivityAt: string;
  updatedAt: string;
}

interface ChapterProgress {
  chapterId: string;
  userId: string;
  completed: boolean;
  completedAt?: string;
  analogiesViewed: number;
  totalAnalogies: number;
  timeSpent: number; // minutes
  lastViewedAt: string;
}
```

### Streak Data Model

```typescript
interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakStartDate: string;
  isAtRisk: boolean;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  activityType: 'chapter_complete' | 'analogy_viewed' | 'feedback_provided' | 'concept_reviewed';
  timestamp: string;
  metadata?: Record<string, any>;
}
```

### Badge Data Model

```typescript
interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
  progress: number; // 0-100
  isUnlocked: boolean;
}

interface BadgeProgress {
  badgeId: string;
  currentValue: number;
  requiredValue: number;
  percentage: number; // 0-100
}
```

### Feedback Data Model

```typescript
interface ConceptFeedback {
  id: string;
  conceptId: string;
  userId: string;
  feedbackType: 'incorrect' | 'edit_suggestion' | 'add_related';
  content: FeedbackContent;
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface FeedbackStats {
  userId: string;
  totalFeedback: number;
  acceptedFeedback: number;
  pendingFeedback: number;
  lastFeedbackAt?: string;
}
```

### Conflict Data Model

```typescript
interface ConceptConflict {
  id: string;
  conceptId: string;
  conceptName: string;
  source1: ConflictSource;
  source2: ConflictSource;
  aiRecommendation: AIRecommendation;
  status: 'unresolved' | 'resolved' | 'ignored';
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: ConflictResolution;
  createdAt: string;
}
```


## Error Handling

### Audio Service Errors

**ElevenLabs API Failures**:
```typescript
try {
  const audioBlob = await audioService.generateSpeech(text, contentId);
} catch (error) {
  if (error.response?.status === 401) {
    // Invalid API key
    showError('Audio service unavailable. Please contact support.');
  } else if (error.response?.status === 429) {
    // Rate limit exceeded
    showError('Too many audio requests. Please try again in a moment.');
  } else if (error.response?.status === 500) {
    // Server error
    showError('Audio generation failed. Please try again later.');
  } else {
    // Network or unknown error
    showError('Unable to generate audio. Check your connection.');
  }
  // Disable audio button for this content
  setAudioAvailable(false);
}
```

**IndexedDB Errors**:
```typescript
try {
  await audioCache.store(contentId, blob);
} catch (error) {
  console.warn('Failed to cache audio:', error);
  // Continue without caching - audio will work but won't be cached
}
```

### Progress Tracking Errors

**API Failures**:
```typescript
// Use optimistic updates with rollback
const updateProgress = useMutation({
  mutationFn: (data) => progressService.updateProgress(data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['progress']);
    
    // Snapshot previous value
    const previousProgress = queryClient.getQueryData(['progress']);
    
    // Optimistically update
    queryClient.setQueryData(['progress'], newData);
    
    return { previousProgress };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['progress'], context.previousProgress);
    showError('Failed to update progress. Changes not saved.');
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries(['progress']);
  }
});
```

### Badge System Errors

**Badge Unlock Failures**:
```typescript
try {
  await badgeService.unlockBadge(badgeId);
  showBadgeUnlockAnimation(badge);
} catch (error) {
  console.error('Failed to unlock badge:', error);
  // Don't show animation, but log for retry
  // Badge will be unlocked on next sync
}
```

### Feedback Submission Errors

**Network Failures**:
```typescript
try {
  await feedbackService.submitFeedback(feedback);
  showSuccess('Thank you for your feedback!');
} catch (error) {
  if (error.response?.status === 409) {
    showError('You have already submitted feedback for this concept.');
  } else {
    // Queue for retry
    await queueFeedbackForRetry(feedback);
    showWarning('Feedback saved locally. Will sync when connection is restored.');
  }
}
```

### Conflict Resolution Errors

**Resolution Failures**:
```typescript
try {
  await conflictService.resolveConflict(conflictId, resolution);
  showSuccess('Conflict resolved successfully!');
  closeModal();
} catch (error) {
  if (error.response?.status === 404) {
    showError('This conflict has already been resolved.');
  } else {
    showError('Failed to save resolution. Please try again.');
  }
}
```


## Testing Strategy

### Unit Tests

**Audio Service Tests**:
```typescript
describe('audioService', () => {
  it('should generate speech from text', async () => {
    const blob = await audioService.generateSpeech('test', 'test-id');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/mpeg');
  });
  
  it('should cache generated audio', async () => {
    await audioService.generateSpeech('test', 'test-id');
    const cached = await audioService.getCachedAudio('test-id');
    expect(cached).not.toBeNull();
  });
  
  it('should handle API errors gracefully', async () => {
    mockElevenLabsAPI.mockRejectedValue(new Error('API Error'));
    await expect(
      audioService.generateSpeech('test', 'test-id')
    ).rejects.toThrow();
  });
});
```

**Progress Service Tests**:
```typescript
describe('progressService', () => {
  it('should calculate overall completion correctly', () => {
    const progress = calculateOverallCompletion([
      { completed: true },
      { completed: false },
      { completed: true }
    ]);
    expect(progress).toBe(67); // 2/3 * 100
  });
  
  it('should track chapter progress', async () => {
    await progressService.markChapterComplete('chapter-1');
    const progress = await progressService.getChapterProgress('chapter-1');
    expect(progress.completed).toBe(true);
  });
});
```

**Badge Service Tests**:
```typescript
describe('badgeService', () => {
  it('should unlock badge when requirement met', async () => {
    await badgeService.checkBadgeProgress('first-steps', 1);
    const badges = await badgeService.getUserBadges();
    expect(badges.earned).toContainEqual(
      expect.objectContaining({ id: 'first-steps' })
    );
  });
  
  it('should calculate badge progress correctly', () => {
    const progress = calculateBadgeProgress(5, 10);
    expect(progress).toBe(50);
  });
});
```

### Integration Tests

**Audio Narration Flow**:
```typescript
describe('AudioNarration Component', () => {
  it('should play audio when button clicked', async () => {
    render(<AudioNarration text="test" contentId="test-1" />);
    
    const playButton = screen.getByLabelText('Play audio');
    await userEvent.click(playButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Pause audio')).toBeInTheDocument();
    });
  });
  
  it('should show loading state during generation', async () => {
    render(<AudioNarration text="test" contentId="test-1" />);
    
    const playButton = screen.getByLabelText('Play audio');
    await userEvent.click(playButton);
    
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });
});
```

**Progress Dashboard Flow**:
```typescript
describe('ProgressDashboard Component', () => {
  it('should display user progress correctly', async () => {
    mockProgressAPI.mockResolvedValue({
      overallCompletion: 75,
      streak: { currentStreak: 5 },
      badges: { earned: [{ id: 'first-steps' }] }
    });
    
    render(<ProgressDashboard userId="user-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

**Complete Onboarding Flow**:
```typescript
test('user can complete onboarding', async ({ page }) => {
  await page.goto('/');
  
  // Step 1: Welcome
  await page.click('text=Let\'s Get Started');
  
  // Step 2: Age Range
  await page.selectOption('select', '25-34');
  await page.click('text=Next');
  
  // Step 3: Location
  await page.fill('input[name="location"]', 'New York');
  await page.click('text=Next');
  
  // Step 4: Interests
  await page.click('text=Science');
  await page.click('text=Technology');
  await page.click('text=Reading');
  await page.click('text=Next');
  
  // Step 5: Learning Style Quiz
  await page.click('text=See diagrams and charts');
  await page.click('text=Next');
  
  // Step 6: Completion
  await page.click('text=Start Learning');
  
  // Verify profile saved
  await expect(page).toHaveURL('/sensa');
});
```

**Badge Unlock Flow**:
```typescript
test('user earns badge after completing chapter', async ({ page }) => {
  await page.goto('/sensa/course/1/chapter/1');
  
  // Complete chapter
  await page.click('text=Mark as Complete');
  
  // Badge animation should appear
  await expect(page.locator('.badge-unlock-modal')).toBeVisible();
  await expect(page.locator('text=First Steps')).toBeVisible();
  
  // Close animation
  await page.click('text=Close');
  
  // Badge should appear in dashboard
  await page.goto('/progress');
  await expect(page.locator('text=First Steps')).toBeVisible();
});
```

### Performance Tests

**Audio Caching Performance**:
```typescript
test('audio caching reduces load time', async () => {
  // First load - should call API
  const start1 = performance.now();
  await audioService.generateSpeech('test', 'test-1');
  const duration1 = performance.now() - start1;
  
  // Second load - should use cache
  const start2 = performance.now();
  await audioService.generateSpeech('test', 'test-1');
  const duration2 = performance.now() - start2;
  
  expect(duration2).toBeLessThan(duration1 * 0.1); // 10x faster
});
```

**Progress Dashboard Load Time**:
```typescript
test('progress dashboard loads in under 2 seconds', async () => {
  const start = performance.now();
  
  render(<ProgressDashboard userId="user-1" />);
  
  await waitFor(() => {
    expect(screen.getByText(/Overall Progress/)).toBeInTheDocument();
  });
  
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(2000);
});
```


## Security Considerations

### API Key Management

**ElevenLabs API Key**:
```typescript
// Store in environment variables
VITE_ELEVENLABS_API_KEY=sk_xxxxx
VITE_ELEVENLABS_VOICE_ID=voice_xxxxx

// Never expose in client-side code
// Consider proxy through backend for production
```

**Backend Proxy Pattern** (Recommended):
```typescript
// Frontend calls backend
const audioBlob = await fetch('/api/audio/generate', {
  method: 'POST',
  body: JSON.stringify({ text, contentId }),
  headers: { 'Authorization': `Bearer ${userToken}` }
});

// Backend proxies to ElevenLabs
app.post('/api/audio/generate', authenticate, async (req, res) => {
  const { text, contentId } = req.body;
  
  // Rate limiting per user
  await rateLimiter.check(req.user.id, 'audio_generation');
  
  // Call ElevenLabs with server-side API key
  const response = await elevenLabs.generateSpeech(text);
  
  res.send(response.data);
});
```

### Data Privacy

**Audio Caching**:
- Audio blobs stored in IndexedDB (client-side only)
- No audio content sent to backend
- Cache cleared on logout
- User can manually clear cache

**Progress Data**:
- All progress data requires authentication
- User can only access their own progress
- No PII in progress records
- GDPR-compliant data export available

**Feedback Data**:
- Feedback can be submitted anonymously
- User ID optional for attribution
- No sensitive content in feedback
- Moderation system for inappropriate content

### XSS Prevention

**User-Generated Content**:
```typescript
// Sanitize all user input
import DOMPurify from 'dompurify';

function sanitizeFeedback(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // No HTML allowed
    ALLOWED_ATTR: []
  });
}

// Use in feedback submission
const sanitizedContent = sanitizeFeedback(userInput);
await feedbackService.submit({ content: sanitizedContent });
```

### CSRF Protection

**API Requests**:
```typescript
// Include CSRF token in all mutations
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
```

### Rate Limiting

**Audio Generation**:
- 10 requests per minute per user
- 100 requests per day per user
- Cached audio doesn't count toward limit

**Feedback Submission**:
- 5 submissions per minute per user
- 50 submissions per day per user

**Progress Updates**:
- 60 updates per minute per user
- No daily limit (legitimate use case)


## Performance Considerations

### Audio Service Optimization

**Lazy Loading**:
```typescript
// Only load audio service when needed
const AudioNarration = lazy(() => import('@/components/audio/AudioNarration'));

// Preload on hover
<button
  onMouseEnter={() => {
    import('@/components/audio/AudioNarration');
  }}
>
  Listen
</button>
```

**Compression**:
```typescript
// Request compressed audio from ElevenLabs
const response = await elevenLabs.generateSpeech(text, {
  output_format: 'mp3_44100_128', // 128kbps for smaller file size
  optimize_streaming_latency: 3 // Balance quality and speed
});
```

**Parallel Loading**:
```typescript
// Preload audio for next concept while user reads current
useEffect(() => {
  if (nextConceptText) {
    audioService.generateSpeech(nextConceptText, nextConceptId);
  }
}, [currentConceptId]);
```

### Progress Dashboard Optimization

**Data Aggregation**:
```typescript
// Single API call for all dashboard data
GET /api/users/{userId}/dashboard
Response: {
  progress: UserProgress,
  streak: StreakData,
  badges: UserBadges,
  recentActivity: Activity[]
}
```

**Incremental Loading**:
```typescript
// Load critical data first
const { data: progress } = useQuery(['progress'], fetchProgress);

// Load badges in background
const { data: badges } = useQuery(['badges'], fetchBadges, {
  enabled: !!progress // Only after progress loads
});
```

**Memoization**:
```typescript
// Memoize expensive calculations
const overallCompletion = useMemo(() => {
  return calculateCompletion(chapters);
}, [chapters]);

const badgeProgress = useMemo(() => {
  return calculateBadgeProgress(activities, BADGE_DEFINITIONS);
}, [activities]);
```

### Animation Performance

**GPU Acceleration**:
```css
/* Use transform and opacity for animations */
.badge-unlock {
  transform: scale(0);
  opacity: 0;
  will-change: transform, opacity;
}

.badge-unlock.active {
  transform: scale(1);
  opacity: 1;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.3s ease;
}
```

**Reduce Motion**:
```typescript
// Respect user preferences
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const animationDuration = prefersReducedMotion ? 0 : 500;
```

### Bundle Size Optimization

**Code Splitting**:
```typescript
// Split by portal
const SensaLearnPortal = lazy(() => import('@/pages/sensa/SensaDashboardPage'));
const PBLPortal = lazy(() => import('@/pages/pbl/PBLDashboardPage'));

// Split by feature
const ProgressDashboard = lazy(() => import('@/components/progress/ProgressDashboard'));
const OnboardingWizard = lazy(() => import('@/components/onboarding/OnboardingWizard'));
```

**Tree Shaking**:
```typescript
// Import only what's needed
import { motion } from 'framer-motion'; // ❌ Large bundle
import { motion } from 'framer-motion/dist/framer-motion'; // ✅ Smaller

// Use named imports
import { Play, Pause } from 'lucide-react'; // ✅ Tree-shakeable
```

### Caching Strategy

**React Query Configuration**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1
    }
  }
});
```

**IndexedDB for Audio**:
```typescript
// Store audio with expiration
interface CachedAudio {
  contentId: string;
  blob: Blob;
  cachedAt: number;
  expiresAt: number;
}

async function getCachedAudio(contentId: string): Promise<Blob | null> {
  const cached = await db.audio.get(contentId);
  
  if (!cached) return null;
  
  // Check expiration
  if (Date.now() > cached.expiresAt) {
    await db.audio.delete(contentId);
    return null;
  }
  
  return cached.blob;
}
```


## Accessibility Considerations

### Audio Narration Accessibility

**Keyboard Navigation**:
```typescript
<button
  onClick={handlePlay}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlay();
    }
  }}
  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
  aria-pressed={isPlaying}
>
  {isPlaying ? <Pause /> : <Play />}
</button>
```

**Screen Reader Support**:
```typescript
<div role="region" aria-label="Audio narration controls">
  <button aria-label="Play audio narration">
    <Play aria-hidden="true" />
  </button>
  <div
    role="progressbar"
    aria-valuenow={currentTime}
    aria-valuemin={0}
    aria-valuemax={duration}
    aria-label="Audio playback progress"
  />
</div>
```

**Captions Alternative**:
```typescript
// Provide text transcript alongside audio
<div className="audio-section">
  <AudioNarration text={concept.definition} />
  <details className="transcript">
    <summary>View Transcript</summary>
    <p>{concept.definition}</p>
  </details>
</div>
```

### Progress Dashboard Accessibility

**Semantic HTML**:
```typescript
<section aria-labelledby="progress-heading">
  <h2 id="progress-heading">Your Learning Progress</h2>
  
  <div role="group" aria-label="Progress statistics">
    <div role="status" aria-live="polite">
      <span className="sr-only">Overall completion:</span>
      <span aria-label={`${completion}% complete`}>
        {completion}%
      </span>
    </div>
  </div>
</section>
```

**Color Contrast**:
```typescript
// Ensure WCAG AA compliance (4.5:1 minimum)
const COMPLEXITY_COLORS = {
  high: '#DC2626', // Red - 4.5:1 on white
  medium: '#F59E0B', // Amber - 4.5:1 on white
  low: '#10B981' // Green - 4.5:1 on white
};
```

**Focus Management**:
```typescript
// Trap focus in modals
import { FocusTrap } from '@headlessui/react';

<FocusTrap>
  <div role="dialog" aria-modal="true">
    <h2 id="modal-title">Badge Unlocked!</h2>
    {/* Modal content */}
    <button onClick={onClose}>Close</button>
  </div>
</FocusTrap>
```

### Onboarding Accessibility

**Progress Indication**:
```typescript
<nav aria-label="Onboarding progress">
  <ol className="steps">
    {steps.map((step, index) => (
      <li
        key={step.id}
        aria-current={index === currentStep ? 'step' : undefined}
        aria-label={`Step ${index + 1} of ${steps.length}: ${step.title}`}
      >
        {step.title}
      </li>
    ))}
  </ol>
</nav>
```

**Form Labels**:
```typescript
<div className="form-field">
  <label htmlFor="age-range">
    Age Range
    <span className="optional">(Optional)</span>
  </label>
  <select
    id="age-range"
    aria-describedby="age-range-help"
    value={ageRange}
    onChange={(e) => setAgeRange(e.target.value)}
  >
    <option value="">Select age range...</option>
    {AGE_RANGE_OPTIONS.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
  <p id="age-range-help" className="help-text">
    This helps us personalize your learning content
  </p>
</div>
```

### Conflict Resolution Accessibility

**Side-by-Side Comparison**:
```typescript
<div role="group" aria-label="Conflicting definitions">
  <div role="article" aria-labelledby="source1-heading">
    <h3 id="source1-heading">Source 1: {source1.documentName}</h3>
    <p>{source1.definition}</p>
    <button
      onClick={() => selectSource('source1')}
      aria-label={`Select definition from ${source1.documentName}`}
    >
      Select This
    </button>
  </div>
  
  <div role="article" aria-labelledby="source2-heading">
    <h3 id="source2-heading">Source 2: {source2.documentName}</h3>
    <p>{source2.definition}</p>
    <button
      onClick={() => selectSource('source2')}
      aria-label={`Select definition from ${source2.documentName}`}
    >
      Select This
    </button>
  </div>
</div>
```

**AI Recommendation**:
```typescript
<div role="complementary" aria-labelledby="ai-recommendation-heading">
  <h3 id="ai-recommendation-heading">
    <span aria-hidden="true">🤖</span>
    AI Recommendation
  </h3>
  <p>{aiRecommendation.reasoning}</p>
  <div role="status">
    Confidence: {aiRecommendation.confidence}%
  </div>
</div>
```


## Deployment Strategy

### Environment Configuration

**Development**:
```env
VITE_API_URL=http://localhost:8000
VITE_ELEVENLABS_API_KEY=sk_dev_xxxxx
VITE_ELEVENLABS_VOICE_ID=voice_dev_xxxxx
VITE_BRAINFM_WIDGET_URL=https://brain.fm/widget?token=dev_token
VITE_ENABLE_AUDIO=true
VITE_ENABLE_MUSIC=true
VITE_ENABLE_ANALYTICS=false
```

**Production**:
```env
VITE_API_URL=https://api.sensalearn.com
VITE_ELEVENLABS_API_KEY=sk_prod_xxxxx
VITE_ELEVENLABS_VOICE_ID=voice_prod_xxxxx
VITE_BRAINFM_WIDGET_URL=https://brain.fm/widget?token=prod_token
VITE_ENABLE_AUDIO=true
VITE_ENABLE_MUSIC=true
VITE_ENABLE_ANALYTICS=true
```

### Feature Flags

**Gradual Rollout**:
```typescript
interface FeatureFlags {
  audioNarration: boolean;
  focusMusic: boolean;
  progressDashboard: boolean;
  badgeSystem: boolean;
  conflictResolution: boolean;
  onboarding: boolean;
}

// Load from backend or config
const featureFlags = await fetchFeatureFlags();

// Conditional rendering
{featureFlags.audioNarration && (
  <AudioNarration text={text} contentId={id} />
)}
```

### Rollout Plan

**Phase 1: Core Features** (Week 1-2)
- Progress Dashboard
- Learning Streaks
- Badge System (basic badges)
- Enhanced Onboarding

**Phase 2: Audio-Visual** (Week 3-4)
- Audio Narration (ElevenLabs)
- Focus Music Player (Brain.fm)
- Immersive Environment

**Phase 3: PBL Enhancements** (Week 5-6)
- Visual Exam Relevance
- Conflict Resolution UI
- Interactive Feedback

**Phase 4: Polish & Optimization** (Week 7-8)
- Performance optimization
- Accessibility improvements
- Bug fixes and refinements

### Monitoring

**Key Metrics**:
```typescript
// Track feature usage
analytics.track('audio_narration_played', {
  contentId,
  duration,
  completionRate
});

analytics.track('badge_unlocked', {
  badgeId,
  userId,
  timeToUnlock
});

analytics.track('feedback_submitted', {
  feedbackType,
  conceptId
});
```

**Error Tracking**:
```typescript
// Sentry integration
Sentry.captureException(error, {
  tags: {
    feature: 'audio_narration',
    component: 'AudioNarration'
  },
  extra: {
    contentId,
    userId
  }
});
```

**Performance Monitoring**:
```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```


## Future Enhancements

### Potential Additions (Out of Current Scope)

1. **Advanced Audio Features**:
   - Multiple voice options
   - Speed control (0.5x - 2x)
   - Pitch adjustment
   - Background music mixing
   - Offline audio download

2. **Enhanced Gamification**:
   - Leaderboards (optional, privacy-respecting)
   - Achievement tiers (Bronze, Silver, Gold)
   - Daily challenges
   - Seasonal events
   - Custom badge creation

3. **Social Features**:
   - Share progress with friends
   - Study groups
   - Collaborative concept maps
   - Peer feedback on analogies

4. **Advanced Analytics**:
   - Learning pattern insights
   - Optimal study time recommendations
   - Concept difficulty predictions
   - Personalized study plans

5. **Mobile Optimization**:
   - Native mobile apps
   - Offline mode
   - Push notifications for streaks
   - Mobile-optimized audio player

6. **AI Enhancements**:
   - Real-time concept explanation
   - Adaptive difficulty adjustment
   - Predictive content recommendations
   - Natural language queries

### Migration Path

**From Current System**:
- All existing features continue to work
- New features are additive, not breaking
- Gradual migration of users to new features
- Backward compatibility maintained

**Database Migrations**:
```sql
-- Add progress tracking tables
CREATE TABLE user_progress (
  user_id UUID PRIMARY KEY,
  overall_completion INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,
  concepts_learned INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add streak tracking
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  is_at_risk BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add badge system
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_id VARCHAR(50),
  unlocked_at TIMESTAMP,
  progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, badge_id)
);

-- Add feedback system
CREATE TABLE concept_feedback (
  id UUID PRIMARY KEY,
  concept_id UUID REFERENCES concepts(id),
  user_id UUID REFERENCES users(id),
  feedback_type VARCHAR(20),
  content JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID
);

-- Add conflict tracking
CREATE TABLE concept_conflicts (
  id UUID PRIMARY KEY,
  concept_id UUID REFERENCES concepts(id),
  source1_id UUID,
  source2_id UUID,
  ai_recommendation JSONB,
  status VARCHAR(20) DEFAULT 'unresolved',
  resolved_at TIMESTAMP,
  resolved_by UUID,
  resolution JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Conclusion

This design provides a comprehensive architecture for implementing advanced features across the Sensa Learn and PBL portals. The modular approach allows for independent development and testing of each feature, while the shared infrastructure (React Query, Framer Motion, brand theme) ensures consistency.

Key design principles:
- **Progressive enhancement** for graceful degradation
- **Performance optimization** through caching and lazy loading
- **Accessibility first** with WCAG AA compliance
- **Security by design** with proper API key management
- **User-centric** with clear feedback and error handling

The implementation can proceed incrementally, with each feature providing immediate value while building toward the complete vision of an immersive, personalized learning platform.
