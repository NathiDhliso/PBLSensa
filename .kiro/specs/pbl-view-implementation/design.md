# PBL View Implementation: Design Document

## Overview

This document details the technical design for the PBL (Problem-Based Learning) View - a system that extracts objective knowledge from documents and visualizes it as interactive, editable concept maps. The PBL View is the first half of the Two-View Learning System.

## Architecture Principles

1. **Separation of Concerns**: Extraction, classification, and visualization are independent services
2. **Progressive Enhancement**: System works with partial results if any component fails
3. **User Control**: Every automated decision can be overridden by the user
4. **Performance First**: Async processing, caching, and optimized queries
5. **Integration Ready**: Clean interfaces for Sensa Learn connection

## High-Level Architecture

```
PDF Upload → ConceptExtractor → StructureClassifier → PBLVisualizationEngine → Frontend
                ↓                      ↓                        ↓
            Concepts DB          Relationships DB      Visualizations DB
```

## Component Design

### 1. ConceptExtractor Service

**Purpose**: Extract domain-specific concepts from PDF documents with full context preservation.

**Technology Stack**:
- PyPDF2 or pdfplumber for PDF parsing
- Claude 3.5 Sonnet via AWS Bedrock for concept identification
- PostgreSQL for storage
- Redis for caching

**Key Methods**:
```python
class ConceptExtractor:
    async def extract_concepts(self, pdf_path: str, document_id: str) -> List[Concept]
    async def _parse_pdf_with_positions(self, pdf_path: str) -> List[TextChunk]
    async def _claude_extract_concepts(self, chunk: TextChunk) -> List[ConceptData]
    async def _enrich_with_context(self, concept: ConceptData, chunks: List[TextChunk]) -> Concept
    async def _generate_embeddings(self, concepts: List[Concept]) -> List[Concept]
```

**Processing Flow**:
1. Parse PDF → Extract text with page numbers and positions
2. Chunk text → Create 1000-token chunks with overlap
3. Claude extraction → Identify concepts per chunk
4. Context enrichment → Find surrounding concepts and source sentences
5. Embedding generation → Create vector embeddings for similarity
6. Deduplication → Flag potential duplicates
7. Storage → Save to database

**Claude Prompt Template**:

```python
CONCEPT_EXTRACTION_PROMPT = """Analyze this textbook excerpt and extract key domain concepts.

For each concept, provide:
1. The exact term (as it appears in the text)
2. A clear definition based on the text
3. The source sentence(s) that define or explain it

Text:
{chunk_text}

Return as JSON array:
[
  {
    "term": "Virtual Machine",
    "definition": "A software emulation of a physical computer system",
    "source_sentences": ["A virtual machine (VM) is a software emulation..."]
  }
]

Focus on:
- Key terms that are defined or explained
- Technical concepts specific to this domain
- Important processes or methodologies
- Skip common words and general terms
"""
```

**Data Model**:
```python
@dataclass
class Concept:
    id: str
    document_id: str
    term: str
    definition: str
    source_sentences: List[str]
    page_number: int
    surrounding_concepts: List[str]
    structure_type: Optional[str]  # hierarchical, sequential, unclassified
    embedding: Optional[List[float]]
    importance_score: float
    validated: bool
    created_at: datetime
```

**Caching Strategy**:
- Cache parsed PDF text for 24 hours
- Cache Claude responses for 7 days
- Cache embeddings permanently

---

### 2. StructureClassifier Service

**Purpose**: Classify relationships between concepts as hierarchical or sequential.

**Technology Stack**:
- Regex pattern matching for initial classification
- Claude 3.5 Sonnet for validation
- PostgreSQL for relationship storage

**Key Methods**:
```python
class StructureClassifier:
    async def classify_relationships(self, concepts: List[Concept]) -> List[Relationship]
    def _match_patterns(self, source: Concept, target: Concept) -> Dict
    async def _claude_validate(self, source: Concept, target: Concept, pattern_result: Dict) -> Dict
    def _shares_context(self, concept_a: Concept, concept_b: Concept) -> bool
```

**Pattern Matching**:

