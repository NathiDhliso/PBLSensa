# UI Integration Guide - Connecting Phase 6 Components

**Issue**: Phase 6 components are created but not integrated into existing pages  
**Solution**: This guide shows how to integrate the new Two-View system into the current UI

---

## Current State vs. Desired State

### Current State (What You're Seeing)
- Sensa Learn dashboard shows old UI (Smart Analogies, Memory Techniques, Learning Mantras)
- Concept Map page doesn't have ViewSwitcher
- No structure-aware styling visible
- No way to create analogies through questions

### Desired State (Two-View System)
- ViewSwitcher to toggle between PBL and Sensa Learn views
- Structure-aware concept map (blue/green borders)
- Question-based analogy creation
- Cross-document suggestions
- Dual-node visualization

---

## Integration Steps

### Step 1: Update Concept Map Page to Include ViewSwitcher

**File**: `src/pages/conceptMap/ConceptMapPage.tsx` (needs to be created or updated)

```typescript
import React, { useState } from 'react';
import { ViewSwitcher } from '@/components/sensa/ViewSwitcher';
import { ConceptMapVisualization } from '@/components/conceptMap/ConceptMapVisualization';
import { SensaLearnMap } from '@/components/sensa/SensaLearnMap';
import { useConceptMap } from '@/hooks/useConceptMap';
import { useAnalogies } from '@/hooks/useAnalogies';

export const ConceptMapPage: React.FC = () => {
  const [view, setView] = useState<'pbl' | 'sensa'>('pbl');
  const { conceptMap, loading } = useConceptMap();
  const { analogies } = useAnalogies();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with ViewSwitcher */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {view === 'pbl' ? 'PBL View' : 'Sensa Learn View'}
          </h1>
          <ViewSwitcher currentView={view} onViewChange={setView} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
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

---

### Step 2: Update Sensa Course Detail Page

**File**: `src/pages/sensa/SensaCourseDetailPage.tsx`

Replace the old cards (Smart Analogies, Memory Techniques, Learning Mantras) with the new system:

```typescript
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { QuestionForm } from '@/components/sensa/QuestionForm';
import { AnalogyList } from '@/components/sensa/AnalogyList';
import { AnalogyySuggestionPanel } from '@/components/sensa/AnalogyySuggestionPanel';
import { ProfileOnboarding } from '@/components/sensa/ProfileOnboarding';

export const SensaCourseDetailPage: React.FC = () => {
  const { courseId } = useParams();
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has completed profile
  const { profile, loading: profileLoading } = useUserProfile();
  
  React.useEffect(() => {
    if (!profileLoading && !profile?.background) {
      setShowOnboarding(true);
    }
  }, [profile, profileLoading]);

  if (showOnboarding) {
    return (
      <ProfileOnboarding
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Learning Journey</h1>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-500">
              Create Analogies
            </button>
            <button className="border-transparent py-4 px-1 text-sm font-medium text-gray-400 hover:text-gray-300">
              My Analogies
            </button>
            <button className="border-transparent py-4 px-1 text-sm font-medium text-gray-400 hover:text-gray-300">
              Concept Map
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Concept Selection */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Select a Concept</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Concept cards will go here */}
          </div>
        </div>

        {/* Question Form (when concept selected) */}
        {selectedConcept && (
          <div className="space-y-6">
            {/* Suggestions Panel */}
            <AnalogyySuggestionPanel
              suggestions={suggestions}
              onApply={handleApplySuggestion}
              onDismiss={handleDismissSuggestion}
            />

            {/* Question Form */}
            <QuestionForm
              questions={questions}
              conceptName={selectedConcept.name}
              conceptDefinition={selectedConcept.definition}
              onSubmit={handleCreateAnalogy}
            />
          </div>
        )}

        {/* Analogy List */}
        <AnalogyList
          analogies={userAnalogies}
          onEdit={handleEditAnalogy}
          onDelete={handleDeleteAnalogy}
          onStrengthen={handleStrengthenAnalogy}
        />
      </div>
    </div>
  );
};
```

---

### Step 3: Create Hooks for Data Fetching

**File**: `src/hooks/useConceptMap.ts`

```typescript
import { useState, useEffect } from 'react';
import { conceptMapApi } from '@/services/api';

