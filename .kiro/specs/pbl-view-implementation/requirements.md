# PBL View Implementation: Requirements Document

## Introduction

This document outlines the requirements for implementing the **PBL (Problem-Based Learning) View** - the objective knowledge extraction and visualization component of the Two-View Learning System. The PBL View extracts factual, logical structures from source material and presents them as interactive, editable concept maps.

## Requirements

### Requirement 1: Concept Extraction from Documents

**User Story:** As a student, I want the system to automatically extract key concepts from my textbook PDFs, so that I can quickly understand the main topics without reading everything.

#### Acceptance Criteria

1. WHEN a user uploads a PDF document THEN the system SHALL parse the document with text and position data
2. WHEN the document is parsed THEN the system SHALL use Claude 3.5 Sonnet to identify domain-specific concepts
3. WHEN concepts are identified THEN the system SHALL extract contextual definitions from surrounding sentences
4. WHEN a concept is extracted THEN the system SHALL store the term, definition, source sentences, page number, and surrounding concepts
5. IF a concept appears multiple times THEN the system SHALL consolidate references while preserving all source locations
6. WHEN extraction is complete THEN the system SHALL present concepts for user validation

### Requirement 2: Structure Classification

**User Story:** As a student, I want the system to identify whether concepts are hierarchical (categories, components) or sequential (process steps), so that I can understand how ideas relate to each other.

#### Acceptance Criteria

1. WHEN concepts are extracted THEN the system SHALL analyze relationships between concepts
2. WHEN analyzing relationships THEN the system SHALL use pattern matching to detect hierarchical keywords ("types of", "consists of", "is a")
3. WHEN analyzing relationships THEN the system SHALL use pattern matching to detect sequential keywords ("first", "then", "next", "after")
4. WHEN patterns are detected THEN the system SHALL validate classifications using Claude
5. WHEN a relationship is classified THEN the system SHALL assign a structure category (hierarchical, sequential, or unclassified)
6. WHEN a relationship is classified THEN the system SHALL assign a specific relationship type (is_a, has_component, precedes, enables, etc.)
7. WHEN classification is complete THEN the system SHALL store relationships with confidence scores

### Requirement 3: Concept Deduplication and Resolution

**User Story:** As a student, I want the system to recognize when "Virtual Machine" and "VM" refer to the same concept, so that my concept map isn't cluttered with duplicates.

#### Acceptance Criteria

1. WHEN concepts are extracted THEN the system SHALL compute vector embeddings for each concept
2. WHEN embeddings are computed THEN the system SHALL identify concept pairs with high semantic similarity (>0.95)
3. WHEN similar concepts are found THEN the system SHALL flag them as potential duplicates
4. WHEN duplicates are flagged THEN the system SHALL present them to the user for confirmation
5. IF the user confirms a merge THEN the system SHALL consolidate the concepts while preserving all source references
6. IF the user rejects a merge THEN the system SHALL mark them as distinct concepts (aliases)

### Requirement 4: Interactive Concept Map Visualization

**User Story:** As a student, I want to see my concepts displayed as an interactive diagram with different layouts, so that I can visualize the knowledge structure in a way that makes sense to me.

#### Acceptance Criteria

1. WHEN concepts and relationships are ready THEN the system SHALL generate a default visualization
2. WHEN generating visualization THEN the system SHALL support multiple layout types (tree, mind map, flowchart, hybrid)
3. WHEN displaying hierarchical relationships THEN the system SHALL use blue rectangular nodes with solid connecting lines
4. WHEN displaying sequential relationships THEN the system SHALL use green rounded nodes with arrow connectors
5. WHEN displaying hybrid maps THEN the system SHALL use dashed lines for cross-type relationships
6. WHEN the user views the map THEN the system SHALL provide zoom, pan, and drag-and-drop capabilities
7. WHEN the user changes layout THEN the system SHALL re-render the visualization with the new layout algorithm

### Requirement 5: Editable Concept Maps

**User Story:** As a student, I want to edit concept labels, add new connections, and delete incorrect nodes, so that I can customize the map to match my understanding.

#### Acceptance Criteria

1. WHEN the user clicks a node THEN the system SHALL display an edit dialog
2. WHEN the user edits a node label THEN the system SHALL update the concept term in the database
3. WHEN the user edits a node definition THEN the system SHALL update the concept definition
4. WHEN the user drags from one node to another THEN the system SHALL create a new relationship
5. WHEN creating a relationship THEN the system SHALL prompt the user to select the relationship type
6. WHEN the user deletes a node THEN the system SHALL remove the concept and all connected relationships
7. WHEN the user deletes an edge THEN the system SHALL remove only that relationship
8. WHEN edits are made THEN the system SHALL save changes immediately to the database

### Requirement 6: Concept Validation Workflow

**User Story:** As a student, I want to review and approve extracted concepts before they appear in my map, so that I can ensure accuracy and remove irrelevant items.

#### Acceptance Criteria

1. WHEN extraction completes THEN the system SHALL display a concept review panel
2. WHEN reviewing concepts THEN the system SHALL show the term, definition, and source context for each concept
3. WHEN the user approves a concept THEN the system SHALL mark it as validated
4. WHEN the user rejects a concept THEN the system SHALL remove it from the concept list
5. WHEN the user edits a concept THEN the system SHALL update the concept before validation
6. WHEN the user approves all concepts THEN the system SHALL proceed to structure detection
7. IF the user skips validation THEN the system SHALL use all extracted concepts by default

### Requirement 7: Export and Sharing

