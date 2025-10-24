# AWS Bedrock Throttling & Validation Error - FIXED

## Issues Identified

### 1. Pydantic Validation Error
**Error**: `1 validation error for Concept - created_at: Input should be a valid datetime [type=datetime_type, input_value=None, input_type=NoneType]`

**Root Cause**: The `Concept` model in `backend/models/pbl_concept.py` required a `created_at` field but didn't have a default value. When Claude API calls failed due to throttling, the error handling path wasn't properly setting this field.

**Fix**: Added a default factory to automatically set `created_at` to current UTC time:
```python
created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
```

### 2. AWS Bedrock Throttling
**Error**: `ThrottlingException: Too many requests, please wait before trying again`

**Root Cause**: Processing 678 PDF chunks with only 0.5-second delays between API calls was exceeding AWS Bedrock's rate limits.

**Fixes Applied**:

1. **Increased Max Retries**: Changed from 5 to 8 retry attempts
2. **More Aggressive Backoff**: Exponential backoff now goes: 2s → 4s → 8s → 16s → 32s → 64s → 120s → 120s (max 2 minutes)
3. **Longer Inter-Chunk Delay**: Increased from 0.5s to 2.0s between chunks

## Files Modified

1. `backend/models/pbl_concept.py`
   - Added default factory for `created_at` field

2. `backend/services/pbl/concept_extractor.py`
   - Increased `max_retries` from 5 to 8
   - Changed backoff calculation from `2^attempt` to `2^(attempt+1)` with max 120s
   - Increased inter-chunk delay from 0.5s to 2.0s

## Expected Behavior

- **Graceful Degradation**: If Claude extraction fails after all retries, the system will return an empty list for that chunk and continue processing
- **Better Throttle Handling**: More retries with longer waits give AWS time to reset rate limits
- **No Validation Errors**: The `created_at` field will always have a valid datetime value

## Testing Recommendations

1. Monitor the console output for throttling warnings
2. If you still see throttling after 8 retries, consider:
   - Increasing the inter-chunk delay to 3-5 seconds
   - Processing documents in smaller batches
   - Requesting a rate limit increase from AWS

## Rate Limit Context

AWS Bedrock has different rate limits based on:
- Model (Claude 3.5 Sonnet, Claude 3 Haiku, etc.)
- Region
- Account tier

For large documents (678 pages), consider:
- Processing during off-peak hours
- Using batch processing with checkpoints
- Implementing a queue system for multiple documents
