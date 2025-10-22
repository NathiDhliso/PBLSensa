# Design Document

## Overview

The AI-Powered Analogy Generation feature transforms Sensa Learn from a static content viewer into an intelligent, personalized learning companion. This feature leverages AWS Bedrock's Claude models to generate contextual analogies, memory techniques, and learning mantras tailored to each student's interests, learning style, and background.

The system operates in three phases:
1. **Profile Enhancement** - Extend user profiles with learning style and enhanced interest tracking
2. **Content Analysis** - Extract and analyze chapter content to identify key concepts and calculate complexity
3. **AI Generation** - Use AWS Bedrock to generate personalized learning aids with caching and feedback loops

This design integrates seamlessly with the existing PBL architecture, reusing the document processing pipeline, database schema, and API patterns while adding new Bedrock-specific components.

## Architecture

### High-Level System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Profile                              │
│  • Interests: ["cooking", "sports", "music"]                    │
│  • Learning Style: "visual"                                      │
│  • Background: "high school student"                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Chapter Content Analysis                       │
│  • Extract key concepts from processed documents                 │
│  • Calculate complexity score                                    │
│  • Identify prerequisite relationships                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Bedrock Integration                       │
│  • Construct personalized prompt                                 │
│  • Call Claude 3.5 Sonnet                                        │
│  • Parse and validate response                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cache & Storage Layer                         │
│  • Store generated analogies in PostgreSQL                       │
│  • Cache for 30 days or until profile changes                    │
│  • Track feedback and ratings                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Display                              │
│  • Render analogies with visual cards                            │
│  • Show complexity indicators                                    │
│  • Collect user feedback                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                            │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Profile Editor  │  │ Chapter Detail   │  │ Feedback UI    │ │
│  │ Component       │  │ Page             │  │ Component      │ │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬───────┘ │
│           │                    │                      │          │
└───────────┼────────────────────┼──────────────────────┼──────────┘
            │                    │                      │
            │ HTTP/REST          │                      │
            │                    │                      │
┌───────────▼────────────────────▼──────────────────────▼──────────┐
│                         Backend API Layer                         │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Profile Service │  │ Analogy Service  │  │ Feedback       │ │
│  │                 │  │                  │  │ Service        │ │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬───────┘ │
│           │                    │                      │          │
└───────────┼────────────────────┼──────────────────────┼──────────┘
            │                    │                      │
            │                    │                      │
┌───────────▼────────────────────▼──────────────────────▼──────────┐
│                      Service Layer                                │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Bedrock Client  │  │ Content Analyzer │  │ Cache Manager  │ │
│  │                 │  │                  │  │                │ │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬───────┘ │
│           │                    │                      │          │
└───────────┼────────────────────┼──────────────────────┼──────────┘
            │                    │                      │
            │                    │                      │
┌───────────▼────────────────────▼──────────────────────▼──────────┐
│                      Data Layer                                   │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ PostgreSQL      │  │ AWS Bedrock      │  │ Redis Cache    │ │
│  │ (RDS)           │  │ (Claude 3.5)     │  │ (Optional)     │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Profile Enhancement

#### Extended User Profile Schema

```typescript
interface UserProfile {
  userId: string;
  email: string;
  name: string;
  ageRange?: AgeRange;
  location?: string;
  
  // New fields for personalization
  interests: string[];              // e.g., ["cooking", "sports", "music"]
  learningStyle: LearningStyle;     // "visual" | "auditory" | "kinesthetic" | "reading-writing"
  background?: string;              // e.g., "high school student", "working professional"
  educationLevel?: EducationLevel;  // "high_school" | "undergraduate" | "graduate" | "professional"
  
  createdAt: string;
  updatedAt: string;
}

type LearningStyle = "visual" | "auditory" | "kinesthetic" | "reading-writing";
type EducationLevel = "high_school" | "undergraduate" | "graduate" | "professional";
```

#### Database Migration

```sql
-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_style VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS background TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[]; -- Array of interests

CREATE INDEX idx_users_learning_style ON users(learning_style);
```

### 2. Content Analysis Service


#### Chapter Content Extractor

