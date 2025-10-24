# Current PDF Processing Pipeline Architecture

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS PDF                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 0: OPTIMIZATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  1. PDF Hash Service (SHA-256)                                    │  │
│  │     → Compute unique hash of PDF content                          │  │
│  │                                                                    │  │
│  │  2. Cache Lookup                                                  │  │
│  │     → Check if PDF already processed                              │  │
│  │     → If HIT: Return cached results (instant)                     │  │
│  │     → If MISS: Continue to processing                             │  │
│  │                                                                    │  │
│  │  3. Document Type Detector                                        │  │
│  │     → Analyze PDF structure                                       │  │
│  │     → Classify: Digital / Scanned / Hybrid                        │  │
│  │     → Estimate processing cost                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PBL PIPELINE ORCHESTRATOR                             │
│                                                                           │
│  Coordinates 5 stages with progress tracking:                            │
│  1. Parsing → 2. Extraction → 3. Classification →                        │
│  4. Deduplication → 5. Visualization                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STAGE 1: PDF PARSING                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PDF Parser Service (pdfplumber)                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  For each page:                                             │  │  │
│  │  │    1. Extract text using pdfplumber                         │  │  │
│  │  │    2. Get page dimensions (width, height)                   │  │  │
│  │  │    3. Count characters                                      │  │  │
│  │  │                                                              │  │  │
│  │  │  ⚠️  LIMITATION: Only extracts selectable text              │  │  │
│  │  │     - Scanned pages → "no extractable text"                 │  │  │
│  │  │     - Image-only pages → skipped                            │  │  │
│  │  │     - No OCR capability                                     │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  Text Chunking:                                                   │  │
│  │    - Chunk size: 1000 tokens (~4000 chars)                        │  │
│  │    - Overlap: 200 tokens (~800 chars)                             │  │
│  │    - Smart sentence boundary detection                            │  │
│  │    - Preserves page numbers and positions                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Output: List of TextChunk objects with:                                 │
│    - text: string                                                         │
│    - page_number: int                                                     │
│    - chunk_index: int                                                     │
│    - start_position: int                                                  │
│    - end_position: int                                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STAGE 2: CONCEPT EXTRACTION                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Concept Extractor Service                                        │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  For each chunk:                                            │  │  │
│  │  │    1. Build XML extraction prompt                           │  │  │
│  │  │    2. Call Claude 3 via AWS Bedrock                         │  │  │
│  │  │    3. Parse XML response                                    │  │  │
│  │  │    4. Extract concepts with:                                │  │  │
│  │  │       - term                                                │  │  │
│  │  │       - definition                                          │  │  │
│  │  │       - source_sentences                                    │  │  │
│  │  │    5. Enrich with context:                                  │  │  │
│  │  │       - Find surrounding concepts                           │  │  │
│  │  │       - Calculate importance score                          │  │  │
│  │  │       - Add page number                                     │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  Deduplication (exact matches):                                   │  │
│  │    - Merge concepts with same term (case-insensitive)             │  │
│  │    - Combine source sentences                                     │  │
│  │    - Take max importance score                                    │  │
│  │                                                                    │  │
│  │  Embedding Generation:                                            │  │
│  │    - Use Amazon Titan Embeddings                                  │  │
│  │    - Generate 768-dimension vectors                               │  │
│  │    - Text: "{term}: {definition}"                                 │  │
│  │    - Retry logic for failures                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Output: List of Concept objects with embeddings                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STAGE 3: STRUCTURE CLASSIFICATION                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Structure Classifier Service                                     │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  Relationship Detection:                                    │  │  │
│  │  │    1. Analyze concept pairs                                 │  │  │
│  │  │    2. Detect relationship types:                            │  │  │
│  │  │       - prerequisite (A required before B)                  │  │  │
│  │  │       - part_of (A is component of B)                       │  │  │
│  │  │       - leads_to (A causes/enables B)                       │  │  │
│  │  │       - applies_to (A used in context of B)                 │  │  │
│  │  │       - contrasts_with (A vs B)                             │  │  │
│  │  │    3. Calculate relationship strength (0.0-1.0)             │  │  │
│  │  │    4. Classify structure category:                          │  │  │
│  │  │       - hierarchical (parent-child)                         │  │  │
│  │  │       - sequential (ordered steps)                          │  │  │
│  │  │       - unclassified                                        │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Output: List of Relationship objects                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STAGE 4: DEDUPLICATION                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Concept Deduplicator Service                                     │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  Semantic Similarity Detection:                             │  │  │
│  │  │    1. Compare concept embeddings                            │  │  │
│  │  │    2. Calculate cosine similarity                           │  │  │
│  │  │    3. Find duplicates (similarity > 0.95)                   │  │  │
│  │  │    4. Identify merge candidates                             │  │  │
│  │  │                                                              │  │  │
│  │  │  User Review Required:                                      │  │  │
│  │  │    - Present duplicate pairs to user                        │  │  │
│  │  │    - User approves/rejects merges                           │  │  │
│  │  │    - Merge approved duplicates                              │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Output: Deduplicated concept list                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STAGE 5: VISUALIZATION GENERATION                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Visualization Service                                            │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  Graph Generation:                                          │  │  │
│  │  │    1. Create nodes from concepts                            │  │  │
│  │  │    2. Create edges from relationships                       │  │  │
│  │  │    3. Apply layout algorithm:                               │  │  │
│  │  │       - force-directed (default)                            │  │  │
│  │  │       - hierarchical                                        │  │  │
│  │  │       - circular                                            │  │  │
│  │  │    4. Calculate node positions                              │  │  │
│  │  │    5. Store as JSON                                         │  │  │
│  │  │                                                              │  │  │
│  │  │  Interactive Features:                                      │  │  │
│  │  │    - User can move nodes                                    │  │  │
│  │  │    - Add/remove edges                                       │  │  │
│  │  │    - Change layout                                          │  │  │
│  │  │    - Export (JSON/PNG/PDF)                                  │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Output: PBLVisualization object with nodes and edges                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CACHE & STORE RESULTS                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Layer 0 Cache Service:                                           │  │
│  │    - Store results by PDF hash                                    │  │
│  │    - TTL: 30 days                                                 │  │
│  │    - Instant retrieval for duplicate uploads                      │  │
│  │                                                                    │  │
│  │  Cost Tracking:                                                   │  │
│  │    - Track API calls (Claude, Titan)                              │  │
│  │    - Calculate costs                                              │  │
│  │    - Monitor savings from cache hits                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RETURN TO USER                                        │
│  - Processing status                                                     │
│  - Extracted concepts                                                    │
│  - Detected relationships                                                │
│  - Interactive visualization                                             │
│  - Cost and timing information                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Layer 0 Services
- **PDF Hash Service**: SHA-256 hashing for duplicate detection
- **Cache Service**: Redis-like caching with 30-day TTL
- **Document Type Detector**: Classifies PDFs as digital/scanned/hybrid
- **Cost Optimizer**: Tracks and optimizes API costs

