# Quick Start: Layer 0 Enhancements

## Immediate Action Items

### 1. Create Utils Directory
```bash
mkdir backend/utils
touch backend/utils/__init__.py
```

### 2. Priority 1: FileHasher Utility

**File**: `backend/utils/file_hash.py`

**Why**: Used by PDFHashService, can be reused for images, uploads, any file type

**Key Methods**:
- `compute_hash(file_path, algorithm='sha256')` - Hash any file
- `compute_hash_from_bytes(data, algorithm='sha256')` - Hash bytes
- `verify_hash(file_path, expected_hash)` - Verify integrity

**Impact**: Eliminates duplication, supports multiple hash algorithms

---

### 3. Priority 2: CompressionUtil

**File**: `backend/utils/compression.py`

**Why**: Critical for Layer0CacheService, reusable for API responses, storage

**Key Methods**:
- `compress_json(data, algorithm='gzip')` - Compress JSON
- `decompress_json(compressed, algorithm='gzip')` - Decompress JSON
- `calculate_compression_ratio(original, compressed)` - Efficiency metric

**Impact**: Consistent compression, support multiple algorithms

---

### 4. Priority 3: RetryStrategy

**File**: `backend/utils/retry.py`

**Why**: Used by BedrockAnalogyGenerator, needed for all AWS API calls

**Key Methods**:
- `retry_with_exponential_backoff(func, max_retries=3)` - Exponential backoff
- `retry_with_linear_backoff(func, max_retries=3)` - Linear backoff

**Impact**: Improves reliability, reduces code duplication

---

### 5. Priority 4: AWSCostCalculator

**File**: `backend/utils/cost_calculator.py`

**Why**: Centralize pricing, easy updates when AWS changes rates

**Key Methods**:
- `calculate_claude_cost(input_tokens, output_tokens)` - Claude pricing
- `calculate_textract_cost(page_count)` - OCR pricing
- `calculate_embedding_cost(token_count)` - Embedding pricing
- `calculate_storage_cost(size_gb, days)` - S3 pricing

**Impact**: Single source of truth for pricing, easy maintenance

---

## Implementation Order

1. **Day 1**: Create FileHasher + tests
2. **Day 2**: Create CompressionUtil + tests
3. **Day 3**: Create RetryStrategy + tests
4. **Day 4**: Create AWSCostCalculator + tests
5. **Day 5**: Migrate PDFHashService to use FileHasher
6. **Week 2**: Migrate remaining services

---

## Testing Checklist

For each utility:
- [ ] Unit tests with 90%+ coverage
- [ ] Edge case handling (empty files, None values, etc.)
- [ ] Performance benchmarks
- [ ] Documentation with examples

---

## Migration Safety

✅ Keep existing service methods
✅ Services call utilities internally
✅ No API changes
✅ Backward compatible

---

## Success Metrics

- **Code Reduction**: 30-40% less duplication
- **Test Coverage**: 90%+ for utilities
- **Performance**: No regression
- **Maintainability**: Single update point for common logic

---

## Next Steps After Phase 1

1. Implement SingletonMeta
2. Extract CacheEvictionStrategy
3. Extract StatisticsAggregator
4. Extend to other services (PBL, Sensa)

See `REUSABLE-CODE-ENHANCEMENT.md` for complete details.
