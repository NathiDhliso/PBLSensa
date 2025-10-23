# Quick Start: Document Extraction with Real AWS Integration

## Prerequisites

1. **AWS Credentials** configured:
   ```bash
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_REGION=us-east-1
   ```

2. **Bedrock Access** enabled for:
   - Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`)
   - Titan Embeddings (`amazon.titan-embed-text-v1`)

3. **Python Dependencies** installed:
   ```bash
   pip install boto3 pdfplumber
   ```

## Usage Examples

### 1. Extract Concepts from PDF

```python
from services.pbl import get_pbl_pipeline
from uuid import uuid4

# Initialize pipeline
pipeline = get_pbl_pipeline()

# Process document
result = pipeline.process_document(
    pdf_path="path/to/your/document.pdf",
    document_id=uuid4()
)

# Check results
print(f"Success: {result['success']}")
print(f"Concepts extracted: {result['results']['concepts_extracted']}")
print(f"Relationships detected: {result['results']['relationships_detected']}")
```

### 2. Test Claude Integration

```python
from services.bedrock_client import BedrockAnalogyGenerator

# Initialize client
client = BedrockAnalogyGenerator()

# Test simple prompt
response = client.invoke_claude(
    "Explain machine learning in one sentence.",
    max_tokens=100
)
print(response)
```

### 3. Test Titan Embeddings

```python
from services.embedding_service import get_embedding_service

# Initialize service
embedding_service = get_embedding_service()

# Generate single embedding
embedding = embedding_service.generate_embedding(
    "Machine learning is a subset of artificial intelligence."
)
print(f"Embedding dimensions: {len(embedding)}")
print(f"First 5 values: {embedding[:5]}")

# Generate batch embeddings
texts = [
    "Neural networks are inspired by the human brain.",
    "Deep learning uses multiple layers of neural networks.",
    "Supervised learning requires labeled training data."
]

embeddings = embedding_service.generate_embeddings_batch(texts)
print(f"Generated {len(embeddings)} embeddings")

# Calculate similarity
similarity = embedding_service.calculate_similarity(
    embeddings[0],
    embeddings[1]
)
print(f"Similarity between text 1 and 2: {similarity:.3f}")
```

### 4. Extract Concepts Only

```python
from services.pbl import get_concept_extractor

# Initialize extractor
extractor = get_concept_extractor()

# Extract concepts
concepts = extractor.extract_concepts(
    pdf_path="document.pdf",
    document_id="doc-123"
)

# Print results
for concept in concepts[:5]:  # First 5 concepts
    print(f"\nTerm: {concept.term}")
    print(f"Definition: {concept.definition}")
    print(f"Page: {concept.page_number}")
    print(f"Importance: {concept.importance_score}")
    print(f"Has embedding: {concept.embedding is not None}")
```

### 5. Classify Relationships

```python
from services.pbl import get_structure_classifier

# Initialize classifier
classifier = get_structure_classifier()

# Detect relationships (assuming you have concepts)
relationships = classifier.detect_relationships(
    concepts=concepts,
    min_strength=0.3
)

# Print results
for rel in relationships[:5]:  # First 5 relationships
    print(f"\n{rel.source_concept_id} -> {rel.target_concept_id}")
    print(f"Type: {rel.relationship_type}")
    print(f"Category: {rel.structure_category}")
    print(f"Strength: {rel.strength:.2f}")
```

### 6. Monitor Costs

```python
from services.cost_tracker import CostTracker

# Initialize tracker
tracker = CostTracker(daily_threshold_usd=50.0)

# Log a Bedrock call
cost = tracker.log_bedrock_call(
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
    prompt_tokens=1000,
    completion_tokens=500,
    user_id="user-123",
    chapter_id="chapter-456"
)
print(f"Call cost: ${cost:.4f}")

# Get daily cost
daily_cost = tracker.get_daily_cost()
print(f"Today's total cost: ${daily_cost:.2f}")