```python
HIERARCHICAL_PATTERNS = [
    r'\b(types? of|categories|kinds? of)\b',
    r'\b(consists? of|includes?|contains?|comprises?)\b',
    r'\b(is a|are|classified as|categorized as)\b',
    r'\b(components?|parts?|elements?)\b',
    r'\b(parent|child|subclass|superclass)\b',
]

SEQUENTIAL_PATTERNS = [
    r'\b(first|then|next|after|before|finally)\b',
    r'\b(step \d+|phase \d+|stage \d+)\b',
    r'\b(process|procedure|workflow|algorithm)\b',
    r'\b(precedes?|follows?|leads? to|results? in)\b',
    r'\b(causes?|enables?|triggers?)\b',
]
```

**Relationship Types**:
- **Hierarchical**: is_a, has_component, contains, category_of, part_of
- **Sequential**: precedes, enables, results_in, follows, leads_to
- **Other**: applies_to, contrasts_with, similar_to

**Data Model**:
```python
@dataclass
class Relationship:
    id: str
    source_concept_id: str
    target_concept_id: str
    relationship_type: str
    structure_category: str  # hierarchical, sequential, unclassified
    strength: float  # 0.0 to 1.0
    validated_by_user: bool
    created_at: datetime
```

---

### 3. ConceptDeduplicator Service

**Purpose**: Identify and merge duplicate concepts using semantic similarity.

**Key Methods**:
```python
class ConceptDeduplicator:
    async def find_duplicates(self, concepts: List[Concept]) -> List[DuplicatePair]
    async def merge_concepts(self, primary_id: str, duplicate_id: str) -> Concept
    def _calculate_similarity(self, concept_a: Concept, concept_b: Concept) -> float
```

**Similarity Algorithm**:
1. Compute cosine similarity of embeddings
2. If similarity > 0.95, flag as potential duplicate
3. Check for common abbreviations (VM → Virtual Machine)
4. Present to user for confirmation

**Merge Strategy**:
- Keep primary concept's term and definition
- Consolidate all source_sentences
- Merge surrounding_concepts lists
- Update all relationships to point to primary concept
- Mark duplicate as merged (soft delete)

---

### 4. PBLVisualizationEngine Service

**Purpose**: Generate interactive, editable concept map visualizations.

**Technology Stack**:
- React Flow for diagram rendering
- D3.js for layout algorithms
- PostgreSQL for visualization storage

**Key Methods**:
```python
class PBLVisualizationEngine:
    async def create_default_visualization(self, document_id: str) -> PBLVisualization
    def _apply_layout(self, nodes: List[Node], edges: List[Edge], layout_type: str) -> Layout
    def _calculate_node_positions(self, concepts: List[Concept], relationships: List[Relationship]) -> Dict
```

**Layout Algorithms**:


1. **Tree Layout** (Hierarchical):
   - Top-down arrangement
   - Parent nodes above children
   - Balanced distribution

2. **Mind Map Layout** (Hierarchical):
   - Central root node
   - Radial distribution of children
   - Curved connecting lines

3. **Flowchart Layout** (Sequential):
   - Left-to-right flow
   - Straight arrows
   - Swimlane support

4. **Hybrid Layout**:
   - Hierarchical clusters arranged vertically
   - Sequential flows within clusters horizontally
   - Dashed lines for cross-type connections

**Visual Styling**:
```typescript
const NODE_STYLES = {
  hierarchical: {
    shape: 'rectangle',
    borderColor: '#3B82F6', // Blue
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  sequential: {
    shape: 'rounded-rectangle',
    borderColor: '#10B981', // Green
    borderWidth: 2,
    backgroundColor: '#ECFDF5',
  },
  unclassified: {
    shape: 'ellipse',
    borderColor: '#6B7280', // Gray
    borderWidth: 1,
    backgroundColor: '#F9FAFB',
  },
};

const EDGE_STYLES = {
  hierarchical: {
    type: 'solid',
    color: '#3B82F6',
    width: 2,
    arrow: false,
  },
  sequential: {
    type: 'solid',
    color: '#10B981',
    width: 2,
    arrow: true,
  },
  cross_type: {
    type: 'dashed',
    color: '#6B7280',
    width: 1,
    arrow: true,
  },
};
```

