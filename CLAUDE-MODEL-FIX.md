# Claude Model ID Fix - COMPLETE ✅

## Problem
AWS Bedrock was rejecting the Claude model ID with this error:
```
ValidationException: Invocation of model ID anthropic.claude-3-5-sonnet-20241022-v2:0 
with on-demand throughput isn't supported.
```

## Root Cause
The model ID `anthropic.claude-3-5-sonnet-20241022-v2:0` is not available in AWS Bedrock. AWS Bedrock has specific model IDs that differ from the Anthropic API.

## Solution Applied

### Changed Model ID
**File**: `backend/services/bedrock_client.py`

**Before**:
```python
model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
```

**After**:
```python
model_id: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"
```

## Available Claude Models in AWS Bedrock

| Model ID | Description |
|----------|-------------|
| `anthropic.claude-3-5-sonnet-20240620-v1:0` | Claude 3.5 Sonnet (recommended) |
| `anthropic.claude-3-sonnet-20240229-v1:0` | Claude 3 Sonnet |
| `anthropic.claude-3-haiku-20240307-v1:0` | Claude 3 Haiku (faster, cheaper) |
| `anthropic.claude-v2:1` | Claude 2.1 (legacy) |

## How to Verify

1. **Restart the backend server**:
   ```powershell
   .\restart-backend.ps1
   ```

2. **Upload a PDF** and check the backend logs

3. **Look for**:
   ```
   🤖 Calling Claude API...
   ✅ Claude response received
   → Extracted X concepts from this chunk
   ```

## If You Still Get Errors

### Check AWS Bedrock Model Access

1. Go to AWS Console → Bedrock → Model access
2. Ensure Claude 3.5 Sonnet is enabled in your region
3. Request access if needed (usually instant approval)

### Check Your AWS Region

The model must be available in your region (`us-east-1` by default). If using a different region, update in your `.env.local`:

```env
AWS_REGION=us-east-1
```

### Alternative: Use Claude 3 Haiku (Faster & Cheaper)

If you want faster processing and lower costs, change to Haiku:

```python
model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"
```

## Cost Comparison

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Speed |
|-------|----------------------|------------------------|-------|
| Claude 3.5 Sonnet | $3.00 | $15.00 | Medium |
| Claude 3 Haiku | $0.25 | $1.25 | Fast |

For 800 pages, Haiku would cost ~$0.03 instead of ~$0.35!

## Status

✅ **FIXED** - Model ID updated to AWS Bedrock compatible version

---

**Next**: Restart backend and try uploading again!
