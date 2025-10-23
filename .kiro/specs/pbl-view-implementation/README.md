# PBL View Implementation Spec

## Status: ✅ APPROVED - Ready for Implementation

**Created**: January 24, 2025  
**Approved**: January 24, 2025  
**Estimated Timeline**: 12 weeks  
**Team Size**: 2-3 developers

---

## Overview

This spec defines the complete implementation of the **PBL (Problem-Based Learning) View** - the objective knowledge extraction and visualization component of the Two-View Learning System.

## What is PBL View?

The PBL View extracts factual, logical structures from textbook PDFs and presents them as interactive, editable concept maps. It identifies:
- **Concepts**: Key terms and definitions
- **Relationships**: Hierarchical (is-a, has-component) and Sequential (precedes, enables)
- **Structure**: Visual representation with multiple layout options

## Key Features

1. **Automated Concept Extraction**: Claude-powered extraction from PDFs
2. **Structure Classification**: Identifies hierarchical vs sequential relationships
3. **Concept Deduplication**: Merges synonyms and abbreviations
4. **Interactive Visualization**: React Flow-based editable diagrams
5. **Multiple Layouts**: Tree, mind map, flowchart, hybrid
6. **Full Editing**: Add, edit, delete nodes and edges
7. **Export**: PNG, PDF, JSON formats
8. **Sensa Learn Integration**: Seamless connection to personalized learning view

## Documents

### 1. Requirements (`requirements.md`)
- 10 main requirements with EARS acceptance criteria
- Non-functional requirements (performance, accuracy, usability)
- Success metrics and constraints
- **Status**: ✅ Approved

### 2. Design (`design.md`)
- Complete architecture with 5 core services
- Data models and database schema
- 20+ API endpoints
- Frontend component structure
- Performance optimization strategies
- **Status**: ✅ Approved

### 3. Tasks (`tasks.md`)
- 95 discrete implementation tasks
- 9 phases over 12 weeks
- Each task with clear objectives and requirements references
- **Status**: ✅ Approved

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         PBL View                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  PDF Upload → ConceptExtractor → StructureClassifier        │
│                      ↓                    ↓                   │
│                 Concepts DB         Relationships DB          │
│                      ↓                    ↓                   │
│              ConceptDeduplicator → PBLVisualizationEngine    │
│                                            ↓                   │
│                                   Visualizations DB           │
│                                            ↓                   │
│                                    Frontend (React Flow)      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. ConceptExtractor
- Parses PDFs with position data
- Uses Claude 3.5 Sonnet for concept identification
- Generates embeddings for similarity search
- **Input**: PDF file
- **Output**: List of Concept objects

### 2. StructureClassifier
- Pattern matching for hierarchical/sequential detection
- Claude validation for accuracy
- Assigns relationship types (is_a, precedes, etc.)
- **Input**: List of Concepts
- **Output**: List of Relationships

### 3. ConceptDeduplicator
- Semantic similarity using pgvector
- Identifies duplicates (VM → Virtual Machine)
- User-confirmed merging
- **Input**: List of Concepts
- **Output**: List of DuplicatePairs

### 4. PBLVisualizationEngine
- Multiple layout algorithms (tree, mindmap, flowchart, hybrid)
- Custom node/edge styling
- Position calculation
- **Input**: Concepts + Relationships
- **Output**: PBLVisualization

### 5. PBL Pipeline
- Orchestrates all services
- Async processing with progress tracking
- Graceful error handling
- **Input**: Document ID + PDF path
- **Output**: ProcessingResult

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL 14+ with pgvector
- **Cache**: Redis
- **AI**: AWS Bedrock (Claude 3.5 Sonnet, Titan Embeddings)
- **Async**: Celery
- **PDF**: pdfplumber

### Frontend
- **Framework**: React + TypeScript
- **Visualization**: React Flow
- **State**: React hooks
- **API**: Axios
- **Styling**: Tailwind CSS

### Infrastructure
- **Compute**: AWS Lambda
- **Storage**: S3 (PDFs), RDS (PostgreSQL)
- **Cache**: ElastiCache (Redis)
- **Monitoring**: CloudWatch

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Database migrations
- Pydantic models
- Basic infrastructure

### Phase 2: Concept Extraction (Weeks 2-3)
- PDF parsing
- Claude integration
- Embedding generation
- Concept CRUD

### Phase 3: Structure Classification (Week 4)
- Pattern matching
- Relationship detection
- Claude validation

### Phase 4: Deduplication (Week 5)
- Similarity search
- Merge operations
- User confirmation UI

### Phase 5: Visualization Engine (Weeks 6-7)
- Layout algorithms
- Node/edge generation
- Styling system

### Phase 6: Pipeline Orchestration (Week 8)
- Async processing
- Progress tracking
- Error handling

### Phase 7: API Endpoints (Week 9)
- 20+ REST endpoints
- Authentication
- Validation

### Phase 8: Frontend Components (Weeks 10-11)
- React Flow integration
- Custom nodes/edges
- Editing dialogs
- Export functionality

### Phase 9: Integration & Polish (Week 12)
- Sensa Learn integration
- Performance optimization
- Testing
- Documentation

## Success Metrics

### Technical
- ✅ Processing time: < 3 minutes for 100-page PDF
- ✅ Concept extraction accuracy: > 85%
- ✅ Structure detection precision: > 75%
- ✅ API response time: < 500ms
- ✅ Visualization render: < 2 seconds

### User
- ✅ Concept validation rate: > 90%
- ✅ User customization rate: > 50%
- ✅ Export usage: > 30%
- ✅ Session duration: > 10 minutes
- ✅ Return rate: > 60%

## Next Steps

1. **Set up development environment**
   - Configure AWS Bedrock access
   - Set up PostgreSQL with pgvector
   - Install Redis

2. **Start Phase 1: Foundation**
   - Create database migration
   - Define Pydantic models
   - Set up project structure

3. **Begin implementation**
   - Follow tasks.md sequentially
   - Mark tasks as complete in tasks.md
   - Test incrementally

## Integration with Sensa Learn

Once PBL View is complete, it will integrate with Sensa Learn:
- **Shared Concepts**: PBL concepts available for analogy creation
- **Bidirectional Navigation**: Switch between views
- **Visual Linking**: Show which concepts have analogies
- **Unified Experience**: Seamless two-view learning system

## Resources

- **Design Document**: Full technical specifications
- **Requirements Document**: User stories and acceptance criteria
- **Task List**: 95 implementation tasks
- **Two-View Analysis**: Gap analysis of current implementation

## Questions?

For questions or clarifications:
1. Review the design document for technical details
2. Check requirements for user stories
3. Refer to tasks.md for implementation guidance

---

**Ready to build the future of learning! 🚀**
