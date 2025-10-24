# SageMaker Real-Time Endpoint - Cost Warning

## Important: This Will Increase Your Monthly Costs

### The Issue
- SageMaker **serverless** endpoints have a **10 GB container size limit**
- The HuggingFace PyTorch container is **13.6 GB**
- Cannot use serverless endpoints with this container

### The Solution
Switched to **real-time endpoint** which supports larger containers.

### Cost Impact

#### Serverless (What We Wanted)
- **Cost:** Pay per request (~$0.20 per million requests)
- **Idle Cost:** $0
- **Best For:** Intermittent usage

#### Real-Time (What We Need)
- **Cost:** ~$50-70/month for ml.t3.medium
- **Idle Cost:** Full cost even when not in use
- **Best For:** Continuous usage

### Monthly Cost Breakdown

| Resource | Serverless | Real-Time |
|----------|-----------|-----------|
| Instance | $0 | ~$50-70 |
| Requests | ~$0.20/M | Included |
| **Total** | **~$5-10** | **~$50-70** |

### Alternatives to Consider

#### Option 1: Use Amazon Bedrock Instead (Recommended)
```python
# No endpoint needed, fully managed
import boto3

bedrock = boto3.client('bedrock-runtime')
response = bedrock.invoke_model(
    modelId='amazon.titan-embed-text-v1',
    body=json.dumps({"inputText": "Your text"})
)
```

**Benefits:**
- No infrastructure to manage
- Pay per use (~$0.10 per 1M tokens)
- No idle costs
- 1536-dimensional embeddings

#### Option 2: Use Smaller Container
Find or build a smaller container (<10 GB) with the model baked in.

#### Option 3: Comment Out SageMaker for Development
Use Bedrock or external API for development, add SageMaker later for production.

### Current Configuration

```terraform
instance_type          = "ml.t3.medium"  # $0.0582/hour = ~$42/month
initial_instance_count = 1
```

### To Reduce Costs

1. **Stop endpoint when not in use:**
   ```bash
   aws sagemaker stop-endpoint --endpoint-name pbl-development-dev-embeddings
   ```

2. **Use smaller instance (if model fits):**
   ```terraform
   instance_type = "ml.t3.small"  # $0.0291/hour = ~$21/month
   ```

3. **Switch to Bedrock:**
   Comment out SageMaker resources and use Bedrock API instead.

### Deployment Decision

Before deploying, decide:

- [ ] **Deploy with real-time endpoint** (~$50-70/month extra)
- [ ] **Switch to Bedrock** (pay per use, no idle cost)
- [ ] **Comment out SageMaker** (deploy without embeddings for now)

### If You Want to Proceed

The configuration is ready. Just run:
```powershell
cd infra\Development
terraform apply
```

**Deployment time:** ~10-15 minutes for real-time endpoint

### If You Want to Switch to Bedrock

I can help you:
1. Comment out SageMaker resources
2. Update backend code to use Bedrock
3. Deploy without SageMaker costs

Let me know which option you prefer!

---

**Current Status:** Ready to deploy with real-time endpoint
**Monthly Cost:** ~$200 total ($150 base + $50 SageMaker)
**Alternative:** Use Bedrock for ~$150 total (no SageMaker)
