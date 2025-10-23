# Implementation Tasks: Two-View Learning System Integration

## Overview

This task list implements the Two-View Learning System by extending the existing PBL infrastructure. Tasks are organized into phases that can be executed incrementally without breaking existing functionality.

---

## Phase 1: Foundation & Database Migration (Week 1-2)

### - [ ] 1. Database Schema Migration

- [ ] 1.1 Create migration script for keywords → concepts rename
  - Rename `keywords` table to `concepts`
  - Add `source_sentences TEXT[]` column
  - Add `surrounding_concepts TEXT[]` column
  - Add `structure_type TEXT` column with CHECK constraint
  - _Requirements: 1.1, 2.1_

- [ ] 1.2 Enhance relationships table with structure classification
  - Add `structure_category TEXT` column with CHECK constraint
  - Add `relationship_type TEXT` column
  - Create indexes for new columns
  - _Requirements: 3.1, 3.2_

- [ ] 1.3 Create Sensa Learn tables
  - Create `user_profiles` table with JSONB columns
  - Create `analogies` table with strength ratings
  - Create `concept_analogy_connections` table
  - Create `generated_questions` table
  - Create all necessary indexes
  - _Requirements: 6.1, 7.1_

- [ ] 1.4 Test migration on development database
  - Run migration script
  - Verify data integrity
  - Test rollback script
  - _Requirements: All_

---

### - [ ] 2. Code Refactoring: Keywords → Concepts

- [ ] 2.1 Update backend type definitions
  - Rename `Keyword` class to `Concept` in `backend/types/`
  - Add new fields: `source_sentences`, `surrounding_concepts`, `structure_type`
  - Update all imports across backend
  - _Requirements: 2.1_

- [ ] 2.2 Update frontend type definitions
  - Rename `Keyword` interface to `Concept` in `src/types/`
  - Add new fields to match backend
  - Update all imports across frontend
  - _Requirements: 2.1_

- [ ] 2.3 Rename service files
  - Rename `keyword_extractor.py` to `concept_extractor.py`
  - Update class name from `KeywordExtractor` to `ConceptExtractor`
  - Update all references in pipeline
  - _Requirements: 2.1_

- [ ] 2.4 Update API endpoints
  - Change `/keywords` routes to `/concepts`
  - Update request/response models
  - Maintain backward compatibility with alias routes
  - _Requirements: 2.1_

---

### - [ ] 3. Structure Classifier Service

- [ ] 3.1 Create StructureClassifier service
  - Create `backend/services/structure_classifier.py`
  - Implement pattern matching for hierarchical structures
  - Implement pattern matching for sequential structures
  - Add regex patterns for common keywords
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3.2 Implement Claude validation
  - Create prompt template for structure classification
  - Integrate with existing Bedrock client
  - Parse and validate Claude responses
  - Handle errors and fallbacks
  - _Requirements: 3.2_

- [ ] 3.3 Add relationship type classification
  - Implement `is_a`, `has_component`, `contains` detection
  - Implement `precedes`, `enables`, `results_in` detection
  - Calculate relationship strength scores
  - _Requirements: 3.3, 3.4_

- [ ] 3.4 Integrate into existing pipeline
  - Add structure classifier call after relationship detection
  - Update `pbl_pipeline.py` with new step
  - Store classified relationships in database
  - _Requirements: 3.1, 3.2_

- [ ] 3.5 Write unit tests for structure classifier
  - Test hierarchical pattern matching
  - Test sequential pattern matching
  - Test Claude validation
  - Test edge cases
  - _Requirements: 3.1, 3.2_

---

## Phase 2: User Profile System (Week 3-4)

### - [ ] 4. User Profile Service

- [ ] 4.1 Create UserProfile data models
  - Create `backend/models/user_profile.py`
  - Define `UserProfile`, `Background`, `Interests`, `Experiences` classes
  - Add validation logic
  - _Requirements: 6.1, 7.1_