```python
class ChapterContentAnalyzer:
    """Analyzes chapter content to extract key concepts and calculate complexity"""
    
    def extract_chapter_content(self, document_id: str, chapter_id: str) -> ChapterContent:
        """
        Extract chapter content from processed document
        
        Args:
            document_id: UUID of the processed document
            chapter_id: Chapter identifier (e.g., "chapter_1")
            
        Returns:
            ChapterContent with text, concepts, and metadata
        """
        # Query processed_documents table for structured_content
        # Extract specific chapter from JSONB structure
        # Return chapter text and metadata
        
    def calculate_complexity_score(self, chapter_content: ChapterContent) -> float:
        """
        Calculate complexity score (0.0 - 1.0) based on multiple factors
        
        Factors:
        - Concept density (concepts per 1000 words)
        - Vocabulary difficulty (average word length, technical terms)
        - Relationship complexity (number of cross-references)
        - Prerequisite depth (how many prior concepts needed)
        
        Returns:
            Float between 0.0 (simple) and 1.0 (very complex)
        """
        
    def get_key_concepts(self, chapter_id: str, limit: int = 7) -> List[Concept]:
        """
        Get top N key concepts for a chapter
        
        Uses existing keywords table with filtering by chapter_id
        Orders by score and exam_relevance_score
        """
```

#### Data Models

```python
@dataclass
class ChapterContent:
    chapter_id: str
    chapter_title: str
    text_content: str
    key_concepts: List[str]
    complexity_score: float
    word_count: int
    estimated_reading_time: int  # minutes
    
@dataclass
class Concept:
    keyword: str
    score: float
    context_snippet: str
    exam_relevance: Optional[float]
```

### 3. AWS Bedrock Integration Service

#### Bedrock Client

```python
import boto3
import json
from typing import Dict, List

class BedrockAnalogyGenerator:
    """AWS Bedrock client for generating personalized analogies"""
    
    def __init__(self):
        self.client = boto3.client('bedrock-runtime', region_name='us-east-1')
        self.model_id = "anthropic.claude-3-5-sonnet-20241022-v2:0"
        self.max_tokens = 2000
        
    async def generate_analogies(
        self,
        chapter_content: ChapterContent,
        user_profile: UserProfile,
        num_analogies: int = 3
    ) -> AnalogyGenerationResult:
        """
        Generate personalized analogies using AWS Bedrock
        
        Args:
            chapter_content: Analyzed chapter content
            user_profile: User's profile with interests and learning style
            num_analogies: Number of analogies to generate (default 3)
            
        Returns:
            AnalogyGenerationResult with analogies, memory techniques, and mantras
        """
        prompt = self._construct_prompt(chapter_content, user_profile, num_analogies)
        
        try:
            response = await self._call_bedrock(prompt)
            result = self._parse_response(response)
            return result
        except Exception as e:
            # Log error and retry with exponential backoff
            raise BedrockGenerationError(f"Failed to generate analogies: {str(e)}")
    
    def _construct_prompt(
        self,
        chapter_content: ChapterContent,
        user_profile: UserProfile,
        num_analogies: int
    ) -> str:
        """Construct the prompt for Claude"""
        # See detailed prompt template below
        
    async def _call_bedrock(self, prompt: str) -> Dict:
        """Call Bedrock API with retry logic"""
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.max_tokens,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "top_p": 0.9
        }
        
        response = self.client.invoke_model(
            modelId=self.model_id,
            body=json.dumps(request_body)
        )
        
        return json.loads(response['body'].read())
    
    def _parse_response(self, response: Dict) -> AnalogyGenerationResult:
        """Parse and validate Bedrock response"""
        # Extract JSON from response
        # Validate structure
        # Return typed result
```

#### Prompt Template


```python
ANALOGY_GENERATION_PROMPT = """
You are an expert educational content creator specializing in personalized learning. Your task is to create engaging, memorable analogies and learning aids for a student.

**Student Profile:**
- Interests: {interests}
- Learning Style: {learning_style}
- Background: {background}
- Education Level: {education_level}

**Chapter Information:**
- Title: {chapter_title}
- Complexity: {complexity_score}/1.0
- Key Concepts: {key_concepts}

**Chapter Content Summary:**
{chapter_summary}

**Your Task:**
Generate {num_analogies} personalized analogies that explain the key concepts using the student's interests. Also create memory techniques and learning mantras.

**Requirements:**
1. Each analogy should connect a complex concept to one of the student's interests
2. Tailor the explanation style to their learning style ({learning_style})
3. Make analogies concrete, relatable, and memorable
4. Include 2-4 memory techniques (acronyms, mind palace, chunking, spaced repetition)
5. Create 3-4 short, motivational learning mantras

**Output Format (JSON):**
{{
  "analogies": [
    {{
      "concept": "concept name",
      "analogy_text": "detailed analogy explanation",
      "based_on_interest": "which interest this uses",
      "learning_style_adaptation": "how it fits their learning style"
    }}
  ],
  "memory_techniques": [
    {{
      "technique_type": "acronym|mind_palace|chunking|spaced_repetition",
      "technique_text": "detailed technique description",
      "application": "how to apply this technique"
    }}
  ],
  "learning_mantras": [
    {{
      "mantra_text": "short motivational phrase",
      "explanation": "brief explanation of the mantra"
    }}
  ]
}}

Generate the response now:
"""
```

