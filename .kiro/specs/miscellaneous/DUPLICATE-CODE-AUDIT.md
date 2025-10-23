# Comprehensive Duplicate Code Audit

## Executive Summary

This audit identifies specific code duplications found in the codebase, categorized by type and severity. Each item includes file locations, duplication percentage, and recommended actions.

---

## Category 1: Modal Component Duplication (HIGH SEVERITY)

### Pattern Detected: Feedback Modal Boilerplate

**Duplicate Files**:
1. `src/components/pbl/SuggestEditModal.tsx` (120 lines)
2. `src/components/pbl/FlagIncorrectModal.tsx` (110 lines)
3. `src/components/pbl/AddRelatedConceptModal.tsx` (130 lines)

**Duplication Analysis**:
- **Shared Structure**: ~70% identical (modal wrapper, animation, form layout)
- **Shared Logic**: ~60% identical (state management, submission handling)
- **Unique Content**: ~30% (form fields, validation)

**Duplicate Code Blocks**:

```typescript
// DUPLICATE PATTERN 1: Modal Props Interface
interface [Name]ModalProps {
  isOpen: boolean;
  conceptName: string;
  onClose: () => void;
  onSubmit: (...args) => Promise<void>;
}

// DUPLICATE PATTERN 2: State Management
const [field, setField] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

// DUPLICATE PATTERN 3: Submit Handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsSubmitting(true);
  try {
    await onSubmit(...);
    onClose();
  } catch (err) {
    setError(err.message);
  } finally {
    setIsSubmitting(false);
  }
};

// DUPLICATE PATTERN 4: Modal Structure
<AnimatePresence>
  {isOpen && (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div className="relative bg-white rounded-lg p-6 max-w-md w-full">
        {/* Form content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Recommended Solution**:
Create `src/components/ui/FormModal.tsx`:

```typescript
interface FormModalProps<T> {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  children: (props: FormChildProps<T>) => ReactNode;
  submitLabel?: string;
}

interface FormChildProps<T> {
  data: T;
  setData: (data: T) => void;
  error: string | null;
  isSubmitting: boolean;
}
```

**Estimated Savings**: ~200 lines of code

---

## Category 2: Service Layer Duplication (CRITICAL SEVERITY)

### 2.1 Duplicate Sensa API Services

**Files**:
1. `src/services/sensaApi.ts` (150 lines) - Uses raw fetch
2. `src/services/sensaService.ts` (200 lines) - Uses apiClient

**Duplication**: ~80% functional overlap

**Duplicate Functions**:
- `getProfile()` / `fetchProfile()`
- `updateProfile()` / `updateUserProfile()`
- `getAnalogies()` / `fetchAnalogies()`
- `createAnalogy()` / `submitAnalogy()`

**Issues**:
- Inconsistent error handling
- Different authentication approaches
- Duplicate type definitions
- Maintenance overhead

**Recommended Action**: DELETE `sensaApi.ts`, migrate all to `sensaService.ts`

**Files to Update**:
- `src/hooks/useSensaAnalogies.ts`
- `src/hooks/useSensaProfile.ts`
- Any components importing sensaApi

**Estimated Savings**: ~150 lines + improved consistency

### 2.2 Duplicate Mock Data Files

**Files**:
1. `src/services/mockData.ts` (300+ lines)
2. `src/services/mocks/mockData.ts` (250+ lines)

**Duplication**: ~60% overlap in mock data definitions

**Duplicate Data**:
- Mock courses
- Mock documents
- Mock user profiles
- Mock concept maps

**Recommended Action**: Consolidate into `src/services/mocks/` directory

**Structure**:
```
src/services/mocks/
  ├── index.ts          # Main export
  ├── courses.ts        # Course mock data
  ├── documents.ts      # Document mock data
  ├── profiles.ts       # Profile mock data
  ├── concepts.ts       # Concept mock data
  └── config.ts         # Mock configuration
```

**Estimated Savings**: ~200 lines + better organization

---

## Category 3: Hook Duplication (HIGH SEVERITY)

### 3.1 Profile Hooks

**Files**:
1. `src/hooks/useProfile.ts` - Main profile hook
2. `src/hooks/useSensaProfile.ts` - Sensa-specific profile
3. `src/hooks/useUserProfile.ts` - User profile variant

**Duplication**: ~70% identical logic

**Duplicate Patterns**:
```typescript
// All three hooks do essentially the same thing:
export function use[X]Profile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => [service].getProfile(),
    staleTime: [varies],
  });
}
```

**Recommended Action**: Keep `useProfile.ts`, delete others

**Migration**:
```typescript
// Before
import { useSensaProfile } from '@/hooks/useSensaProfile';
const { data: profile } = useSensaProfile();