- [ ] 4.2 Implement UserProfileService
  - Create `backend/services/sensa/user_profile_service.py`
  - Implement `get_profile()` method
  - Implement `update_profile()` method
  - Implement `create_default_profile()` method
  - _Requirements: 6.1_

- [ ] 4.3 Create profile API endpoints
  - Create `backend/routers/sensa_profile.py`
  - Add `GET /api/sensa/users/{user_id}/profile`
  - Add `PUT /api/sensa/users/{user_id}/profile`
  - Add request/response validation
  - _Requirements: 6.1_

- [ ] 4.4 Write tests for profile service
  - Test profile creation
  - Test profile updates
  - Test validation errors
  - _Requirements: 6.1_

---

### - [ ] 5. Onboarding Flow

- [ ] 5.1 Create onboarding questions data
  - Define question categories (hobbies, places, work, sports, media, memories)
  - Create question templates
  - Store in `backend/data/onboarding_questions.json`
  - _Requirements: 7.1, 7.2_

- [ ] 5.2 Build ProfileOnboarding component
  - Create `src/components/sensa/ProfileOnboarding.tsx`
  - Implement multi-step form (6 categories)
  - Add progress indicator
  - Add skip/back navigation
  - _Requirements: 7.1, 7.2_

- [ ] 5.3 Create onboarding page
  - Create `src/pages/sensa/OnboardingPage.tsx`
  - Add routing for `/sensa-learn/onboarding`
  - Redirect new users to onboarding
  - _Requirements: 7.1_

- [ ] 5.4 Enhance ProfileEditForm
  - Update `src/components/profile/ProfileEditForm.tsx`
  - Add fields for interests, experiences, learning style
  - Add validation
  - _Requirements: 6.1, 7.1_

---

## Phase 3: Dynamic Question Generator (Week 5-6)

### - [ ] 6. Question Generation Service

- [ ] 6.1 Create Question data models
  - Create `backend/models/question.py`
  - Define `Question`, `QuestionType` classes
  - Add validation
  - _Requirements: 7.3, 7.4_

- [ ] 6.2 Implement AnalogyQuestionGenerator
  - Create `backend/services/sensa/question_generator.py`
  - Implement `generate_questions()` method
  - Add concept analysis logic
  - Add user domain matching logic
  - _Requirements: 7.3, 7.4_

- [ ] 6.3 Create question templates
  - Define templates for hierarchical concepts
  - Define templates for sequential concepts
  - Store in `backend/data/question_templates.json`
  - _Requirements: 7.3, 7.4_

- [ ] 6.4 Implement Claude question generation
  - Create prompt template for question generation
  - Integrate with Bedrock client
  - Parse and validate responses
  - Handle errors and fallbacks
  - _Requirements: 7.3, 7.4_

- [ ] 6.5 Add guided first experience logic
  - Detect new users with minimal profile
  - Supplement with universal metaphorical domains
  - Ensure robust question generation
  - _Requirements: 7.3_

- [ ] 6.6 Create question API endpoints
  - Create `backend/routers/sensa_questions.py`
  - Add `POST /api/sensa/questions/generate`
  - Add request/response validation
  - _Requirements: 7.3_

- [ ] 6.7 Write tests for question generator
  - Test hierarchical question generation
  - Test sequential question generation
  - Test new user fallback
  - _Requirements: 7.3, 7.4_

---

### - [ ] 7. Question UI Components

- [ ] 7.1 Create QuestionForm component
  - Create `src/components/sensa/QuestionForm.tsx`
  - Display generated questions
  - Add text input for answers
  - Add submit button
  - _Requirements: 7.3, 7.4_

- [ ] 7.2 Create QuestionCard component
  - Create `src/components/sensa/QuestionCard.tsx`
  - Display question text
  - Show question type badge
  - Add answer input field
  - _Requirements: 7.3_