### 4. Database Schema

#### New Tables

```sql
-- Chapter analogies table
CREATE TABLE IF NOT EXISTS chapter_analogies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id VARCHAR(100) NOT NULL,
    document_id UUID REFERENCES processed_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analogy content
    concept VARCHAR(255) NOT NULL,
    analogy_text TEXT NOT NULL,
    based_on_interest VARCHAR(100),
    learning_style_adaptation TEXT,
    
    -- Generation metadata
    model_version VARCHAR(50) NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    generation_cost_usd DECIMAL(10, 6),
    
    -- Caching
    cache_key VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analogies_chapter_id ON chapter_analogies(chapter_id);
CREATE INDEX idx_analogies_user_id ON chapter_analogies(user_id);
CREATE INDEX idx_analogies_cache_key ON chapter_analogies(cache_key);
CREATE INDEX idx_analogies_expires_at ON chapter_analogies(expires_at);

-- Memory techniques table
CREATE TABLE IF NOT EXISTS memory_techniques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    technique_type VARCHAR(50) NOT NULL, -- acronym, mind_palace, chunking, spaced_repetition
    technique_text TEXT NOT NULL,
    application TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memory_techniques_chapter_id ON memory_techniques(chapter_id);
CREATE INDEX idx_memory_techniques_user_id ON memory_techniques(user_id);

-- Learning mantras table
CREATE TABLE IF NOT EXISTS learning_mantras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    mantra_text VARCHAR(255) NOT NULL,
    explanation TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mantras_user_id ON learning_mantras(user_id);
CREATE INDEX idx_mantras_course_id ON learning_mantras(course_id);

-- Analogy feedback table
CREATE TABLE IF NOT EXISTS analogy_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analogy_id UUID REFERENCES chapter_analogies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(analogy_id, user_id) -- One rating per user per analogy
);

CREATE INDEX idx_feedback_analogy_id ON analogy_feedback(analogy_id);
CREATE INDEX idx_feedback_user_id ON analogy_feedback(user_id);
CREATE INDEX idx_feedback_rating ON analogy_feedback(rating);

-- Chapter complexity table
CREATE TABLE IF NOT EXISTS chapter_complexity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id VARCHAR(100) UNIQUE NOT NULL,
    document_id UUID REFERENCES processed_documents(id) ON DELETE CASCADE,
    
    complexity_score FLOAT NOT NULL CHECK (complexity_score >= 0 AND complexity_score <= 1),
    concept_count INTEGER,
    vocabulary_difficulty FLOAT,
    relationship_complexity FLOAT,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complexity_chapter_id ON chapter_complexity(chapter_id);
CREATE INDEX idx_complexity_score ON chapter_complexity(complexity_score);
```

### 5. API Endpoints


#### Backend API Routes