**User Story:** As a student, I want to export my concept map as an image or PDF, so that I can include it in my study notes or share it with classmates.

#### Acceptance Criteria

1. WHEN the user clicks export THEN the system SHALL offer format options (PNG, PDF, JSON)
2. WHEN the user selects PNG THEN the system SHALL render the current view as a high-resolution image
3. WHEN the user selects PDF THEN the system SHALL generate a PDF document with the full concept map
4. WHEN the user selects JSON THEN the system SHALL export the raw data structure for backup or import
5. WHEN export is complete THEN the system SHALL download the file to the user's device
6. WHEN exporting THEN the system SHALL preserve the current layout and zoom level

### Requirement 8: Multi-Document Support

**User Story:** As a student, I want to process multiple chapters or textbooks and see them as separate concept maps, so that I can organize my learning by topic.

#### Acceptance Criteria

1. WHEN a user uploads multiple documents THEN the system SHALL process each independently
2. WHEN viewing documents THEN the system SHALL display a document selector
3. WHEN the user switches documents THEN the system SHALL load the corresponding concept map
4. WHEN concepts exist across documents THEN the system SHALL optionally show cross-document connections
5. IF concepts are similar across documents THEN the system SHALL suggest linking them

### Requirement 9: Performance and Scalability

**User Story:** As a student, I want my 100-page textbook to be processed in under 3 minutes, so that I don't have to wait long to start studying.

#### Acceptance Criteria

1. WHEN processing a 100-page document THEN the system SHALL complete extraction within 3 minutes
2. WHEN displaying a concept map THEN the system SHALL render up to 500 nodes without lag
3. WHEN the user interacts with the map THEN the system SHALL respond to clicks within 100ms
4. WHEN loading a saved visualization THEN the system SHALL retrieve it from the database within 500ms
5. IF processing fails THEN the system SHALL provide graceful degradation with partial results

### Requirement 10: Integration with Sensa Learn

**User Story:** As a student, I want to switch between the objective PBL view and my personalized Sensa Learn view, so that I can see both the factual structure and my own analogies.

#### Acceptance Criteria

1. WHEN viewing a PBL map THEN the system SHALL provide a "Switch to Sensa Learn" button
2. WHEN switching to Sensa Learn THEN the system SHALL pass the concept list to the Sensa Learn view
3. WHEN in Sensa Learn THEN the system SHALL display which PBL concepts have analogies
4. WHEN the user creates an analogy THEN the system SHALL link it to the corresponding PBL concept
5. WHEN viewing connections THEN the system SHALL show lines between PBL concepts and Sensa analogies

---

## Non-Functional Requirements

### Performance
- Concept extraction: < 3 minutes for 100-page PDF
- Visualization rendering: < 2 seconds for 500 nodes
- API response time: < 500ms for concept retrieval
- Database queries: < 200ms for relationship lookups

### Accuracy
- Concept extraction accuracy: > 85% validated by users
- Structure detection precision: > 75% correct classifications
- Deduplication accuracy: > 90% correct merge suggestions

### Usability
- Concept validation rate: > 90% of extracted concepts approved
- User customization: > 50% of users edit their maps
- Export usage: > 30% of users export their maps

### Reliability
- System uptime: 99.5%
- Graceful degradation: Partial results if Claude API fails
- Data persistence: All edits saved within 1 second

### Security
- User data isolation: Concepts visible only to document owner
- API authentication: All endpoints require valid JWT token
- Input validation: PDF size limit of 50MB, sanitize all user inputs

---

## Success Metrics

1. **Extraction Quality**: 85%+ of extracted concepts validated by users
2. **Structure Accuracy**: 75%+ of relationships correctly classified
3. **User Engagement**: 50%+ of users customize their concept maps
4. **Processing Speed**: 100-page documents processed in < 3 minutes
5. **System Adoption**: 80%+ of uploaded documents use PBL view

---

## Dependencies

- AWS Bedrock (Claude 3.5 Sonnet) for concept extraction and validation
- PDF parsing library (PyPDF2 or pdfplumber) for text extraction
- PostgreSQL with pgvector for concept embeddings
- React Flow or D3.js for visualization rendering
- FastAPI for backend API endpoints

---

## Out of Scope

- Handwritten note recognition (OCR)
- Real-time collaborative editing
- Mobile app support (web-only for MVP)
- Video or audio content processing
- Automatic quiz generation from concepts

---

## Assumptions

1. Users upload PDF documents (not Word, PowerPoint, etc.)
2. Documents are primarily text-based (not image-heavy)
3. Users have basic understanding of concept maps
4. Internet connection available for Claude API calls
5. Documents are in English (multi-language support later)

---

## Constraints

- Claude API rate limits: 50 requests/minute
- PDF processing: Maximum 50MB file size
- Visualization: Maximum 1000 nodes per map
- Database: PostgreSQL 14+ with pgvector extension
- Browser support: Chrome, Firefox, Safari (latest 2 versions)

---

## Glossary

- **Concept**: A key term or idea extracted from source material
- **Relationship**: A connection between two concepts (hierarchical or sequential)
- **Structure Category**: Classification of relationship type (hierarchical, sequential, unclassified)
- **Relationship Type**: Specific nature of connection (is_a, has_component, precedes, etc.)
- **Concept Map**: Visual representation of concepts and their relationships
- **Hybrid Map**: Visualization showing both hierarchical and sequential relationships
- **Deduplication**: Process of identifying and merging duplicate concepts
- **Validation**: User review and approval of extracted concepts

---

**Status**: Ready for Design Phase
