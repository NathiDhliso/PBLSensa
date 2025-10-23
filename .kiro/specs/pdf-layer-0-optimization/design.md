# PDF Layer 0 Optimization: Design Document

## Overview

This document outlines the technical design for Layer 0 of the PDF processing pipeline - a comprehensive pre-processing layer that provides validation, intelligent detection, caching, and cost optimization before documents enter the main extraction pipeline.

### Goals

- **99% Reliability**: Robust error handling and validation
- **Cost Optimization**: Reduce redundant processing through intelligent caching
- **Performance**: Sub-500ms response for cached documents, under 30s for new digital PDFs
- **Seamless Integration**: Drop-in enhancement to existing pipeline

### Architecture Position

```
Upload → [Layer 0: Validation & Caching] → Existing PBL Pipeline → Results
         ↓
         Cache Hit? → Return Cached Results (bypass pipeline)
```

---

## Architecture

### High-Level Flow

```
1. PDF Upload
   ↓
2. Layer 0 Entry Point
   ↓
3. Hash Computation (SHA-256)
   ↓
4. Cache Lookup
   ↓
5a. Cache Hit → Return Results (DONE)
   ↓
5b. Cache Miss → Continue
   ↓
6. PDF Validation
   ↓
7. Document Type Detection
   ↓
8. Cost Estimation
   ↓
9. Pass to Existing Pipeline
   ↓
10. Cache Results
    ↓
11. Return Results
```


## Components and Interfaces

### 1. PDF Hash Service

**Purpose**: Compute and manage PDF file hashes for duplicate detection

**Class**: `PDFHashService`

```python
class PDFHashService:
    """Compute and validate PDF hashes"""
    
    def compute_hash(self, pdf_path: str) -> str:
        """
        Compute SHA-256 hash of PDF file
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Hex string of SHA-256 hash
        """
        
    def compute_hash_from_bytes(self, pdf_bytes: bytes) -> str:
        """Compute hash from bytes (for uploads)"""
        
    def extract_metadata(self, pdf_path: str) -> Dict:
        """
        Extract PDF metadata
        
        Returns:
            {
                'page_count': int,
                'file_size': int,
                'creation_date': str,
                'author': str,
                'title': str,
                'producer': str
            }
        """
```

**Implementation Details**:
- Use `hashlib.sha256()` for consistent hashing
- Read file in chunks (8KB) to handle large files efficiently
- Extract metadata using `pdfplumber` or `PyPDF2`
- Store hash with metadata in database


### 2. Document Type Detector

**Purpose**: Classify PDFs as scanned, digital, or hybrid

**Class**: `DocumentTypeDetector`

```python
class DocumentTypeDetector:
    """Detect if PDF is scanned or digital"""
    
    def detect_type(self, pdf_path: str) -> DocumentType:
        """
        Analyze PDF and classify document type
        
        Returns:
            DocumentType with classification and confidence
        """
        
    def analyze_page(self, page) -> PageAnalysis:
        """Analyze single page for text/image ratio"""
        
    def estimate_ocr_cost(self, doc_type: DocumentType, page_count: int) -> float:
        """Estimate OCR processing cost"""
```

**Detection Algorithm**:

1. **Sample Pages**: Analyze first 5 pages, middle 2 pages, last 2 pages
2. **Text Extraction Test**: Try to extract text from each sample page
3. **Image Analysis**: Check for embedded images vs. text layers
4. **Classification Logic**:
   - **Digital**: >80% of pages have extractable text, <20% image content
   - **Scanned**: <20% of pages have extractable text, >80% image content
   - **Hybrid**: Mixed characteristics

**Confidence Scoring**:
```python
confidence = (consistent_pages / total_sampled_pages) * 100
```

**Cost Estimation**:
- Digital: Base processing cost only
- Scanned: Base + (pages × OCR_COST_PER_PAGE)
- Hybrid: Base + (scanned_pages × OCR_COST_PER_PAGE)


### 3. Cache Service (Enhanced)

**Purpose**: Multi-level caching with LRU eviction and compression

**Class**: `Layer0CacheService` (extends existing `CacheManager`)