**Data Model**:
```python
@dataclass
class PBLVisualization:
    id: str
    document_id: str
    user_id: str
    nodes: List[DiagramNode]
    edges: List[DiagramEdge]
    layout_type: str  # tree, mindmap, flowchart, hybrid
    viewport: Viewport  # zoom, pan position
    created_at: datetime
    updated_at: datetime

@dataclass
class DiagramNode:
    id: str
    concept_id: str
    label: str
    position: Point
    structure_type: str
    style: NodeStyle

@dataclass
class DiagramEdge:
    id: str
    source_node_id: str
    target_node_id: str
    relationship_type: str
    label: str
    style: EdgeStyle
```

---

### 5. PBL Pipeline Orchestrator

**Purpose**: Coordinate the end-to-end processing of documents.

**Processing Stages**:
```python
class PBLPipeline:
    async def process_document(self, document_id: str, pdf_path: str) -> ProcessingResult:
        # Stage 1: Extract concepts
        concepts = await self.concept_extractor.extract_concepts(pdf_path, document_id)
        await self.concept_service.bulk_create(concepts)
        
        # Stage 2: Find duplicates
        duplicates = await self.deduplicator.find_duplicates(concepts)
        # Present to user for confirmation
        
        # Stage 3: Classify structures
        relationships = await self.structure_classifier.classify_relationships(concepts)
        await self.relationship_service.bulk_create(relationships)
        
        # Stage 4: Generate visualization
        visualization = await self.visualization_engine.create_default_visualization(document_id)
        
        return ProcessingResult(
            status='success',
            concepts_count=len(concepts),
            relationships_count=len(relationships),
            visualization_id=visualization.id,
            duplicates_found=len(duplicates)
        )
```

**Error Handling**:
- If concept extraction fails → Use fallback text chunking
- If structure classification fails → Create concepts without relationships
- If visualization fails → Return raw data for manual layout
- Always return partial results with warnings

---

## Database Schema

### Concepts Table (Enhanced)
```sql
CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES processed_documents(id),
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    source_sentences TEXT[],
    page_number INTEGER,
    surrounding_concepts TEXT[],
    structure_type TEXT CHECK (structure_type IN ('hierarchical', 'sequential', 'unclassified')),
    embedding vector(768),
    importance_score FLOAT DEFAULT 0.5,
    validated BOOLEAN DEFAULT false,
    merged_into UUID REFERENCES concepts(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_concepts_document ON concepts(document_id);
CREATE INDEX idx_concepts_embedding ON concepts USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_concepts_structure_type ON concepts(structure_type);
CREATE INDEX idx_concepts_validated ON concepts(validated);
```

### Relationships Table (Enhanced)
```sql
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    target_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    structure_category TEXT CHECK (structure_category IN ('hierarchical', 'sequential', 'unclassified')),
    strength FLOAT CHECK (strength BETWEEN 0 AND 1),
    validated_by_user BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_concept_id, target_concept_id, relationship_type)
);

CREATE INDEX idx_relationships_source ON relationships(source_concept_id);
CREATE INDEX idx_relationships_target ON relationships(target_concept_id);
CREATE INDEX idx_relationships_category ON relationships(structure_category);
```

### PBL Visualizations Table (New)
```sql
CREATE TABLE pbl_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES processed_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nodes_json JSONB NOT NULL,
    edges_json JSONB NOT NULL,
    layout_type TEXT DEFAULT 'hybrid',
    viewport_json JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

CREATE INDEX idx_pbl_viz_document ON pbl_visualizations(document_id);
CREATE INDEX idx_pbl_viz_user ON pbl_visualizations(user_id);
```

---

## API Endpoints

### Document Processing
```
POST /api/pbl/documents/upload
- Upload PDF and start extraction
- Body: multipart/form-data with file
- Returns: { task_id, document_id }

GET /api/pbl/documents/{document_id}/status
- Check processing status
- Returns: { status, progress, current_stage }
```

### Concept Management
```
GET /api/pbl/documents/{document_id}/concepts
- Get all extracted concepts
- Query params: ?validated=true&structure_type=hierarchical
- Returns: { concepts: Concept[] }

POST /api/pbl/documents/{document_id}/concepts/validate
- User validation of extracted concepts
- Body: { approved: string[], rejected: string[], edited: Concept[] }
- Returns: { validated_count, rejected_count }

GET /api/pbl/concepts/{concept_id}
- Get single concept with details
- Returns: Concept

PUT /api/pbl/concepts/{concept_id}
- Update concept
- Body: Partial<Concept>
- Returns: Concept

DELETE /api/pbl/concepts/{concept_id}
- Delete concept and relationships
- Returns: { success: boolean }
```

