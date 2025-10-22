# Design Document

## Overview

The PBL Core Features provide course management, document processing, and interactive concept map visualization for the Sensa Learn platform. This design leverages the existing API integration layer (Phase 1) and authentication system (Phase 2) to deliver a complete learning experience.

The system integrates with the backend PBL pipeline (AWS Layers 0-10) for document processing, using D3.js for concept map visualization and React Query for data management. All components follow the established brand theme with purple-tinted dark mode support.

### Design Philosophy

1. **Leverage Existing Infrastructure**: Use hooks from API integration layer (useCourses, useUploadDocument, etc.)
2. **Progressive Enhancement**: Show immediate feedback, then enhance with real-time updates
3. **Visual Clarity**: Use color-coding, badges, and icons to communicate status
4. **Performance First**: Virtualize large concept maps, cache aggressively
5. **Accessibility**: Full keyboard navigation and screen reader support

### Ke