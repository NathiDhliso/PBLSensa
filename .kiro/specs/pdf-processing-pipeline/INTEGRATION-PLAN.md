# Integration Plan: Two-View Learning System

## Executive Summary

This document outlines how to integrate the Two-View Learning System with your existing exam-focused PBL implementation **without breaking what already works**.

**Strategy**: **Option A - Extend Your Existing System**

- Keep your current pipeline as the foundation
- Add structure classification layer
- Build Sensa Learn as a complementary service
- Create view switcher in frontend

**Timeline**: 8-10 weeks  
**Risk**: Low (preserves existing functionality)

---

## What You Already Have (Keep As-Is)

### ✅ Infrastructure (100% Reusable)
- Layer 0: PDF validation, hashing, S3 upload
- Layer 1: Redis caching, SQS queues, Fargate workers
- Layer 2: LlamaParse parsing (or Textract fallback)
- Layer 3: SageMaker embeddings (HDT-E model)
- Layer 6-7: S3, RDS with pgvector, Cognito auth
- Layer 8: FastAPI on Fargate, API Gateway
- Monitoring: CloudWatch, X-Ray, alarms

### ✅ Frontend Components (Reusable with Modifications)
- Course management
- Document upload
- Concept map visualization (D3.js)
- Processing status page
- User authentication

### ✅ Database Schema (Extend, Don't Replace)
- `processed_documents` table
- `keywords` table (will become `concepts`)
- `relationships` table (add columns)
- `user_annotations` table (for feedback)

---

## What Needs to Change

### 🔧 Modifications to Existing Code

#### 1. Rename "Keywords" to "Concepts"

**Why**: Two-View uses "concepts" terminology, and they're more than just keywords

**Changes**:
```sql
-- Migration: Rename table
ALTER TABLE keywords RENAME TO concepts;

-- Add new columns
ALTER TABLE concepts 
  ADD COLUMN source_sentences TEXT[],
  ADD COLUMN surrounding_concepts TEXT[],
  ADD COLUMN structure_type TEXT CHECK (structure_type IN ('hierarchical', 'sequential', 'unclassified'));
```

**Code Updates**:
```python
# backend/services/keyword_extractor.py → concept_extractor.py
class ConceptExtractor:  # Renamed from KeywordExtractor
    async def extract_concepts(self, chapter: Chapter) -> List[Concept]:
        # Keep your existing extraction logic
        # Add: source_sentences, surrounding_concepts
        pass
```

#### 2. Enhance Relationships Table

**Add structure classification**:
```sql
ALTER TABLE relationships 
  ADD COLUMN structure_category TEXT CHECK (structure_category IN ('hierarchical', 'sequential', 'unclassified')),
  ADD COLUMN relationship_type TEXT;  -- 'is_a', 'precedes', 'has_component', etc.
```

#### 3. Add Structure Classifier to Layer 5

