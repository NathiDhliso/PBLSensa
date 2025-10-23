# Codebase Cleanup & Remediation Plan

## Executive Summary

This plan addresses the comprehensive audit findings, prioritizing high-impact issues that improve maintainability, reduce technical debt, and align the codebase with the core PBL + Sensa Learn vision.

## Priority Classification

- **P0 (Critical)**: Security vulnerabilities, data integrity issues
- **P1 (High)**: Major code duplication, architectural inconsistencies
- **P2 (Medium)**: Performance optimizations, code quality improvements
- **P3 (Low)**: Documentation, minor cleanup

---

## Phase 1: Critical Security & Data Integrity (P0)

### 1.1 XSS Prevention Audit ✅ PRIORITY
**Issue**: Potential XSS vulnerabilities in user/AI-generated content rendering
**Impact**: High security risk
**Action**:
- Audit all components rendering dynamic content
- Ensure DOMPurify sanitization before rendering
- Add sanitization utility wrapper
- Create security testing checklist

**Files to Audit**:
- `src/components/pbl/ConceptCard.tsx`
- `src/components/sensa/AnalogyCard.tsx`
- `src/components/pbl/SuggestEditModal.tsx`
- All components displaying concept definitions, analogy text

**Estimated Effort**: 4-6 hours

### 1.2 Security Monitoring Enhancement
**Issue**: localStorage used for security logs (XSS accessible)
**Impact**: Security event data exposure
**Action**:
- Move rate limiting to server-side (backend)
- Keep client-side monitoring for UX only
- Send security events to backend logging

**Files**:
- `src/services/securityMonitor.ts`
- Backend: Add security logging endpoint

**Estimated Effort**: 3-4 hours

---

## Phase 2: Major Code Duplication (P1)

### 2.1 Consolidate API Services ✅ HIGH PRIORITY
**Issue**: Duplicate Sensa API services (sensaApi.ts vs sensaService.ts)
**Impact**: Inconsistent error handling, maintenance overhead
**Action**:
1. Audit which service is used where
2. Migrate all calls to `sensaService.ts` (uses standard apiClient)
3. Delete `sensaApi.ts`
4. Update all imports

**Files**:
- DELETE: `src/services/sensaApi.ts`
- KEEP: `src/services/sensaService.ts`
- UPDATE: All hooks using sensaApi

**Estimated Effort**: 2-3 hours

### 2.2 Consolidate React Hooks ✅ HIGH PRIORITY
**Issue**: Duplicate hooks for same data (profiles, analogies)
**Impact**: Code bloat, inconsistent caching
**Action**:

#### Profile Hooks:
- KEEP: `src/hooks/useProfile.ts` (main profile hook)
- DELETE: `src/hooks/useSensaProfile.ts`, `src/hooks/useUserProfile.ts`
- UPDATE: All imports to use `useProfile`

#### Analogy Hooks:
- KEEP: `src/hooks/useChapterAnalogies.ts` (chapter-scoped)
- DELETE: `src/hooks/useSensaAnalogies.ts` (if redundant)
- Or MERGE: If they serve different purposes, document clearly

**Files**:
- Profile: 3 files → 1 file
- Analogies: 2 files → 1 file

**Estimated Effort**: 3-4 hours

### 2.3 Consolidate Type Definitions ✅ HIGH PRIORITY
**Issue**: Overlapping type definitions across multiple files
**Impact**: No single source of truth, maintenance overhead
**Action**:
1. Audit all type files for duplicates
2. Consolidate into domain-specific files:
   - `src/types/api.ts` - Core API types
   - `src/types/pbl.ts` - PBL-specific types
   - `src/types/sensa.ts` - Sensa-specific types
   - `src/types/auth.ts` - Auth types
3. Remove duplicates
4. Update all imports

**Files**:
- Consolidate: `api.ts`, `profile.ts`, `analogy.ts`, `conceptMap.ts`, `pbl.ts`, `sensa.ts`, `conflict.ts`, `feedback.ts`