// After
import { useProfile } from '@/hooks/useProfile';
const { data: profile } = useProfile();
```

**Estimated Savings**: ~100 lines

### 3.2 Analogy Hooks

**Files**:
1. `src/hooks/useChapterAnalogies.ts` - Chapter-scoped
2. `src/hooks/useSensaAnalogies.ts` - Document-scoped

**Duplication**: ~50% overlap

**Analysis**:
- Different scopes (chapter vs document)
- Similar fetching logic
- Could be unified with parameters

**Recommended Action**: Merge into single hook with scope parameter

```typescript
export function useAnalogies(scope: 'chapter' | 'document', id: string) {
  return useQuery({
    queryKey: ['analogies', scope, id],
    queryFn: () => {
      if (scope === 'chapter') return analogyService.getChapterAnalogies(id);
      return analogyService.getDocumentAnalogies(id);
    },
  });
}
```

**Estimated Savings**: ~80 lines

---

## Category 4: React Query Pattern Duplication (MEDIUM SEVERITY)

### 4.1 Inconsistent Cache Invalidation

**Pattern Found in 15+ hooks**:

```typescript
// Pattern A: Simple invalidation (8 hooks)
queryClient.invalidateQueries({ queryKey: ['resource'] });

// Pattern B: Specific invalidation (5 hooks)
queryClient.invalidateQueries({ queryKey: ['resource', id] });

// Pattern C: Multiple invalidations (3 hooks)
queryClient.invalidateQueries({ queryKey: ['resource1'] });
queryClient.invalidateQueries({ queryKey: ['resource2'] });
```

**Files with Pattern**:
- `usePBLConcepts.ts`
- `usePBLVisualization.ts`
- `usePBLDuplicates.ts`
- `useUpdateProfile.ts`
- `useProgress.ts`
- `useStreaks.ts`
- `useBadges.ts`
- `useConflicts.ts`
- `useFeedback.ts`
- And more...

**Recommended Action**: Create invalidation helper

```typescript
// src/utils/queryInvalidation.ts
export const invalidateQueries = {
  concepts: (queryClient: QueryClient, documentId?: string) => {
    if (documentId) {
      queryClient.invalidateQueries({ queryKey: ['pbl-concepts', documentId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['pbl-concepts'] });
    }
  },
  
  visualization: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['pbl-visualization'] });
  },
  
  // ... more helpers
};
```

**Estimated Savings**: Improved consistency, easier maintenance

### 4.2 Inconsistent staleTime Values

**Audit Results**:
- Default (queryClient.ts): 5 minutes
- useProfile: 30 minutes
- useChapterAnalogies: 10 minutes
- useCourses: 5 minutes
- useConceptMap: 10 minutes
- useChapterSummary: 10 minutes

**Recommended Action**: Standardize or document exceptions

```typescript
// src/config/cacheConfig.ts
export const CACHE_TIMES = {
  DEFAULT: 5 * 60 * 1000,      // 5 min
  PROFILE: 30 * 60 * 1000,     // 30 min (rarely changes)
  CONTENT: 10 * 60 * 1000,     // 10 min (moderate changes)
  REALTIME: 1 * 60 * 1000,     // 1 min (frequent changes)
};
```

---

## Category 5: Type Definition Duplication (MEDIUM SEVERITY)

### 5.1 Overlapping Interfaces

**Duplicate Concept Types**:

**File 1**: `src/types/api.ts`
```typescript
export interface Keyword {
  term: string;
  definition: string;
  importance: number;
}
```

**File 2**: `src/types/conceptMap.ts`
```typescript
export interface ConceptNode {
  term: string;
  definition: string;
  importance: number;
  // ... additional fields
}
```

**File 3**: `src/types/pbl.ts`
```typescript
export interface Concept {
  term: string;
  definition: string;
  importance: number;
  // ... different additional fields
}
```

**Analysis**: 3 types representing the same core entity with slight variations

**Recommended Action**: Create base type with extensions

```typescript
// src/types/core.ts
export interface BaseConcept {
  term: string;
  definition: string;
  importance: number;
}

// src/types/api.ts
export interface Keyword extends BaseConcept {}

// src/types/conceptMap.ts
export interface ConceptNode extends BaseConcept {
  x: number;
  y: number;
  // visualization-specific fields
}