**New service** (doesn't replace existing RAG):
```python
# backend/services/structure_classifier.py
class StructureClassifier:
    """
    Takes your existing concepts and relationships,
    classifies them as hierarchical or sequential
    """
    
    async def classify_relationships(
        self,
        concepts: List[Concept],
        relationships: List[Relationship]
    ) -> List[Relationship]:
        """
        For each relationship, determine:
        1. Is it hierarchical (is_a, has_component, contains)?
        2. Is it sequential (precedes, enables, results_in)?
        3. What's the specific type?
        """
        
        classified = []
        for rel in relationships:
            # Pattern matching
            pattern_type = self._match_patterns(rel)
            
            # Claude validation (reuse your existing Bedrock client)
            validated = await self._claude_classify(rel, pattern_type)
            
            rel.structure_category = validated.category
            rel.relationship_type = validated.type
            classified.append(rel)
        
        return classified
```

**Integration point** (add to existing pipeline):
```python
# backend/services/pbl_pipeline.py (your existing file)
class PBLPipeline:
    async def process_document(self, document_id: str):
        # ... your existing steps ...
        
        # Step 4: Extract keywords (keep as-is)
        keywords = await self.keyword_extractor.extract(chapters)
        
        # Step 5: Detect relationships (keep as-is)
        relationships = await self.relationship_detector.detect(keywords)
        
        # NEW Step 5.5: Classify structures
        classified_rels = await self.structure_classifier.classify_relationships(
            concepts=keywords,  # Will be renamed to concepts
            relationships=relationships
        )
        
        # Step 6: Generate concept map (keep as-is, but now has structure data)
        concept_map = await self.generate_map(keywords, classified_rels)
        
        return concept_map
```

---

## What Needs to Be Built (New)

### 🆕 Sensa Learn Service Stack

#### Phase 1: User Profile System (Week 1-2)

**New Tables**:
```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    background_json JSONB,
    interests_json JSONB,
    experiences_json JSONB,
    learning_style_json JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**New Service**:
```python
# backend/services/sensa/user_profile_service.py
class UserProfileService:
    async def get_profile(self, user_id: str) -> UserProfile:
        pass
    
    async def update_profile(self, user_id: str, updates: dict) -> UserProfile:
        pass
    
    async def initialize_onboarding(self, user_id: str) -> OnboardingQuestions:
        pass
```

**New API Endpoints**:
```python
# backend/routers/sensa_profile.py
@router.get("/api/sensa/users/{user_id}/profile")
async def get_profile(user_id: str):
    pass

@router.put("/api/sensa/users/{user_id}/profile")
async def update_profile(user_id: str, updates: UpdateProfileRequest):
    pass
```

**New Frontend Components**:
```typescript
// src/components/sensa/ProfileOnboarding.tsx
// src/components/sensa/ProfileEditForm.tsx (enhance existing)
```

---

#### Phase 2: Dynamic Question Generator (Week 3-4)

**New Tables**:
```sql
CREATE TABLE generated_questions (
    id UUID PRIMARY KEY,
    concept_id UUID REFERENCES concepts(id),
    user_id UUID REFERENCES users(id),
    question_text TEXT NOT NULL,
    question_type TEXT,
    answered BOOLEAN DEFAULT false,
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**New Service**:
```python
# backend/services/sensa/question_generator.py
class AnalogyQuestionGenerator:
    async def generate_questions(
        self,
        concept: Concept,
        user_profile: UserProfile,
        max_questions: int = 3
    ) -> List[Question]:
        """
        Generate personalized questions based on:
        1. Concept's structure_type (hierarchical vs sequential)
        2. User's profile (interests, experiences)
        3. Past successful analogies
        """
        
        # Analyze concept
        concept_traits = self._analyze_concept(concept)
        
        # Match to user domains
        relevant_domains = self._match_to_user_domains(
            concept_traits,
            user_profile
        )
        
        # Generate with Claude (reuse your Bedrock client)
        questions = await self._claude_generate_questions(
            concept=concept,
            user_profile=user_profile,
            domains=relevant_domains
        )
        
        return questions
```

**New API Endpoints**:
```python
# backend/routers/sensa_questions.py
@router.post("/api/sensa/questions/generate")
async def generate_questions(request: GenerateQuestionsRequest):
    pass
```

**New Frontend Components**:
```typescript
// src/components/sensa/QuestionForm.tsx
// src/components/sensa/QuestionCard.tsx
```

---

#### Phase 3: Analogy Storage & Management (Week 5-6)

**New Tables**:
```sql
CREATE TABLE analogies (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    concept_id UUID REFERENCES concepts(id),
    user_experience_text TEXT NOT NULL,
    connection_explanation TEXT,
    strength FLOAT CHECK (strength BETWEEN 1 AND 5),
    type TEXT CHECK (type IN ('metaphor', 'experience', 'scenario', 'emotion')),
    reusable BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);

CREATE TABLE concept_analogy_connections (
    id UUID PRIMARY KEY,
    concept_id UUID REFERENCES concepts(id),
    analogy_id UUID REFERENCES analogies(id),
    strength FLOAT CHECK (strength BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(concept_id, analogy_id)
);
```

**New Service**:
```python
# backend/services/sensa/analogy_service.py
class AnalogyService:
    async def create_analogy(
        self,
        user_id: str,
        concept_id: str,
        experience_text: str,
        strength: float
    ) -> Analogy:
        # Auto-generate connection explanation with Claude
        connection = await self._generate_connection_explanation(
            concept_id,
            experience_text
        )
        
        # Auto-tag
        tags = await self._auto_tag(experience_text)
        
        # Save
        analogy = Analogy(...)
        await self._save(analogy)
        
        return analogy
    
    async def get_analogies(
        self,
        user_id: str,
        document_id: Optional[str] = None,
        reusable_only: bool = False
    ) -> List[Analogy]:
        pass
    
    async def update_analogy(
        self,
        analogy_id: str,
        updates: dict
    ) -> Analogy:
        pass
    
    async def delete_analogy(self, analogy_id: str):
        pass
```

**New API Endpoints**:
```python
# backend/routers/sensa_analogies.py
@router.post("/api/sensa/analogies")
async def create_analogy(request: CreateAnalogyRequest):
    pass

@router.get("/api/sensa/analogies")
async def get_analogies(
    user_id: str,
    document_id: Optional[str] = None,
    reusable: bool = False
):
    pass

@router.put("/api/sensa/analogies/{analogy_id}")
async def update_analogy(analogy_id: str, updates: UpdateAnalogyRequest):
    pass

@router.delete("/api/sensa/analogies/{analogy_id}")
async def delete_analogy(analogy_id: str):
    pass
```

**New Frontend Components**:
```typescript
// src/components/sensa/AnalogyForm.tsx
// src/components/sensa/AnalogyCard.tsx (enhance existing)
// src/components/sensa/AnalogyList.tsx
```

---

#### Phase 4: Cross-Document Learning (Week 7)

**New Service**:
```python
# backend/services/sensa/cross_document_learning.py
class CrossDocumentLearningService:
    async def suggest_analogies_for_new_concept(
        self,
        user_id: str,
        new_concept: Concept
    ) -> List[AnalogyySuggestion]:
        """
        Find reusable analogies from past documents
        that might apply to this new concept
        """
        
        # 1. Find similar past concepts (using pgvector)
        similar_concepts = await self._find_similar_concepts(
            user_id,
            new_concept
        )
        
        # 2. Get their analogies
        past_analogies = []
        for concept in similar_concepts:
            analogies = await self.analogy_service.get_by_concept(concept.id)
            past_analogies.extend(analogies)
        
        # 3. Rank by relevance
        ranked = self._rank_analogies(new_concept, past_analogies)
        
        # 4. Format suggestions
        suggestions = [
            AnalogyySuggestion(
                analogy=analogy,
                similarity_score=score,
                suggestion_text=f"You previously compared {analogy.concept.term} to {analogy.tags[0]}—might that help here?"
            )
            for analogy, score in ranked[:3]
        ]
        
        return suggestions
```

**New API Endpoints**:
```python
# backend/routers/sensa_learning.py
@router.get("/api/sensa/analogies/suggest")
async def suggest_analogies(user_id: str, concept_id: str):
    pass
```

**New Frontend Components**:
```typescript
// src/components/sensa/AnalogyySuggestionPanel.tsx
// src/components/sensa/SuggestionCard.tsx
```

---

#### Phase 5: Dual-Mode Visualization (Week 8-10)

**Enhance Existing Concept Map**:
```typescript
// src/components/conceptMap/ConceptMapVisualization.tsx (modify existing)

interface ConceptMapProps {
  mode: 'pbl' | 'sensa_learn';  // NEW
  documentId: string;
  userId?: string;  // Required for sensa_learn mode
}

const ConceptMapVisualization: React.FC<ConceptMapProps> = ({
  mode,
  documentId,
  userId
}) => {
  if (mode === 'pbl') {
    // Your existing visualization
    return <PBLConceptMap documentId={documentId} />;
  } else {
    // New Sensa Learn visualization
    return <SensaLearnMap documentId={documentId} userId={userId} />;
  }
};
```

**New Components**:
```typescript
// src/components/sensa/SensaLearnMap.tsx
// src/components/sensa/AnalogyNode.tsx
// src/components/sensa/ConnectionLine.tsx
// src/components/sensa/ViewSwitcher.tsx
```

**View Switcher**:
```typescript
// src/pages/conceptMap/ConceptMapPage.tsx (modify existing)

const ConceptMapPage = () => {
  const [viewMode, setViewMode] = useState<'pbl' | 'sensa_learn'>('pbl');
  
  return (
    <div>
      <ViewSwitcher 
        currentMode={viewMode}
        onModeChange={setViewMode}
      />
      
      <ConceptMapVisualization
        mode={viewMode}
        documentId={documentId}
        userId={userId}
      />
    </div>
  );
};
```

---

## Migration Strategy

### Database Migration Script

```sql
-- migration_001_two_view_integration.sql

-- 1. Rename keywords to concepts
ALTER TABLE keywords RENAME TO concepts;

-- 2. Add new columns to concepts
ALTER TABLE concepts 
  ADD COLUMN source_sentences TEXT[],
  ADD COLUMN surrounding_concepts TEXT[],
  ADD COLUMN structure_type TEXT CHECK (structure_type IN ('hierarchical', 'sequential', 'unclassified'));

-- 3. Enhance relationships
ALTER TABLE relationships 
  ADD COLUMN structure_category TEXT CHECK (structure_category IN ('hierarchical', 'sequential', 'unclassified')),
  ADD COLUMN relationship_type TEXT;

-- 4. Create Sensa Learn tables
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    background_json JSONB,
    interests_json JSONB,
    experiences_json JSONB,
    learning_style_json JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analogies (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    concept_id UUID REFERENCES concepts(id),
    user_experience_text TEXT NOT NULL,
    connection_explanation TEXT,
    strength FLOAT CHECK (strength BETWEEN 1 AND 5),
    type TEXT CHECK (type IN ('metaphor', 'experience', 'scenario', 'emotion')),
    reusable BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);

CREATE TABLE concept_analogy_connections (
    id UUID PRIMARY KEY,
    concept_id UUID REFERENCES concepts(id),
    analogy_id UUID REFERENCES analogies(id),
    strength FLOAT CHECK (strength BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(concept_id, analogy_id)
);

CREATE TABLE generated_questions (
    id UUID PRIMARY KEY,
    concept_id UUID REFERENCES concepts(id),
    user_id UUID REFERENCES users(id),
    question_text TEXT NOT NULL,
    question_type TEXT,
    answered BOOLEAN DEFAULT false,
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX idx_analogies_user ON analogies(user_id);
CREATE INDEX idx_analogies_concept ON analogies(concept_id);
CREATE INDEX idx_analogies_reusable ON analogies(user_id, reusable) WHERE reusable = true;
CREATE INDEX idx_analogies_tags ON analogies USING GIN(tags);
CREATE INDEX idx_concept_analogy_connections_concept ON concept_analogy_connections(concept_id);
CREATE INDEX idx_concept_analogy_connections_analogy ON concept_analogy_connections(analogy_id);
```

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Run database migration
- [ ] Rename keywords → concepts in code
- [ ] Add structure classifier service
- [ ] Integrate classifier into existing pipeline
- [ ] Test with existing documents

### Week 3-4: User Profiles & Questions
- [ ] Build user profile service
- [ ] Create onboarding flow
- [ ] Build question generator
- [ ] Create question UI components
- [ ] Test question generation

### Week 5-6: Analogy System
- [ ] Build analogy service
- [ ] Create analogy CRUD endpoints
- [ ] Build analogy UI components
- [ ] Test analogy creation and storage

### Week 7: Cross-Document Learning
- [ ] Build cross-document service
- [ ] Create suggestion endpoints
- [ ] Build suggestion UI
- [ ] Test with multiple documents

### Week 8-10: Visualization
- [ ] Enhance concept map for dual-mode
- [ ] Build Sensa Learn visualization
- [ ] Create view switcher
- [ ] Polish and test

---

## Testing Strategy

### Unit Tests
- Structure classifier accuracy
- Question generation quality
- Analogy matching algorithm
- Cross-document similarity search

### Integration Tests
- End-to-end PBL pipeline (existing + new classifier)
- End-to-end Sensa Learn flow (profile → questions → analogies)
- Cross-document analogy suggestions
- Dual-mode visualization switching

### User Acceptance Tests
- Upload document → see both PBL and Sensa Learn views
- Create analogies → see them persist across documents
- Switch between views → data consistency

---

## Rollout Plan

### Phase 1: Internal Testing (Week 11)
- Deploy to staging environment
- Test with sample documents
- Gather internal feedback

### Phase 2: Beta Users (Week 12)
- Invite 10-20 beta users
- Monitor usage and errors
- Collect feedback on question quality

### Phase 3: General Availability (Week 13+)
- Deploy to production
- Monitor performance
- Iterate based on user feedback

---

## Success Metrics

### Technical Metrics
- Structure classification accuracy > 85%
- Question generation time < 3 seconds
- Analogy suggestion relevance > 70%
- Visualization render time < 1 second

### User Metrics
- % of users who complete onboarding
- Average analogies created per document
- % of analogies marked as reusable
- Cross-document suggestion acceptance rate

---

## Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**: 
- Keep existing code paths intact
- Add new features as optional layers
- Comprehensive regression testing

### Risk 2: Poor Question Quality
**Mitigation**:
- Curated fallback questions for new users
- A/B test different prompt templates
- User feedback loop for question improvement

### Risk 3: Performance Degradation
**Mitigation**:
- Async processing for question generation
- Cache generated questions
- Optimize database queries with proper indexes

---

## Conclusion

This integration plan allows you to:
1. ✅ Keep your existing exam-focused PBL system working
2. ✅ Add Two-View Learning capabilities incrementally
3. ✅ Minimize risk by extending rather than replacing
4. ✅ Deliver value in phases (8-10 weeks total)

**Next Step**: Review this plan and confirm approach, then I'll create detailed implementation tasks.
