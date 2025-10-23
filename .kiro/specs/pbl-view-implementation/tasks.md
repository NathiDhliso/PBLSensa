# PBL View Implementation: Task List

## Overview

This task list breaks down the PBL View implementation into discrete, manageable coding steps. Each task builds incrementally on previous work, following test-driven development principles where appropriate.

---

## Phase 1: Foundation & Data Models (Week 1)

### 1. Database Schema Setup

- [ ] 1.1 Create database migration for PBL tables
  - Create migration file `20250124_0001_pbl_view_tables.sql`
  - Add columns to `concepts` table: `importance_score`, `validated`, `merged_into`
  - Add columns to `relationships` table: ensure all design fields present
  - Create `pbl_visualizations` table with JSONB columns
  - Add indexes for performance
  - _Requirements: 1.1, 2.1, 4.1_

- [ ] 1.2 Create Concept data model
  - Create `backend/models/pbl_concept.py`
  - Define `Concept` Pydantic model with all fields
  - Add validation rules (term length, definition required)
  - Create `ConceptCreate`, `ConceptUpdate` schemas
  - _Requirements: 1.4_

- [ ] 1.3 Create Relationship data model
  - Create `backend/models/pbl_relationship.py`
  - Define `Relationship` Pydantic model
  - Add enums for `RelationshipType` and `StructureCategory`
  - Create `RelationshipCreate` schema
  - _Requirements: 2.5, 2.6_

- [ ] 1.4 Create Visualization data models
  - Create `backend/models/pbl_visualization.py`
  - Define `DiagramNode`, `DiagramEdge`, `PBLVisualization` models
  - Add `Point`, `NodeStyle`, `EdgeStyle` helper classes
  - _Requirements: 4.2, 4.3_

---

## Phase 2: Concept Extraction Service (Week 2-3)

### 2. PDF Parsing and Text Extraction

- [ ] 2.1 Set up PDF parsing infrastructure
  - Install `pdfplumber` library
  - Create `backend/services/pdf_parser.py`
  - Implement `parse_pdf_with_positions()` method
  - Extract text with page numbers and bounding boxes
  - Handle multi-column layouts
  - _Requirements: 1.1_

- [ ] 2.2 Implement text chunking
  - Create `_chunk_text()` method in PDF parser
  - Split text into 1000-token chunks with 200-token overlap
  - Preserve page number metadata
  - Return `List[TextChunk]` with position data
  - _Requirements: 1.1_

### 3. ConceptExtractor Service

- [ ] 3.1 Create ConceptExtractor service skeleton
  - Create `backend/services/pbl/concept_extractor.py`
  - Define class with `__init__` and main methods
  - Set up Bedrock client integration
  - Add error handling structure
  - _Requirements: 1.1, 1.2_

- [ ] 3.2 Implement Claude-based concept extraction
  - Create `_claude_extract_concepts()` method
  - Build prompt template for concept extraction
  - Call Claude via Bedrock with proper parameters
  - Parse JSON response into concept data
  - Handle API errors with retries
  - _Requirements: 1.2, 1.3_

- [ ] 3.3 Implement context enrichment
  - Create `_enrich_with_context()` method
  - Find surrounding concepts within same chunk
  - Extract source sentences containing the term
  - Calculate importance score based on frequency
  - _Requirements: 1.4_

- [ ] 3.4 Implement embedding generation
  - Create `_generate_embeddings()` method
  - Use Bedrock Titan Embeddings model
  - Generate 768-dimension vectors
  - Batch process for efficiency
  - Cache embeddings in Redis
  - _Requirements: 3.1_

- [ ] 3.5 Integrate full extraction pipeline
  - Implement `extract_concepts()` main method
  - Orchestrate: parse → chunk → extract → enrich → embed
  - Add progress tracking
  - Return `List[Concept]` with all fields populated
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### 4. Concept Service (Database Operations)

- [ ] 4.1 Create ConceptService for CRUD operations
  - Create `backend/services/pbl/concept_service.py`
  - Implement `create()`, `get()`, `update()`, `delete()` methods
  - Implement `bulk_create()` for batch inserts
  - Add `get_by_document()` to fetch all concepts for a document
  - _Requirements: 1.6_