export const useConceptMap = (documentId?: string) => {
  const [conceptMap, setConceptMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId) return;

    const fetchConceptMap = async () => {
      try {
        setLoading(true);
        const data = await conceptMapApi.getConceptMap(documentId);
        setConceptMap(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConceptMap();
  }, [documentId]);

  return { conceptMap, loading, error };
};
```

**File**: `src/hooks/useAnalogies.ts`

```typescript
import { useState, useEffect } from 'react';
import { sensaApi } from '@/services/api';

export const useAnalogies = (userId?: string, documentId?: string) => {
  const [analogies, setAnalogies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchAnalogies = async () => {
      try {
        setLoading(true);
        const data = await sensaApi.getAnalogies({ userId, documentId });
        setAnalogies(data.analogies);
      } catch (err) {
        console.error('Failed to fetch analogies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalogies();
  }, [userId, documentId]);

  const createAnalogy = async (analogyData) => {
    const newAnalogy = await sensaApi.createAnalogy(analogyData);
    setAnalogies(prev => [...prev, newAnalogy]);
    return newAnalogy;
  };

  const updateAnalogy = async (analogyId, updates) => {
    const updated = await sensaApi.updateAnalogy(analogyId, updates);
    setAnalogies(prev => prev.map(a => a.id === analogyId ? updated : a));
    return updated;
  };

  const deleteAnalogy = async (analogyId) => {
    await sensaApi.deleteAnalogy(analogyId);
    setAnalogies(prev => prev.filter(a => a.id !== analogyId));
  };

  return { 
    analogies, 
    loading, 
    createAnalogy, 
    updateAnalogy, 
    deleteAnalogy 
  };
};
```

---

### Step 4: Create API Service Layer

**File**: `src/services/sensaApi.ts`

```typescript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const sensaApi = {
  // Profile
  async getProfile(userId: string) {
    const response = await fetch(`${API_BASE}/api/sensa/users/${userId}/profile`);
    return response.json();
  },

  async updateProfile(userId: string, profile: any) {
    const response = await fetch(`${API_BASE}/api/sensa/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return response.json();
  },

  // Questions
  async generateQuestions(conceptId: string, userId: string, maxQuestions = 3) {
    const response = await fetch(`${API_BASE}/api/sensa/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept_id: conceptId, user_id: userId, max_questions: maxQuestions }),
    });
    return response.json();
  },

  // Analogies
  async getAnalogies(params: { userId: string; documentId?: string; reusable?: boolean }) {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE}/api/sensa/analogies?${query}`);
    return response.json();
  },

  async createAnalogy(data: any) {
    const response = await fetch(`${API_BASE}/api/sensa/analogies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateAnalogy(analogyId: string, updates: any) {
    const response = await fetch(`${API_BASE}/api/sensa/analogies/${analogyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async deleteAnalogy(analogyId: string) {
    await fetch(`${API_BASE}/api/sensa/analogies/${analogyId}`, {
      method: 'DELETE',
    });
  },

  // Suggestions
  async getSuggestions(userId: string, conceptId: string) {
    const response = await fetch(
      `${API_BASE}/api/sensa/analogies/suggest/for-concept?user_id=${userId}&concept_id=${conceptId}`
    );
    return response.json();
  },

  async applySuggestion(suggestionId: string) {
    const response = await fetch(
      `${API_BASE}/api/sensa/analogies/suggest/${suggestionId}/apply`,
      { method: 'POST' }
    );
    return response.json();
  },
};
```

---

### Step 5: Update Routing

**File**: `src/App.tsx`

Add routes for the new pages:

```typescript
import { ConceptMapPage } from '@/pages/conceptMap/ConceptMapPage';

// In your routes:
<Route path="/concept-map/:documentId" element={<ConceptMapPage />} />
<Route path="/sensa-learn/:courseId" element={<SensaCourseDetailPage />} />
```

---

## Quick Integration Checklist

To see the new UI immediately:

### Option 1: Update Existing Sensa Dashboard
1. Open `src/pages/sensa/SensaDashboardPage.tsx`
2. Replace the three cards (Smart Analogies, Memory Techniques, Learning Mantras) with:
   - ProfileOnboarding (if no profile)
   - Course list with "Create Analogies" button
   - Link to concept map with ViewSwitcher

### Option 2: Create New Route
1. Create `/sensa-learn/new` route
2. Show ProfileOnboarding first
3. Then show QuestionForm + AnalogyList
4. Add link to concept map

### Option 3: Add to Existing Concept Map
1. Find where ConceptMapVisualization is used
2. Wrap it with ViewSwitcher
3. Add SensaLearnMap as alternative view

---

## Testing the Integration

### Test 1: View Switcher
1. Navigate to concept map
2. Click ViewSwitcher
3. Should toggle between PBL and Sensa views

### Test 2: Analogy Creation
1. Go to Sensa Learn
2. Complete profile onboarding
3. Select a concept
4. Answer questions
5. Create analogy
6. See it in the list

### Test 3: Suggestions
1. Create reusable analogy in document 1
2. Upload document 2
3. Select similar concept
4. Should see suggestion panel
5. Apply suggestion

---

## Next Steps

1. **Choose integration approach** (Option 1, 2, or 3 above)
2. **Update the selected page** with new components
3. **Test with mock data** first
4. **Connect to backend APIs** once working
5. **Deploy and iterate**

---

## Mock Data for Testing

While backend isn't connected, use this mock data:

```typescript
const mockConceptMap = {
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

const mockAnalogies = [
  {
    id: '1',
    concept_id: 'concept-1',
    user_experience_text: 'Like organizing my bookshelf by genre',
    connection_explanation: 'Both involve categorizing items',
    strength: 4.5,
    tags: ['organization', 'books'],
    type: 'experience',
    reusable: true,
  },
];
```

---

**The components are ready - they just need to be wired into the existing pages!**
