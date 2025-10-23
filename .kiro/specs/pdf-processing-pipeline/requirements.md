# Requirements Document: PDF Processing Pipeline

## Introduction

This document defines the requirements for implementing the **core value proposition** of the Perspective-Based Learning platform: the automated extraction of hierarchical logical structures from PDF documents, keyword extraction with definitions, and the generation of visual concept maps that show the sequential and hierarchical relationships between concepts.

**Current State**: When users upload a PDF, they see a generic concept map with placeholder data. The actual PDF is not processed, keywords are not extracted, and no logical structure is created.

**Desired State**: When users upload a PDF, the system should:
1. Extract the document's hierarchical structure (chapters, sections, subsections)
2. Extract keywords from each section with AI-generated definitions
3. Identify relationships between keywords (prerequisite, applies_to, leads_to, etc.)
4. Store this in the database with proper hierarchy
5. Display it as an interactive, zoomable concept map showing the logical flow
6. Use this structure to generate personalized analogies in Sensa Learn based on user's past experiences

---

## Requirements

### Requirement 1: PDF Structure Extraction

**User Story:** As a student, I want the system to automatically understand the structure of my textbook PDF, so that I can see how chapters and sections relate to each other.

#### Acceptance Criteria

1. WHEN a user uploads a PDF THEN the system SHALL extract the document hierarchy (chapters, sections, subsections)
2. WHEN the PDF has a table of contents THEN the system SHALL use it to identify chapter boundaries
3. WHEN the PDF uses heading styles THEN the system SHALL detect heading levels (H1, H2, H3)
4. WHEN structure extraction completes THEN the system SHALL store it in the `processed_documents` table with `hierarchy_json` field
5. IF the PDF is scanned/image-based THEN the system SHALL use Amazon Textract for OCR before structure extraction
6. WHEN structure extraction fails THEN the system SHALL fall back to page-based chunking with 10-page chapters

---

### Requirement 2: Keyword Extraction with Definitions

**User Story:** As a student, I want to see the key terms from each chapter with clear definitions, so that I can understand what concepts I need to learn.

#### Acceptance Criteria

1. WHEN a chapter is processed THEN the system SHALL extract 5-15 keywords using KeyBERT, YAKE, and spaCy ensemble
2. WHEN keywords are extracted THEN the system SHALL use Claude 3.5 Sonnet to generate concise definitions (1-2 sentences)
3. WHEN a keyword appears in multiple chapters THEN the system SHALL mark the first occurrence as `is_primary=true` and others as `is_primary=false`
4. WHEN keywords are stored THEN the system SHALL include embeddings using SageMaker HDT-E model
5. WHEN the user views a concept map THEN the system SHALL display keyword definitions in tooltips or detail panels
6. IF a keyword is ambiguous (homograph) THEN the system SHALL use the document's subject field to disambiguate

---

### Requirement 3: Relationship Identification

**User Story:** As a student, I want to see how concepts connect to each other, so that I can understand the logical flow of the material.

#### Acceptance Criteria

1. WHEN keywords are extracted THEN the system SHALL identify relationships between them using RAG-powered analysis
2. WHEN analyzing relationships THEN the system SHALL use pgvector semantic search to find related concepts
3. WHEN relationships are found THEN the system SHALL classify them as: `prerequisite`, `applies_to`, `leads_to`, `contains`, `enables`, `contrasts_with`
4. WHEN relationships are stored THEN the system SHALL include a strength score (0.0-1.0)
5. WHEN the concept map is displayed THEN the system SHALL show relationships as directed edges with labels
6. IF no relationships are found within a chapter THEN the system SHALL search neighboring chapters

---

### Requirement 4: Hierarchical Concept Map Visualization

**User Story:** As a student, I want to see the logical structure of my textbook as an interactive map, so that I can zoom in on specific topics and understand how they fit into the bigger picture.

#### Acceptance Criteria

1. WHEN a user views a concept map THEN the system SHALL display a hierarchical D3.js force-directed graph
2. WHEN the map loads THEN the system SHALL show chapter-level nodes at the top level
3. WHEN a user clicks a chapter node THEN the system SHALL expand to show section-level keywords
4. WHEN a user zooms in THEN the system SHALL reveal more detailed relationships and sub-concepts
5. WHEN a user hovers over a keyword THEN the system SHALL display its definition in a tooltip
6. WHEN a user clicks a keyword THEN the system SHALL open a detail panel showing:
   - Full definition
   - Source chapter/section
   - Related concepts
   - Importance score
7. WHEN displaying relationships THEN the system SHALL use different edge styles for different relationship types

---