**Estimated Effort**: 4-6 hours

### 2.4 Resolve Duplicate Concept Resolution Systems ✅ HIGH PRIORITY
**Issue**: Two systems for handling concept conflicts/duplicates
**Impact**: Significant duplication, potential conflicts
**Action**:
1. **Decision**: Keep PBL duplicate system (simpler, more aligned with workflow)
2. **Deprecate**: Conflict resolution system (more complex, overlapping)
3. **Migration Path**:
   - Mark conflict system as deprecated
   - Document why duplicate system is preferred
   - Plan removal in next major version

**Files to Keep**:
- `src/components/pbl/DuplicateResolver.tsx`
- `src/hooks/usePBLDuplicates.ts`
- Related pblService methods

**Files to Deprecate/Remove**:
- `src/components/pbl/ConflictResolutionModal.tsx`
- `src/hooks/useConflicts.ts`
- `src/services/conflictService.ts`
- `src/types/conflict.ts`

**Estimated Effort**: 3-4 hours

### 2.5 Consolidate Mock Data
**Issue**: Multiple mock data files and strategies
**Impact**: Confusion, potential inconsistencies
**Action**:
1. Consolidate into `src/services/mocks/` directory
2. Single entry point: `src/services/mocks/index.ts`
3. Environment flag to toggle mocking
4. Delete duplicate mock files

**Files**:
- CONSOLIDATE: `mockData.ts`, `mocks/mockData.ts`, `mockAuth.ts`, `mocks/mockApiClient.ts`
- CREATE: `src/services/mocks/index.ts` (single entry point)

**Estimated Effort**: 2-3 hours

---

## Phase 3: Architectural Improvements (P1)

### 3.1 Consolidate Modal Components
**Issue**: Duplicate modal boilerplate (SuggestEditModal, FlagIncorrectModal, AddRelatedConceptModal)
**Impact**: Code duplication, poor scalability
**Action**:
1. Create generic `FormModal` component
2. Refactor specific modals to use FormModal
3. Extract common form logic to hooks

**Files**:
- CREATE: `src/components/ui/FormModal.tsx`
- REFACTOR: `SuggestEditModal.tsx`, `FlagIncorrectModal.tsx`, `AddRelatedConceptModal.tsx`

**Estimated Effort**: 4-5 hours

### 3.2 Consolidate Error Handling
**Issue**: Overlapping error utilities (authErrors.ts, errorHandler.ts)
**Impact**: Inconsistent error messages
**Action**:
1. Create unified error handling utility
2. Keep domain-specific logic (auth errors) as extensions
3. Standardize error message format

**Files**:
- CREATE: `src/utils/errors/index.ts` (unified)
- REFACTOR: `authErrors.ts`, `errorHandler.ts`

**Estimated Effort**: 2-3 hours

### 3.3 Improve Routing Architecture
**Issue**: Monolithic App.tsx with all routes
**Impact**: Hard to maintain, poor code-splitting
**Action**:
1. Create route configuration files by domain
2. Implement lazy loading for route components
3. Split into: `authRoutes.ts`, `pblRoutes.ts`, `sensaRoutes.ts`

**Files**:
- CREATE: `src/routes/` directory
- REFACTOR: `src/App.tsx`

**Estimated Effort**: 3-4 hours

---

## Phase 4: Performance Optimizations (P2)

### 4.1 Optimize D3 Imports ✅ QUICK WIN
**Issue**: Importing entire D3 library
**Impact**: Large bundle size
**Action**:
```typescript
// Before
import * as d3 from 'd3';

// After
import { select } from 'd3-selection';
import { forceSimulation, forceLink, forceManyBody } from 'd3-force';
```

**Files**:
- `src/components/conceptMap/ConceptMapVisualization.tsx`
- `src/components/sensa/SensaLearnMap.tsx`

**Estimated Effort**: 1-2 hours

