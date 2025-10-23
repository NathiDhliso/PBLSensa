# AWS Full Stack Deployment Guide

## Overview

This guide walks you through deploying the complete AWS infrastructure for the PBL Platform based on the v7.0 tech stack specification.

## Architecture Summary

**11 Layers:**
- Layer 0: PDF Validation (Lambda + Textract)
- Layer 1: Caching & Queuing (ElastiCache + SQS + Fargate)
- Layer 2: PDF Parsing (LlamaParse)
- Layer 3: Embeddings (SageMaker HDT-E)
- Layer 4: Keyword Extraction (Multi-method)
- Layer 5: RAG Concept Mapping (Bedrock Claude 3.5)
- Layer 6-7: Storage & Auth (S3, RDS, Cognito)
- Layer 8: API Layer (Fargate + API Gateway)
- Layer 9: Feedback Loop (Lambda + EventBridge)
- Layer 10: Multi-Document Synthesis
- Layer 11: Feature Flags (AppConfig)

## Prerequisites

### 1. AWS Account Setup
```bash
# Install AWS CLI
# Windows (PowerShell as Admin):
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure AWS credentials
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### 2. Install Terraform
```powershell
# Using Chocolatey
choco install terraform

# Or download from: https://www.terraform.io/downloads
```

### 3. Install Docker Desktop
Download from: https://www.docker.com/products/docker-desktop

### 4. Required API Keys
You'll need accounts and API keys for:
- **LlamaParse**: https://cloud.llamaindex.ai/
- **Eleven Labs** (optional): https://elevenlabs.io/
- **Brain.fm** (optional): https://www.brain.fm/

## Cost Estimate

### Development Environment (Monthly)
- RDS db.t4g.medium: ~$30
- ElastiCache t4g.micro: ~$12
- Fargate (minimal): ~$20-40
- S3 + Data Transfer: ~$5
- SageMaker Serverless: ~$20-50 (usage-based)
- Bedrock API calls: ~$50-100 (usage-based)
- **Total: ~$137-237/month**

### Production (Low Traffic)
- **Total: ~$400-600/month**

## Deployment Steps

### Step 1: Configure Terraform Variables

```powershell
cd infra/Development

# Copy and edit terraform.tfvars
cp terraform.tfvars terraform.tfvars.local

# Edit with your values:
# - developer_id: your initials (e.g., "jd")
# - aws_region: your preferred region
# - db_password: strong password
```

### Step 2: Initialize Terraform Backend

```powershell
# Create S3 bucket for Terraform state
aws s3 mb s3://pbl-terraform-state-dev --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table `
  --table-name pbl-terraform-locks-dev `
  --attribute-definitions AttributeName=LockID,AttributeType=S `
  --key-schema AttributeName=LockID,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region us-east-1
```

### Step 3: Deploy Core Infrastructure

```powershell
cd infra/Development

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file="terraform.tfvars.local"

# Deploy (this will take 15-20 minutes)
terraform apply -var-file="terraform.tfvars.local"
```

**What gets created:**
- ✅ VPC with public/private subnets
- ✅ RDS PostgreSQL with pgvector
- ✅ ElastiCache Redis
- ✅ S3 buckets (uploads, artifacts, logs)
- ✅ SQS queues (main + DLQ)
- ✅ ECS Cluster
- ✅ ECR repositories
- ✅ Cognito User Pool
- ✅ API Gateway
- ✅ Lambda functions (placeholder)
- ✅ SageMaker endpoint (placeholder)
- ✅ CloudWatch dashboards & alarms
- ✅ AppConfig feature flags

### Step 4: Set Up Database Schema

```powershell
# Get RDS endpoint from Terraform output
terraform output rds_endpoint

# Connect to RDS (replace with your values)
$RDS_HOST = "pbl-development-dev-db.xxxxx.us-east-1.rds.amazonaws.com"
$DB_NAME = "pbl_development"
$DB_USER = "pbl_admin"
$DB_PASSWORD = "YourPassword123!"

# Install PostgreSQL client
choco install postgresql