- [ ] 4.2 Add concept validation methods
  - Implement `validate_concepts()` method
  - Update `validated` field in database
  - Handle bulk approval/rejection
  - Return validation statistics
  - _Requirements: 6.3, 6.4, 6.5_

---

## Phase 3: Structure Classification (Week 4)

### 5. StructureClassifier Service

- [ ] 5.1 Integrate existing StructureClassifier
  - Move `backend/services/structure_classifier.py` to `backend/services/pbl/`
  - Update imports and references
  - Ensure compatibility with new Concept model
  - _Requirements: 2.1, 2.2_

- [ ] 5.2 Enhance pattern matching
  - Review and expand hierarchical patterns
  - Review and expand sequential patterns
  - Add confidence scoring
  - Test pattern matching with sample data
  - _Requirements: 2.2, 2.3_

- [ ] 5.3 Improve Claude validation
  - Refine validation prompt template
  - Add structured output parsing
  - Implement fallback logic if Claude fails
  - Cache validation results
  - _Requirements: 2.4_

- [ ] 5.4 Add context-based relationship detection
  - Implement `_shares_context()` method improvements
  - Check for co-occurrence in same sentences
  - Check for proximity on same page
  - Weight relationships by context strength
  - _Requirements: 2.1_

### 6. Relationship Service

- [ ] 6.1 Create RelationshipService
  - Create `backend/services/pbl/relationship_service.py`
  - Implement CRUD operations
  - Implement `bulk_create()` for batch inserts
  - Add `get_by_document()` method
  - Add `get_by_concept()` method
  - _Requirements: 2.7_

- [ ] 6.2 Add relationship filtering
  - Implement `get_by_category()` (hierarchical/sequential)
  - Implement `get_by_type()` (is_a, precedes, etc.)
  - Add strength threshold filtering
  - _Requirements: 2.5, 2.6_

---

## Phase 4: Concept Deduplication (Week 5)

### 7. ConceptDeduplicator Service

- [ ] 7.1 Create ConceptDeduplicator service
  - Create `backend/services/pbl/concept_deduplicator.py`
  - Implement `find_duplicates()` method
  - Use pgvector for similarity search
  - Set similarity threshold at 0.95
  - _Requirements: 3.2_

- [ ] 7.2 Implement similarity calculation
  - Create `_calculate_similarity()` method
  - Compute cosine similarity of embeddings
  - Check for abbreviation patterns (VM → Virtual Machine)
  - Return similarity score and reasoning
  - _Requirements: 3.2_

- [ ] 7.3 Implement concept merging
  - Create `merge_concepts()` method
  - Consolidate source_sentences and surrounding_concepts
  - Update all relationships to point to primary concept
  - Soft delete duplicate (set `merged_into` field)
  - _Requirements: 3.5_

- [ ] 7.4 Add duplicate resolution UI data
  - Create `DuplicatePair` model
  - Format duplicate suggestions for frontend
  - Include similarity score and merge preview
  - _Requirements: 3.3, 3.4_

---

## Phase 5: Visualization Engine (Week 6-7)

### 8. Layout Algorithms

- [ ] 8.1 Implement tree layout algorithm
  - Create `backend/services/pbl/layouts/tree_layout.py`
  - Implement top-down hierarchical positioning
  - Balance node distribution
  - Calculate node positions as `{x, y}` coordinates
  - _Requirements: 4.2_

- [ ] 8.2 Implement mind map layout algorithm
  - Create `backend/services/pbl/layouts/mindmap_layout.py`
  - Implement radial distribution from center
  - Calculate curved connection paths
  - _Requirements: 4.2_

- [ ] 8.3 Implement flowchart layout algorithm
  - Create `backend/services/pbl/layouts/flowchart_layout.py`
  - Implement left-to-right sequential flow
  - Add swimlane support for grouped concepts
  - _Requirements: 4.2_

- [ ] 8.4 Implement hybrid layout algorithm
  - Create `backend/services/pbl/layouts/hybrid_layout.py`
  - Arrange hierarchical clusters vertically
  - Arrange sequential flows horizontally within clusters
  - Minimize edge crossings
  - _Requirements: 4.2, 4.5_