```python
class Layer0CacheService:
    """Enhanced cache service for Layer 0"""
    
    def lookup_by_hash(self, pdf_hash: str) -> Optional[CachedResult]:
        """
        Lookup cached results by PDF hash
        
        Returns:
            CachedResult if found and not expired, None otherwise
        """
        
    def store_results(
        self,
        pdf_hash: str,
        results: Dict,
        metadata: Dict,
        compression: bool = True
    ) -> None:
        """Store processing results with compression"""
        
    def get_cache_stats(self) -> CacheStats:
        """Get cache statistics"""
        
    def evict_lru(self, target_size_mb: int) -> int:
        """Evict least recently used entries"""
        
    def cleanup_expired(self, max_age_days: int = 90) -> int:
        """Remove expired cache entries"""
```

**Cache Storage Strategy**:

1. **Primary Key**: PDF hash (SHA-256)
2. **Stored Data**:
   - Extracted concepts (JSON)
   - Relationships (JSON)
   - Embeddings (compressed binary)
   - Visualization data (JSON)
   - Processing metadata
3. **Compression**: Use `gzip` for JSON data (typically 70-80% reduction)
4. **TTL**: 90 days default, refreshed on access
5. **Eviction**: LRU when storage exceeds threshold

**Database Schema**:
```sql
CREATE TABLE pdf_cache (
    pdf_hash VARCHAR(64) PRIMARY KEY,
    file_metadata JSONB NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    processing_results BYTEA NOT NULL,  -- Compressed JSON
    embeddings BYTEA,  -- Compressed embeddings
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    storage_size_bytes INTEGER,
    compression_ratio FLOAT
);

CREATE INDEX idx_pdf_cache_last_accessed ON pdf_cache(last_accessed);
CREATE INDEX idx_pdf_cache_created ON pdf_cache(created_at);
```


### 4. Cost Optimizer (Enhanced)

**Purpose**: Track and optimize processing costs

**Class**: `Layer0CostOptimizer` (extends existing `CostTracker`)

```python
class Layer0CostOptimizer:
    """Enhanced cost tracking and optimization"""
    
    def estimate_processing_cost(
        self,
        doc_type: DocumentType,
        page_count: int,
        has_cache: bool
    ) -> CostEstimate:
        """Estimate total processing cost"""
        
    def log_processing(
        self,
        pdf_hash: str,
        actual_cost: float,
        cache_hit: bool,
        processing_time: float
    ) -> None:
        """Log processing event with costs"""
        
    def calculate_savings(self, period_days: int = 30) -> CostSavings:
        """Calculate cost savings from caching"""
        
    def get_cost_breakdown(self) -> Dict:
        """Get detailed cost breakdown"""
```

**Cost Calculation**:

```python
# Base costs (example values)
CLAUDE_INPUT_COST = 3.00 / 1_000_000  # per token
CLAUDE_OUTPUT_COST = 15.00 / 1_000_000  # per token
EMBEDDING_COST = 0.10 / 1_000_000  # per token
OCR_COST_PER_PAGE = 0.05  # Textract pricing
STORAGE_COST_PER_GB_MONTH = 0.023  # S3 pricing

def estimate_cost(doc_type, page_count):
    base_cost = 0
    
    # Text extraction
    if doc_type == "scanned":
        base_cost += page_count * OCR_COST_PER_PAGE
    
    # Concept extraction (Claude)
    estimated_tokens = page_count * 500  # avg tokens per page
    base_cost += estimated_tokens * CLAUDE_INPUT_COST
    base_cost += (estimated_tokens * 0.3) * CLAUDE_OUTPUT_COST
    
    # Embeddings
    concept_count = page_count * 10  # avg concepts per page
    base_cost += concept_count * 100 * EMBEDDING_COST
    
    return base_cost
```

**Database Schema**:
```sql
CREATE TABLE layer0_cost_tracking (
    id UUID PRIMARY KEY,
    pdf_hash VARCHAR(64),
    document_id UUID,
    cache_hit BOOLEAN,
    estimated_cost DECIMAL(10,4),
    actual_cost DECIMAL(10,4),
    cost_saved DECIMAL(10,4),
    processing_time_ms INTEGER,
    page_count INTEGER,
    document_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_tracking_date ON layer0_cost_tracking(created_at);
CREATE INDEX idx_cost_tracking_hash ON layer0_cost_tracking(pdf_hash);
```