### Requirement 5: Sequential and Hierarchical Layout

**User Story:** As a student, I want the concept map to show the natural reading order of the material, so that I can follow the logical progression from basic to advanced topics.

#### Acceptance Criteria

1. WHEN the concept map is rendered THEN the system SHALL position nodes based on their hierarchical level
2. WHEN nodes are at the same level THEN the system SHALL order them by chapter/section sequence
3. WHEN displaying prerequisite relationships THEN the system SHALL position prerequisite concepts above dependent concepts
4. WHEN the user toggles "Sequential View" THEN the system SHALL arrange nodes in a left-to-right or top-to-bottom flow
5. WHEN the user toggles "Hierarchical View" THEN the system SHALL arrange nodes in a tree structure
6. WHEN the user toggles "Force-Directed View" THEN the system SHALL use physics simulation for organic layout

---

### Requirement 6: Integration with Sensa Learn

**User Story:** As a student, I want the system to use the extracted structure to create personalized analogies based on my past experiences, so that I can understand complex concepts through familiar examples.

#### Acceptance Criteria

1. WHEN a user enters Sensa Learn THEN the system SHALL display chapters from the processed document
2. WHEN a user clicks "Simplify" on a chapter THEN the system SHALL retrieve the extracted keywords and structure
3. WHEN generating analogies THEN the system SHALL use the keyword definitions as input to Claude 3.5 Sonnet
4. WHEN generating analogies THEN the system SHALL incorporate the user's profile (interests, location, age, past experiences)
5. WHEN analogies are generated THEN the system SHALL explain which keyword each analogy addresses
6. WHEN the user provides feedback THEN the system SHALL store it linked to the specific keyword

---

### Requirement 7: Memory-Based Analogy Generation

**User Story:** As a student, I want the system to ask me about my past experiences and use them to create analogies, so that I can connect new concepts to things I already know.

#### Acceptance Criteria

1. WHEN a user first sets up their profile THEN the system SHALL present a curated questionnaire about past experiences
2. WHEN the questionnaire is presented THEN the system SHALL ask about:
   - Hobbies and interests
   - Places lived or visited
   - Work or volunteer experiences
   - Sports or activities participated in
   - Books, movies, or games enjoyed
3. WHEN the user completes the questionnaire THEN the system SHALL store responses in the `user_profile` table
4. WHEN generating analogies THEN the system SHALL reference specific experiences from the questionnaire
5. WHEN an analogy is shown THEN the system SHALL include a note like "Based on your experience with [specific memory]"
6. WHEN the user updates their profile THEN the system SHALL regenerate analogies with new context

---

### Requirement 8: Processing Status and Progress

**User Story:** As a student, I want to see the progress of PDF processing in real-time, so that I know when my concept map will be ready.

#### Acceptance Criteria

1. WHEN a PDF is uploaded THEN the system SHALL display a processing status page
2. WHEN processing is in progress THEN the system SHALL show:
   - Current step (Extracting structure, Extracting keywords, Generating relationships, etc.)
   - Progress percentage
   - Estimated time remaining
3. WHEN each step completes THEN the system SHALL update the status in real-time
4. WHEN processing completes THEN the system SHALL show a "View Concept Map" button
5. WHEN processing fails THEN the system SHALL show a clear error message and "Try Again" button
6. WHEN the user navigates away THEN the system SHALL continue processing in the background

---

### Requirement 9: Multi-Document Course Synthesis

**User Story:** As a student, I want to upload multiple textbooks for a course and see how concepts connect across them, so that I can understand the subject holistically.

#### Acceptance Criteria

1. WHEN a user uploads multiple PDFs to a course THEN the system SHALL process each independently
2. WHEN viewing a course-level concept map THEN the system SHALL merge keywords from all documents
3. WHEN merging keywords THEN the system SHALL use cosine similarity > 0.95 to identify duplicates
4. WHEN duplicate keywords are found THEN the system SHALL create one primary node and reference nodes
5. WHEN displaying merged maps THEN the system SHALL color-code nodes by source document
6. WHEN conflicts exist THEN the system SHALL show the conflict resolution UI with AI recommendations

---

### Requirement 10: Exam Relevance Scoring

**User Story:** As a student, I want to see which concepts are most likely to appear on exams, so that I can prioritize my study time.

#### Acceptance Criteria

1. WHEN a user uploads a past exam PDF THEN the system SHALL extract keywords from it
2. WHEN processing a textbook THEN the system SHALL calculate exam relevance scores for each keyword
3. WHEN calculating relevance THEN the system SHALL use cosine similarity between keyword embeddings and exam keyword embeddings
4. WHEN displaying the concept map THEN the system SHALL highlight high-relevance keywords with a pulsing glow
5. WHEN the user toggles "Show High Relevance Only" THEN the system SHALL filter to show only high-priority concepts
6. WHEN the user hovers over a keyword THEN the system SHALL display its exam relevance score

