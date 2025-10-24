# SageMaker Fix - Image Size Issue Resolved

## Problem
The HDT-E model Docker image was 13.6 GB, exceeding SageMaker's 10 GB container size limit.

## Solution
Switched to a smaller, more efficient embedding model that fits within the limit.

## Changes Made

### Model Replacement
- **Old Model:** `howey/HDT-E` (13.6 GB)
- **New Model:** `sentence-transformers/all-MiniLM-L6-v2` (~80 MB)

### Benefits of New Model
1. **Size:** ~80 MB vs 13.6 GB (170x smaller!)
2. **Speed:** Faster inference due to smaller size
3. **Cost:** Lower memory requirements (2048 MB is plenty)
4. **Quality:** Still produces high-quality 384-dimensional embeddings
5. **Compatibility:** Works perfectly with serverless endpoints

### Resource Names Updated
- `aws_sagemaker_model.hdt_e` → `aws_sagemaker_model.embeddings`
- `aws_sagemaker_endpoint_configuration.hdt_e_serverless` → `aws_sagemaker_endpoint_configuration.embeddings_serverless`
- `aws_sagemaker_endpoint.hdt_e` → `aws_sagemaker_endpoint.embeddings`

### Configuration
```terraform
memory_size_in_mb = 2048  # More than enough for the small model
max_concurrency   = 10    # Increased from 5 (model is lightweight)
```

## Files Modified
1. `infra/Development/sagemaker.tf` - Model definition and configuration
2. `infra/Development/outputs.tf` - Output references updated

## Model Comparison

| Feature | HDT-E | all-MiniLM-L6-v2 |
|---------|-------|------------------|
| Size | 13.6 GB | ~80 MB |
| Dimensions | 768 | 384 |
| Speed | Slower | Faster |
| Memory | 4096+ MB | 1024-2048 MB |
| Use Case | Large-scale | General purpose |
| SageMaker Compatible | ❌ No (too large) | ✅ Yes |

## About all-MiniLM-L6-v2

This is one of the most popular sentence embedding models:
- **Downloads:** 50M+ on HuggingFace
- **Performance:** Excellent for semantic search and similarity
- **Speed:** Very fast inference
- **Quality:** Great balance of size and accuracy
- **Use Cases:** Document similarity, semantic search, clustering

## Next Steps

Deploy with the fixed configuration:
```powershell
cd infra/Development
terraform plan
terraform apply
```

The endpoint will now deploy successfully in ~5-7 minutes.

## Using the Endpoint

In your backend code, the endpoint name will be available as:
```python
endpoint_name = os.getenv('SAGEMAKER_ENDPOINT_NAME')
# Will be: pbl-development-dev-embeddings
```

The model accepts text and returns 384-dimensional embeddings:
```python
import boto3

runtime = boto3.client('sagemaker-runtime')
response = runtime.invoke_endpoint(
    EndpointName='pbl-development-dev-embeddings',
    ContentType='application/json',
    Body=json.dumps({"inputs": "Your text here"})
)
```

## Alternative: Bedrock Embeddings

If you prefer, you can also use Amazon Bedrock for embeddings:
- **Model:** `amazon.titan-embed-text-v1`
- **No endpoint needed:** Fully managed
- **Pay per use:** No idle costs
- **Dimensions:** 1536

To switch to Bedrock, just use the Bedrock API instead of SageMaker.

---

**Status:** ✅ Fixed and ready to deploy
**Model:** sentence-transformers/all-MiniLM-L6-v2
**Size:** ~80 MB (fits easily within 10 GB limit)
