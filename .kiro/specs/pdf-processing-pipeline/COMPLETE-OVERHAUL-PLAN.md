# Complete UI Overhaul - Implementation Plan

**Status**: In Progress  
**Goal**: Replace old Sensa Learn UI with new Two-View Learning System

---

## ✅ What's Been Created

### Services & Hooks
- ✅ `src/services/sensaApi.ts` - Complete API service layer
- ✅ `src/hooks/useSensaProfile.ts` - Profile management hook
- ✅ `src/hooks/useSensaAnalogies.ts` - Analogy management hook

### Components (Phase 6)
- ✅ ViewSwitcher
- ✅ SensaLearnMap
- ✅ AnalogyNode
- ✅ ConnectionLine
- ✅ QuestionForm
- ✅ QuestionCard
- ✅ AnalogyForm
- ✅ AnalogyList
- ✅ SuggestionCard
- ✅ AnalogyySuggestionPanel
- ✅ ProfileOnboarding

---

## 🔄 What Needs to Be Done

### Step 1: Create New Concept Map Page
**File**: `src/pages/conceptMap/ConceptMapPage.tsx`

```typescript
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ViewSwitcher } from '@/components/sensa/ViewSwitcher';
import { ConceptMapVisualization } from '@/components/conceptMap/ConceptMapVisualization';
import { SensaLearnMap } from '@/components/sensa/SensaLearnMap';
import { useSensaAnalogies } from '@/hooks/useSensaAnalogies';

export const ConceptMapPage = () => {
  const { documentId } = useParams();
  const [view, setView] = useState<'pbl' | 'sensa'>('pbl');
  const userId = 'user-123'; // Get from auth context
  
  const { analogies } = useSensaAnalogies(userId, documentId);
  
  // Mock concept map data - replace with real data
  const conceptMap = {
    chapters: [
      {
        chapter_number: 1,
        title: 'Introduction',
        keywords: [
          {
            term: 'Database',
            definition: 'A structured collection of data',
            is_primary: true,
            structure_type: 'hierarchical',
          },
        ],
        relationships: [],
      },
    ],
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">
            {view === 'pbl' ? 'PBL View' : 'Sensa Learn View'}
          </h1>
          <ViewSwitcher currentView={view} onViewChange={setView} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'pbl' ? (
          <ConceptMapVisualization
            conceptMap={conceptMap}
            showExamRelevanceFilter={true}
          />
        ) : (
          <SensaLearnMap
            conceptMap={conceptMap}
            analogies={analogies}
            mode="overlay"
          />
        )}
      </div>
    </div>
  );
};
```

### Step 2: Completely Rewrite SensaCourseDetailPage
**File**: `src/pages/sensa/SensaCourseDetailPage.tsx`

Replace entire file with:

