# Codebase Cleanup: Quick Start Guide

## Immediate Actions (Can Start Today)

This guide provides step-by-step instructions for the highest-priority cleanup
tasks that can be completed quickly with minimal risk.

---

## Quick Win #1: Delete Duplicate Sensa API Service (2-3 hours)

### Impact: High (Eliminates major inconsistency)

### Risk: Low (Clear migration path)

### Step 1: Identify Usage

```bash
# Find all files importing sensaApi
grep -r "from '@/services/sensaApi'" src/
grep -r "from '../services/sensaApi'" src/
```

### Step 2: Update Imports

Replace all instances:

```typescript
// Before
import { sensaApi } from "@/services/sensaApi";
const data = await sensaApi.getProfile();

// After
import { sensaService } from "@/services/sensaService";
const data = await sensaService.getProfile();
```

### Step 3: Update Hook Files

Likely files to update:

- `src/hooks/useSensaAnalogies.ts`
- `src/hooks/useSensaProfile.ts`

### Step 4: Delete File

```bash
rm src/services/sensaApi.ts
```

### Step 5: Test

```bash
npm run build
npm run type-check
```

---

## Quick Win #2: Consolidate Profile Hooks (2-3 hours)

### Impact: High (Reduces confusion)

### Risk: Low (Simple refactor)

### Step 1: Audit Current Usage

```bash
# Find usages of each hook
grep -r "useSensaProfile" src/
grep -r "useUserProfile" src/
grep -r "useProfile" src/
```

### Step 2: Choose Primary Hook

**Decision**: Keep `src/hooks/useProfile.ts` (most standard)

### Step 3: Update All Imports

```typescript
// Before (multiple variations)
import { useSensaProfile } from "@/hooks/useSensaProfile";
import { useUserProfile } from "@/hooks/useUserProfile";

// After (single source)
import { useProfile } from "@/hooks/useProfile";
```

### Step 4: Delete Redundant Files

```bash
rm src/hooks/useSensaProfile.ts
rm src/hooks/useUserProfile.ts
```

### Step 5: Update index.ts

```typescript
// src/hooks/index.ts
// Remove old exports
export { useProfile } from "./useProfile";
```

---

## Quick Win #3: Optimize D3 Imports (1-2 hours)

### Impact: High (Reduces bundle size significantly)

### Risk: Low (No logic changes)

### Step 1: Update ConceptMapVisualization

```typescript
// Before
import * as d3 from "d3";

// After
import { select, selectAll } from "d3-selection";
import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
} from "d3-force";
import { zoom, zoomIdentity } from "d3-zoom";
import { drag } from "d3-drag";
```

### Step 2: Update SensaLearnMap

Same pattern as above.

### Step 3: Verify Build

```bash
npm run build
# Check bundle size reduction
```

---

## Quick Win #4: Remove .gitkeep Files (15 minutes)

### Impact: Low (Cleanup)

### Risk: None

### Commands:

```bash
rm src/components/.gitkeep
rm src/styles/.gitkeep
rm src/utils/.gitkeep
```

---

## Quick Win #5: Memoize Visualization Components (1-2 hours)

### Impact: High (Performance improvement)

### Risk: Low (Wrapper only)

### Step 1: Update ConceptMapVisualization

```typescript
// Before
export function ConceptMapVisualization({ conceptMap, layout, onNodeClick }) {
    // ... component code
}

// After
export const ConceptMapVisualization = React.memo(
    function ConceptMapVisualization({ conceptMap, layout, onNodeClick }) {
        // ... component code
    },
    (prevProps, nextProps) => {
        // Custom comparison
        return (
            prevProps.conceptMap.course_id === nextProps.conceptMap.course_id &&
            prevProps.layout === nextProps.layout &&
            prevProps.conceptMap.chapters.length ===
                nextProps.conceptMap.chapters.length
        );
    },
);
```

### Step 2: Update SensaLearnMap

Same pattern.

---

## Quick Win #6: Create LoadingState Component (1 hour)

### Impact: Medium (Reduces duplication)

### Risk: None

### Step 1: Create Component

