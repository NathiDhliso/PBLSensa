# Requirements Document: PDF v7.0 Accuracy Enhancements

## Introduction

This document defines requirements for implementing v7.0 accuracy enhancements to the existing PDF processing pipeline. The current pipeline successfully extracts concepts and relationships but has accuracy limitations due to:

1. **Missing Content (25%)**: Basic pdfplumber misses scanned/image-based content
2. **Single-Method Extraction**: Relies solely on Claude for concept extraction
3. **No Structure Preservation**: Flat text extraction loses hierarchical information
4. **Isolated Processing**: Chunks processed without cross-chunk context (RAG)

**Current State**: 
- Pipeline processes PDFs and extracts concepts
- Structure classification works (hierarchical vs sequential)
- Dual-view system (PBL + Sensa Learn) operational
- Layer 0 optimization provides caching and cost tracking

**Desired State**: 
- 100% content capture (including scanned PDFs)
- Multi-method ensemble extraction (3x more accurate)
- Hierarchical structure preservation from source
- RAG-powered relationship detection with context
- 170%+ accuracy improvement overall

---

## Requirements

### Requirement 1: Multi-Method PDF Parsing with Fallback Chain

**User Story:** As a student, I want the system to extract all content from my PDFs including scanned pages, so that I don't miss important information.

#### Acceptance Criteria

1. WHEN a PDF is uploaded THEN the system SHALL attempt parsing with LlamaParse first
2. WHEN LlamaParse succeeds THEN the system SHALL extract structured markdown with heading hierarchy preserved
3. WHEN LlamaParse fails THEN the system SHALL fall back to Amazon Textract with OCR and layout detection
4. WHEN Textract fails THEN the system SHALL fall back to pdfplumber with basic text extraction
5. WHEN parsing completes THEN the system SHALL tag results with the method used (`llamaparse`, `textract`, `pdfplumber`)
6. WHEN scanned content is detected THEN the system SHALL automatically use OCR-capable methods
7. WHEN all methods fail THEN the system SHALL log the error and notify the user with specific failure reasons

---

### Requirement 2: Hierarchical Structure Extraction from Markdown

**User Story:** As a student, I want the system to understand the chapter and section structure of my textbook, so that concepts are organized logically.

#### Acceptance Criteria

1. WHEN LlamaParse returns markdown THEN the system SHALL extract heading hierarchy (H1, H2, H3, H4, H5, H6)
2. WHEN headings are extracted THEN the system SHALL create a normalized hierarchy with consistent IDs
3. WHEN numbered lists are detected THEN the system SHALL identify them as sequential structures
4. WHEN nested lists are detected THEN the system SHALL preserve parent-child relationships
5. WHEN Textract is used THEN the system SHALL extract layout blocks and convert to hierarchy
6. WHEN hierarchy is stored THEN the system SHALL include level, title, type, and parent references
7. WHEN hierarchy extraction fails THEN the system SHALL fall back to page-based chunking

---

### Requirement 3: Ensemble Keyword Extraction (KeyBERT + YAKE + spaCy)

**User Story:** As a student, I want the system to identify the most important concepts accurately, so that I focus on what matters.

#### Acceptance Criteria

1. WHEN extracting concepts THEN the system SHALL use KeyBERT for semantic keyword extraction
2. WHEN extracting concepts THEN the system SHALL use YAKE for statistical keyword extraction
3. WHEN extracting concepts THEN the system SHALL use spaCy TextRank for graph-based extraction
4. WHEN all methods complete THEN the system SHALL combine results using voting/scoring
5. WHEN combining results THEN the system SHALL only keep keywords agreed upon by 2+ methods
6. WHEN keywords are stored THEN the system SHALL include confidence scores (0.0-1.0)
7. WHEN keywords are stored THEN the system SHALL include the count of methods that found them
8. WHEN confidence is below 0.5 THEN the system SHALL mark the concept as low-confidence
9. WHEN Claude generates definitions THEN the system SHALL only process high-confidence keywords first

---

### Requirement 4: RAG-Powered Relationship Detection

**User Story:** As a student, I want the system to find connections between concepts across different chapters, so that I understand how topics relate.

#### Acceptance Criteria

