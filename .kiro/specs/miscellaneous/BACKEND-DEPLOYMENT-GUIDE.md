# Backend Deployment Guide

## Current Status

❌ **Backend Not Deployed** - Your AWS infrastructure is ready, but no backend application exists yet.

Your infrastructure includes:
- ✅ ECS Cluster running
- ✅ ECR repositories created
- ✅ RDS PostgreSQL database ready
- ✅ Application Load Balancer configured
- ✅ All networking and security groups set up
- ❌ **No Docker images in ECR** (this is why you're getting 503 errors)

## Why You're Seeing Errors

1. **503 Service Unavailable**: ECS service has 0 running tasks because it can't find the Docker image
2. **CORS Errors**: No backend is responding, so CORS headers are never sent
3. **Connection Failed**: The ALB has no healthy targets to route traffic to

## Solution Options

### Option 1: Use Mock API (Current - Recommended for Development)

Your frontend already has a complete mock API implementation. I've updated your `.env.local` to use it:

```bash
VITE_ENABLE_MOCK_API=true
VITE_API_BASE_URL=http://localhost:5173
```

**Restart your dev server** and the app will work with mock data. This is perfect for:
- Frontend development
- Testing UI components
- Demo purposes
- Development without AWS costs

### Option 2: Deploy a Real Backend (When Ready)

To deploy a real backend, you need to:

#### 1. Create Backend Application

You'll need to build a FastAPI/Python backend with these endpoints:

```
GET    /health
GET    /courses
POST   /courses
GET    /courses/{id}
DELETE /courses/{id}
GET    /courses/{id}/documents
POST   /upload-document
GET    /status/{task_id}
GET    /concept-map/course/{id}
POST   /feedback
DELETE /documents/{id}
```

#### 2. Create Dockerfiles

**Dockerfile.api** (for the API service):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Dockerfile.worker** (for background processing):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "worker.py"]
```

#### 3. Build and Push Images

```powershell
# Navigate to your backend directory
cd backend

# Login to ECR
$ecrRegistry = "202717921808.dkr.ecr.eu-west-1.amazonaws.com"
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin $ecrRegistry

# Build and push API image
$apiRepo = "202717921808.dkr.ecr.eu-west-1.amazonaws.com/pbl/development/dev/api"
docker build -t ${apiRepo}:latest -f Dockerfile.api .
docker push ${apiRepo}:latest

# Build and push Worker image
$workerRepo = "202717921808.dkr.ecr.eu-west-1.amazonaws.com/pbl/development/dev/worker"
docker build -t ${workerRepo}:latest -f Dockerfile.worker .
docker push ${workerRepo}:latest
```

#### 4. Update ECS Services

After pushing images, ECS will automatically pull and deploy them:

```powershell
# Force new deployment
aws ecs update-service `
  --cluster pbl-development-dev-cluster `
  --service pbl-development-dev-api-service `
  --force-new-deployment `
  --region eu-west-1

# Check deployment status
aws ecs describe-services `
  --cluster pbl-development-dev-cluster `
  --services pbl-development-dev-api-service `
  --region eu-west-1 `
  --query "services[0].{status:status,runningCount:runningCount,desiredCount:desiredCount}"
```

#### 5. Update Frontend Configuration

Once backend is deployed, update `.env.local`:

```bash
VITE_API_BASE_URL=http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com
VITE_ENABLE_MOCK_API=false
```

#### 6. Configure CORS on Backend

Your backend must include CORS headers:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Backend Requirements

Your backend needs to integrate with:

- **PostgreSQL**: `pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com:5432`
- **Redis**: `pbl-development-dev-redis.yll9mr.0001.euw1.cache.amazonaws.com:6379`
- **S3 Buckets**: 
  - PDF uploads: `pbl-development-dev-pdf-uploads-202717921808`
  - Artifacts: `pbl-development-dev-artifacts-202717921808`
- **SQS Queue**: `https://sqs.eu-west-1.amazonaws.com/202717921808/pbl-development-dev-documents-queue`
- **AWS Bedrock**: For AI processing (Claude 3.5 Sonnet)
- **AWS Textract**: For PDF text extraction

## Environment Variables for Backend

Your backend container will receive these from ECS task definition:

```bash
ENVIRONMENT=development
AWS_REGION=eu-west-1
DB_HOST=pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=pbl_development
REDIS_HOST=pbl-development-dev-redis.yll9mr.0001.euw1.cache.amazonaws.com
REDIS_PORT=6379
S3_PDF_BUCKET=pbl-development-dev-pdf-uploads-202717921808
SQS_QUEUE_URL=https://sqs.eu-west-1.amazonaws.com/202717921808/pbl-development-dev-documents-queue
```

Secrets (from AWS Secrets Manager):
- Database credentials
- API keys (LlamaParse, Eleven Labs, Brain.fm)

## Cost Considerations

Running the backend will cost approximately:
- **ECS Fargate**: ~$35/month (2 tasks running 24/7)
- **RDS**: ~$50/month (db.t4g.medium)
- **ALB**: ~$16/month
- **Bedrock API**: Pay per use (~$3-15 per 1M tokens)

**To save costs during development:**

```powershell
# Stop ECS services
aws ecs update-service --cluster pbl-development-dev-cluster --service pbl-development-dev-api-service --desired-count 0 --region eu-west-1
aws ecs update-service --cluster pbl-development-dev-cluster --service pbl-development-dev-worker-service --desired-count 0 --region eu-west-1

# Stop RDS (can't delete without losing data)
aws rds stop-db-instance --db-instance-identifier pbl-development-dev-db --region eu-west-1
```

## Next Steps

1. **For now**: Use the mock API (already configured)
2. **When ready**: Build your FastAPI backend
3. **Then**: Follow the deployment steps above
4. **Finally**: Switch `.env.local` to use the real backend

## Questions?

- Need help building the backend? Let me know what features you want to implement first
- Want to scaffold a basic FastAPI backend? I can create the structure
- Need help with specific AWS integrations? Ask away!
