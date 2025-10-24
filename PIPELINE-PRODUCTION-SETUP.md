# Production Pipeline Setup Guide

## Overview

Your V7 PBL Pipeline is now configured with production-ready features:
- ✅ Rate limiting (50 requests/minute, 1000/day)
- ✅ Exponential backoff retry (3 attempts)
- ✅ Health monitoring (5-minute intervals)
- ✅ Cost tracking
- ✅ Automatic fallback (LlamaParse → Textract → pdfplumber)

## Current Configuration

### AWS Bedrock (Claude AI) - CONFIGURED ✅
- **Status**: AWS credentials detected
- **Model**: Claude 3 Sonnet
- **Rate Limit**: 50 requests/minute
- **Daily Limit**: 1000 requests
- **Cost**: ~$0.003-0.015 per 1K tokens

### AWS Textract - CONFIGURED ✅
- **Status**: Enabled
- **Use Case**: Scanned PDFs, images
- **Fallback**: Automatic if LlamaParse fails

### pdfplumber - CONFIGURED ✅
- **Status**: Always available
- **Use Case**: Final fallback
- **Cost**: Free (local processing)

### LlamaParse - NOT CONFIGURED ⚠️
- **Status**: Disabled (no API key)
- **Use Case**: Best PDF structure preservation
- **Cost**: Free tier available

## Setup Instructions

### 1. Test Current Setup (Works Now!)

```powershell
# Restart backend
.\restart-backend.ps1

# Upload a PDF - will use Textract → pdfplumber fallback
# Check health
curl http://localhost:8000/api/health
```

### 2. Optional: Add LlamaParse (Best Results)

**Get API Key:**
1. Go to https://cloud.llamaindex.ai/
2. Sign up (free tier: 1000 pages/day)
3. Get API key from dashboard

**Configure:**
```powershell
# Edit backend/.env
LLAMA_CLOUD_API_KEY=llx-your-key-here
LLAMA_PARSE_ENABLED=true
```

### 3. Monitor API Health

**Check health dashboard:**
```powershell
curl http://localhost:8000/api/health | ConvertFrom-Json
```

**Response includes:**
- Bedrock success rate
- Total cost
- Request counts
- Recent alerts

### 4. Adjust Rate Limits (Optional)

Edit `backend/.env`:
```env
# Increase if you have higher quotas
BEDROCK_RPM_LIMIT=100
BEDROCK_DAILY_LIMIT=5000

# Adjust retry behavior
MAX_RETRIES=5
RETRY_INITIAL_DELAY=2
```

## How It Works

### Upload Flow

```
1. PDF Upload
   ↓
2. Check Cache (by SHA-256 hash)
   ↓ (if miss)
3. Parse PDF:
   → Try LlamaParse (if enabled)
   → Fallback to Textract (AWS)
   → Fallback to pdfplumber (local)
   ↓
4. Extract Hierarchy
   ↓
5. Extract Concepts (uses Bedrock/Claude)
   ↓
6. Deduplicate Concepts
   ↓
7. Detect Relationships (uses Bedrock/Claude)
   ↓
8. Store & Cache Results
```

### Rate Limiting

- **Per-Minute**: Token bucket algorithm
- **Daily**: Rolling 24-hour window
- **Behavior**: Waits automatically if limit reached

### Retry Logic

- **Attempts**: 3 by default
- **Delay**: 1s, 2s, 4s (exponential)
- **Max Delay**: 60s
- **Non-Retryable**: ValidationException, AccessDeniedException

### Cost Tracking

**Claude 3 Sonnet Pricing:**
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens

**Typical Document:**
- Small PDF (10 pages): ~$0.05-0.10
- Medium PDF (50 pages): ~$0.25-0.50
- Large PDF (200 pages): ~$1.00-2.00

## Monitoring & Alerts

### Health Checks (Every 5 minutes)

Monitors:
- Bedrock success rate
- Total API cost
- Service availability
- Error rates

### Alerts Triggered When:

- Success rate < 95% (warning)
- Success rate < 90% (critical)
- Daily cost > $10 (warning)
- Service unavailable (critical)

### View Alerts

```powershell
# Get health report
curl http://localhost:8000/api/health

# Check logs
# Alerts are logged with severity level
```

## Troubleshooting

### Issue: "Rate limit exceeded"
**Solution**: Wait or increase `BEDROCK_RPM_LIMIT` in .env

### Issue: "Daily limit exceeded"
**Solution**: Wait 24 hours or increase `BEDROCK_DAILY_LIMIT`

### Issue: "Bedrock invocation failed"
**Check:**
1. AWS credentials: `aws configure list`
2. Bedrock access: `aws bedrock list-foundation-models --region eu-west-1`
3. Health endpoint: `curl http://localhost:8000/api/health`

### Issue: "LlamaParse failed"
**Solution**: Normal - falls back to Textract automatically

### Issue: High costs
**Solutions:**
1. Enable caching (already enabled)
2. Reduce `BEDROCK_MAX_TOKENS`
3. Use smaller model (Claude Haiku)
4. Set lower `BEDROCK_DAILY_LIMIT`

## Best Practices

### Development
- Use pdfplumber fallback (free)
- Set low daily limits
- Monitor costs daily

### Production
- Enable all three parsers
- Set appropriate rate limits
- Monitor health dashboard
- Set up cost alerts in AWS

### Cost Optimization
1. **Cache hits**: Same PDF = $0 cost
2. **Batch processing**: Process multiple docs together
3. **Smaller chunks**: Reduce token usage
4. **Model selection**: Use Haiku for simple tasks

## Next Steps

1. ✅ **Test upload** - Try uploading a PDF now
2. ⚠️ **Add LlamaParse** - Get API key for best results
3. ✅ **Monitor health** - Check `/api/health` endpoint
4. ✅ **Track costs** - Review Bedrock metrics
5. 📊 **Optimize** - Adjust limits based on usage

## Support

- **Health Dashboard**: http://localhost:8000/api/health
- **API Docs**: http://localhost:8000/docs
- **Logs**: Check backend console for detailed errors