### 5. Layer 0 Orchestrator

**Purpose**: Main entry point that coordinates all Layer 0 services

**Class**: `Layer0Orchestrator`

```python
class Layer0Orchestrator:
    """Main orchestrator for Layer 0 processing"""
    
    def __init__(self):
        self.hash_service = PDFHashService()
        self.type_detector = DocumentTypeDetector()
        self.cache_service = Layer0CacheService()
        self.cost_optimizer = Layer0CostOptimizer()
        self.validator = PDFValidator()
    
    async def process_pdf(
        self,
        pdf_path: str,
        document_id: UUID,
        user_id: UUID,
        force_reprocess: bool = False
    ) -> ProcessingResult:
        """
        Main entry point for PDF processing
        
        Flow:
        1. Compute hash
        2. Check cache (unless force_reprocess)
        3. Validate PDF
        4. Detect document type
        5. Estimate cost
        6. Process or return cached
        7. Update cache
        8. Return results
        """
```

**Processing Flow**:

```python
async def process_pdf(self, pdf_path, document_id, user_id, force_reprocess=False):
    start_time = time.time()
    
    # Step 1: Compute hash
    pdf_hash = self.hash_service.compute_hash(pdf_path)
    metadata = self.hash_service.extract_metadata(pdf_path)
    
    # Step 2: Cache lookup
    if not force_reprocess:
        cached = self.cache_service.lookup_by_hash(pdf_hash)
        if cached:
            # Cache hit!
            processing_time = (time.time() - start_time) * 1000
            self.cost_optimizer.log_processing(
                pdf_hash, 0.0, True, processing_time
            )
            return ProcessingResult(
                success=True,
                cached=True,
                data=cached.results,
                processing_time_ms=processing_time
            )
    
    # Step 3: Validate PDF
    is_valid, error = self.validator.validate_pdf(pdf_path)
    if not is_valid:
        return ProcessingResult(success=False, error=error)
    
    # Step 4: Detect document type
    doc_type = self.type_detector.detect_type(pdf_path)
    
    # Step 5: Estimate cost
    cost_estimate = self.cost_optimizer.estimate_processing_cost(
        doc_type, metadata['page_count'], False
    )
    
    # Step 6: Process through existing pipeline
    pipeline = get_pbl_pipeline()
    results = await pipeline.process_document(
        pdf_path, document_id, user_id
    )
    
    # Step 7: Cache results
    if results['success']:
        self.cache_service.store_results(
            pdf_hash, results, metadata
        )
    
    # Step 8: Log costs
    processing_time = (time.time() - start_time) * 1000
    self.cost_optimizer.log_processing(
        pdf_hash, cost_estimate.total, False, processing_time
    )
    
    return ProcessingResult(
        success=True,
        cached=False,
        data=results,
        processing_time_ms=processing_time,
        cost_usd=cost_estimate.total
    )
```


## Data Models

### DocumentType

```python
@dataclass
class DocumentType:
    """Classification of document type"""
    classification: str  # "digital", "scanned", "hybrid"
    confidence: float  # 0.0 to 1.0
    text_pages: int
    image_pages: int
    total_pages: int
    characteristics: Dict[str, Any]
```

### CachedResult

```python
@dataclass
class CachedResult:
    """Cached processing results"""
    pdf_hash: str
    results: Dict  # Full processing results
    metadata: Dict  # File metadata
    created_at: datetime
    last_accessed: datetime
    access_count: int
    compression_ratio: float
```

### CostEstimate

```python
@dataclass
class CostEstimate:
    """Cost estimation breakdown"""
    ocr_cost: float
    extraction_cost: float
    embedding_cost: float
    storage_cost: float
    total: float
    breakdown: Dict[str, float]
```

### ProcessingResult

```python
@dataclass
class ProcessingResult:
    """Result of Layer 0 processing"""
    success: bool
    cached: bool
    data: Dict
    processing_time_ms: float
    cost_usd: Optional[float]
    error: Optional[str]
    pdf_hash: str
    document_type: Optional[DocumentType]
```