# Connect and run schema
psql -h $RDS_HOST -U $DB_USER -d $DB_NAME -f ../database/schema.sql
```

### Step 5: Store API Keys in Secrets Manager

```powershell
# Update API keys secret
aws secretsmanager update-secret `
  --secret-id pbl/development/dev/api-keys `
  --secret-string '{
    "llamaparse": "YOUR_LLAMAPARSE_API_KEY",
    "elevenlabs": "YOUR_ELEVENLABS_API_KEY",
    "brainfm": "YOUR_BRAINFM_API_KEY"
  }'
```

### Step 6: Build and Push Docker Images

#### 6a. Build API Container

```powershell
cd ../../backend

# Create Dockerfile
```

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```powershell
# Get ECR repository URL
$ECR_API_REPO = terraform output -raw ecr_api_repository_url

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_API_REPO

# Build and push
docker build -t pbl-api .
docker tag pbl-api:latest $ECR_API_REPO:latest
docker push $ECR_API_REPO:latest
```

#### 6b. Build Worker Container

Create `backend/Dockerfile.worker`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
COPY requirements-worker.txt .
RUN pip install --no-cache-dir -r requirements.txt -r requirements-worker.txt

# Copy application code
COPY . .

# Run worker
CMD ["python", "worker.py"]
```

```powershell
# Get ECR repository URL
$ECR_WORKER_REPO = terraform output -raw ecr_worker_repository_url

# Build and push
docker build -f Dockerfile.worker -t pbl-worker .
docker tag pbl-worker:latest $ECR_WORKER_REPO:latest
docker push $ECR_WORKER_REPO:latest
```

### Step 7: Deploy ECS Services

The ECS task definitions are already created by Terraform, but you need to create the services:

```powershell
cd ../infra/Development

# Create ECS service for API
aws ecs create-service `
  --cluster pbl-development-dev-cluster `
  --service-name pbl-api `
  --task-definition pbl-development-dev-api `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" `
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=api,containerPort=8000"

# Create ECS service for Worker
aws ecs create-service `
  --cluster pbl-development-dev-cluster `
  --service-name pbl-worker `
  --task-definition pbl-development-dev-worker `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

### Step 8: Deploy Lambda Functions

#### 8a. PDF Validator Lambda

Create `lambda/validator/validator.py`:
```python
import json
import boto3
import hashlib
import PyPDF2
from io import BytesIO

s3 = boto3.client('s3')
sqs = boto3.client('sqs')

def handler(event, context):
    """Layer 0: PDF Validation & Hashing"""
    
    # Get S3 event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    try:
        # Download PDF
        response = s3.get_object(Bucket=bucket, Key=key)
        pdf_content = response['Body'].read()
        
        # Generate SHA256 hash
        file_hash = hashlib.sha256(pdf_content).hexdigest()
        
        # Validate PDF
        pdf_file = BytesIO(pdf_content)
        reader = PyPDF2.PdfReader(pdf_file)
        
        if reader.is_encrypted:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'PDF is password protected'})
            }
        
        num_pages = len(reader.pages)
        
        # Send to SQS for processing
        sqs.send_message(
            QueueUrl=os.environ['SQS_QUEUE_URL'],
            MessageBody=json.dumps({
                'file_hash': file_hash,
                's3_bucket': bucket,
                's3_key': key,
                'num_pages': num_pages,
                'pipeline_version': os.environ['PIPELINE_VERSION']
            })
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'file_hash': file_hash,
                'num_pages': num_pages
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

```powershell
# Package and deploy
cd lambda/validator
pip install -r requirements.txt -t .
Compress-Archive -Path * -DestinationPath validator.zip

aws lambda update-function-code `
  --function-name pbl-development-dev-pdf-validator `
  --zip-file fileb://validator.zip
```

### Step 9: Configure SageMaker Endpoint

The SageMaker endpoint is created but needs the model deployed:

```powershell
# Option 1: Use HuggingFace pre-built container (recommended)
# The model will auto-download from HuggingFace Hub

# Option 2: Build custom container
# See: https://docs.aws.amazon.com/sagemaker/latest/dg/your-algorithms-inference-code.html
```

### Step 10: Test the Deployment

```powershell
# Get API Gateway URL
$API_URL = terraform output -raw api_gateway_url

