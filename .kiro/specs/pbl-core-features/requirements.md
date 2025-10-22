# Requirements Document

## Introduction

The PBL Core Features provide the main functionality for course management, document processing, and concept map visualization in the Sensa Learn platform. This feature builds on the existing API integration layer and authentication system to deliver a complete Perspective-Based Learning experience.

Users can create courses, upload PDF documents for processing, view processing status, and explore interactive concept maps generated from their learning materials. The system integrates with the backend PBL pipeline (Layers 0-10) for document processing, embedding generation, keyword extraction, and concept map creation.

## Requirements

### Requirement 1: Course Management

**User Story:** As a user, I want to create and manage courses, so that I can organize my learning materials by subject or topic.

#### Acceptance Criteria

1. WHEN a user navigates to the courses page THEN the system SHALL display a list of all their courses with name, description, document count, and creation date
2. WHEN a user clicks "Create Course" THEN the system SHALL display a form with fields for course name (required) and description (optional)
3. WHEN a user submits a valid course form THEN the system SHALL create the course via POST /courses and display a success message
4. WHEN a user submits a course form with an empty name THEN the system SHALL display an error message "Course name is required"
5. WHEN a user clicks on a course card THEN the system SHALL navigate to the course detail page showing documents and concept map
6. WHEN a user has no courses THEN the system SHALL display an empty state with a "Create Your First Course" button
7. WHEN a user deletes a course THEN the system SHALL show a confirmation dialog and delete via DELETE /courses/{course_id}

### Requirement 2: Document Upload

**User Story:** As a user, I want to upload PDF documents to my courses, so that the system can process them and generate concept maps.

#### Acceptance Criteria

1. WHEN a user is on a course detail page THEN the system SHALL display an "Upload Document" button
2. WHEN a user clicks "Upload Document" THEN the system SHALL open a file picker accepting only PDF files
3. WHEN a user selects a valid PDF file THEN the system SHALL display the file name, size, and an upload button
4. WHEN a user clicks upload THEN the system SHALL compute SHA256 hash, upload via POST /upload-document, and show a progress indicator
5. WHEN a file upload exceeds 50MB THEN the system SHALL display an error message "File size must be under 50MB"
6. WHEN a file is not a PDF THEN the system SHALL display an error message "Only PDF files are supported"
7. WHEN an upload succeeds THEN the system SHALL redirect to the processing status page with the task_id
8. WHEN an upload fails THEN the system SHALL display the error message and allow retry

### Requirement 3: Processing Status

**User Story:** As a user, I want to see the processing status of my uploaded documents, so that I know when the concept map is ready.

#### Acceptance Criteria

1. WHEN a document is uploaded THEN the system SHALL navigate to a processing status page showing progress
2. WHEN on the processing status page THEN the system SHALL poll GET /status/{task_id} every 2 seconds
3. WHEN processing is in progress THEN the system SHALL display a progress bar, current step, and estimated time remaining
4. WHEN processing completes successfully THEN the system SHALL display a success message and "View Concept Map" button
5. WHEN processing fails THEN the system SHALL display the error message and "Try Again" button
6. WHEN a user navigates away from the status page THEN the system SHALL stop polling
7. WHEN a user returns to a completed processing task THEN the system SHALL show the final status without polling

### Requirement 4: Document List

**User Story:** As a user, I want to view all documents in a course, so that I can manage my learning materials.

#### Acceptance Criteria

1. WHEN a user views a course detail page THEN the system SHALL display a list of all documents with name, upload date, and processing status
2. WHEN a document is processing THEN the system SHALL display a "Processing..." badge with a spinner
3. WHEN a document is completed THEN the system SHALL display a "Completed" badge with a checkmark
4. WHEN a document failed THEN the system SHALL display a "Failed" badge with an error icon
5. WHEN a user clicks on a completed document THEN the system SHALL navigate to the concept map view
6. WHEN a user clicks on a processing document THEN the system SHALL navigate to the processing status page
7. WHEN a user deletes a document THEN the system SHALL show a confirmation dialog and delete via DELETE /documents/{document_id}

### Requirement 5: Concept Map Visualization

**User Story:** As a user, I want to view interactive concept maps of my documents, so that I can understand the relationships between concepts.

#### Acceptance Criteria

1. WHEN a user views a concept map THEN the system SHALL display nodes representing concepts with labels
2. WHEN a user hovers over a node THEN the system SHALL highlight the node and show a tooltip with the concept name and description
3. WHEN a user clicks on a node THEN the system SHALL display a detail panel with concept summary, related concepts, and source chapter
4. WHEN a user zooms in/out THEN the system SHALL scale the concept map smoothly using D3.js zoom behavior
5. WHEN a user pans the map THEN the system SHALL move the viewport smoothly
6. WHEN a user clicks "Reset View" THEN the system SHALL return to the default zoom and center position
7. WHEN a concept map has many nodes THEN the system SHALL use force-directed layout to prevent overlapping

### Requirement 6: Concept Map Filtering

**User Story:** As a user, I want to filter concept maps by chapter or keyword, so that I can focus on specific topics.