```typescript
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { ProfileOnboarding } from '@/components/sensa/ProfileOnboarding';
import { QuestionForm } from '@/components/sensa/QuestionForm';
import { AnalogyList } from '@/components/sensa/AnalogyList';
import { AnalogyySuggestionPanel } from '@/components/sensa/AnalogyySuggestionPanel';
import { useSensaProfile } from '@/hooks/useSensaProfile';
import { useSensaAnalogies } from '@/hooks/useSensaAnalogies';
import { sensaApi } from '@/services/sensaApi';

export function SensaCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const userId = 'user-123'; // Get from auth
  
  const { profile, loading: profileLoading } = useSensaProfile(userId);
  const { analogies, createAnalogy, updateAnalogy, deleteAnalogy } = useSensaAnalogies(userId, courseId);
  
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if profile is complete
  React.useEffect(() => {
    if (!profileLoading && (!profile || !profile.background)) {
      setShowOnboarding(true);
    }
  }, [profile, profileLoading]);

  // Load questions when concept selected
  React.useEffect(() => {
    if (selectedConcept) {
      loadQuestionsAndSuggestions();
    }
  }, [selectedConcept]);

  const loadQuestionsAndSuggestions = async () => {
    if (!selectedConcept) return;
    
    try {
      // Load suggestions first
      const suggestionsData = await sensaApi.getSuggestions(userId, selectedConcept.id);
      setSuggestions(suggestionsData.suggestions);
      
      // Load questions
      const questionsData = await sensaApi.generateQuestions(selectedConcept.id, userId);
      setQuestions(questionsData.questions);
    } catch (error) {
      console.error('Failed to load questions/suggestions:', error);
    }
  };

  const handleCreateAnalogy = async (answers) => {
    if (!selectedConcept) return;
    
    try {
      await createAnalogy({
        concept_id: selectedConcept.id,
        user_experience_text: answers[0].answer_text,
        strength: 4.0,
        type: 'experience',
        reusable: true,
      });
      
      // Clear selection
      setSelectedConcept(null);
      setQuestions([]);
      setSuggestions([]);
    } catch (error) {
      console.error('Failed to create analogy:', error);
    }
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen p-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <ProfileOnboarding
            onComplete={() => setShowOnboarding(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Button
          onClick={() => navigate('/sensa')}
          variant="ghost"
          leftIcon={<ArrowLeft size={20} />}
          className="mb-6"
        >
          Back to Sensa Learn
        </Button>

        <h1 className="text-4xl font-bold text-warm-coral mb-8">
          Your Learning Journey
        </h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-500">
              Create Analogies
            </button>
            <button className="border-transparent py-4 px-1 text-sm font-medium text-gray-400">
              My Analogies
            </button>
            <button 
              onClick={() => navigate(`/concept-map/${courseId}`)}
              className="border-transparent py-4 px-1 text-sm font-medium text-gray-400"
            >
              Concept Map
            </button>
          </nav>
        </div>

        {/* Concept Selection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select a Concept</h2>
          {/* Mock concepts - replace with real data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Database', 'Algorithm', 'Data Structure'].map((concept) => (
              <button
                key={concept}
                onClick={() => setSelectedConcept({ id: concept.toLowerCase(), name: concept })}
                className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
              >
                <h3 className="font-semibold">{concept}</h3>
              </button>
            ))}
          </div>
        </div>

        {/* Question Form (when concept selected) */}
        {selectedConcept && (
          <div className="space-y-6">
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <AnalogyySuggestionPanel
                suggestions={suggestions}
                onApply={async (id) => {
                  await sensaApi.applySuggestion(id);
                  setSelectedConcept(null);
                }}
                onDismiss={(id) => {
                  setSuggestions(prev => prev.filter(s => s.analogy_id !== id));
                }}
              />
            )}

            {/* Questions */}
            {questions.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <QuestionForm
                  questions={questions}
                  conceptName={selectedConcept.name}
                  onSubmit={handleCreateAnalogy}
                  onSkip={() => setSelectedConcept(null)}
                />
              </div>
            )}
          </div>
        )}

        {/* Analogy List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">My Analogies</h2>
          <AnalogyList
            analogies={analogies}
            onEdit={(analogy) => {
              // Handle edit
            }}
            onDelete={deleteAnalogy}
            onStrengthen={(id, strength) => updateAnalogy(id, { strength })}
          />
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Update App.tsx Routes

Add new route:

```typescript
import { ConceptMapPage } from '@/pages/conceptMap/ConceptMapPage';

// In routes:
<Route path="/concept-map/:documentId" element={<ConceptMapPage />} />
```

### Step 4: Update SensaDashboardPage

Add link to concept map:

```typescript
<Button
  onClick={() => navigate(`/concept-map/${course.id}`)}
  variant="primary"
>
  View Concept Map
</Button>
```

---

## 🧪 Testing with Mock Data

Until backend is connected, use this mock data:

```typescript
// Mock concept map
const mockConceptMap = {
  chapters: [
    {
      chapter_number: 1,
      title: 'Introduction to Databases',
      keywords: [
        {
          term: 'Database',
          definition: 'A structured collection of data',
          is_primary: true,
          structure_type: 'hierarchical',
        },
        {
          term: 'Query',
          definition: 'A request for data from a database',
          is_primary: true,
          structure_type: 'sequential',
        },
      ],
      relationships: [
        {
          source: 'Database',
          target: 'Query',
          type: 'enables',
          structure_category: 'sequential',
        },
      ],
    },
  ],
  global_relationships: [],
};

// Mock analogies
const mockAnalogies = [
  {
    id: '1',
    concept_id: 'database',
    user_experience_text: 'Like organizing my bookshelf by genre and author',
    connection_explanation: 'Both involve categorizing and structuring information for easy retrieval',
    strength: 4.5,
    tags: ['organization', 'books'],
    type: 'experience',
    reusable: true,
    created_at: new Date().toISOString(),
  },
];
```

---

## 📋 Implementation Checklist

- [ ] Create ConceptMapPage.tsx
- [ ] Rewrite SensaCourseDetailPage.tsx
- [ ] Add route to App.tsx
- [ ] Update SensaDashboardPage with concept map link
- [ ] Test with mock data
- [ ] Connect to backend APIs
- [ ] Test end-to-end flow
- [ ] Deploy

---

## 🚀 Quick Start

1. Create the 3 files above
2. Test with mock data
3. Verify ViewSwitcher works
4. Verify analogy creation flow
5. Connect to real backend
6. Done!

---

**All components are ready - just need to wire them into pages!**