```typescript
// src/components/ui/LoadingState.tsx
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
    message?: string;
    size?: "sm" | "md" | "lg";
}

export function LoadingState({
    message = "Loading...",
    size = "md",
}: LoadingStateProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    return (
        <div className="flex items-center justify-center p-8">
            <Loader2
                className={`${sizeClasses[size]} animate-spin text-purple-600`}
            />
            {message && <p className="ml-2 text-gray-600">{message}</p>}
        </div>
    );
}
```

### Step 2: Replace Usage (Gradually)

```typescript
// Before
if (isLoading) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="ml-2 text-gray-600">Loading...</p>
        </div>
    );
}

// After
if (isLoading) {
    return <LoadingState />;
}
```

---

## Quick Win #7: Consolidate Mock Data (2-3 hours)

### Impact: Medium (Better organization)

### Risk: Low

### Step 1: Create Mocks Directory Structure

```bash
mkdir -p src/services/mocks
```

### Step 2: Create Index File

```typescript
// src/services/mocks/index.ts
export * from "./courses";
export * from "./documents";
export * from "./profiles";
export * from "./concepts";

// Toggle mocking
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
```

### Step 3: Split Mock Data

```typescript
// src/services/mocks/courses.ts
export const mockCourses = [/* ... */];
export const getMockCourses = async () => {/* ... */};

// src/services/mocks/profiles.ts
export const mockProfile = {/* ... */};
export const getMockProfile = async () => {/* ... */};
```

### Step 4: Update Imports

```typescript
// Before
import { mockCourses } from "@/services/mockData";

// After
import { mockCourses } from "@/services/mocks";
```

### Step 5: Delete Old Files

```bash
rm src/services/mockData.ts
# Keep mocks/mockData.ts or consolidate
```

---

## Quick Win #8: Add XSS Sanitization Utility (1 hour)

### Impact: Critical (Security)

### Risk: None

### Step 1: Create Utility

```typescript
// src/utils/sanitize.ts
import DOMPurify from "dompurify";

export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
        ALLOWED_ATTR: [],
    });
}

export function sanitizeText(text: string): string {
    // For plain text, just escape HTML entities
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}
```

### Step 2: Use in Components

```typescript
// Before
<div>{concept.definition}</div>

// After
import { sanitizeText } from '@/utils/sanitize';
<div>{sanitizeText(concept.definition)}</div>

// Or for HTML content
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
```

---

## Testing Checklist

After each quick win:

- [ ] Run TypeScript compiler: `npm run type-check`
- [ ] Run build: `npm run build`
- [ ] Test affected features manually
- [ ] Check for console errors
- [ ] Verify no regressions

---

## Progress Tracking

### Completed Quick Wins:

- [ ] #1: Delete sensaApi.ts
- [ ] #2: Consolidate profile hooks
- [ ] #3: Optimize D3 imports
- [ ] #4: Remove .gitkeep files
- [ ] #5: Memoize visualizations
- [ ] #6: Create LoadingState component
- [ ] #7: Consolidate mock data
- [ ] #8: Add XSS sanitization

### Estimated Total Time: 12-16 hours

### Estimated Impact:

- **Code Reduction**: ~500 lines
- **Bundle Size**: -20% (D3 optimization)
- **Performance**: +15% (memoization)
- **Security**: XSS protection added
- **Maintainability**: Significantly improved

---

## Next Steps After Quick Wins

Once quick wins are complete, proceed to:

1. **Phase 2**: Major refactoring (FormModal, type consolidation)
2. **Phase 3**: Architectural improvements (routing, error handling)
3. **Phase 4**: Feature flags (gamification, audio)
4. **Phase 5**: Testing and documentation

See `CODEBASE-CLEANUP-PLAN.md` for full roadmap.

---

## Getting Help

If you encounter issues:

1. **TypeScript Errors**: Check import paths and type definitions
2. **Build Failures**: Verify all dependencies are installed
3. **Runtime Errors**: Check browser console for specific errors
4. **Test Failures**: Run tests individually to isolate issues

**Remember**: Each quick win is independent. If one is blocked, move to the
next!