### 2. Core Services
- **PDF Parser**: pdfplumber-based text extraction
- **Concept Extractor**: Claude 3 + Titan Embeddings
- **Structure Classifier**: Relationship detection
- **Concept Deduplicator**: Semantic similarity matching
- **Visualization Service**: Graph generation and layout

### 3. AI Models Used
- **Claude 3 (Sonnet)**: Concept extraction from text
- **Amazon Titan Embeddings**: 768-dim vector generation
- **Bedrock**: AWS AI service integration

## Current Limitations

### ❌ No OCR Support
- **Problem**: Pages with scanned/image content show "no extractable text"
- **Impact**: Missing content from:
  - Scanned textbook pages
  - Image-heavy pages
  - Diagrams with embedded text
  - Screenshots
- **Solution Needed**: Add OCR layer (Tesseract or AWS Textract)

### ⚠️ Text-Only Processing
- Only processes selectable text
- Skips images, diagrams, charts
- No visual element extraction

### ⚠️ Single-Pass Extraction
- Each chunk processed independently
- Limited cross-chunk context
- May miss concepts spanning multiple chunks

## Performance Metrics

### Processing Time (500-page PDF)
- Layer 0 (cache hit): < 1 second
- Layer 0 (cache miss): 
  - Parsing: ~30 seconds
  - Extraction: ~5-10 minutes (depends on chunks)
  - Classification: ~1-2 minutes
  - Total: ~7-13 minutes

### Cost Per Document
- Claude API: ~$0.50-2.00 per document
- Titan Embeddings: ~$0.10-0.30 per document
- Total: ~$0.60-2.30 per document
- Cache hit: $0.00 (instant)

### Cache Performance
- Hit rate: Varies by usage
- Storage: ~5-10MB per document
- TTL: 30 days
- Savings: 100% cost on cache hits

## Data Flow

```
PDF File
  ↓
PDF Hash (SHA-256)
  ↓
Cache Check → [HIT] → Return Cached Results
  ↓ [MISS]
Text Extraction (pdfplumber)
  ↓
Text Chunks (1000 tokens each)
  ↓
Claude API (concept extraction)
  ↓
Raw Concepts (term + definition)
  ↓
Titan Embeddings (768-dim vectors)
  ↓
Concepts with Embeddings
  ↓
Relationship Detection
  ↓
Deduplication
  ↓
Visualization Generation
  ↓
Cache Storage
  ↓
Return to User
```

## Missing: OCR Layer

**What's needed to handle scanned pages:**

```
┌─────────────────────────────────────────────────────────────────┐
│  PROPOSED: OCR ENHANCEMENT                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  In PDF Parser, for each page:                            │  │
│  │    1. Try pdfplumber text extraction                      │  │
│  │    2. If no text found:                                   │  │
│  │       a. Convert page to image (pdf2image)                │  │
│  │       b. Apply OCR (Tesseract or AWS Textract)            │  │
│  │       c. Extract text from image                          │  │
│  │    3. Continue with normal processing                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

This would allow extraction from the 9+ pages currently showing "no extractable text".