```python
# Profile endpoints
@app.patch("/api/users/{user_id}/profile")
async def update_user_profile(user_id: str, profile: UpdateProfileRequest):
    """Update user profile with learning style and interests"""
    
@app.get("/api/users/{user_id}/profile")
async def get_user_profile(user_id: str) -> UserProfile:
    """Get user profile"""

# Analogy generation endpoints
@app.post("/api/chapters/{chapter_id}/generate-analogies")
async def generate_chapter_analogies(
    chapter_id: str,
    user_id: str,
    force_regenerate: bool = False
) -> AnalogyGenerationResponse:
    """
    Generate or retrieve personalized analogies for a chapter
    
    Query params:
    - user_id: User requesting analogies
    - force_regenerate: Force regeneration even if cached (default: false)
    
    Returns:
    - analogies: List of personalized analogies
    - memory_techniques: List of memory techniques
    - learning_mantras: List of learning mantras
    - complexity: Chapter complexity info
    - cached: Whether result was from cache
    """

@app.get("/api/chapters/{chapter_id}/analogies")
async def get_chapter_analogies(
    chapter_id: str,
    user_id: str
) -> AnalogyResponse:
    """Get cached analogies for a chapter"""

@app.get("/api/chapters/{chapter_id}/complexity")
async def get_chapter_complexity(chapter_id: str) -> ComplexityResponse:
    """Get complexity score and breakdown for a chapter"""

# Feedback endpoints
@app.post("/api/analogies/{analogy_id}/feedback")
async def submit_analogy_feedback(
    analogy_id: str,
    feedback: FeedbackRequest
) -> FeedbackResponse:
    """
    Submit feedback on an analogy
    
    Body:
    - user_id: User submitting feedback
    - rating: 1-5 star rating
    - comment: Optional text comment
    """

@app.get("/api/analogies/{analogy_id}/feedback")
async def get_analogy_feedback(analogy_id: str) -> FeedbackSummary:
    """Get aggregated feedback for an analogy"""
```

#### Request/Response Models

```python
class UpdateProfileRequest(BaseModel):
    name: Optional[str]
    interests: Optional[List[str]]
    learning_style: Optional[str]
    background: Optional[str]
    education_level: Optional[str]

class AnalogyGenerationResponse(BaseModel):
    analogies: List[Analogy]
    memory_techniques: List[MemoryTechnique]
    learning_mantras: List[LearningMantra]
    complexity: ComplexityInfo
    cached: bool
    generated_at: str

class Analogy(BaseModel):
    id: str
    concept: str
    analogy_text: str
    based_on_interest: str
    learning_style_adaptation: str
    average_rating: Optional[float]
    rating_count: int

class MemoryTechnique(BaseModel):
    id: str
    technique_type: str
    technique_text: str
    application: str

class LearningMantra(BaseModel):
    id: str
    mantra_text: str
    explanation: str

class ComplexityInfo(BaseModel):
    score: float
    level: str  # "beginner", "intermediate", "advanced"
    concept_count: int
    estimated_study_time: int  # minutes

class FeedbackRequest(BaseModel):
    user_id: str
    rating: int  # 1-5
    comment: Optional[str]

class FeedbackResponse(BaseModel):
    feedback_id: str
    message: str

class FeedbackSummary(BaseModel):
    analogy_id: str
    average_rating: float
    rating_count: int
    rating_distribution: Dict[int, int]  # {1: 2, 2: 1, 3: 5, 4: 10, 5: 15}
```

### 6. Caching Strategy

#### Cache Key Generation

```python
def generate_cache_key(chapter_id: str, user_profile: UserProfile) -> str:
    """
    Generate cache key based on chapter and user profile
    
    Key format: "analogies:{chapter_id}:{profile_hash}"
    Profile hash includes: interests, learning_style, education_level
    """
    profile_data = {
        "interests": sorted(user_profile.interests),
        "learning_style": user_profile.learning_style,
        "education_level": user_profile.education_level
    }
    profile_hash = hashlib.md5(json.dumps(profile_data).encode()).hexdigest()[:8]
    return f"analogies:{chapter_id}:{profile_hash}"
```

#### Cache Invalidation Rules

1. **Time-based**: Expire after 30 days
2. **Profile change**: Invalidate when user updates interests or learning style
3. **Low rating**: Regenerate if average rating < 2.5 with 5+ ratings
4. **Manual**: User can request regeneration (rate-limited to 10/day)

#### Cache Storage

- **Primary**: PostgreSQL `chapter_analogies` table with `expires_at` timestamp
- **Optional**: Redis for faster retrieval (if performance becomes an issue)

### 7. Frontend Components


#### Profile Editor Component

```typescript
// src/components/profile/ProfileEditor.tsx
interface ProfileEditorProps {
  profile: UserProfile;
  onSave: (updates: UpdateProfileRequest) => Promise<void>;
}

export function ProfileEditor({ profile, onSave }: ProfileEditorProps) {
  // Form with fields for:
  // - Learning style selector (visual, auditory, kinesthetic, reading-writing)
  // - Interests tag input with autocomplete
  // - Background text input
  // - Education level selector
  
  // On save, call API and invalidate analogy cache if interests/style changed
}
```