### 4.2 Memoize Heavy Components
**Issue**: Visualization components not memoized
**Impact**: Unnecessary re-renders
**Action**:
```typescript
export const ConceptMapVisualization = React.memo(({ conceptMap, layout }) => {
  // ... component code
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.conceptMap.id === nextProps.conceptMap.id &&
         prevProps.layout === nextProps.layout;
});
```

**Files**:
- `src/components/conceptMap/ConceptMapVisualization.tsx`
- `src/components/sensa/SensaLearnMap.tsx`

**Estimated Effort**: 1-2 hours

### 4.3 Add useCallback for Event Handlers
**Issue**: Inline functions causing child re-renders
**Impact**: Performance degradation
**Action**:
- Audit components passing functions as props
- Wrap in useCallback with proper dependencies

**Files**:
- `src/pages/courses/CourseDetailPage.tsx`
- `src/pages/profile/ProfilePage.tsx`
- Others identified during audit

**Estimated Effort**: 2-3 hours

### 4.4 Standardize React Query Caching
**Issue**: Inconsistent staleTime values
**Impact**: Unpredictable data freshness
**Action**:
1. Document caching strategy
2. Use default from queryClient.ts (5 min)
3. Only override for specific reasons (document why)

**Files**:
- All hooks using React Query
- `src/config/queryClient.ts`

**Estimated Effort**: 2-3 hours

---

## Phase 5: Feature Scope Alignment (P2)

### 5.1 Evaluate Gamification Features
**Issue**: Badges, Streaks, Progress not in core vision
**Impact**: Complexity, maintenance overhead
**Decision Options**:
1. **Keep but isolate**: Move to optional feature flag
2. **Deprecate**: Mark for removal, stop development
3. **Remove**: Delete entirely

**Recommendation**: Keep but isolate with feature flag

**Action**:
1. Add `ENABLE_GAMIFICATION` feature flag
2. Conditionally render gamification UI
3. Document as optional enhancement
4. Consider extraction to plugin/module

**Files**:
- All badge/streak/progress files
- Add feature flag to env config

**Estimated Effort**: 3-4 hours

### 5.2 Evaluate Audio/Music Features
**Issue**: Focus Music Player, Audio Narration not in core vision
**Impact**: External dependencies, complexity
**Decision Options**:
1. **Keep but isolate**: Feature flag
2. **Remove**: Delete entirely

**Recommendation**: Keep but isolate with feature flag

**Action**:
1. Add `ENABLE_AUDIO_FEATURES` feature flag
2. Conditionally load audio components
3. Document as optional enhancement

**Files**:
- `src/components/music/`
- `src/components/audio/`
- `src/contexts/MusicPlayerContext.tsx`

**Estimated Effort**: 2-3 hours

---

## Phase 6: Code Quality Improvements (P3)

### 6.1 Add Centralized Constants
**Issue**: Magic strings throughout codebase
**Impact**: Typo-prone, hard to refactor
**Action**:
1. Create `src/constants/` directory
2. Extract storage keys, routes, event names
3. Update all references

**Files**:
- CREATE: `src/constants/storage.ts`, `routes.ts`, `events.ts`
- UPDATE: All files using magic strings

**Estimated Effort**: 3-4 hours

### 6.2 Improve Styling Consistency
**Issue**: Hardcoded Tailwind colors vs theme
**Impact**: Hard to rebrand, inconsistent
**Action**:
1. Audit color usage
2. Create semantic color utilities
3. Replace hardcoded colors with theme references

**Files**:
- Many component files
- `src/styles/brandColors.ts`

**Estimated Effort**: 6-8 hours (large scope)

### 6.3 Add Inline Documentation
**Issue**: Complex logic lacks comments
**Impact**: Hard to understand/maintain
**Action**:
- Add JSDoc comments to complex functions
- Document D3 simulation parameters
- Explain API interceptor logic

**Files**:
- Visualization components
- `src/services/api.ts`

**Estimated Effort**: 4-5 hours

