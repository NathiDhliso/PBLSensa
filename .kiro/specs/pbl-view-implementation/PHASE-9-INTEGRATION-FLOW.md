# Phase 9: Integration Flow Visualization

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER STARTS HERE                             │
│                    (Portal Selection Page)                           │
└─────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │    PBL PORTAL        │        │   SENSA LEARN        │
    │  (Objective View)    │◄──────►│  (Personalized)      │
    └──────────────────────┘        └──────────────────────┘
                │                               │
                │                               │
    ┌───────────┴───────────┐                  │
    │                       │                  │
    ▼                       ▼                  ▼
┌─────────┐         ┌─────────────┐    ┌──────────────┐
│ Upload  │         │   Browse    │    │   View       │
│Document │         │  Courses    │    │ Analogies    │
└─────────┘         └─────────────┘    └──────────────┘
    │                       │                  │
    ▼                       │                  │
┌─────────┐                │                  │
│Process  │                │                  │
│ Status  │                │                  │
└─────────┘                │                  │
    │                       │                  │
    ▼                       │                  │
┌─────────────────────────┐│                  │
│  DOCUMENT WORKFLOW      ││                  │
│  ┌─────────────────┐   ││                  │
│  │ 1. VALIDATE     │   ││                  │
│  │    Concepts     │   ││                  │
│  └─────────────────┘   ││                  │
│         │              ││                  │
│         ▼              ││                  │
│  ┌─────────────────┐   ││                  │
│  │ 2. DEDUPLICATE  │   ││                  │
│  │    Merge Similar│   ││                  │
│  └─────────────────┘   ││                  │
│         │              ││                  │
│         ▼              ││                  │
│  ┌─────────────────┐   ││                  │
│  │ 3. VISUALIZE    │   ││                  │
│  │    Concept Map  │───┼┼──────────────────┤
│  └─────────────────┘   ││                  │
│         │              ││                  │
│         │ "Get         ││                  │
│         │  Personalized││                  │
│         │  Analogies"  ││                  │
│         └──────────────┼┼──────────────────►
└─────────────────────────┘│
                           │
                           │ "View Concept Map"
                           └──────────────────►
```

## Navigation Paths

### Path 1: Upload → Process → Validate → Visualize
```
/pbl/courses
    │
    ├─► Upload Document
    │       │
    │       ▼
    │   /processing/:taskId
    │       │
    │       ▼ (when complete)
    │   /pbl/document/:documentId
    │       │
    │       ├─► Step 1: Validate Concepts
    │       │       │
    │       │       ▼
    │       ├─► Step 2: Resolve Duplicates
    │       │       │
    │       │       ▼
    │       └─► Step 3: View Visualization
    │               │
    │               ▼
    │           "Get Personalized Analogies"
    │               │
    │               ▼
    └───────────────────────────────────────────►
                                                  │
                                                  ▼
                                        /sensa/document/:documentId
```

### Path 2: Sensa → PBL Concept Map
```
/sensa/course/:courseId
    │
    ├─► View Analogies
    │       │
    │       ▼
    │   /sensa/document/:documentId
    │       │
    │       ▼ "View Concept Map"
    │   /pbl/document/:documentId
    │       │
    │       └─► Step 3: Visualization
```

## Component Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│                    (Route Configuration)                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│PBLDocumentPage│   │ConceptValid- │   │SensaDocument │
│              │   │  ationPage   │   │    Page      │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ├───────────────────┼───────────────────┤
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│              Shared Components Layer                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ConceptReview │  │  Duplicate   │  │  Concept  │ │
│  │    Panel     │  │   Resolver   │  │    Map    │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│usePBLConcepts│   │usePBLVisual- │   │usePBLDupli-  │
│              │   │   ization    │   │    cates     │
└──────────────┘   └──────────────┘   └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  pblService  │
                    │  (API Client)│
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Backend    │
                    │   (FastAPI)  │
                    └──────────────┘
```

## State Flow

### Document Processing State
```
PENDING → PROCESSING → COMPLETED
   │          │            │
   │          │            ▼
   │          │      ┌──────────────┐
   │          │      │  Navigate to │
   │          │      │   Document   │
   │          │      │   Workflow   │
   │          │      └──────────────┘
   │          │
   │          ▼
   │    ┌──────────────┐
   │    │ Show Progress│
   │    │   Updates    │
   │    └──────────────┘
   │
   ▼
┌──────────────┐
│ Show Queued  │
│   Message    │
└──────────────┘
```