### 9. PBLVisualizationEngine Service

- [ ] 9.1 Create PBLVisualizationEngine service
  - Create `backend/services/pbl/visualization_engine.py`
  - Implement `create_default_visualization()` method
  - Load concepts and relationships from database
  - Apply default hybrid layout
  - _Requirements: 4.1, 4.6_

- [ ] 9.2 Implement node generation
  - Create `_generate_nodes()` method
  - Convert concepts to DiagramNode objects
  - Apply styling based on structure_type
  - Set initial positions using layout algorithm
  - _Requirements: 4.3_

- [ ] 9.3 Implement edge generation
  - Create `_generate_edges()` method
  - Convert relationships to DiagramEdge objects
  - Apply styling based on structure_category
  - Add labels for relationship types
  - _Requirements: 4.4, 4.5_

- [ ] 9.4 Add layout switching
  - Implement `apply_layout()` method
  - Support switching between tree, mindmap, flowchart, hybrid
  - Recalculate node positions
  - Preserve user customizations where possible
  - _Requirements: 4.7_

### 10. Visualization Service

- [ ] 10.1 Create VisualizationService for persistence
  - Create `backend/services/pbl/visualization_service.py`
  - Implement `get_or_create()` method
  - Implement `update()` method for saving edits
  - Store nodes and edges as JSONB
  - _Requirements: 4.6, 5.8_

- [ ] 10.2 Add node update operations
  - Implement `update_node()` method
  - Update position, label, or style
  - Validate changes before saving
  - _Requirements: 5.2, 5.3_

- [ ] 10.3 Add edge operations
  - Implement `create_edge()` method
  - Implement `delete_edge()` method
  - Validate source and target nodes exist
  - _Requirements: 5.4, 5.7_

- [ ] 10.4 Add node deletion
  - Implement `delete_node()` method
  - Cascade delete connected edges
  - Update visualization JSON
  - _Requirements: 5.6_

---

## Phase 6: PBL Pipeline Orchestrator (Week 8)

### 11. Pipeline Orchestration

- [x] 11.1 Create PBLPipeline orchestrator
  - Create `backend/services/pbl/pbl_pipeline.py`
  - Implement `process_document()` main method
  - Coordinate all services in sequence
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 11.2 Add progress tracking
  - Implement progress callback system
  - Track stages: parsing, extraction, classification, visualization
  - Store progress in Redis
  - Emit WebSocket events for real-time updates
  - _Requirements: 9.2_

- [x] 11.3 Implement error handling
  - Add try-catch blocks for each stage
  - Implement graceful degradation
  - Return partial results with warnings
  - Log errors to CloudWatch
  - _Requirements: 9.4, 9.5_

- [ ] 11.4 Add async processing (DEFERRED - Option A chosen)
  - Set up Celery task for document processing
  - Create background job queue
  - Implement task status checking
  - _Requirements: 9.1_

---

## Phase 7: API Endpoints (Week 9)

### 12. Document Processing Endpoints

- [ ] 12.1 Create document upload endpoint
  - Create `backend/routers/pbl_documents.py`
  - Implement `POST /api/pbl/documents/upload`
  - Handle multipart file upload
  - Validate PDF file type and size
  - Start async processing task
  - Return task_id and document_id
  - _Requirements: 1.1_

- [ ] 12.2 Create processing status endpoint
  - Implement `GET /api/pbl/documents/{document_id}/status`
  - Query task status from Celery
  - Return progress percentage and current stage
  - _Requirements: 9.2_

### 13. Concept Management Endpoints

- [ ] 13.1 Create concept listing endpoint
  - Implement `GET /api/pbl/documents/{document_id}/concepts`
  - Support filtering by validated, structure_type
  - Add pagination
  - Return concept list with metadata
  - _Requirements: 1.6, 6.1_

- [ ] 13.2 Create concept validation endpoint
  - Implement `POST /api/pbl/documents/{document_id}/concepts/validate`
  - Accept arrays of approved, rejected, edited concepts
  - Bulk update database
  - Return validation statistics
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 13.3 Create single concept endpoints
  - Implement `GET /api/pbl/concepts/{concept_id}`
  - Implement `PUT /api/pbl/concepts/{concept_id}`
  - Implement `DELETE /api/pbl/concepts/{concept_id}`
  - _Requirements: 5.2, 5.3, 5.6_