---

### Requirement 11: Caching and Performance

**User Story:** As a student, I want to see my concept map instantly when I return to it, so that I don't have to wait for reprocessing.

#### Acceptance Criteria

1. WHEN a document is processed THEN the system SHALL cache the result in ElastiCache Redis
2. WHEN caching THEN the system SHALL use versioned keys: `processed:{file_hash}:v{PIPELINE_VERSION}`
3. WHEN a user requests a concept map THEN the system SHALL check the cache first
4. WHEN a cache hit occurs THEN the system SHALL return results in < 500ms
5. WHEN the pipeline version changes THEN the system SHALL invalidate old cache entries
6. WHEN cache is full THEN the system SHALL use LRU eviction policy

---

### Requirement 12: Error Handling and Fallbacks

**User Story:** As a student, I want the system to handle problematic PDFs gracefully, so that I can still get value even if processing isn't perfect.

#### Acceptance Criteria

1. WHEN LlamaParse fails THEN the system SHALL fall back to Amazon Textract + Claude
2. WHEN Textract fails THEN the system SHALL fall back to PyPDF2 + basic chunking
3. WHEN keyword extraction finds < 3 keywords THEN the system SHALL use chapter titles as keywords
4. WHEN relationship detection finds no connections THEN the system SHALL create sequential relationships based on document order
5. WHEN any step fails THEN the system SHALL log the error to CloudWatch and continue with degraded functionality
6. WHEN processing completes with fallbacks THEN the system SHALL notify the user which features are limited

---

## Success Criteria

The PDF Processing Pipeline will be considered successful when:

1. ✅ Users can upload a PDF and see extracted keywords with definitions
2. ✅ The concept map shows the hierarchical structure of the document
3. ✅ Relationships between concepts are visible and labeled
4. ✅ Users can zoom in/out to see different levels of detail
5. ✅ Sensa Learn generates analogies based on the extracted structure
6. ✅ The memory questionnaire captures user experiences for analogy generation
7. ✅ Processing completes in < 5 minutes for a 200-page textbook
8. ✅ Cache hit rate is > 80% for repeat views
9. ✅ Fallback chain ensures 99% of PDFs produce some output

---

## Out of Scope

The following are explicitly out of scope for this feature:

- Real-time collaborative editing of concept maps
- Manual keyword editing by users
- Video or audio content processing
- Handwritten note recognition
- Integration with external learning management systems (LMS)

---

## Dependencies

- AWS Bedrock access (Claude 3.5 Sonnet)
- LlamaParse API key
- SageMaker endpoint deployed (HDT-E model)
- PostgreSQL database with pgvector extension
- ElastiCache Redis cluster
- SQS queue for async processing

---

## Technical Constraints

- Maximum PDF size: 100MB
- Maximum processing time: 10 minutes (timeout)
- Maximum keywords per chapter: 50
- Maximum relationships per keyword: 20
- Cache TTL: 30 days
- Embedding dimension: 768 (HDT-E model)

---

## Acceptance Testing Scenarios

### Scenario 1: Standard Textbook Processing
```
GIVEN a user uploads a 150-page biology textbook PDF
WHEN the processing completes
THEN the concept map should show:
  - 10-15 chapter nodes
  - 100-150 keyword nodes
  - 200-300 relationship edges
  - Hierarchical structure with 3 levels
  - All keywords have definitions
  - Processing time < 4 minutes
```

### Scenario 2: Scanned PDF Fallback
```
GIVEN a user uploads a scanned PDF without text layer
WHEN the processing detects it's image-based
THEN the system should:
  - Use Textract for OCR
  - Extract text successfully
  - Generate concept map with slightly lower accuracy
  - Complete within 8 minutes
```

### Scenario 3: Memory-Based Analogy
```
GIVEN a user has completed the experience questionnaire
  AND indicated they played soccer for 10 years
WHEN they view analogies for "cellular respiration"
THEN the system should generate an analogy like:
  "Think of cellular respiration like your body during a soccer match.
   Just as your muscles need oxygen to produce energy for running,
   cells need oxygen to produce ATP for cellular functions."
  WITH a note: "Based on your experience with soccer"
```

---

**Status**: Ready for Design Phase  
**Priority**: P0 - Critical (Core Value Proposition)  
**Estimated Effort**: 3-4 weeks for full implementation