- [ ] 7.3 Add question generation to concept detail
  - Update concept detail panel
  - Add "Create Analogy" button
  - Trigger question generation
  - Display QuestionForm
  - _Requirements: 7.3, 7.4_

---

## Phase 4: Analogy Storage & Management (Week 7-8)

### - [ ] 8. Analogy Service

- [ ] 8.1 Create Analogy data models
  - Create `backend/models/analogy.py`
  - Define `Analogy`, `AnalogyType` classes
  - Add validation logic
  - _Requirements: 6.2, 6.3_

- [ ] 8.2 Implement AnalogyService
  - Create `backend/services/sensa/analogy_service.py`
  - Implement `create_analogy()` method
  - Implement `get_analogies()` method
  - Implement `update_analogy()` method
  - Implement `delete_analogy()` method
  - _Requirements: 6.2, 6.3_

- [ ] 8.3 Add connection explanation generation
  - Create prompt for Claude to explain connections
  - Integrate with Bedrock client
  - Store explanation with analogy
  - _Requirements: 6.2_

- [ ] 8.4 Implement auto-tagging
  - Extract tags from experience text
  - Use NLP to identify domains (sports, cooking, etc.)
  - Store tags array
  - _Requirements: 6.2_

- [ ] 8.5 Create analogy API endpoints
  - Create `backend/routers/sensa_analogies.py`
  - Add `POST /api/sensa/analogies`
  - Add `GET /api/sensa/analogies`
  - Add `PUT /api/sensa/analogies/{analogy_id}`
  - Add `DELETE /api/sensa/analogies/{analogy_id}`
  - _Requirements: 6.2, 6.3_

- [ ] 8.6 Write tests for analogy service
  - Test analogy creation
  - Test connection explanation generation
  - Test auto-tagging
  - Test CRUD operations
  - _Requirements: 6.2, 6.3_

---

### - [ ] 9. Analogy UI Components

- [ ] 9.1 Create AnalogyForm component
  - Create `src/components/sensa/AnalogyForm.tsx`
  - Display question and answer
  - Add strength rating (1-5 stars)
  - Add "Mark as Reusable" checkbox
  - Add submit button
  - _Requirements: 6.2, 6.3_

- [ ] 9.2 Enhance AnalogyCard component
  - Update `src/components/sensa/AnalogyCard.tsx`
  - Display user experience text
  - Show connection explanation
  - Display strength rating
  - Add edit/delete buttons
  - _Requirements: 6.2, 6.3_

- [ ] 9.3 Create AnalogyList component
  - Create `src/components/sensa/AnalogyList.tsx`
  - Display all user analogies
  - Add filtering by document
  - Add filtering by reusable
  - Add sorting options
  - _Requirements: 6.2_

- [ ] 9.4 Add analogy management to Sensa Learn
  - Update `src/pages/sensa/SensaCourseDetailPage.tsx`
  - Add "My Analogies" tab
  - Display AnalogyList
  - Add create/edit/delete functionality
  - _Requirements: 6.2, 6.3_

---

## Phase 5: Cross-Document Learning (Week 9)

### - [ ] 10. Cross-Document Service

- [ ] 10.1 Create AnalogyySuggestion data model
  - Create `backend/models/suggestion.py`
  - Define `AnalogyySuggestion` class
  - Add similarity score field
  - _Requirements: 9.1, 9.2_

- [ ] 10.2 Implement CrossDocumentLearningService
  - Create `backend/services/sensa/cross_document_learning.py`
  - Implement `suggest_analogies_for_new_concept()` method
  - Add semantic search using pgvector
  - Add analogy ranking logic
  - _Requirements: 9.1, 9.2_

- [ ] 10.3 Create suggestion API endpoint
  - Add `GET /api/sensa/analogies/suggest` to analogies router
  - Add query parameters for user_id and concept_id
  - Return ranked suggestions
  - _Requirements: 9.1_