1. WHEN detecting relationships THEN the system SHALL use semantic search to find related concepts
2. WHEN searching for relationships THEN the system SHALL query pgvector with concept embeddings
3. WHEN searching THEN the system SHALL prioritize concepts from the same chapter first
4. WHEN same-chapter results are sparse (<3) THEN the system SHALL expand to neighboring chapters
5. WHEN related concepts are found THEN the system SHALL provide them as context to Claude
6. WHEN Claude analyzes relationships THEN the system SHALL include up to 10 related concepts in the prompt
7. WHEN relationships are stored THEN the system SHALL include the similarity score from vector search
8. WHEN relationships are displayed THEN the system SHALL show confidence based on similarity + Claude validation

---

### Requirement 5: Hierarchy Normalization and ID Assignment

**User Story:** As a student, I want the concept map to show the document structure clearly, so that I can navigate by chapters and sections.

#### Acceptance Criteria

1. WHEN hierarchy is extracted THEN the system SHALL assign consistent IDs (chapter_1, chapter_1_section_1, etc.)
2. WHEN assigning IDs THEN the system SHALL maintain parent-child references
3. WHEN storing hierarchy THEN the system SHALL include level (1-6), title, type (hierarchical/sequential)
4. WHEN concepts are extracted THEN the system SHALL tag each with its structure_id (location in hierarchy)
5. WHEN displaying the concept map THEN the system SHALL use hierarchy to organize node layout
6. WHEN users navigate THEN the system SHALL allow filtering by chapter or section
7. WHEN hierarchy is incomplete THEN the system SHALL create synthetic structure based on page numbers

---

### Requirement 6: Cost Optimization with Intelligent Method Selection

**User Story:** As a system administrator, I want to minimize processing costs while maintaining accuracy, so that the service is sustainable.

#### Acceptance Criteria

1. WHEN a PDF is uploaded THEN the system SHALL estimate costs for each parsing method
2. WHEN estimating costs THEN the system SHALL consider document type (digital vs scanned)
3. WHEN document is digital THEN the system SHALL prefer LlamaParse ($0.10-0.30 per doc)
4. WHEN document is scanned THEN the system SHALL use Textract ($1-3 per doc)
5. WHEN cost exceeds threshold THEN the system SHALL request user approval before processing
6. WHEN processing completes THEN the system SHALL track actual costs in layer0_cost_tracking
7. WHEN costs are tracked THEN the system SHALL calculate savings from caching and method selection

---

### Requirement 7: Enhanced Concept Extraction with Context

**User Story:** As a student, I want concept definitions to be accurate and contextual, so that I understand terms in the right way.

#### Acceptance Criteria

1. WHEN extracting concepts THEN the system SHALL include surrounding sentences (2 before, 2 after)
2. WHEN storing concepts THEN the system SHALL save source_sentences array
3. WHEN generating definitions THEN the system SHALL provide Claude with full context
4. WHEN concepts appear multiple times THEN the system SHALL merge definitions from all occurrences
5. WHEN concepts are ambiguous THEN the system SHALL use document subject to disambiguate
6. WHEN definitions are generated THEN the system SHALL be 1-2 sentences maximum
7. WHEN definitions are stored THEN the system SHALL include page number and section reference

---

### Requirement 8: Performance and Caching Integration

**User Story:** As a student, I want my documents to process quickly on repeat views, so that I don't waste time waiting.

#### Acceptance Criteria

1. WHEN a PDF is uploaded THEN the system SHALL check Layer 0 cache by hash
2. WHEN cache hit occurs THEN the system SHALL return results in <500ms
3. WHEN cache miss occurs THEN the system SHALL process with v7.0 pipeline
4. WHEN processing completes THEN the system SHALL cache results with compression
5. WHEN caching THEN the system SHALL use versioned keys: `v7_processed:{hash}`
6. WHEN pipeline version changes THEN the system SHALL invalidate old cache entries
7. WHEN cache is full THEN the system SHALL use LRU eviction policy

---

### Requirement 9: Processing Status and Progress Tracking

**User Story:** As a student, I want to see detailed progress during PDF processing, so that I know what's happening.

#### Acceptance Criteria

1. WHEN processing starts THEN the system SHALL display current step and progress percentage
2. WHEN each step completes THEN the system SHALL update status in real-time
3. WHEN displaying status THEN the system SHALL show: "Parsing PDF", "Extracting hierarchy", "Finding concepts", "Detecting relationships"
4. WHEN using fallback methods THEN the system SHALL notify user (e.g., "Using OCR for scanned pages")
5. WHEN processing completes THEN the system SHALL show summary: method used, concepts found, relationships detected
6. WHEN errors occur THEN the system SHALL show specific error message and retry option
7. WHEN processing takes >2 minutes THEN the system SHALL show estimated time remaining