#### Analogy Display Component

```typescript
// src/components/sensa/AnalogyCard.tsx
interface AnalogyCardProps {
  analogy: Analogy;
  onRate: (rating: number, comment?: string) => Promise<void>;
}

export function AnalogyCard({ analogy, onRate }: AnalogyCardProps) {
  // Display:
  // - Concept name as header
  // - Analogy text with nice typography
  // - "Based on your interest in: {interest}" badge
  // - Star rating component
  // - Average rating display
  
  // Styling: Use Sensa Learn brand colors (warm-coral, gentle-sky, soft-sage)
}
```

#### Complexity Indicator Component

```typescript
// src/components/sensa/ComplexityIndicator.tsx
interface ComplexityIndicatorProps {
  score: number; // 0.0 - 1.0
  conceptCount: number;
  estimatedTime: number;
}

export function ComplexityIndicator({ score, conceptCount, estimatedTime }: ComplexityIndicatorProps) {
  // Display:
  // - Visual indicator (stars, color gradient, or badge)
  // - Tooltip with breakdown
  // - Estimated study time
  
  // Color mapping:
  // 0.0-0.3: soft-sage (beginner)
  // 0.3-0.6: gentle-sky (intermediate)
  // 0.6-1.0: warm-coral (advanced)
}
```

#### Updated Chapter Detail Page

```typescript
// src/pages/sensa/SensaCourseDetailPage.tsx
export function SensaCourseDetailPage() {
  const { courseId } = useParams();
  const { data: course } = useCourse(courseId);
  const { data: analogies, isLoading } = useChapterAnalogies(courseId, chapterId);
  
  // Sections:
  // 1. Chapter list with complexity indicators
  // 2. Selected chapter content
  // 3. Personalized analogies (AnalogyCard components)
  // 4. Memory techniques
  // 5. Learning mantras
  
  // Loading states: Skeleton loaders for each section
  // Error states: Friendly error with retry button
}
```

#### Custom Hooks

```typescript
// src/hooks/useChapterAnalogies.ts
export function useChapterAnalogies(courseId: string, chapterId: string) {
  return useQuery({
    queryKey: ['analogies', courseId, chapterId],
    queryFn: async () => {
      const response = await api.get(`/api/chapters/${chapterId}/analogies`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// src/hooks/useGenerateAnalogies.ts
export function useGenerateAnalogies() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chapterId, forceRegenerate }) => {
      const response = await api.post(
        `/api/chapters/${chapterId}/generate-analogies`,
        { force_regenerate: forceRegenerate }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['analogies', variables.chapterId]);
    },
  });
}

// src/hooks/useAnalogyFeedback.ts
export function useAnalogyFeedback() {
  return useMutation({
    mutationFn: async ({ analogyId, rating, comment }) => {
      const response = await api.post(
        `/api/analogies/${analogyId}/feedback`,
        { rating, comment }
      );
      return response.data;
    },
  });
}
```

## Data Models

### Core Data Structures

```python
# Python backend models
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class UserProfile:
    user_id: str
    email: str
    name: str
    interests: List[str]
    learning_style: str
    background: Optional[str]
    education_level: Optional[str]
    created_at: datetime
    updated_at: datetime

@dataclass
class ChapterContent:
    chapter_id: str
    document_id: str
    chapter_title: str
    text_content: str
    key_concepts: List[str]
    complexity_score: float
    word_count: int
    estimated_reading_time: int

@dataclass
class Analogy:
    id: str
    chapter_id: str
    user_id: str
    concept: str
    analogy_text: str
    based_on_interest: str
    learning_style_adaptation: str
    model_version: str
    average_rating: Optional[float]
    rating_count: int
    created_at: datetime

@dataclass
class MemoryTechnique:
    id: str
    chapter_id: str
    user_id: str
    technique_type: str
    technique_text: str
    application: str
    created_at: datetime

@dataclass
class LearningMantra:
    id: str
    user_id: str
    course_id: str
    mantra_text: str
    explanation: str
    created_at: datetime

@dataclass
class AnalogyFeedback:
    id: str
    analogy_id: str
    user_id: str
    rating: int
    comment: Optional[str]
    created_at: datetime
```

## Error Handling

### Error Types and Recovery

