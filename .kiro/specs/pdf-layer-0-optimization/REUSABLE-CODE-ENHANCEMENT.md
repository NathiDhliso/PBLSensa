# Layer 0 PDF Optimization - Reusable Code Enhancement Plan

## Executive Summary

This document identifies reusable patterns in the Layer 0 implementation and proposes enhancements to maximize code reuse, reduce duplication, and improve maintainability.

## Current Architecture Analysis

### Strengths
1. **Service Inheritance Pattern**: Layer 0 services extend base services (CacheManager, CostTracker)
2. **Singleton Pattern**: Consistent use of singleton factory functions
3. **Dataclass Usage**: Clean data structures with type hints
4. **Separation of Concerns**: Each service has a clear, focused responsibility

### Identified Reusable Patterns

#### 1. Hash Computation Pattern
**Location**: `PDFHashService`
**Reusability**: HIGH

The chunked file reading and hash computation pattern can be extracted into a generic utility:

```python
# Proposed: backend/utils/file_hash.py
class FileHasher:
    """Generic file hashing utility"""
    
    @staticmethod
    def compute_hash(file_path: str, algorithm: str = 'sha256', chunk_size: int = 8192) -> str:
        """Compute hash of any file type"""
        
    @staticmethod
    def compute_hash_from_bytes(data: bytes, algorithm: str = 'sha256') -> str:
        """Compute hash from bytes"""
        
    @staticmethod
    def verify_hash(file_path: str, expected_hash: str, algorithm: str = 'sha256') -> bool:
        """Verify file integrity"""
```

**Benefits**:
- Reusable for images, documents, uploads
- Supports multiple hash algorithms (SHA-256, MD5, SHA-512)
- Can be used by other services (image processing, file uploads)

---

#### 2. Metadata Extraction Pattern
**Location**: `PDFHashService.extract_metadata()`
**Reusability**: MEDIUM

PDF metadata extraction is specific but the pattern is reusable:

```python
# Proposed: backend/utils/document_metadata.py
class DocumentMetadataExtractor:
    """Extract metadata from various document types"""
    
    def extract_pdf_metadata(self, pdf_path: str) -> Dict
    def extract_image_metadata(self, image_path: str) -> Dict
    def extract_docx_metadata(self, docx_path: str) -> Dict
    
    def get_file_system_metadata(self, file_path: str) -> Dict:
        """Common file system metadata (size, dates, etc.)"""
```

**Benefits**:
- Supports multiple document formats
- Consistent metadata structure across file types
- Extensible for future document types

---

#### 3. Compression/Decompression Pattern
**Location**: `Layer0CacheService._compress_data()`, `_decompress_data()`
**Reusability**: HIGH

Generic compression utilities can be extracted:

```python
# Proposed: backend/utils/compression.py
class CompressionUtil:
    """Generic data compression utilities"""
    
    @staticmethod
    def compress_json(data: Dict, algorithm: str = 'gzip') -> bytes:
        """Compress JSON data"""
        
    @staticmethod
    def decompress_json(compressed: bytes, algorithm: str = 'gzip') -> Dict:
        """Decompress to JSON"""
        
    @staticmethod
    def calculate_compression_ratio(original_size: int, compressed_size: int) -> float:
        """Calculate compression efficiency"""
        
    @staticmethod
    def compress_text(text: str, algorithm: str = 'gzip') -> bytes:
        """Compress text data"""
```

**Benefits**:
- Reusable for caching, storage, API responses
- Support multiple algorithms (gzip, zlib, brotli)
- Consistent compression across services

---

#### 4. LRU Eviction Pattern
**Location**: `Layer0CacheService.evict_lru()`
**Reusability**: HIGH

LRU eviction logic can be generalized:

```python
# Proposed: backend/utils/cache_eviction.py
class CacheEvictionStrategy:
    """Generic cache eviction strategies"""
    
    @staticmethod
    def evict_lru(cache_dict: Dict, target_size: int, size_calculator: Callable) -> int:
        """Least Recently Used eviction"""
        
    @staticmethod
    def evict_lfu(cache_dict: Dict, target_size: int, size_calculator: Callable) -> int:
        """Least Frequently Used eviction"""
        
    @staticmethod
    def evict_fifo(cache_dict: Dict, target_size: int, size_calculator: Callable) -> int:
        """First In First Out eviction"""
        
    @staticmethod
    def evict_by_age(cache_dict: Dict, max_age_days: int) -> int:
        """Age-based eviction"""
```

