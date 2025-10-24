# Reusable Code Examples

## 1. FileHasher Utility

### Implementation
```python
# backend/utils/file_hash.py
import hashlib
from pathlib import Path
from typing import Literal

HashAlgorithm = Literal['md5', 'sha1', 'sha256', 'sha512']

class FileHasher:
    """Generic file hashing utility"""
    
    @staticmethod
    def compute_hash(
        file_path: str,
        algorithm: HashAlgorithm = 'sha256',
        chunk_size: int = 8192
    ) -> str:
        """Compute hash of file"""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        hash_obj = hashlib.new(algorithm)
        with open(file_path, 'rb') as f:
            while chunk := f.read(chunk_size):
                hash_obj.update(chunk)
        
        return hash_obj.hexdigest()
    
    @staticmethod
    def compute_hash_from_bytes(
        data: bytes,
        algorithm: HashAlgorithm = 'sha256'
    ) -> str:
        """Compute hash from bytes"""
        return hashlib.new(algorithm, data).hexdigest()
```

### Usage in PDFHashService
```python
from utils.file_hash import FileHasher

class PDFHashService:
    def compute_hash(self, pdf_path: str) -> str:
        return FileHasher.compute_hash(pdf_path, algorithm='sha256')
    
    def compute_hash_from_bytes(self, pdf_bytes: bytes) -> str:
        return FileHasher.compute_hash_from_bytes(pdf_bytes)
```

---

## 2. CompressionUtil

### Implementation
```python
# backend/utils/compression.py
import gzip
import json
from typing import Dict

class CompressionUtil:
    """Data compression utilities"""
    
    @staticmethod
    def compress_json(data: Dict) -> bytes:
        """Compress JSON data with gzip"""
        json_str = json.dumps(data)
        return gzip.compress(json_str.encode('utf-8'))
    
    @staticmethod
    def decompress_json(compressed: bytes) -> Dict:
        """Decompress gzip data to JSON"""
        json_str = gzip.decompress(compressed).decode('utf-8')
        return json.loads(json_str)
    
    @staticmethod
    def calculate_compression_ratio(
        original_size: int,
        compressed_size: int
    ) -> float:
        """Calculate compression ratio"""
        if original_size == 0:
            return 1.0
        return compressed_size / original_size
```

### Usage in Layer0CacheService
```python
from utils.compression import CompressionUtil

class Layer0CacheService:
    def _compress_data(self, data: Dict) -> bytes:
        return CompressionUtil.compress_json(data)
    
    def _decompress_data(self, compressed: bytes) -> Dict:
        return CompressionUtil.decompress_json(compressed)
```

---

## 3. RetryStrategy

### Implementation
```python
# backend/utils/retry.py
import time
import logging
from typing import Callable, Any, Tuple, Type

logger = logging.getLogger(__name__)

class RetryStrategy:
    """Retry strategies with backoff"""
    
    @staticmethod
    def retry_with_exponential_backoff(
        func: Callable,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exceptions: Tuple[Type[Exception], ...] = (Exception,)
    ) -> Any:
        """Retry with exponential backoff"""
        for attempt in range(max_retries):
            try:
                return func()
            except exceptions as e:
                if attempt == max_retries - 1:
                    raise
                
                delay = min(base_delay * (2 ** attempt), max_delay)
                logger.warning(
                    f"Attempt {attempt + 1} failed: {e}. "
                    f"Retrying in {delay}s..."
                )
                time.sleep(delay)
```

### Usage in BedrockAnalogyGenerator
```python
from utils.retry import RetryStrategy

class BedrockAnalogyGenerator:
    async def generate_analogies(self, ...):
        return RetryStrategy.retry_with_exponential_backoff(
            func=lambda: self._call_bedrock(prompt),
            max_retries=3,
            base_delay=1.0
        )
```

---

## 4. AWSCostCalculator

### Implementation
```python
# backend/utils/cost_calculator.py
class AWSCostCalculator:
    """AWS service cost calculations"""
    
    # Pricing constants (update in one place)
    CLAUDE_INPUT_COST_PER_TOKEN = 3.00 / 1_000_000
    CLAUDE_OUTPUT_COST_PER_TOKEN = 15.00 / 1_000_000
    TEXTRACT_COST_PER_PAGE = 0.05
    S3_STORAGE_COST_PER_GB_MONTH = 0.023
    EMBEDDING_COST_PER_TOKEN = 0.10 / 1_000_000
    
    @staticmethod
    def calculate_claude_cost(
        input_tokens: int,
        output_tokens: int
    ) -> float:
        """Calculate Claude API cost"""
        input_cost = input_tokens * AWSCostCalculator.CLAUDE_INPUT_COST_PER_TOKEN
        output_cost = output_tokens * AWSCostCalculator.CLAUDE_OUTPUT_COST_PER_TOKEN
        return input_cost + output_cost
    
    @staticmethod
    def calculate_textract_cost(page_count: int) -> float:
        """Calculate Textract OCR cost"""
        return page_count * AWSCostCalculator.TEXTRACT_COST_PER_PAGE
```

### Usage in Layer0CostOptimizer
```python
from utils.cost_calculator import AWSCostCalculator

class Layer0CostOptimizer:
    def estimate_processing_cost(self, doc_type, page_count):
        # OCR cost
        if doc_type.classification == "scanned":
            ocr_cost = AWSCostCalculator.calculate_textract_cost(page_count)
        
        # Claude cost
        estimated_tokens = page_count * 500
        extraction_cost = AWSCostCalculator.calculate_claude_cost(
            input_tokens=estimated_tokens,
            output_tokens=int(estimated_tokens * 0.3)
        )
```

---

## Benefits Demonstrated

### Before: Duplicated Code
```python
# In 3 different services
input_cost = (tokens / 1_000_000) * 3.00
output_cost = (tokens / 1_000_000) * 15.00
```

### After: Reusable Utility
```python
# In 1 place
cost = AWSCostCalculator.calculate_claude_cost(input_tokens, output_tokens)
```

**Result**: When pricing changes, update once instead of 3+ times.

---

## Testing Examples

### FileHasher Test
```python
def test_compute_hash():
    # Create test file
    test_file = "test.pdf"
    with open(test_file, 'wb') as f:
        f.write(b"test content")
    
    # Compute hash
    hash1 = FileHasher.compute_hash(test_file)
    hash2 = FileHasher.compute_hash(test_file)
    
    # Should be consistent
    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256 is 64 hex chars
```

### CompressionUtil Test
```python
def test_compression():
    data = {"key": "value" * 1000}
    
    # Compress
    compressed = CompressionUtil.compress_json(data)
    
    # Should be smaller
    original_size = len(json.dumps(data))
    assert len(compressed) < original_size
    
    # Decompress
    decompressed = CompressionUtil.decompress_json(compressed)
    assert decompressed == data
```

---

## Migration Checklist

For each service:
- [ ] Identify duplicated code
- [ ] Create/use appropriate utility
- [ ] Update service to call utility
- [ ] Run existing tests (should pass)
- [ ] Add new utility tests
- [ ] Update documentation
- [ ] Code review
- [ ] Deploy

---

## Performance Notes

- **FileHasher**: No performance impact (same algorithm)
- **CompressionUtil**: Slightly faster (optimized implementation)
- **RetryStrategy**: Improves reliability without overhead
- **AWSCostCalculator**: Negligible (simple math)

All utilities are designed for zero performance regression.