```python
class BedrockGenerationError(Exception):
    """Raised when Bedrock API call fails"""
    pass

class CacheError(Exception):
    """Raised when cache operations fail"""
    pass

class ProfileValidationError(Exception):
    """Raised when profile data is invalid"""
    pass

# Error handling strategy
async def generate_analogies_with_fallback(chapter_id: str, user_id: str):
    try:
        # Try to generate with Bedrock
        result = await bedrock_client.generate_analogies(chapter_content, user_profile)
        return result
    except BedrockGenerationError as e:
        logger.error(f"Bedrock generation failed: {e}")
        
        # Fallback 1: Try cached generic analogies
        cached = await get_generic_analogies(chapter_id)
        if cached:
            return cached
        
        # Fallback 2: Return empty state with error message
        return {
            "analogies": [],
            "error": "Unable to generate analogies. Please try again later.",
            "retry_available": True
        }
```

### Frontend Error States

```typescript
// Error display component
function AnalogyErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <p className="text-red-600 dark:text-red-400 mb-4">
        {error.message || "Failed to load analogies"}
      </p>
      <Button onClick={onRetry} variant="primary">
        Try Again
      </Button>
    </div>
  );
}
```

## Testing Strategy


### Unit Tests

```python
# test_bedrock_client.py
def test_construct_prompt():
    """Test prompt construction with user profile"""
    client = BedrockAnalogyGenerator()
    prompt = client._construct_prompt(chapter_content, user_profile, 3)
    assert "cooking" in prompt  # User's interest
    assert "visual" in prompt   # Learning style
    
def test_parse_response():
    """Test response parsing and validation"""
    client = BedrockAnalogyGenerator()
    mock_response = {...}
    result = client._parse_response(mock_response)
    assert len(result.analogies) == 3
    assert all(a.concept for a in result.analogies)

# test_content_analyzer.py
def test_calculate_complexity():
    """Test complexity score calculation"""
    analyzer = ChapterContentAnalyzer()
    score = analyzer.calculate_complexity_score(chapter_content)
    assert 0.0 <= score <= 1.0

def test_extract_key_concepts():
    """Test concept extraction and ranking"""
    analyzer = ChapterContentAnalyzer()
    concepts = analyzer.get_key_concepts(chapter_id, limit=5)
    assert len(concepts) <= 5
    assert concepts[0].score >= concepts[-1].score  # Sorted by score
```

### Integration Tests

```python
# test_analogy_api.py
@pytest.mark.asyncio
async def test_generate_analogies_endpoint():
    """Test full analogy generation flow"""
    response = await client.post(
        f"/api/chapters/{chapter_id}/generate-analogies",
        params={"user_id": user_id}
    )
    assert response.status_code == 200
    data = response.json()
    assert "analogies" in data
    assert len(data["analogies"]) > 0

@pytest.mark.asyncio
async def test_caching_behavior():
    """Test that second request uses cache"""
    # First request
    response1 = await client.post(f"/api/chapters/{chapter_id}/generate-analogies")
    
    # Second request (should be cached)
    response2 = await client.post(f"/api/chapters/{chapter_id}/generate-analogies")
    
    assert response2.json()["cached"] == True
```

### End-to-End Tests

```typescript
// e2e/analogy-generation.spec.ts
describe('Analogy Generation', () => {
  it('should generate and display analogies for a chapter', async () => {
    // Navigate to chapter detail page
    await page.goto(`/sensa/courses/${courseId}`);
    
    // Wait for analogies to load
    await page.waitForSelector('[data-testid="analogy-card"]');
    
    // Verify analogies are displayed
    const analogies = await page.$$('[data-testid="analogy-card"]');
    expect(analogies.length).toBeGreaterThan(0);
    
    // Verify complexity indicator
    const complexity = await page.$('[data-testid="complexity-indicator"]');
    expect(complexity).toBeTruthy();
  });
  
  it('should allow rating an analogy', async () => {
    // Click on 4-star rating
    await page.click('[data-testid="star-rating-4"]');
    
    // Verify feedback submitted
    await page.waitForSelector('[data-testid="rating-success"]');
  });
});
```

### Performance Tests

