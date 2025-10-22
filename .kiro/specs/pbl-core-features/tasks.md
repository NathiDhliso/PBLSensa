# Implementation Plan

- [x] 1. Install D3.js dependencies



  - Install d3 and @types/d3 packages
  - Verify D3.js v7 compatibility with React 18




  - _Requirements: 5.1, 5.4, 5.5_

- [x] 2. Create course management pages


  - [x] 2.1 Create CoursesListPage component

    - Display grid of course cards with name, description, document count
    - Add "Create Course" button in header
    - Show empty state when no courses exist

    - Integrate useCourses hook for data fetching
    - Add skeleton loaders for loading state
    - _Requirements: 1.1, 1.6_


  - [ ] 2.2 Create CreateCourseModal component
    - Build modal with form for course name and description
    - Integrate React Hook Form with validation

    - Connect to useCreateCourse mutation hook
    - Show success toast on creation
    - Close modal and refresh list on success
    - _Requirements: 1.2, 1.3, 1.4_








  - [ ] 2.3 Create CourseCard component
    - Display course name, description, document count, date


    - Add hover effects and click navigation
    - Show delete button with confirmation dialog
    - Use brand gradient for card accents
    - _Requirements: 1.1, 1.5, 1.7_


- [-] 3. Create course detail page

  - [ ] 3.1 Create CourseDetailPage component
    - Display course header with name and description
    - Add tabs for "Documents" and "Concept Map"


    - Integrate useCourse hook for course data
    - Show breadcrumb navigation
    - _Requirements: 1.5, 4.1, 8.1_

  - [ ] 3.2 Create DocumentsList component
    - Display list of documents with status badges
    - Show upload date and processing status
    - Add "Upload Document" button
    - Handle click navigation based on status
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 3.3 Create DocumentCard component
    - Display document name and metadata
    - Show status badge (Processing/Completed/Failed)
    - Add delete button with confirmation
    - Handle click to navigate to appropriate page
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_

- [x] 4. Implement document upload flow

  - [x] 4.1 Create UploadDocumentModal component

    - Build file picker accepting only PDFs
    - Display selected file name and size
    - Validate file size (max 50MB)
    - Show upload progress bar
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_


  - [ ] 4.2 Implement SHA256 hashing utility
    - Create hashFile function using Web Crypto API
    - Handle large files with chunked reading
    - Display hashing progress
    - _Requirements: 2.4_


  - [ ] 4.3 Connect upload to useUploadDocument hook
    - Compute SHA256 hash before upload
    - Call useUploadDocument mutation
    - Handle upload progress updates


    - Redirect to processing status on success
    - _Requirements: 2.4, 2.7, 2.8_

- [x] 5. Create processing status page

  - [x] 5.1 Create ProcessingStatusPage component

    - Display progress bar with percentage
    - Show current processing step
    - Display estimated time remaining
    - Use useProcessingStatus hook with polling
    - _Requirements: 3.1, 3.2, 3.3_


  - [ ] 5.2 Implement processing status display
    - Show different states (queued, processing, completed, failed)
    - Display step-by-step progress
    - Add "View Concept Map" button on completion
    - Add "Try Again" button on failure
    - _Requirements: 3.3, 3.4, 3.5_


  - [ ] 5.3 Handle polling lifecycle
    - Start polling on mount
    - Stop polling on unmount or completion




    - Handle navigation away and back
    - _Requirements: 3.2, 3.6, 3.7_

- [ ] 6. Create concept map visualization
  - [x] 6.1 Create ConceptMapPage component

    - Set up D3.js SVG container
    - Implement zoom and pan behavior
    - Add reset view button
    - Integrate useConceptMap hook
    - _Requirements: 5.1, 5.4, 5.5, 5.6_


  - [ ] 6.2 Implement D3.js force-directed layout
    - Create nodes for concepts
    - Create links for relationships
    - Apply force simulation for positioning
    - Handle node dragging

    - _Requirements: 5.1, 5.7_


  - [ ] 6.3 Add node interactions
    - Implement hover effects with tooltips
    - Handle node click to show detail panel
    - Highlight connected nodes on hover
    - Add smooth transitions
    - _Requirements: 5.2, 5.3_


- [ ] 7. Create concept detail panel
  - [ ] 7.1 Create ConceptDetailPanel component
    - Display concept name and description
    - Show source chapter information
    - List related concepts as clickable links
    - Add "View in Context" button
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 7.2 Implement panel animations
    - Slide in from right on open
    - Slide out on close
    - Handle responsive layout on mobile
    - _Requirements: 7.1, 7.5_