---

### Requirement 10: Accuracy Metrics and Validation

**User Story:** As a system administrator, I want to track accuracy improvements, so that I can validate the v7.0 enhancements.

#### Acceptance Criteria

1. WHEN processing completes THEN the system SHALL calculate accuracy metrics
2. WHEN calculating metrics THEN the system SHALL track: concepts found, confidence scores, relationships detected
3. WHEN storing metrics THEN the system SHALL compare to baseline (pre-v7.0)
4. WHEN displaying results THEN the system SHALL show accuracy improvement percentage
5. WHEN confidence is low THEN the system SHALL flag concepts for manual review
6. WHEN relationships are weak THEN the system SHALL mark them as "suggested" not "confirmed"
7. WHEN metrics are tracked THEN the system SHALL store in database for analytics

---

### Requirement 11: Reusable Code Integration

**User Story:** As a developer, I want v7.0 enhancements to reuse existing code, so that we maintain consistency and reduce duplication.

#### Acceptance Criteria

1. WHEN implementing v7.0 THEN the system SHALL extend existing PDFParser class
2. WHEN implementing v7.0 THEN the system SHALL reuse ConceptExtractor base logic
3. WHEN implementing v7.0 THEN the system SHALL extend Layer0CacheService for v7.0 caching
4. WHEN implementing v7.0 THEN the system SHALL reuse existing embedding_service for vectors
5. WHEN implementing v7.0 THEN the system SHALL extend CostTracker for new method costs
6. WHEN implementing v7.0 THEN the system SHALL reuse existing database models (Concept, Relationship)
7. WHEN implementing v7.0 THEN the system SHALL maintain backward compatibility with existing API endpoints

---

### Requirement 12: Sensa Color Theme Consistency

**User Story:** As a user, I want the v7.0 features to match the existing Sensa Learn visual design, so that the experience is cohesive.

#### Acceptance Criteria

1. WHEN displaying processing status THEN the system SHALL use Sensa color palette (purple primary, warm accents)
2. WHEN showing confidence scores THEN the system SHALL use color coding: green (high), yellow (medium), red (low)
3. WHEN displaying hierarchy THEN the system SHALL use blue for hierarchical, green for sequential (existing pattern)
4. WHEN showing method badges THEN the system SHALL use: purple (LlamaParse), blue (Textract), gray (pdfplumber)
5. WHEN displaying progress THEN the system SHALL use animated gradients in Sensa theme
6. WHEN showing errors THEN the system SHALL use red accent with clear messaging
7. WHEN displaying success THEN the system SHALL use green accent with celebration animation

---

## Success Criteria

The v7.0 PDF Processing Pipeline will be considered successful when:

1. ✅ Content capture rate reaches 100% (including scanned PDFs)
2. ✅ Concept extraction accuracy improves by 40%+ (ensemble methods)
3. ✅ Relationship detection accuracy improves by 50%+ (RAG-powered)
4. ✅ Hierarchical structure is preserved and displayed correctly
5. ✅ Processing costs remain under $2 per document average
6. ✅ Cache hit rate exceeds 60% for repeat documents
7. ✅ Processing time stays under 5 minutes for 200-page documents
8. ✅ All existing features continue to work (backward compatibility)
9. ✅ Sensa color theme is consistent throughout
10. ✅ Code reuse exceeds 60% (extending existing services)

---

## Out of Scope

The following are explicitly out of scope for this feature:

- Real-time collaborative PDF annotation
- Video or audio content extraction
- Handwritten note recognition beyond OCR
- Custom ML model training
- Integration with external LMS systems
- Mobile app development
- Multi-language translation (English only for v7.0)

---

## Dependencies

### External Services
- LlamaParse API (new dependency)
- Amazon Textract (existing AWS service)
- AWS Bedrock Claude 3.5 Sonnet (existing)
- SageMaker HDT-E embeddings (existing)

### Python Libraries (New)
- `keybert` - Semantic keyword extraction
- `yake` - Statistical keyword extraction
- `spacy` - NLP and TextRank
- `pytextrank` - Graph-based keyword extraction
- `llama-parse` - LlamaParse Python client