```python
# test_performance.py
def test_analogy_generation_time():
    """Test that analogy generation completes within acceptable time"""
    start = time.time()
    result = await generate_analogies(chapter_id, user_id)
    duration = time.time() - start
    
    assert duration < 10.0  # Should complete within 10 seconds

def test_cache_retrieval_time():
    """Test that cached retrieval is fast"""
    # Generate and cache
    await generate_analogies(chapter_id, user_id)
    
    # Retrieve from cache
    start = time.time()
    result = await get_cached_analogies(chapter_id, user_id)
    duration = time.time() - start
    
    assert duration < 0.5  # Should retrieve within 500ms
```

## Cost Monitoring and Optimization

### Cost Tracking

```python
class CostTracker:
    """Track AWS Bedrock costs"""
    
    def log_bedrock_call(
        self,
        model_id: str,
        prompt_tokens: int,
        completion_tokens: int,
        user_id: str,
        chapter_id: str
    ):
        """Log Bedrock API call for cost tracking"""
        # Claude 3.5 Sonnet pricing (as of 2024)
        # Input: $3.00 per million tokens
        # Output: $15.00 per million tokens
        
        input_cost = (prompt_tokens / 1_000_000) * 3.00
        output_cost = (completion_tokens / 1_000_000) * 15.00
        total_cost = input_cost + output_cost
        
        # Store in cost_tracking table
        db.execute("""
            INSERT INTO cost_tracking (
                service_name, operation, estimated_cost_usd,
                units_consumed, document_id, created_at
            ) VALUES (
                'bedrock', 'generate_analogies', %s, %s, %s, NOW()
            )
        """, (total_cost, prompt_tokens + completion_tokens, chapter_id))
        
        # Check daily threshold
        daily_cost = self.get_daily_cost()
        if daily_cost > 50.0:  # $50 threshold
            self.send_cost_alert(daily_cost)
    
    def get_daily_cost(self) -> float:
        """Get total Bedrock cost for today"""
        result = db.execute("""
            SELECT SUM(estimated_cost_usd)
            FROM cost_tracking
            WHERE service_name = 'bedrock'
            AND created_at >= CURRENT_DATE
        """)
        return result[0][0] or 0.0
```

### Rate Limiting

```python
class RateLimiter:
    """Rate limit analogy generation per user"""
    
    def check_user_limit(self, user_id: str) -> bool:
        """Check if user has exceeded daily generation limit"""
        count = db.execute("""
            SELECT COUNT(*)
            FROM chapter_analogies
            WHERE user_id = %s
            AND created_at >= CURRENT_DATE
        """, (user_id,))
        
        return count[0][0] < 10  # 10 generations per day
    
    def get_reset_time(self) -> datetime:
        """Get time when rate limit resets"""
        tomorrow = datetime.now().date() + timedelta(days=1)
        return datetime.combine(tomorrow, datetime.min.time())
```

### Prompt Optimization

```python
# Optimize prompt length to reduce token usage
def optimize_chapter_summary(text: str, max_words: int = 500) -> str:
    """Summarize chapter content to reduce prompt tokens"""
    # Use extractive summarization
    # Keep only most important sentences
    # Target: 500 words max for context
    
def select_top_concepts(concepts: List[Concept], max_concepts: int = 7) -> List[Concept]:
    """Select only top N concepts to reduce prompt size"""
    return sorted(concepts, key=lambda c: c.score, reverse=True)[:max_concepts]
```

## Security Considerations

### API Authentication

```python
# Require authentication for all analogy endpoints
@app.post("/api/chapters/{chapter_id}/generate-analogies")
@require_auth
async def generate_chapter_analogies(
    chapter_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify user has access to this chapter's course
    if not await user_has_course_access(current_user.id, chapter_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate analogies
    ...
```

### Input Validation

```python
# Validate all user inputs
class UpdateProfileRequest(BaseModel):
    interests: Optional[List[str]] = Field(max_items=20)  # Max 20 interests
    learning_style: Optional[str] = Field(regex="^(visual|auditory|kinesthetic|reading-writing)$")
    background: Optional[str] = Field(max_length=500)  # Max 500 chars
    
# Sanitize text inputs to prevent injection
def sanitize_text(text: str) -> str:
    """Remove potentially harmful content from text"""
    # Remove HTML tags
    # Escape special characters
    # Limit length
    return bleach.clean(text, strip=True)
```

### Data Privacy