# Get cost breakdown
breakdown = tracker.get_cost_breakdown(days=7)
for date, cost in breakdown.items():
    print(f"{date}: ${cost:.2f}")
```

### 7. Rate Limiting

```python
from services.rate_limiter import RateLimiter

# Initialize limiter
limiter = RateLimiter(daily_limit=10)

# Check user limit
user_id = "user-123"
limit_info = limiter.check_user_limit(user_id)

if limit_info.is_limited:
    print(f"User has reached daily limit!")
    print(f"Resets at: {limit_info.reset_at}")
else:
    print(f"Remaining: {limit_info.remaining}/{limit_info.limit}")
    
    # Increment count
    new_count = limiter.increment_user_count(user_id)
    print(f"New count: {new_count}")
```

### 8. Full Pipeline with Progress Tracking

```python
from services.pbl import get_pbl_pipeline
from uuid import uuid4

def progress_callback(stage: str, progress: float):
    print(f"Stage: {stage} - Progress: {progress*100:.1f}%")

pipeline = get_pbl_pipeline()

result = pipeline.process_document(
    pdf_path="textbook.pdf",
    document_id=uuid4(),
    progress_callback=progress_callback
)

if result['success']:
    print("\n✅ Processing complete!")
    print(f"Concepts: {result['results']['concepts_extracted']}")
    print(f"Relationships: {result['results']['relationships_detected']}")
else:
    print(f"\n❌ Processing failed: {result['error']}")
    print(f"Failed at stage: {result['failed_at_stage']}")
```

## Error Handling

All services include comprehensive error handling:

```python
from services.pbl import get_pbl_pipeline

pipeline = get_pbl_pipeline()

try:
    result = pipeline.process_document(
        pdf_path="document.pdf",
        document_id=uuid4()
    )
    
    if result['success']:
        print("Success!")
    else:
        print(f"Partial failure: {result['error']}")
        print(f"Partial results: {result['partial_results']}")
        
except Exception as e:
    print(f"Fatal error: {e}")
```

## Expected Output

### Successful Processing

```
Stage: parsing - Progress: 20.0%
Stage: extraction - Progress: 40.0%
Stage: classification - Progress: 60.0%
Stage: deduplication - Progress: 80.0%
Stage: visualization - Progress: 100.0%

✅ Processing complete!
Concepts: 47
Relationships: 23
```

### Cost Tracking

```
Call cost: $0.0234
Today's total cost: $1.45
2025-01-23: $1.45
2025-01-22: $2.31
2025-01-21: $0.89
```

## Troubleshooting

### Issue: "Failed to initialize Bedrock client"

**Solution**: Check AWS credentials and region
```bash
aws configure list
aws bedrock list-foundation-models --region us-east-1
```

### Issue: "Model not found"

**Solution**: Enable Bedrock model access in AWS Console
1. Go to AWS Bedrock Console
2. Navigate to "Model access"
3. Request access to Claude 3.5 Sonnet and Titan Embeddings

### Issue: "Rate limit exceeded"

**Solution**: Implement delays or use rate limiter
```python
import time
time.sleep(1)  # Wait 1 second between calls
```

### Issue: "Embedding generation failed"

**Solution**: Check text length and retry
```python
# Embeddings have 8K token limit
# Truncate long texts
text = text[:30000]  # ~7500 tokens
```

## Performance Tips

1. **Batch Processing**: Use batch methods for multiple texts
2. **Caching**: Cache embeddings for repeated concepts
3. **Parallel Processing**: Process multiple documents in parallel
4. **Rate Limiting**: Implement delays to avoid throttling
5. **Error Recovery**: Use retry logic for transient failures

## Next Steps

1. ✅ Test with sample PDF
2. ✅ Monitor costs in first week
3. ✅ Tune batch sizes for your use case
4. ✅ Implement caching for production
5. ✅ Add queue processing for scale

---

**All services are production-ready with real AWS API calls!**