- [ ] 8. Implement concept map filtering
  - [ ] 8.1 Create FilterPanel component
    - Add chapter dropdown filter
    - Add keyword search input
    - Show active filters with clear buttons
    - Display filter count
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 8.2 Implement filter logic
    - Filter nodes by chapter
    - Filter nodes by keyword match
    - Apply OR logic for multiple filters
    - Update visualization in real-time
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 9. Create multi-document concept map
  - [ ] 9.1 Add course-level concept map tab
    - Create tab switcher in CourseDetailPage
    - Fetch course concept map data
    - Display unified visualization
    - _Requirements: 8.1, 8.2_

  - [ ] 9.2 Implement document color-coding
    - Assign colors to each source document
    - Color-code nodes by source
    - Show legend with document names
    - Add document filter
    - _Requirements: 8.3, 8.4, 8.6_

  - [ ] 9.3 Handle merged concepts
    - Display "merged" badge on nodes
    - Show all source documents in tooltip
    - Highlight merge connections
    - _Requirements: 8.5_

- [ ] 10. Implement feedback system
  - [ ] 10.1 Add feedback buttons to detail panel
    - Create thumbs up/down buttons
    - Show feedback state (given/not given)
    - Display thank you message on submission
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ] 10.2 Create feedback comment modal
    - Show text area for additional comments
    - Validate comment length
    - Submit feedback with comments
    - _Requirements: 9.3, 9.4_

  - [ ] 10.3 Connect to useFeedback hook
    - Call POST /feedback endpoint
    - Handle success and error states
    - Update UI to reflect feedback given
    - _Requirements: 9.2, 9.4, 9.6_

- [ ] 11. Optimize performance
  - [ ] 11.1 Implement concept map virtualization
    - Render only visible nodes
    - Use quadtree for spatial indexing
    - Lazy load node details
    - _Requirements: 10.3_

  - [ ] 11.2 Add caching and memoization
    - Cache concept map data
    - Memoize expensive calculations
    - Use React.memo for components
    - _Requirements: 10.4_

  - [ ] 11.3 Optimize D3.js rendering
    - Use canvas for large maps (>100 nodes)
    - Debounce zoom and pan events
    - Throttle force simulation updates
    - _Requirements: 10.3_

- [ ] 12. Implement responsive design
  - [ ] 12.1 Create mobile-optimized layouts
    - Simplify concept map controls for touch
    - Stack panels vertically on mobile
    - Use bottom sheets for detail panel
    - _Requirements: 10.1_

  - [ ] 12.2 Add touch gestures
    - Implement pinch-to-zoom
    - Add two-finger pan
    - Handle tap vs long-press
    - _Requirements: 10.2_

- [ ] 13. Add accessibility features
  - [ ] 13.1 Implement keyboard navigation
    - Tab through concept nodes
    - Enter to open detail panel
    - Escape to close panels
    - Arrow keys to navigate between nodes
    - _Requirements: 11.1, 11.2, 11.3, 11.5_


  - [x] 13.2 Add screen reader support

    - Add ARIA labels to all interactive elements
    - Announce node selections
    - Provide text descriptions of relationships
    - _Requirements: 11.4_


  - [ ] 13.3 Create list view alternative
    - Build accessible list of concepts
    - Allow navigation without visualization
    - Maintain feature parity
    - _Requirements: 11.6_


- [ ] 14. Implement error handling
  - [ ] 14.1 Add error states to all pages
    - Display error messages with retry buttons
    - Handle network errors gracefully
    - Show specific error reasons
    - _Requirements: 12.1, 12.2, 12.6_


  - [ ] 14.2 Create empty states
    - Design empty course list state
    - Create empty document list state
    - Add empty concept map state
    - _Requirements: 12.3, 12.5_

  - [x] 14.3 Handle edge cases

    - Detect duplicate document uploads
    - Handle processing failures
    - Manage large file uploads
    - _Requirements: 12.4_

- [ ] 15. Add loading states
  - Create skeleton loaders for all pages
  - Add progress indicators for uploads
  - Show loading spinners for concept maps
  - Implement smooth transitions
  - _Requirements: 10.5_

- [ ] 16. Update routing
  - Add routes for courses list, course detail, processing status
  - Add route for concept map view
  - Update navigation in DashboardPage
  - Add breadcrumb navigation
  - _Requirements: All_

- [ ]* 17. Testing and quality assurance
  - [ ]* 17.1 Write unit tests for components
  - [ ]* 17.2 Write integration tests for flows
  - [ ]* 17.3 Test D3.js visualizations
  - [ ]* 17.4 Perform accessibility testing
  - [ ]* 17.5 Conduct performance testing
