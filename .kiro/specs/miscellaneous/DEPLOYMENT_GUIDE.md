# 🚀 Deployment Guide - Sensa Learn Platform

## Prerequisites

- Node.js 18+ installed
- AWS Account (for infrastructure)
- Terraform installed (for infrastructure deployment)

---

## Frontend Deployment

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: AWS Amplify
1. Connect your GitHub repository
2. Amplify will auto-detect Vite configuration
3. Deploy automatically on push

---

## Backend Infrastructure (AWS)

### 1. Prerequisites
```bash
# Install Terraform
# Windows: choco install terraform
# Mac: brew install terraform

# Configure AWS CLI
aws configure
```

### 2. Deploy Infrastructure
```bash
cd infra/Development

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply (creates all AWS resources)
terraform apply
```

### 3. What Gets Created
- VPC with public/private subnets
- RDS PostgreSQL 15 with pgvector
- ElastiCache Redis cluster
- ECS Fargate cluster
- S3 buckets for documents
- SQS queues for processing
- CloudWatch logs and monitoring
- API Gateway
- Lambda functions

---

## Environment Variables

### Frontend (.env.production)
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_API_LOGGING=false
```

### Backend (Set in AWS Secrets Manager)
- Database credentials
- Redis auth token
- API keys (LlamaParse, Eleven Labs, Brain.fm)
- Bedrock access

---

## Post-Deployment

### 1. Verify Build
```bash
npm run build
# Should complete with 0 errors
```

### 2. Test Locally
```bash
npm run preview
# Visit http://localhost:4173
```

### 3. Monitor
- Check CloudWatch logs
- Monitor RDS performance
- Review API Gateway metrics

---

## Terraform Outputs

After `terraform apply`, you'll get:
- API Gateway URL
- RDS endpoint
- Redis endpoint
- S3 bucket names
- CloudFront distribution URL

---

## Cost Estimate

**First Year**: $12,000 - $18,000
- Bedrock API: ~40%
- RDS Multi-AZ: ~25%
- Fargate: ~15%
- S3 + Transfer: ~10%
- SageMaker: ~10%

---

## Support

- Documentation: `.kiro/specs/`
- Architecture: `src/documentation/architecture.md`
- Issues: Check logs in CloudWatch

---

**Ready to deploy!** 🎉