### Concept Validation State
```
UNVALIDATED → VALIDATED
     │            │
     ▼            ▼
┌─────────┐  ┌─────────┐
│ Review  │  │ Include │
│ Required│  │ in Map  │
└─────────┘  └─────────┘
```

### Duplicate Resolution State
```
DETECTED → MERGED
    │         │
    ▼         ▼
┌─────────┐  ┌─────────┐
│ Show in │  │ Single  │
│Resolver │  │ Concept │
└─────────┘  └─────────┘
```

## Data Flow

### Upload to Visualization
```
1. User uploads PDF
   └─► POST /upload-document
       └─► Returns task_id

2. Poll processing status
   └─► GET /status/:task_id
       └─► Returns progress updates

3. Processing completes
   └─► Navigate to /pbl/document/:documentId

4. Load concepts
   └─► GET /api/pbl/documents/:documentId/concepts
       └─► Returns unvalidated concepts

5. User validates concepts
   └─► POST /api/pbl/documents/:documentId/concepts/validate
       └─► Updates concept status

6. Load duplicates
   └─► GET /api/pbl/documents/:documentId/duplicates
       └─► Returns duplicate groups

7. User merges duplicates
   └─► POST /api/pbl/concepts/merge
       └─► Merges concepts

8. Load visualization
   └─► GET /api/pbl/visualizations/:documentId
       └─► Returns nodes and edges

9. User views concept map
   └─► ConceptMapVisualization renders

10. User switches to Sensa
    └─► Navigate to /sensa/document/:documentId
```

## Integration Points

### PBL → Sensa Integration
```
┌─────────────────────────────────────┐
│     PBL Document Page               │
│  (Step 3: Visualization)            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ "Get Personalized Analogies"  │ │
│  │         Button                │ │
│  └───────────────────────────────┘ │
│              │                      │
└──────────────┼──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Sensa Document Page              │
│  (Personalized Learning)            │
│                                     │
│  - Shows analogies for concepts     │
│  - Memory techniques                │
│  - Learning mantras                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   "View Concept Map"          │ │
│  │         Button                │ │
│  └───────────────────────────────┘ │
│              │                      │
└──────────────┼──────────────────────┘
               │
               ▼
         (Back to PBL)
```

### Sensa → PBL Integration
```
┌─────────────────────────────────────┐
│    Sensa Document Page              │
│  (Viewing Analogies)                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   "View Concept Map"          │ │
│  │         Button                │ │
│  └───────────────────────────────┘ │
│              │                      │
└──────────────┼──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     PBL Document Page               │
│  (Step 3: Visualization)            │
│                                     │
│  - Shows objective concept map      │
│  - All relationships                │
│  - Interactive exploration          │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ "Get Personalized Analogies"  │ │
│  │         Button                │ │
│  └───────────────────────────────┘ │
│              │                      │
└──────────────┼──────────────────────┘
               │
               ▼
         (Back to Sensa)
```

## Success Indicators

### Visual Indicators
- ✅ Step progress indicators (1/3, 2/3, 3/3)
- ✅ Status badges (Pending, Processing, Completed)
- ✅ Loading spinners during async operations
- ✅ Success messages after actions
- ✅ Error messages with retry options

### Navigation Indicators
- ✅ Breadcrumbs showing current location
- ✅ Back buttons to previous pages
- ✅ Clear call-to-action buttons
- ✅ Integration callouts explaining connections

### State Indicators
- ✅ Unvalidated concept count
- ✅ Duplicate count badges
- ✅ Processing progress percentage
- ✅ Completion checkmarks

## Error Handling Flow

```
┌─────────────────┐
│  API Request    │
└─────────────────┘
        │
        ▼
   ┌─────────┐
   │Success? │
   └─────────┘
    │      │
    │ Yes  │ No
    │      │
    ▼      ▼
┌────────┐ ┌────────────────┐
│Update  │ │Show Error Toast│
│UI State│ │+ Retry Button  │
└────────┘ └────────────────┘
```

---

**Phase 9 Integration: COMPLETE ✅**
**All workflows connected and tested ✅**
**Ready for user testing ✅**