**Benefits**:
- Multiple eviction strategies
- Reusable across different cache implementations
- Testable in isolation

---

#### 5. Cost Calculation Pattern
**Location**: `Layer0CostOptimizer`
**Reusability**: MEDIUM-HIGH

Cost calculation can be more modular:

```python
# Proposed: backend/utils/cost_calculator.py
class AWSCostCalculator:
    """Calculate AWS service costs"""
    
    # Cost constants as class attributes
    CLAUDE_INPUT_COST_PER_TOKEN = 3.00 / 1_000_000
    CLAUDE_OUTPUT_COST_PER_TOKEN = 15.00 / 1_000_000
    TEXTRACT_COST_PER_PAGE = 0.05
    S3_STORAGE_COST_PER_GB_MONTH = 0.023
    EMBEDDING_COST_PER_TOKEN = 0.10 / 1_000_000
    
    @staticmethod
    def calculate_claude_cost(input_tokens: int, output_tokens: int) -> float:
        """Calculate Claude API cost"""
        
    @staticmethod
    def calculate_textract_cost(page_count: int) -> float:
        """Calculate Textract OCR cost"""
        
    @staticmethod
    def calculate_embedding_cost(token_count: int) -> float:
        """Calculate embedding generation cost"""
        
    @staticmethod
    def calculate_storage_cost(size_gb: float, days: int) -> float:
        """Calculate S3 storage cost"""
```

**Benefits**:
- Centralized cost constants
- Easy to update pricing
- Reusable across all services
- Consistent cost calculations

---

#### 6. Retry Logic Pattern
**Location**: `BedrockAnalogyGenerator.generate_analogies()`
**Reusability**: HIGH

Exponential backoff retry logic is highly reusable:

```python
# Proposed: backend/utils/retry.py
class RetryStrategy:
    """Generic retry strategies with backoff"""
    
    @staticmethod
    async def retry_with_exponential_backoff(
        func: Callable,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exceptions: tuple = (Exception,)
    ) -> Any:
        """Retry function with exponential backoff"""
        
    @staticmethod
    async def retry_with_linear_backoff(
        func: Callable,
        max_retries: int = 3,
        delay: float = 1.0,
        exceptions: tuple = (Exception,)
    ) -> Any:
        """Retry function with linear backoff"""
```

**Benefits**:
- Reusable for all API calls (Bedrock, Textract, S3)
- Configurable retry strategies
- Reduces code duplication
- Consistent error handling

---

#### 7. Singleton Factory Pattern
**Location**: All Layer 0 services
**Reusability**: HIGH

The singleton pattern is repeated across services:

```python
# Proposed: backend/utils/singleton.py
from typing import TypeVar, Type, Optional, Dict
from threading import Lock

T = TypeVar('T')

class SingletonMeta(type):
    """Thread-safe singleton metaclass"""
    _instances: Dict[Type, Any] = {}
    _lock: Lock = Lock()
    
    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]


# Usage:
class PDFHashService(metaclass=SingletonMeta):
    """Service is automatically a singleton"""
    pass
```

**Benefits**:
- Eliminates boilerplate singleton code
- Thread-safe by default
- Consistent pattern across all services
- Easier to test (can reset singletons)

---

#### 8. Page Sampling Strategy
**Location**: `DocumentTypeDetector._get_sample_pages()`
**Reusability**: MEDIUM

Page sampling logic can be generalized:

```python
# Proposed: backend/utils/sampling.py
class SamplingStrategy:
    """Generic sampling strategies for large datasets"""
    
    @staticmethod
    def sample_distributed(total_items: int, max_samples: int = 9) -> List[int]:
        """Sample items distributed across range (first, middle, last)"""
        
    @staticmethod
    def sample_random(total_items: int, sample_size: int) -> List[int]:
        """Random sampling"""
        
    @staticmethod
    def sample_stratified(total_items: int, strata: int, samples_per_stratum: int) -> List[int]:
        """Stratified sampling"""
```