## Error Handling

### Validation Errors

```python
class PDFValidationError(Exception):
    """Raised when PDF validation fails"""
    pass

class CacheError(Exception):
    """Raised when cache operations fail"""
    pass

class CostThresholdExceeded(Exception):
    """Raised when estimated cost exceeds threshold"""
    pass
```

### Error Handling Strategy

1. **Validation Failures**: Return clear error to user, don't process
2. **Cache Failures**: Log error, continue with processing (graceful degradation)
3. **Cost Threshold**: Require admin approval or reject
4. **Processing Failures**: Retry with exponential backoff (max 3 attempts)

### Retry Logic

```python
async def process_with_retry(self, pdf_path, max_retries=3):
    for attempt in range(max_retries):
        try:
            return await self.process_pdf(pdf_path)
        except TransientError as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt  # Exponential backoff
            await asyncio.sleep(wait_time)
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {wait_time}s")
```

### Monitoring and Alerts

```python
class Layer0Monitor:
    """Monitor Layer 0 health and performance"""
    
    def check_health(self) -> HealthStatus:
        """
        Check system health
        
        Returns:
            HealthStatus with metrics
        """
        return HealthStatus(
            cache_hit_rate=self._calculate_hit_rate(),
            avg_processing_time=self._get_avg_time(),
            error_rate=self._calculate_error_rate(),
            uptime_percentage=self._calculate_uptime()
        )
    
    def send_alert(self, alert_type: str, message: str):
        """Send alert to administrators"""
        # CloudWatch, SNS, email, etc.
```


## Testing Strategy

### Unit Tests

1. **PDFHashService**
   - Test hash consistency for same file
   - Test hash difference for different files
   - Test metadata extraction

2. **DocumentTypeDetector**
   - Test digital PDF detection
   - Test scanned PDF detection
   - Test hybrid PDF detection
   - Test confidence scoring

3. **Layer0CacheService**
   - Test cache hit/miss
   - Test compression/decompression
   - Test LRU eviction
   - Test expiration cleanup

4. **Layer0CostOptimizer**
   - Test cost estimation accuracy
   - Test savings calculation
   - Test cost tracking

### Integration Tests

1. **End-to-End Flow**
   - Upload → Hash → Cache Miss → Process → Cache → Retrieve
   - Upload → Hash → Cache Hit → Return Cached

2. **Cache Performance**
   - Measure cache hit response time (<500ms)
   - Measure cache miss processing time (<30s for digital)

3. **Cost Tracking**
   - Verify cost calculations
   - Verify savings from caching

### Performance Tests

1. **Load Testing**
   - 100 concurrent uploads
   - 1000 cache lookups/second
   - Large file handling (100MB+)

2. **Reliability Testing**
   - 99% success rate over 10,000 operations
   - Graceful degradation when cache fails
   - Recovery from transient errors


## API Integration

### Updated Endpoint

```python
@router.post("/api/pbl/documents/upload")
async def upload_document(
    file: UploadFile,
    user_id: UUID,
    force_reprocess: bool = False
):
    """
    Upload and process PDF document
    
    Now uses Layer 0 for optimization
    """
    # Save uploaded file
    pdf_path = await save_upload(file)
    
    # Process through Layer 0
    orchestrator = Layer0Orchestrator()
    result = await orchestrator.process_pdf(
        pdf_path,
        document_id=uuid4(),
        user_id=user_id,
        force_reprocess=force_reprocess
    )
    
    return {
        "success": result.success,
        "document_id": str(result.data.get('document_id')),
        "cached": result.cached,
        "processing_time_ms": result.processing_time_ms,
        "cost_usd": result.cost_usd,
        "document_type": result.document_type.classification if result.document_type else None
    }
```

### New Admin Endpoints