```python
# Ensure user data privacy
# - Don't share analogies between users (unless explicitly shared)
# - Anonymize feedback data for analytics
# - Allow users to delete their generated content

@app.delete("/api/users/{user_id}/analogies")
@require_auth
async def delete_user_analogies(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete all analogies generated for a user"""
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.execute("""
        DELETE FROM chapter_analogies WHERE user_id = %s
    """, (user_id,))
    
    return {"message": "Analogies deleted successfully"}
```

## Deployment Strategy

### Phase 1: Backend Infrastructure (Week 1)
1. Add Bedrock permissions to ECS task role
2. Deploy database migrations
3. Implement Bedrock client and content analyzer
4. Deploy API endpoints
5. Set up cost monitoring and alerts

### Phase 2: Frontend Integration (Week 2)
1. Update profile editor with new fields
2. Create analogy display components
3. Implement complexity indicators
4. Update chapter detail page
5. Add loading and error states

### Phase 3: Testing and Optimization (Week 3)
1. Run integration tests
2. Perform load testing
3. Optimize prompt templates
4. Fine-tune caching strategy
5. Monitor costs and adjust limits

### Phase 4: Launch and Iteration (Week 4)
1. Soft launch to beta users
2. Collect feedback
3. Monitor performance and costs
4. Iterate on prompt quality
5. Full launch

## Monitoring and Observability

### Key Metrics

```python
# Metrics to track
METRICS = {
    "analogy_generation_time": "Time to generate analogies (seconds)",
    "bedrock_api_latency": "Bedrock API response time (ms)",
    "cache_hit_rate": "Percentage of requests served from cache",
    "average_rating": "Average user rating for analogies",
    "daily_cost": "Daily Bedrock API cost (USD)",
    "generation_errors": "Number of failed generation attempts",
    "user_regeneration_rate": "How often users request regeneration"
}
```

### Logging

```python
import logging
import structlog

logger = structlog.get_logger()

# Log all Bedrock calls
logger.info(
    "bedrock_call",
    chapter_id=chapter_id,
    user_id=user_id,
    model_id=model_id,
    prompt_tokens=prompt_tokens,
    completion_tokens=completion_tokens,
    cost_usd=cost,
    duration_seconds=duration
)

# Log cache hits/misses
logger.info(
    "cache_lookup",
    chapter_id=chapter_id,
    cache_key=cache_key,
    hit=True/False
)

# Log user feedback
logger.info(
    "analogy_feedback",
    analogy_id=analogy_id,
    user_id=user_id,
    rating=rating,
    has_comment=bool(comment)
)
```

### Alerts

```python
# CloudWatch alarms
ALARMS = [
    {
        "name": "HighBedrockCost",
        "metric": "daily_bedrock_cost",
        "threshold": 50.0,  # $50/day
        "action": "send_email_to_admin"
    },
    {
        "name": "HighErrorRate",
        "metric": "generation_error_rate",
        "threshold": 0.05,  # 5% error rate
        "action": "send_slack_alert"
    },
    {
        "name": "LowCacheHitRate",
        "metric": "cache_hit_rate",
        "threshold": 0.70,  # Below 70%
        "action": "investigate_cache_strategy"
    }
]
```

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Multi-language Support**: Generate analogies in different languages
2. **Voice Analogies**: Text-to-speech for auditory learners
3. **Visual Analogies**: Generate diagrams and illustrations for visual learners
4. **Collaborative Analogies**: Allow users to share and rate each other's analogies
5. **Adaptive Learning**: Adjust complexity based on user performance
6. **Analogy Chains**: Link related analogies across chapters
7. **Quiz Generation**: Create practice questions based on analogies
8. **Progress Tracking**: Track which analogies helped users most

### Technical Improvements

1. **Redis Caching**: Add Redis layer for faster cache retrieval
2. **Async Processing**: Move generation to background jobs for better UX
3. **A/B Testing**: Test different prompt templates and models
4. **Personalization ML**: Use ML to predict which analogy types work best per user
5. **Batch Generation**: Generate analogies for all chapters at once
6. **Streaming Responses**: Stream Bedrock responses for faster perceived performance

## Conclusion

This design provides a comprehensive, production-ready approach to implementing AI-powered analogy generation in Sensa Learn. The architecture is scalable, cost-effective, and user-centric, with robust error handling, caching, and monitoring. The phased deployment strategy allows for iterative improvement based on real user feedback while maintaining system stability and cost control.