// src/types/pbl.ts
export interface Concept extends BaseConcept {
  validated: boolean;
  structure_type: string;
  // PBL-specific fields
}
```

**Estimated Savings**: Better type safety, clearer relationships

### 5.2 Duplicate UserProfile Types

**Files**:
- `src/types/api.ts` - UserProfile
- `src/types/profile.ts` - UserProfile
- `src/types/sensa.ts` - SensaProfile

**Duplication**: ~80% identical fields

**Recommended Action**: Single source of truth in `types/profile.ts`

---

## Category 6: Error Handling Duplication (MEDIUM SEVERITY)

### 6.1 Overlapping Error Utilities

**Files**:
1. `src/utils/authErrors.ts` (150 lines)
2. `src/utils/errorHandler.ts` (100 lines)

**Duplicate Logic**:
- Network error detection
- Server error categorization
- User message generation

**Duplicate Code**:

```typescript
// authErrors.ts
export function isNetworkError(error: any): boolean {
  return error.message?.includes('Network') || 
         error.message?.includes('Failed to fetch');
}

// errorHandler.ts
export function isNetworkError(error: Error): boolean {
  return error.message.includes('network') || 
         error.message.includes('fetch');
}
```

**Recommended Action**: Unified error handling

```typescript
// src/utils/errors/index.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
  }
}

export const ErrorCodes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  SERVER: 'SERVER_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
} as const;

// src/utils/errors/auth.ts
export class AuthError extends AppError {
  // Auth-specific extensions
}
```

**Estimated Savings**: ~100 lines + consistency

---

## Category 7: Component Pattern Duplication (LOW-MEDIUM SEVERITY)

### 7.1 Loading State Patterns

**Found in 20+ components**:

```typescript
// Pattern repeated everywhere
if (isLoading) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <p className="ml-2 text-gray-600">Loading...</p>
    </div>
  );
}
```

**Recommended Action**: Create reusable component

```typescript
// src/components/ui/LoadingState.tsx
export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <p className="ml-2 text-gray-600">{message}</p>
    </div>
  );
}
```

**Estimated Savings**: ~100 lines across components

### 7.2 Empty State Patterns

**Found in 15+ components**:

```typescript
// Repeated pattern
if (!data || data.length === 0) {
  return (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No items found</h3>
      <p className="text-gray-600 mb-6">Description text</p>
      <Button onClick={action}>Action</Button>
    </div>
  );
}
```

**Recommended Action**: Create EmptyState component

**Estimated Savings**: ~150 lines across components

---

## Category 8: Utility Function Duplication (LOW SEVERITY)

### 8.1 Date Formatting

**Found in multiple files**:
- `src/utils/fileProcessing.ts` - formatDate()
- `src/components/documents/DocumentCard.tsx` - inline formatting
- `src/pages/progress/ProgressDashboardPage.tsx` - inline formatting

**Recommended Action**: Centralize in `src/utils/date.ts`

### 8.2 File Size Formatting

**Found in**:
- `src/utils/fileProcessing.ts` - formatFileSize()
- Inline calculations in components

**Recommended Action**: Already centralized, ensure usage

---

## Summary Statistics

### Total Duplication Found:
- **Modal Components**: ~200 lines (70% duplicate)
- **Services**: ~350 lines (80% duplicate)
- **Hooks**: ~180 lines (60% duplicate)
- **Types**: ~150 lines (50% duplicate)
- **Error Handling**: ~100 lines (60% duplicate)
- **Component Patterns**: ~250 lines (80% duplicate)

### Total Potential Savings:
- **Lines of Code**: ~1,230 lines (10-15% of frontend codebase)
- **Files to Consolidate**: 15-20 files
- **Improved Consistency**: Across 50+ files

### Priority Actions:
1. **Immediate** (P0): Consolidate API services (sensaApi → sensaService)
2. **High** (P1): Create FormModal component, consolidate hooks
3. **Medium** (P2): Unify type definitions, standardize React Query patterns
4. **Low** (P3): Extract common component patterns

---

## Implementation Checklist

### Week 1: Critical Duplications
- [ ] Delete sensaApi.ts, migrate to sensaService.ts
- [ ] Consolidate profile hooks (3 → 1)
- [ ] Consolidate mock data files

### Week 2: Component Patterns
- [ ] Create FormModal component
- [ ] Refactor feedback modals to use FormModal
- [ ] Create LoadingState and EmptyState components

### Week 3: Type System
- [ ] Consolidate concept type definitions
- [ ] Consolidate profile type definitions
- [ ] Create base types with extensions

### Week 4: Utilities & Patterns
- [ ] Unify error handling utilities
- [ ] Standardize React Query patterns
- [ ] Create query invalidation helpers

### Week 5: Testing & Verification
- [ ] Test all refactored components
- [ ] Verify no regressions
- [ ] Update documentation

---

## Conclusion

The codebase contains significant duplication (10-15% of code) that can be eliminated through systematic refactoring. The highest priority items are:

1. **Service consolidation** (immediate impact on consistency)
2. **Modal component refactoring** (high code savings)
3. **Hook consolidation** (improved maintainability)

Estimated total effort: 40-50 hours over 5 weeks.