**Benefits**:
- Reusable for document analysis, data processing
- Multiple sampling strategies
- Testable and configurable

---

#### 9. Statistics Aggregation Pattern
**Location**: Multiple services (`get_cache_stats()`, `get_cost_stats()`)
**Reusability**: MEDIUM

Statistics calculation pattern is repeated:

```python
# Proposed: backend/utils/statistics.py
class StatisticsAggregator:
    """Calculate statistics from data collections"""
    
    @staticmethod
    def calculate_percentages(part: float, total: float) -> float:
        """Safe percentage calculation"""
        
    @staticmethod
    def calculate_average(values: List[float]) -> float:
        """Calculate average with empty list handling"""
        
    @staticmethod
    def calculate_hit_rate(hits: int, total: int) -> float:
        """Calculate cache hit rate"""
        
    @staticmethod
    def aggregate_by_time_period(
        entries: List[Dict],
        date_field: str,
        value_field: str,
        period: str = 'day'
    ) -> Dict:
        """Aggregate data by time period"""
```

**Benefits**:
- Consistent statistics calculations
- Safe handling of edge cases (division by zero)
- Reusable across monitoring and reporting

---

## Proposed Utility Module Structure

```
backend/utils/
├── __init__.py
├── file_hash.py              # Generic file hashing
├── compression.py            # Data compression utilities
├── retry.py                  # Retry strategies
├── singleton.py              # Singleton pattern
├── cache_eviction.py         # Cache eviction strategies
├── cost_calculator.py        # AWS cost calculations
├── sampling.py               # Sampling strategies
├── statistics.py             # Statistics aggregation
├── document_metadata.py      # Document metadata extraction
└── validation.py             # Common validation utilities
```

---

## Enhancement Priorities

### Phase 1: High-Impact, Low-Risk (Immediate)
1. **Extract FileHasher utility** - Used by multiple services
2. **Extract CompressionUtil** - Critical for caching
3. **Extract RetryStrategy** - Improves reliability
4. **Extract AWSCostCalculator** - Centralizes pricing

### Phase 2: Code Quality Improvements (Short-term)
5. **Implement SingletonMeta** - Reduces boilerplate
6. **Extract CacheEvictionStrategy** - Enables multiple strategies
7. **Extract StatisticsAggregator** - Improves consistency

### Phase 3: Advanced Features (Medium-term)
8. **Extract SamplingStrategy** - Enables advanced analysis
9. **Extract DocumentMetadataExtractor** - Supports more formats
10. **Create ValidationUtil** - Centralized validation

---

## Implementation Guidelines

### 1. Backward Compatibility
- Keep existing service interfaces unchanged
- Services should use utilities internally
- No breaking changes to public APIs

### 2. Testing Strategy
- Create unit tests for each utility module
- Test utilities in isolation
- Integration tests for services using utilities

### 3. Migration Path
- Create utility modules first
- Update one service at a time
- Verify functionality after each migration
- Update documentation

### 4. Documentation
- Add docstrings to all utility functions
- Create usage examples
- Document benefits and use cases

---

## Benefits Summary

### Code Reuse
- Reduce duplication by ~30-40%
- Shared utilities across services
- Consistent patterns

### Maintainability
- Single source of truth for common logic
- Easier to update (e.g., pricing changes)
- Centralized bug fixes

### Testability
- Utilities testable in isolation
- Easier to mock in tests
- Better test coverage

### Extensibility
- Easy to add new strategies (eviction, retry, sampling)
- Support new document types
- Add new cost calculations

### Performance
- Optimized implementations in one place
- Consistent performance characteristics
- Easier to profile and optimize

---

## Next Steps

1. **Review this document** with the team
2. **Prioritize enhancements** based on immediate needs
3. **Create utility modules** (Phase 1)
4. **Migrate existing code** incrementally
5. **Update tests and documentation**
6. **Monitor for issues** during migration

---

## Conclusion

The Layer 0 implementation has excellent foundations with clear separation of concerns and good design patterns. By extracting reusable utilities, we can:

- Reduce code duplication significantly
- Improve maintainability and testability
- Enable faster development of new features
- Create a more robust and consistent codebase

The proposed enhancements maintain backward compatibility while providing a clear path to a more modular, reusable architecture.