#### Acceptance Criteria

1. WHEN a user views a concept map THEN the system SHALL display a filter panel with chapter and keyword options
2. WHEN a user selects a chapter filter THEN the system SHALL highlight nodes from that chapter and dim others
3. WHEN a user enters a keyword in the search box THEN the system SHALL highlight matching nodes and their connections
4. WHEN a user clears filters THEN the system SHALL restore all nodes to full visibility
5. WHEN no nodes match the filter THEN the system SHALL display a message "No concepts found matching your filter"
6. WHEN a user applies multiple filters THEN the system SHALL show nodes matching ANY of the filters (OR logic)

### Requirement 7: Concept Detail View

**User Story:** As a user, I want to see detailed information about a concept, so that I can understand it better.

#### Acceptance Criteria

1. WHEN a user clicks on a concept node THEN the system SHALL open a detail panel on the right side
2. WHEN the detail panel opens THEN the system SHALL display the concept name, description, source chapter, and related concepts
3. WHEN a user clicks on a related concept THEN the system SHALL navigate to that concept and update the detail panel
4. WHEN a user clicks "View in Context" THEN the system SHALL navigate to the chapter summary page (Sensa Learn feature)
5. WHEN a user closes the detail panel THEN the system SHALL deselect the node and hide the panel
6. WHEN a concept has no description THEN the system SHALL display "No description available"

### Requirement 8: Multi-Document Concept Maps

**User Story:** As a user, I want to view a unified concept map for all documents in a course, so that I can see connections across materials.

#### Acceptance Criteria

1. WHEN a user views a course with multiple documents THEN the system SHALL display a "Course Concept Map" tab
2. WHEN a user clicks "Course Concept Map" THEN the system SHALL fetch GET /concept-map/course/{course_id}
3. WHEN the course map loads THEN the system SHALL display nodes from all documents with color-coding by source document
4. WHEN a user hovers over a node THEN the system SHALL show which document it came from
5. WHEN concepts from different documents are merged THEN the system SHALL display a "merged" badge
6. WHEN a user filters by document THEN the system SHALL show only nodes from that document

### Requirement 9: Feedback on Concepts

**User Story:** As a user, I want to provide feedback on concept accuracy, so that the system can improve over time.

#### Acceptance Criteria

1. WHEN a user views a concept detail panel THEN the system SHALL display thumbs up/down feedback buttons
2. WHEN a user clicks thumbs up THEN the system SHALL submit positive feedback via POST /feedback and show a thank you message
3. WHEN a user clicks thumbs down THEN the system SHALL show a text area for additional comments
4. WHEN a user submits feedback with comments THEN the system SHALL send the feedback and comments to the backend
5. WHEN a user has already provided feedback THEN the system SHALL display their previous feedback and allow changing it
6. WHEN feedback submission fails THEN the system SHALL display an error message and allow retry

### Requirement 10: Responsive Design and Performance

**User Story:** As a user, I want the concept map to work smoothly on all devices, so that I can learn anywhere.

#### Acceptance Criteria

1. WHEN a user views a concept map on mobile THEN the system SHALL display a simplified layout with touch-friendly controls
2. WHEN a user pinches to zoom on mobile THEN the system SHALL zoom the concept map smoothly
3. WHEN a concept map has over 100 nodes THEN the system SHALL use virtualization to render only visible nodes
4. WHEN a user navigates between pages THEN the system SHALL cache concept map data for 5 minutes
5. WHEN a concept map is loading THEN the system SHALL display a skeleton loader with animated placeholders
6. WHEN a concept map fails to load THEN the system SHALL display an error message with a retry button

### Requirement 11: Accessibility

**User Story:** As a user with accessibility needs, I want to navigate concept maps using keyboard and screen readers, so that I can access all features.

#### Acceptance Criteria

1. WHEN a user tabs through the concept map THEN the system SHALL focus on nodes in a logical order
2. WHEN a user presses Enter on a focused node THEN the system SHALL open the detail panel
3. WHEN a user presses Escape THEN the system SHALL close the detail panel or clear filters
4. WHEN a user uses a screen reader THEN the system SHALL announce node names, descriptions, and relationships
5. WHEN a user navigates with keyboard THEN the system SHALL provide visible focus indicators
6. WHEN a concept map has many nodes THEN the system SHALL provide a list view alternative for screen reader users

### Requirement 12: Error Handling and Edge Cases

**User Story:** As a user, I want clear error messages and recovery options, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the system SHALL display "Connection lost. Retrying..." and attempt automatic retry
2. WHEN a document processing fails THEN the system SHALL display the specific error reason and suggest solutions
3. WHEN a concept map is empty THEN the system SHALL display "No concepts found. Try uploading a different document."
4. WHEN a user tries to upload a duplicate document THEN the system SHALL display "This document has already been uploaded"
5. WHEN a course has no documents THEN the system SHALL display an empty state with "Upload your first document" prompt
6. WHEN the backend is unavailable THEN the system SHALL display "Service temporarily unavailable. Please try again later."