```python
@router.get("/api/admin/layer0/stats")
async def get_layer0_stats():
    """Get Layer 0 statistics"""
    orchestrator = Layer0Orchestrator()
    return {
        "cache": orchestrator.cache_service.get_cache_stats(),
        "costs": orchestrator.cost_optimizer.get_cost_breakdown(),
        "health": orchestrator.monitor.check_health()
    }

@router.post("/api/admin/layer0/cache/clear")
async def clear_cache(pdf_hash: Optional[str] = None):
    """Clear cache entries"""
    orchestrator = Layer0Orchestrator()
    if pdf_hash:
        count = orchestrator.cache_service.invalidate_cache(pdf_hash)
    else:
        count = orchestrator.cache_service.cleanup_expired()
    return {"cleared": count}

@router.get("/api/admin/layer0/costs")
async def get_cost_report(days: int = 30):
    """Get cost report"""
    orchestrator = Layer0Orchestrator()
    return orchestrator.cost_optimizer.calculate_savings(days)
```


## Frontend Integration

### Upload Component Enhancement

```typescript
// src/components/documents/UploadDocumentModal.tsx

interface UploadResponse {
  success: boolean;
  document_id: string;
  cached: boolean;
  processing_time_ms: number;
  cost_usd?: number;
  document_type?: string;
}

const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/pbl/documents/upload', {
    method: 'POST',
    body: formData
  });
  
  const result: UploadResponse = await response.json();
  
  if (result.cached) {
    toast.success(
      `Document loaded from cache in ${result.processing_time_ms}ms!`
    );
  } else {
    toast.success(
      `Document processed in ${(result.processing_time_ms / 1000).toFixed(1)}s`
    );
  }
};
```

### Admin Dashboard Component

```typescript
// src/pages/admin/Layer0DashboardPage.tsx

interface Layer0Stats {
  cache: {
    total_entries: number;
    hit_rate: number;
    storage_size_mb: number;
  };
  costs: {
    total_cost: number;
    cost_saved: number;
    savings_percentage: number;
  };
  health: {
    uptime_percentage: number;
    avg_processing_time_ms: number;
    error_rate: number;
  };
}

const Layer0Dashboard = () => {
  const [stats, setStats] = useState<Layer0Stats | null>(null);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  return (
    <div className="layer0-dashboard">
      <h1>Layer 0 Performance</h1>
      
      <div className="stats-grid">
        <StatCard
          title="Cache Hit Rate"
          value={`${(stats?.cache.hit_rate * 100).toFixed(1)}%`}
          icon="cache"
        />
        <StatCard
          title="Cost Savings"
          value={`$${stats?.costs.cost_saved.toFixed(2)}`}
          subtitle={`${stats?.costs.savings_percentage.toFixed(0)}% saved`}
          icon="dollar"
        />
        <StatCard
          title="Uptime"
          value={`${(stats?.health.uptime_percentage).toFixed(2)}%`}
          icon="check"
        />
        <StatCard
          title="Avg Processing Time"
          value={`${stats?.health.avg_processing_time_ms}ms`}
          icon="clock"
        />
      </div>
      
      <CostChart data={stats?.costs} />
      <CacheManagement />
    </div>
  );
};
```


## Performance Optimization

### Caching Strategy

1. **In-Memory Cache** (Redis)
   - Store hash lookups for ultra-fast access
   - TTL: 1 hour
   - Eviction: LRU

2. **Database Cache** (PostgreSQL)
   - Store full results with compression
   - TTL: 90 days
   - Eviction: LRU when storage exceeds threshold

3. **CDN Cache** (CloudFront)
   - Cache static visualization assets
   - TTL: 7 days

### Database Optimization

```sql
-- Indexes for fast lookups
CREATE INDEX idx_pdf_cache_hash ON pdf_cache(pdf_hash);
CREATE INDEX idx_pdf_cache_accessed ON pdf_cache(last_accessed DESC);

-- Partitioning by date for efficient cleanup
CREATE TABLE pdf_cache_2024_01 PARTITION OF pdf_cache
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Materialized view for stats
CREATE MATERIALIZED VIEW layer0_stats AS
SELECT
    COUNT(*) as total_entries,
    SUM(CASE WHEN last_accessed > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as active_entries,
    AVG(compression_ratio) as avg_compression,
    SUM(storage_size_bytes) / 1024 / 1024 as total_size_mb
FROM pdf_cache;

-- Refresh stats hourly
CREATE OR REPLACE FUNCTION refresh_layer0_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW layer0_stats;
END;
$$ LANGUAGE plpgsql;
```