# Test health endpoint
curl "$API_URL/health"

# Upload a test PDF
curl -X POST "$API_URL/documents/upload" `
  -H "Authorization: Bearer YOUR_COGNITO_TOKEN" `
  -F "file=@test.pdf"
```

### Step 11: Configure Frontend

Update your `.env.local`:
```env
VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=us-east-1
VITE_S3_UPLOAD_BUCKET=pbl-development-dev-pdf-uploads-xxxxxxxxxxxx
```

### Step 12: Monitor Your Deployment

```powershell
# View CloudWatch Dashboard
$DASHBOARD_URL = terraform output -raw cloudwatch_dashboard_url
Start-Process $DASHBOARD_URL

# View logs
aws logs tail /ecs/pbl-development-dev/api --follow

# Check SQS queue depth
aws sqs get-queue-attributes `
  --queue-url $(terraform output -raw sqs_queue_url) `
  --attribute-names ApproximateNumberOfMessages
```

## Post-Deployment Configuration

### Enable Bedrock Access

```powershell
# Request access to Claude 3.5 Sonnet in AWS Console
# Go to: Bedrock > Model access > Request access
# Select: Anthropic Claude 3.5 Sonnet
```

### Configure Feature Flags

```powershell
# Update feature flags via AWS Console
# Go to: AppConfig > Applications > pbl-development-dev > feature-flags

# Or via CLI:
aws appconfig create-hosted-configuration-version `
  --application-id $(terraform output -raw appconfig_application_id) `
  --configuration-profile-id $(terraform output -raw appconfig_configuration_profile_id) `
  --content file://feature-flags.json `
  --content-type "application/json"
```

### Set Up Alarms

```powershell
# Add email notification to SNS topic
aws sns subscribe `
  --topic-arn arn:aws:sns:us-east-1:xxxx:pbl-development-dev-alarms `
  --protocol email `
  --notification-endpoint your-email@example.com
```

## Troubleshooting

### Issue: Terraform fails with "backend not initialized"
```powershell
# Re-run backend setup
terraform init -reconfigure
```

### Issue: Docker push fails
```powershell
# Re-authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO
```

### Issue: RDS connection timeout
```powershell
# Check security group allows connection from Fargate
# Verify you're connecting from within VPC or using bastion host
```

### Issue: SageMaker endpoint not responding
```powershell
# Check endpoint status
aws sagemaker describe-endpoint --endpoint-name pbl-development-dev-hdt-e

# View logs
aws logs tail /aws/sagemaker/Endpoints/pbl-development-dev-hdt-e --follow
```

## Cleanup

To destroy all resources:

```powershell
cd infra/Development

# Destroy infrastructure
terraform destroy -var-file="terraform.tfvars.local"

# Delete S3 buckets (if not empty)
aws s3 rb s3://pbl-development-dev-pdf-uploads-xxxx --force
aws s3 rb s3://pbl-development-dev-artifacts-xxxx --force
aws s3 rb s3://pbl-development-dev-logs-xxxx --force

# Delete Terraform state bucket
aws s3 rb s3://pbl-terraform-state-dev --force
aws dynamodb delete-table --table-name pbl-terraform-locks-dev
```

## Next Steps

1. **Implement Backend Services**: Create the actual Python services for document processing
2. **Build Lambda Functions**: Complete the Lambda function implementations
3. **Test End-to-End**: Upload a PDF and verify the full pipeline
4. **Set Up CI/CD**: Automate deployments with GitHub Actions
5. **Add Monitoring**: Configure custom metrics and dashboards
6. **Optimize Costs**: Review usage and adjust instance sizes

## Support

- AWS Documentation: https://docs.aws.amazon.com/
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- Project Issues: [Your GitHub repo]

## Estimated Timeline

- **Initial Setup**: 2-3 hours
- **Infrastructure Deployment**: 20-30 minutes
- **Application Deployment**: 1-2 hours
- **Testing & Validation**: 2-4 hours
- **Total**: 1 day for basic deployment

Good luck with your deployment! 🚀