### 6.4 Clean Up Non-Essential Files
**Issue**: .gitkeep, example files in source
**Impact**: Minor clutter
**Action**:
- Remove .gitkeep files from populated directories
- Move examples to separate directory or delete
- Update .gitignore

**Files**:
- `src/components/.gitkeep`
- `src/styles/.gitkeep`
- `src/utils/.gitkeep`
- `src/examples/ApiUsageExamples.tsx`

**Estimated Effort**: 30 minutes

---

## Phase 7: Testing & Documentation (P3)

### 7.1 Add Integration Tests
**Issue**: Only unit tests exist
**Impact**: Low confidence in workflows
**Action**:
1. Set up React Testing Library for integration tests
2. Test critical workflows:
   - Login flow
   - Document upload → processing → visualization
   - Concept validation workflow
   - PBL ↔ Sensa navigation

**Estimated Effort**: 8-12 hours

### 7.2 Update Architecture Documentation
**Issue**: Docs describe target state, not current
**Impact**: Misleading for developers
**Action**:
1. Add "Current State" vs "Target State" sections
2. Document what's mocked vs real
3. Update deployment docs

**Files**:
- `src/documentation/architecture.md`
- `src/services/README.md`

**Estimated Effort**: 2-3 hours

---

## Implementation Strategy

### Recommended Order:
1. **Week 1**: Phase 1 (Security) + Phase 2.1-2.2 (API/Hook consolidation)
2. **Week 2**: Phase 2.3-2.5 (Types, Conflicts, Mocks) + Phase 4.1-4.2 (Quick perf wins)
3. **Week 3**: Phase 3 (Architecture) + Phase 4.3-4.4 (Remaining perf)
4. **Week 4**: Phase 5 (Feature flags) + Phase 6.1-6.2 (Constants, styling)
5. **Week 5**: Phase 6.3-6.4 (Docs, cleanup) + Phase 7 (Testing)

### Risk Mitigation:
- Create feature branch for each phase
- Run full test suite after each change
- Keep main branch stable
- Document breaking changes
- Create migration guides for major refactors

---

## Success Metrics

### Code Quality:
- [ ] Reduce total lines of code by 15-20%
- [ ] Eliminate all duplicate services/hooks
- [ ] Zero TypeScript errors maintained
- [ ] Bundle size reduced by 20%+

### Maintainability:
- [ ] Single source of truth for types
- [ ] Consistent error handling
- [ ] Centralized constants
- [ ] Clear feature boundaries

### Performance:
- [ ] Visualization components memoized
- [ ] D3 imports optimized
- [ ] Consistent caching strategy
- [ ] Faster initial load time

### Security:
- [ ] All XSS vulnerabilities addressed
- [ ] Security monitoring improved
- [ ] Input sanitization verified

---

## Quick Wins (Can Start Immediately)

1. **Optimize D3 imports** (1-2 hours, big impact)
2. **Delete sensaApi.ts** (2-3 hours, clear win)
3. **Remove .gitkeep files** (30 min, easy)
4. **Memoize visualizations** (1-2 hours, performance boost)
5. **Consolidate profile hooks** (2-3 hours, clear duplication)

---

## Long-Term Recommendations

### Architecture Evolution:
1. Consider micro-frontend architecture for PBL/Sensa portals
2. Implement proper feature flag system (LaunchDarkly, etc.)
3. Add comprehensive E2E testing (Playwright/Cypress)
4. Implement proper monitoring (Sentry, DataDog)

### Code Organization:
1. Move to monorepo structure (Nx, Turborepo)
2. Extract shared components to library
3. Implement design system
4. Add Storybook for component documentation

---

## Conclusion

This plan addresses the most critical issues first (security, major duplication) while providing a clear path for ongoing improvements. The phased approach allows for incremental progress without disrupting development.

**Total Estimated Effort**: 60-80 hours (1.5-2 months at 1 developer)
**Recommended Team Size**: 1-2 developers
**Timeline**: 5 weeks with focused effort

**Next Step**: Review and approve plan, then start with Phase 1 (Security) and quick wins.