### Compression Strategy

```python
import gzip
import json

def compress_results(results: Dict) -> bytes:
    """Compress results with gzip"""
    json_str = json.dumps(results)
    return gzip.compress(json_str.encode('utf-8'))

def decompress_results(compressed: bytes) -> Dict:
    """Decompress results"""
    json_str = gzip.decompress(compressed).decode('utf-8')
    return json.loads(json_str)
```

### Parallel Processing

```python
async def process_multiple_pdfs(pdf_paths: List[str]) -> List[ProcessingResult]:
    """Process multiple PDFs in parallel"""
    tasks = [
        orchestrator.process_pdf(path, uuid4(), user_id)
        for path in pdf_paths
    ]
    return await asyncio.gather(*tasks, return_exceptions=True)
```


## Deployment and Configuration

### Environment Variables

```bash
# Layer 0 Configuration
LAYER0_CACHE_ENABLED=true
LAYER0_CACHE_TTL_DAYS=90
LAYER0_CACHE_MAX_SIZE_GB=100
LAYER0_COST_THRESHOLD_USD=50.0
LAYER0_MAX_FILE_SIZE_MB=100
LAYER0_PARALLEL_PROCESSING_LIMIT=5

# Redis Configuration (for in-memory cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Monitoring
LAYER0_ENABLE_MONITORING=true
LAYER0_ALERT_EMAIL=admin@example.com
```

### Database Migration

```sql
-- Migration: 20250124_0002_layer0_tables.sql

-- PDF Cache table
CREATE TABLE IF NOT EXISTS pdf_cache (
    pdf_hash VARCHAR(64) PRIMARY KEY,
    file_metadata JSONB NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    processing_results BYTEA NOT NULL,
    embeddings BYTEA,
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    storage_size_bytes INTEGER,
    compression_ratio FLOAT
);

-- Cost tracking table
CREATE TABLE IF NOT EXISTS layer0_cost_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_hash VARCHAR(64),
    document_id UUID,
    cache_hit BOOLEAN,
    estimated_cost DECIMAL(10,4),
    actual_cost DECIMAL(10,4),
    cost_saved DECIMAL(10,4),
    processing_time_ms INTEGER,
    page_count INTEGER,
    document_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pdf_cache_last_accessed ON pdf_cache(last_accessed);
CREATE INDEX idx_pdf_cache_created ON pdf_cache(created_at);
CREATE INDEX idx_cost_tracking_date ON layer0_cost_tracking(created_at);
CREATE INDEX idx_cost_tracking_hash ON layer0_cost_tracking(pdf_hash);

-- Stats view
CREATE MATERIALIZED VIEW layer0_stats AS
SELECT
    COUNT(*) as total_cache_entries,
    SUM(CASE WHEN last_accessed > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as active_entries,
    AVG(compression_ratio) as avg_compression,
    SUM(storage_size_bytes) / 1024 / 1024 as total_size_mb,
    (SELECT COUNT(*) FROM layer0_cost_tracking WHERE cache_hit = true) as total_cache_hits,
    (SELECT COUNT(*) FROM layer0_cost_tracking WHERE cache_hit = false) as total_cache_misses,
    (SELECT SUM(cost_saved) FROM layer0_cost_tracking) as total_cost_saved
FROM pdf_cache;
```

### Rollback Migration

```sql
-- Migration: 20250124_0002_layer0_tables_rollback.sql

DROP MATERIALIZED VIEW IF EXISTS layer0_stats;
DROP TABLE IF EXISTS layer0_cost_tracking;
DROP TABLE IF EXISTS pdf_cache;
```


## Monitoring and Observability

### Metrics to Track

1. **Cache Performance**
   - Hit rate (target: >60%)
   - Miss rate
   - Average lookup time
   - Cache size and growth rate

2. **Cost Metrics**
   - Daily processing cost
   - Cost per document
   - Savings from caching
   - Cost by document type

3. **Performance Metrics**
   - Average processing time (cached vs. uncached)
   - P95 and P99 latencies
   - Throughput (documents/hour)
   - Error rate (target: <1%)