### Structure Detection
```
GET /api/pbl/documents/{document_id}/structures
- Get detected relationships
- Query params: ?category=hierarchical
- Returns: { hierarchical: Relationship[], sequential: Relationship[] }

POST /api/pbl/relationships
- Create new relationship
- Body: { source_concept_id, target_concept_id, relationship_type }
- Returns: Relationship

DELETE /api/pbl/relationships/{relationship_id}
- Delete relationship
- Returns: { success: boolean }
```

### Deduplication
```
GET /api/pbl/documents/{document_id}/duplicates
- Get potential duplicate concepts
- Returns: { duplicates: DuplicatePair[] }

POST /api/pbl/concepts/merge
- Merge duplicate concepts
- Body: { primary_id, duplicate_id }
- Returns: Concept
```

### Visualization
```
GET /api/pbl/visualizations/{document_id}
- Get or create visualization for document
- Returns: PBLVisualization

PUT /api/pbl/visualizations/{visualization_id}
- Update entire visualization
- Body: PBLVisualization
- Returns: PBLVisualization

PUT /api/pbl/visualizations/{visualization_id}/nodes/{node_id}
- Update single node
- Body: Partial<DiagramNode>
- Returns: DiagramNode

POST /api/pbl/visualizations/{visualization_id}/edges
- Create new edge
- Body: { source, target, type }
- Returns: DiagramEdge

DELETE /api/pbl/visualizations/{visualization_id}/nodes/{node_id}
- Delete node and connected edges
- Returns: { success: boolean }

POST /api/pbl/visualizations/{visualization_id}/layout
- Change layout algorithm
- Body: { layout_type: 'tree' | 'mindmap' | 'flowchart' | 'hybrid' }
- Returns: PBLVisualization

GET /api/pbl/visualizations/{visualization_id}/export
- Export visualization
- Query params: ?format=png|pdf|json
- Returns: File download
```

---

## Frontend Architecture

### Component Structure
```
src/
├── pages/
│   └── pbl/
│       ├── PBLDocumentPage.tsx          # Main PBL view
│       └── ConceptValidationPage.tsx    # Validation workflow
│
├── components/
│   └── pbl/
│       ├── ConceptReviewPanel.tsx       # List of concepts for validation
│       ├── ConceptCard.tsx              # Individual concept display
│       ├── StructureExplorer.tsx        # Relationship browser
│       ├── PBLCanvas.tsx                # Main visualization canvas
│       ├── VisualizationControls.tsx    # Layout switcher, zoom, export
│       ├── NodeEditor.tsx               # Edit node dialog
│       ├── EdgeCreator.tsx              # Create relationship dialog
│       ├── DuplicateResolver.tsx        # Merge duplicates UI
│       └── ProcessingStatus.tsx         # Progress indicator
│
├── hooks/
│   ├── usePBLVisualization.ts           # Visualization state management
│   ├── useConcepts.ts                   # Concept CRUD operations
│   ├── useRelationships.ts              # Relationship management
│   └── useDocumentProcessing.ts         # Processing status polling
│
└── services/
    └── pblApi.ts                        # API client
```

### Key Frontend Components

#### PBLCanvas Component
```typescript
interface PBLCanvasProps {
  documentId: string;
  visualization: PBLVisualization;
  onNodeEdit: (nodeId: string, changes: Partial<DiagramNode>) => void;
  onEdgeCreate: (source: string, target: string, type: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onLayoutChange: (layout: string) => void;
}

const PBLCanvas: React.FC<PBLCanvasProps> = ({
  documentId,
  visualization,
  onNodeEdit,
  onEdgeCreate,
  onNodeDelete,
  onLayoutChange,
}) => {
  // React Flow implementation
  // - Render nodes with custom styling based on structure_type
  // - Handle drag-and-drop
  // - Zoom and pan controls
  // - Connection creation
  // - Node selection and editing
};
```