### 14. Relationship Endpoints

- [ ] 14.1 Create relationship listing endpoint
  - Implement `GET /api/pbl/documents/{document_id}/structures`
  - Return hierarchical and sequential relationships separately
  - Support filtering by category and type
  - _Requirements: 2.7_

- [ ] 14.2 Create relationship CRUD endpoints
  - Implement `POST /api/pbl/relationships`
  - Implement `DELETE /api/pbl/relationships/{relationship_id}`
  - _Requirements: 5.4, 5.7_

### 15. Deduplication Endpoints

- [ ] 15.1 Create duplicate detection endpoint
  - Implement `GET /api/pbl/documents/{document_id}/duplicates`
  - Return list of potential duplicate pairs
  - Include similarity scores
  - _Requirements: 3.3_

- [ ] 15.2 Create merge endpoint
  - Implement `POST /api/pbl/concepts/merge`
  - Accept primary_id and duplicate_id
  - Perform merge operation
  - Return merged concept
  - _Requirements: 3.4, 3.5_

### 16. Visualization Endpoints

- [ ] 16.1 Create visualization retrieval endpoint
  - Implement `GET /api/pbl/visualizations/{document_id}`
  - Get or create visualization for document
  - Return full visualization data
  - _Requirements: 4.6_

- [ ] 16.2 Create visualization update endpoint
  - Implement `PUT /api/pbl/visualizations/{visualization_id}`
  - Accept full visualization object
  - Update database
  - _Requirements: 5.8_

- [ ] 16.3 Create node update endpoint
  - Implement `PUT /api/pbl/visualizations/{visualization_id}/nodes/{node_id}`
  - Update single node properties
  - _Requirements: 5.2, 5.3_

- [ ] 16.4 Create edge management endpoints
  - Implement `POST /api/pbl/visualizations/{visualization_id}/edges`
  - Implement `DELETE /api/pbl/visualizations/{visualization_id}/edges/{edge_id}`
  - _Requirements: 5.4, 5.7_

- [ ] 16.5 Create layout change endpoint
  - Implement `POST /api/pbl/visualizations/{visualization_id}/layout`
  - Accept layout_type parameter
  - Recalculate positions
  - Return updated visualization
  - _Requirements: 4.7_

- [ ] 16.6 Create export endpoint
  - Implement `GET /api/pbl/visualizations/{visualization_id}/export`
  - Support PNG, PDF, JSON formats
  - Generate file and return download
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

---

## Phase 8: Frontend Components (Week 10-11)

### 17. TypeScript Types and API Client

- [ ] 17.1 Create TypeScript type definitions
  - Create `src/types/pbl.ts`
  - Define interfaces for Concept, Relationship, PBLVisualization
  - Define DiagramNode, DiagramEdge types
  - Export all types
  - _Requirements: 4.1_

- [ ] 17.2 Create PBL API client
  - Create `src/services/pblApi.ts`
  - Implement all API endpoint calls
  - Add error handling and retries
  - Use axios or fetch
  - _Requirements: All API endpoints_

### 18. Concept Review Components

- [ ] 18.1 Create ConceptCard component
  - Create `src/components/pbl/ConceptCard.tsx`
  - Display term, definition, source context
  - Add approve/reject/edit buttons
  - Show validation status
  - _Requirements: 6.2_

- [ ] 18.2 Create ConceptReviewPanel component
  - Create `src/components/pbl/ConceptReviewPanel.tsx`
  - List all extracted concepts
  - Support bulk actions (approve all, reject all)
  - Add filtering by structure_type
  - Show validation progress
  - _Requirements: 6.1, 6.6_

- [ ] 18.3 Create DuplicateResolver component
  - Create `src/components/pbl/DuplicateResolver.tsx`
  - Display potential duplicate pairs
  - Show similarity scores
  - Add merge/keep separate buttons
  - Preview merge result
  - _Requirements: 3.3, 3.4, 3.5_

### 19. Visualization Components