4. **Reliability Metrics**
   - Uptime percentage (target: 99%)
   - Failed processing attempts
   - Retry success rate
   - Cache failure rate

### CloudWatch Integration

```python
import boto3

class CloudWatchMetrics:
    """Send metrics to CloudWatch"""
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.namespace = 'SensaLearn/Layer0'
    
    def put_metric(self, metric_name: str, value: float, unit: str = 'None'):
        """Send metric to CloudWatch"""
        self.cloudwatch.put_metric_data(
            Namespace=self.namespace,
            MetricData=[{
                'MetricName': metric_name,
                'Value': value,
                'Unit': unit,
                'Timestamp': datetime.now()
            }]
        )
    
    def put_cache_hit(self):
        """Record cache hit"""
        self.put_metric('CacheHit', 1, 'Count')
    
    def put_cache_miss(self):
        """Record cache miss"""
        self.put_metric('CacheMiss', 1, 'Count')
    
    def put_processing_time(self, time_ms: float):
        """Record processing time"""
        self.put_metric('ProcessingTime', time_ms, 'Milliseconds')
    
    def put_cost(self, cost_usd: float):
        """Record processing cost"""
        self.put_metric('ProcessingCost', cost_usd, 'None')
```

### Logging Strategy

```python
import logging
import json

logger = logging.getLogger('layer0')

# Structured logging
def log_processing_event(event_type: str, data: Dict):
    """Log structured event"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'event_type': event_type,
        'data': data
    }
    logger.info(json.dumps(log_entry))

# Usage
log_processing_event('cache_hit', {
    'pdf_hash': hash_value,
    'processing_time_ms': 234,
    'document_id': str(doc_id)
})
```


## Security Considerations

### Hash Collision Prevention

- Use SHA-256 (cryptographically secure)
- Probability of collision: negligible (2^-256)
- Store file size as additional validation

### Access Control

```python
def validate_access(user_id: UUID, pdf_hash: str) -> bool:
    """Ensure user has access to cached document"""
    # Check if user uploaded this document
    # or has been granted access
    return check_document_ownership(user_id, pdf_hash)
```

### Data Privacy

- Cache only processed results, not raw PDF content
- Implement cache isolation per user/organization
- Support cache purging for GDPR compliance

### Rate Limiting

```python
class Layer0RateLimiter:
    """Rate limit Layer 0 operations"""
    
    def check_rate_limit(self, user_id: UUID) -> bool:
        """
        Check if user is within rate limits
        
        Limits:
        - 100 uploads per hour
        - 1000 cache lookups per hour
        """
        uploads = self.get_upload_count(user_id, hours=1)
        if uploads >= 100:
            raise RateLimitExceeded("Upload limit exceeded")
        return True
```

## Success Metrics

### Target KPIs

1. **Reliability**: 99% uptime and success rate
2. **Performance**:
   - Cache hit response: <500ms (P95)
   - New document processing: <30s for digital PDFs (P95)
3. **Cost Optimization**:
   - Cache hit rate: >60%
   - Cost savings: >40% compared to no caching
4. **User Experience**:
   - Reduced wait time for repeat uploads
   - Clear feedback on processing status

### Monitoring Dashboard

```
┌─────────────────────────────────────────────────────┐
│ Layer 0 Performance Dashboard                       │
├─────────────────────────────────────────────────────┤
│ Cache Hit Rate:        67.3% ▲                      │
│ Avg Processing Time:   1.2s  ▼                      │
│ Cost Saved Today:      $23.45 ▲                     │
│ Uptime (24h):          99.8% ✓                      │
├─────────────────────────────────────────────────────┤
│ [Cache Performance Chart]                           │
│ [Cost Savings Chart]                                │
│ [Processing Time Distribution]                      │
└─────────────────────────────────────────────────────┘
```

## Future Enhancements

1. **Smart Prefetching**: Predict and pre-cache likely documents
2. **Distributed Caching**: Multi-region cache for global performance
3. **ML-Based Type Detection**: Improve document classification accuracy
4. **Incremental Processing**: Process only changed pages for updated PDFs
5. **Cost Prediction**: ML model to predict processing costs more accurately