### Existing Infrastructure
- PostgreSQL with pgvector (existing)
- Layer 0 cache service (existing)
- Cost tracking system (existing)
- Embedding service (existing)

---

## Technical Constraints

- Maximum PDF size: 100MB (unchanged)
- Maximum processing time: 10 minutes with timeout
- LlamaParse rate limit: 100 requests/hour (free tier)
- Textract rate limit: 10 concurrent jobs
- Ensemble extraction: 3 methods minimum
- RAG context: 10 related concepts maximum
- Cache TTL: 30 days (unchanged)
- Embedding dimension: 768 (HDT-E model, unchanged)

---

## Acceptance Testing Scenarios

### Scenario 1: Digital PDF with Clear Structure
```
GIVEN a user uploads a 150-page digital textbook with clear headings
WHEN the v7.0 pipeline processes it
THEN the system should:
  - Use LlamaParse successfully
  - Extract 10-15 chapter nodes with hierarchy
  - Find 100-150 concepts with 80%+ confidence
  - Detect 200-300 relationships with RAG context
  - Complete in < 3 minutes
  - Cost < $0.50
```

### Scenario 2: Scanned PDF Requiring OCR
```
GIVEN a user uploads a 100-page scanned PDF
WHEN the v7.0 pipeline processes it
THEN the system should:
  - Detect document type as "scanned"
  - Fall back to Textract automatically
  - Extract text with OCR
  - Find 80-120 concepts with 70%+ confidence
  - Complete in < 6 minutes
  - Cost < $2.50
  - Notify user that OCR was used
```

### Scenario 3: Hybrid PDF with Mixed Content
```
GIVEN a user uploads a PDF with both digital and scanned pages
WHEN the v7.0 pipeline processes it
THEN the system should:
  - Detect document type as "hybrid"
  - Use LlamaParse for digital pages
  - Use Textract for scanned pages
  - Merge results seamlessly
  - Find concepts from all pages
  - Complete in < 5 minutes
```

### Scenario 4: Ensemble Extraction Accuracy
```
GIVEN a user uploads a technical document
WHEN the ensemble extraction runs
THEN the system should:
  - Run KeyBERT, YAKE, and spaCy in parallel
  - Combine results with voting
  - Only keep concepts with 2+ method agreement
  - Assign confidence scores
  - Show 30-40% more concepts than single-method
  - Filter out low-confidence false positives
```

### Scenario 5: RAG-Powered Relationship Detection
```
GIVEN a document with cross-chapter concept references
WHEN the RAG relationship detection runs
THEN the system should:
  - Use pgvector to find semantically similar concepts
  - Provide top 10 related concepts to Claude
  - Detect relationships across chapters
  - Assign similarity-based confidence scores
  - Find 50% more relationships than isolated processing
```

### Scenario 6: Cache Performance
```
GIVEN a user re-uploads a previously processed PDF
WHEN the system checks the cache
THEN the system should:
  - Compute hash in < 100ms
  - Find cache hit with v7.0 results
  - Return results in < 500ms
  - Show "Loaded from cache" message
  - Track cost savings
```

---

## Migration Strategy

### Phase 1: Parallel Implementation
- Implement v7.0 pipeline alongside existing pipeline
- Use feature flag to enable v7.0 for specific users
- Compare results between v6 and v7 pipelines
- Validate accuracy improvements

### Phase 2: Gradual Rollout
- Enable v7.0 for 10% of users
- Monitor performance and costs
- Collect user feedback
- Fix issues and optimize

### Phase 3: Full Migration
- Enable v7.0 for all users
- Deprecate v6 pipeline
- Update documentation
- Celebrate improvements!

---

## Implementation Guidelines

### Documentation Rules
- During implementation, progress MUST be tracked ONLY in the tasks.md file
- Task status updates MUST use the task status markers: `[ ]` (not started), `[-]` (in progress), `[x]` (complete)
- Side documentation files (e.g., TASK-X-COMPLETE.md, PHASE-X-SUMMARY.md) MUST NOT be created
- All implementation notes, decisions, and progress MUST be added as comments in tasks.md
- Completion summaries MUST be added at the end of tasks.md, not in separate files
- This keeps all project information in one place and prevents documentation sprawl

---

**Status**: Ready for Design Phase  
**Priority**: P0 - Critical (Accuracy Improvement)  
**Estimated Effort**: 4-6 weeks for full implementation  
**Expected Accuracy Gain**: +170% overall