- [ ] 10.4 Write tests for cross-document service
  - Test semantic search
  - Test ranking algorithm
  - Test with multiple documents
  - _Requirements: 9.1, 9.2_

---

### - [ ] 11. Suggestion UI Components

- [ ] 11.1 Create SuggestionCard component
  - Create `src/components/sensa/SuggestionCard.tsx`
  - Display past analogy
  - Show similarity score
  - Add "Apply" button
  - Add "Dismiss" button
  - _Requirements: 9.1, 9.2_

- [ ] 11.2 Create AnalogyySuggestionPanel component
  - Create `src/components/sensa/AnalogyySuggestionPanel.tsx`
  - Display "From Your Past Learning" header
  - Show list of SuggestionCards
  - Handle apply/dismiss actions
  - _Requirements: 9.1, 9.2_

- [ ] 11.3 Integrate suggestions into question flow
  - Update QuestionForm to check for suggestions first
  - Display AnalogyySuggestionPanel above questions
  - Allow user to apply or skip suggestions
  - _Requirements: 9.1, 9.2_

---

## Phase 6: Dual-Mode Visualization (Week 10-12)

### - [ ] 12. PBL Visualization Enhancements

- [ ] 12.1 Add structure-aware styling
  - Update `src/components/conceptMap/ConceptMapVisualization.tsx`
  - Add blue border for hierarchical nodes
  - Add green border for sequential nodes
  - Add different edge styles for relationship types
  - _Requirements: 4.1, 4.2_

- [ ] 12.2 Add layout options
  - Implement tree layout for hierarchical
  - Implement flowchart layout for sequential
  - Implement hybrid layout
  - Add layout switcher in toolbar
  - _Requirements: 4.3_

- [ ] 12.3 Add node editing capabilities
  - Enable inline editing of concept labels
  - Add edit modal for full concept details
  - Allow relationship creation via drag-and-drop
  - Add delete confirmation
  - _Requirements: 4.3_

- [ ] 12.4 Add export functionality
  - Implement PNG export
  - Implement PDF export
  - Implement JSON export
  - Add export button to toolbar
  - _Requirements: 4.3_

---

### - [ ] 13. Sensa Learn Visualization

- [ ] 13.1 Create SensaLearnMap component
  - Create `src/components/sensa/SensaLearnMap.tsx`
  - Display PBL nodes in blue (read-only)
  - Display analogy nodes in warm colors
  - Show connection lines between concepts and analogies
  - _Requirements: 5.1, 5.2_

- [ ] 13.2 Implement visualization modes
  - Create side-by-side view (PBL left, Sensa right)
  - Create integrated overlay view
  - Create tabbed navigation view
  - Add mode switcher
  - _Requirements: 5.1, 5.2_

- [ ] 13.3 Add interactive features
  - Hover on concept → highlight related analogies
  - Hover on analogy → highlight connected concepts
  - Click concept → show analogy creation form
  - Click analogy → show edit/strengthen options
  - _Requirements: 5.2_

- [ ] 13.4 Create AnalogyNode component
  - Create `src/components/sensa/AnalogyNode.tsx`
  - Display analogy summary
  - Show strength as color intensity
  - Add edit/delete icons
  - _Requirements: 5.2_

- [ ] 13.5 Create ConnectionLine component
  - Create `src/components/sensa/ConnectionLine.tsx`
  - Display dashed line between concept and analogy
  - Show strength as line thickness
  - Add hover tooltip
  - _Requirements: 5.2_

---

### - [ ] 14. View Switcher

- [ ] 14.1 Create ViewSwitcher component
  - Create `src/components/sensa/ViewSwitcher.tsx`
  - Add toggle between "PBL View" and "Sensa Learn View"
  - Add visual indicator of current mode
  - Persist selection in local storage
  - _Requirements: 5.1_