- [ ] 19.1 Set up React Flow
  - Install `reactflow` library
  - Create basic canvas setup
  - Configure zoom, pan, drag controls
  - _Requirements: 4.6_

- [ ] 19.2 Create custom node components
  - Create `src/components/pbl/nodes/HierarchicalNode.tsx`
  - Create `src/components/pbl/nodes/SequentialNode.tsx`
  - Create `src/components/pbl/nodes/UnclassifiedNode.tsx`
  - Apply styling based on design spec
  - _Requirements: 4.3_

- [ ] 19.3 Create custom edge components
  - Create `src/components/pbl/edges/HierarchicalEdge.tsx`
  - Create `src/components/pbl/edges/SequentialEdge.tsx`
  - Create `src/components/pbl/edges/CrossTypeEdge.tsx`
  - Apply styling (solid, dashed, arrows)
  - _Requirements: 4.4, 4.5_

- [ ] 19.4 Create PBLCanvas component
  - Create `src/components/pbl/PBLCanvas.tsx`
  - Integrate React Flow with custom nodes/edges
  - Handle node drag events
  - Handle connection creation
  - Handle node selection
  - _Requirements: 4.6, 4.7, 5.1_

- [ ] 19.5 Create NodeEditor dialog
  - Create `src/components/pbl/NodeEditor.tsx`
  - Modal dialog for editing node
  - Edit label and definition
  - Save changes to API
  - _Requirements: 5.2, 5.3_

- [ ] 19.6 Create EdgeCreator dialog
  - Create `src/components/pbl/EdgeCreator.tsx`
  - Modal for selecting relationship type
  - Dropdown with all relationship types
  - Create edge via API
  - _Requirements: 5.4_

### 20. Visualization Controls

- [ ] 20.1 Create VisualizationControls component
  - Create `src/components/pbl/VisualizationControls.tsx`
  - Add layout switcher dropdown
  - Add zoom in/out buttons
  - Add fit-to-screen button
  - Add export button
  - _Requirements: 4.7, 7.1_

- [ ] 20.2 Create ExportDialog component
  - Create `src/components/pbl/ExportDialog.tsx`
  - Modal with format selection (PNG, PDF, JSON)
  - Trigger download via API
  - Show export progress
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

### 21. Processing Status Components

- [ ] 21.1 Create ProcessingStatus component
  - Create `src/components/pbl/ProcessingStatus.tsx`
  - Show progress bar
  - Display current stage
  - Show estimated time remaining
  - Handle errors and warnings
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] 21.2 Create StructureExplorer component
  - Create `src/components/pbl/StructureExplorer.tsx`
  - List all relationships
  - Filter by category (hierarchical/sequential)
  - Click to highlight in visualization
  - _Requirements: 2.7_

### 22. Custom Hooks

- [ ] 22.1 Create usePBLVisualization hook
  - Create `src/hooks/usePBLVisualization.ts`
  - Manage nodes and edges state
  - Implement updateNode, addEdge, deleteNode
  - Implement changeLayout
  - Handle loading and errors
  - _Requirements: 4.6, 5.2, 5.3, 5.4, 5.6, 5.7_

- [ ] 22.2 Create useConcepts hook
  - Create `src/hooks/useConcepts.ts`
  - Fetch concepts for document
  - Implement validation operations
  - Handle concept CRUD
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 22.3 Create useRelationships hook
  - Create `src/hooks/useRelationships.ts`
  - Fetch relationships for document
  - Filter by category and type
  - Create and delete relationships
  - _Requirements: 2.7, 5.4, 5.7_

- [ ] 22.4 Create useDocumentProcessing hook
  - Create `src/hooks/useDocumentProcessing.ts`
  - Poll processing status
  - Handle WebSocket updates
  - Return progress data
  - _Requirements: 9.2_

### 23. Main Pages

- [ ] 23.1 Create ConceptValidationPage
  - Create `src/pages/pbl/ConceptValidationPage.tsx`
  - Show ConceptReviewPanel
  - Show DuplicateResolver
  - Navigate to visualization when complete
  - _Requirements: 6.1, 6.6, 6.7_