#### usePBLVisualization Hook
```typescript
export const usePBLVisualization = (documentId: string) => {
  const [nodes, setNodes] = useState<DiagramNode[]>([]);
  const [edges, setEdges] = useState<DiagramEdge[]>([]);
  const [layout, setLayout] = useState<string>('hybrid');
  const [loading, setLoading] = useState(true);

  // Load visualization
  useEffect(() => {
    loadVisualization();
  }, [documentId]);

  const updateNode = async (nodeId: string, changes: Partial<DiagramNode>) => {
    // Optimistic update
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...changes } : n));
    // API call
    await pblApi.updateNode(nodeId, changes);
  };

  const addEdge = async (source: string, target: string, type: string) => {
    const newEdge = await pblApi.createEdge({ source, target, type });
    setEdges(prev => [...prev, newEdge]);
  };

  const deleteNode = async (nodeId: string) => {
    await pblApi.deleteNode(nodeId);
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  };

  const changeLayout = async (newLayout: string) => {
    setLayout(newLayout);
    const updated = await pblApi.changeLayout(documentId, newLayout);
    setNodes(updated.nodes);
    setEdges(updated.edges);
  };

  return {
    nodes,
    edges,
    layout,
    loading,
    updateNode,
    addEdge,
    deleteNode,
    changeLayout,
  };
};
```

---

## Performance Optimization

### Caching Strategy
```python
# Redis cache keys
CONCEPT_CACHE = "pbl:concepts:{document_id}"
RELATIONSHIPS_CACHE = "pbl:relationships:{document_id}"
VISUALIZATION_CACHE = "pbl:viz:{document_id}:{user_id}"

# TTLs
CONCEPT_TTL = 7 * 24 * 60 * 60  # 7 days
VISUALIZATION_TTL = 24 * 60 * 60  # 1 day
```

### Async Processing
- Use Celery for long-running tasks
- WebSocket for real-time progress updates
- Background job for embedding generation

### Database Optimization
- Batch insert concepts (bulk_create)
- Use EXPLAIN ANALYZE for query optimization
- Index on frequently queried columns
- Materialized views for analytics

### Frontend Optimization
- Virtual scrolling for large concept lists
- Lazy loading of visualization data
- Debounced API calls for edits
- Canvas rendering optimization (only visible nodes)

---

## Testing Strategy

### Unit Tests
- ConceptExtractor: Test PDF parsing, Claude integration, embedding generation
- StructureClassifier: Test pattern matching, relationship detection
- PBLVisualizationEngine: Test layout algorithms, node positioning

### Integration Tests
- Full pipeline: PDF → Concepts → Relationships → Visualization
- API endpoints: Test all CRUD operations
- Database: Test queries, indexes, constraints

### E2E Tests
- Upload document → Review concepts → View map → Edit nodes → Export
- Multi-document workflow
- Error handling and graceful degradation

---

## Deployment Considerations

### Infrastructure
- AWS Lambda for async processing
- AWS Bedrock for Claude API
- RDS PostgreSQL with pgvector
- ElastiCache Redis for caching
- S3 for PDF storage

### Monitoring
- CloudWatch metrics for processing time
- Error tracking for Claude API failures
- User analytics for feature usage
- Performance monitoring for visualization rendering

### Rollout Plan
1. Deploy backend services
2. Run database migrations
3. Deploy frontend components
4. Enable feature flag for beta users
5. Monitor and iterate
6. Full rollout

---

## Integration with Sensa Learn

### Connection Points
1. **Concept Sharing**: PBL concepts available to Sensa Learn for analogy creation
2. **Bidirectional Navigation**: Switch between PBL and Sensa views
3. **Visual Linking**: Show which PBL concepts have analogies
4. **Unified Data Model**: Shared concept IDs across both views

### API Contract
```typescript
// PBL provides to Sensa Learn
interface PBLConcept {
  id: string;
  term: string;
  definition: string;
  structure_type: string;
}

// Sensa Learn provides to PBL
interface SensaAnalogy {
  id: string;
  concept_id: string;
  has_analogy: boolean;
  analogy_count: number;
}
```

---

## Success Metrics

### Technical Metrics
- Processing time: < 3 minutes for 100-page PDF
- Concept extraction accuracy: > 85%
- Structure detection precision: > 75%
- API response time: < 500ms
- Visualization render time: < 2 seconds

### User Metrics
- Concept validation rate: > 90%
- User customization rate: > 50%
- Export usage: > 30%
- Session duration: > 10 minutes
- Return rate: > 60%

---

**Status**: Ready for Task Breakdown