- [ ] 14.2 Update ConceptMapPage
  - Update `src/pages/conceptMap/ConceptMapPage.tsx`
  - Add ViewSwitcher to header
  - Pass mode prop to ConceptMapVisualization
  - Handle mode changes
  - _Requirements: 5.1_

- [ ] 14.3 Add mode-specific toolbars
  - Show PBL-specific tools in PBL mode (layout, export)
  - Show Sensa-specific tools in Sensa mode (create analogy, filter)
  - Hide irrelevant tools based on mode
  - _Requirements: 5.1, 5.2_

---

## Phase 7: Testing & Polish (Week 13-14)

### - [ ] 15. Integration Testing

- [ ] 15.1 Test end-to-end PBL pipeline
  - Upload document
  - Verify structure classification
  - Check concept map with structure types
  - Validate relationship types
  - _Requirements: All PBL requirements_

- [ ] 15.2 Test end-to-end Sensa Learn flow
  - Complete onboarding
  - Generate questions for concept
  - Create analogy
  - Verify storage and display
  - _Requirements: All Sensa requirements_

- [ ] 15.3 Test cross-document learning
  - Create analogies in document 1
  - Upload document 2
  - Verify suggestions appear
  - Test apply/dismiss functionality
  - _Requirements: 9.1, 9.2_

- [ ] 15.4 Test dual-mode visualization
  - Switch between PBL and Sensa views
  - Verify data consistency
  - Test interactive features
  - Check performance
  - _Requirements: 5.1, 5.2_

---

### - [ ] 16. Performance Optimization

- [ ] 16.1 Optimize question generation
  - Add caching for generated questions
  - Implement async processing
  - Add loading states
  - _Requirements: 7.3_

- [ ] 16.2 Optimize analogy suggestions
  - Cache semantic search results
  - Limit suggestion count
  - Add pagination if needed
  - _Requirements: 9.1_

- [ ] 16.3 Optimize visualization rendering
  - Implement virtualization for large maps
  - Add progressive loading
  - Optimize D3.js performance
  - _Requirements: 5.1, 5.2_

---

### - [ ] 17. Documentation & Deployment

- [ ] 17.1 Update API documentation
  - Document all new Sensa Learn endpoints
  - Add request/response examples
  - Update Swagger/OpenAPI spec
  - _Requirements: All_

- [ ] 17.2 Create user guide
  - Write guide for PBL View features
  - Write guide for Sensa Learn features
  - Add screenshots and examples
  - _Requirements: All_

- [ ] 17.3 Update deployment scripts
  - Add database migration to deployment
  - Update environment variables
  - Test deployment on staging
  - _Requirements: All_

- [ ] 17.4 Create rollback plan
  - Document rollback procedures
  - Test rollback on staging
  - Prepare emergency contacts
  - _Requirements: All_

---

## Optional Enhancements (Post-Launch)

### - [ ] 18. Advanced Features

- [ ]* 18.1 Add concept resolution for synonyms
  - Detect duplicate concepts with high similarity
  - Present merge/alias confirmation UI
  - Update relationships after merge
  - _Requirements: 2.1_

- [ ]* 18.2 Add learning analytics
  - Track analogy usage
  - Calculate retention metrics
  - Display analytics dashboard
  - _Requirements: 6.3_

- [ ]* 18.3 Add collaborative features
  - Share analogies with other users
  - Community analogy library
  - Voting on helpful analogies
  - _Requirements: 6.3_

---

## Success Criteria

- ✅ All database migrations complete without data loss
- ✅ Structure classification accuracy > 85%
- ✅ Question generation time < 3 seconds
- ✅ Analogy suggestion relevance > 70%
- ✅ Visualization render time < 1 second
- ✅ Zero breaking changes to existing PBL functionality
- ✅ All tests passing
- ✅ Documentation complete

---

**Total Estimated Time**: 10-14 weeks  
**Priority**: P0 (Core Value Proposition)  
**Status**: Ready for Implementation