- [ ] 23.2 Create PBLDocumentPage
  - Create `src/pages/pbl/PBLDocumentPage.tsx`
  - Main PBL view with canvas
  - Show VisualizationControls
  - Show StructureExplorer in sidebar
  - Add "Switch to Sensa Learn" button
  - _Requirements: 4.1, 10.1, 10.2_

---

## Phase 9: Integration & Polish (Week 12)

### 24. Sensa Learn Integration

- [ ] 24.1 Add PBL-to-Sensa navigation
  - Add button in PBLDocumentPage
  - Pass concept list to Sensa Learn
  - Maintain document context
  - _Requirements: 10.1, 10.2_

- [ ] 24.2 Add Sensa-to-PBL navigation
  - Add button in Sensa Learn view
  - Load PBL visualization
  - Highlight concepts with analogies
  - _Requirements: 10.3_

- [ ] 24.3 Create connection visualization
  - Show which PBL concepts have analogies
  - Add visual indicators (badges, colors)
  - Display analogy count per concept
  - _Requirements: 10.4_

- [ ] 24.4 Implement bidirectional linking
  - Link analogies to PBL concepts via concept_id
  - Update PBL view when analogies created
  - Update Sensa view when concepts edited
  - _Requirements: 10.5_

### 25. Performance Optimization

- [ ] 25.1 Implement caching
  - Set up Redis caching for concepts
  - Cache relationships
  - Cache visualizations
  - Set appropriate TTLs
  - _Requirements: 9.1, 9.4_

- [ ] 25.2 Optimize database queries
  - Add missing indexes
  - Use EXPLAIN ANALYZE
  - Implement batch operations
  - _Requirements: 9.4_

- [ ] 25.3 Optimize frontend rendering
  - Implement virtual scrolling for concept lists
  - Lazy load visualization data
  - Debounce API calls
  - Optimize canvas rendering
  - _Requirements: 9.3, 9.4_

### 26. Testing

- [ ] 26.1 Write unit tests for backend services
  - Test ConceptExtractor
  - Test StructureClassifier
  - Test PBLVisualizationEngine
  - Test all CRUD services
  - _Requirements: All backend_

- [ ] 26.2 Write API integration tests
  - Test all endpoints
  - Test error handling
  - Test authentication
  - _Requirements: All API endpoints_

- [ ] 26.3 Write frontend component tests
  - Test PBLCanvas interactions
  - Test ConceptReviewPanel
  - Test all dialogs and modals
  - _Requirements: All frontend_

- [ ] 26.4 Write E2E tests
  - Test full upload → validate → visualize flow
  - Test editing and customization
  - Test export functionality
  - Test PBL-Sensa integration
  - _Requirements: All requirements_

### 27. Documentation & Deployment

- [ ] 27.1 Write API documentation
  - Document all endpoints with examples
  - Create Postman collection
  - Add authentication guide
  - _Requirements: All API endpoints_

- [ ] 27.2 Write user documentation
  - Create user guide for PBL view
  - Add tooltips and help text in UI
  - Create video tutorials
  - _Requirements: All user-facing features_

- [ ] 27.3 Deploy to staging
  - Run database migrations
  - Deploy backend services
  - Deploy frontend
  - Test in staging environment
  - _Requirements: All_

- [ ] 27.4 Monitor and iterate
  - Set up CloudWatch dashboards
  - Monitor error rates
  - Track performance metrics
  - Gather user feedback
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

---

## Summary

**Total Tasks**: 95 tasks across 27 major components
**Estimated Timeline**: 12 weeks
**Team Size**: 2-3 developers

**Phase Breakdown**:
- Phase 1: Foundation (1 week)
- Phase 2: Concept Extraction (2 weeks)
- Phase 3: Structure Classification (1 week)
- Phase 4: Deduplication (1 week)
- Phase 5: Visualization Engine (2 weeks)
- Phase 6: Pipeline Orchestration (1 week)
- Phase 7: API Endpoints (1 week)
- Phase 8: Frontend Components (2 weeks)
- Phase 9: Integration & Polish (1 week)

**Dependencies**:
- AWS Bedrock access for Claude API
- PostgreSQL with pgvector extension
- Redis for caching
- React Flow library
- Celery for async processing

---

**Status**: Ready for Implementation
