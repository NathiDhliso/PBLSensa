# AWS Deployment - Quick Start

## 🚀 Deploy in 5 Commands

```powershell
# 1. Check prerequisites
.\deploy-aws.ps1 -Action check

# 2. Initialize Terraform backend
.\deploy-aws.ps1 -Action init

# 3. Review deployment plan
.\deploy-aws.ps1 -Action plan

# 4. Deploy infrastructure (20-30 min)
.\deploy-aws.ps1 -Action deploy

# 5. Check status
.\deploy-aws.ps1 -Action status
```

## 📋 Before You Start

### Required
- [ ] AWS account with admin access
- [ ] AWS CLI installed and configured
- [ ] Terraform installed (>= 1.5.0)
- [ ] Docker Desktop running

### Optional (for full features)
- [ ] LlamaParse API key
- [ ] Bedrock model access (Claude 3.5 Sonnet)

## ⚙️ Configuration

Edit `infra/Development/terraform.tfvars.local`:

```hcl
environment  = "development"
developer_id = "yourname"  # Change this!
aws_region   = "us-east-1"
project_name = "pbl"

db_username = "pbl_admin"
db_password = "YourSecurePassword123!"  # Change this!

vpc_cidr = "10.1.0.0/16"
```

## 💰 Cost Estimate

**Development**: ~$189-269/month
- RDS: $30
- ElastiCache: $12
- Fargate: $30
- NAT Gateway: $32
- SageMaker: $20-50 (usage)
- Bedrock: $50-100 (usage)
- Other: $15

**To reduce costs:**
- Use db.t4g.micro: Save $20/month
- Stop Fargate when not in use: Save $30/month
- Skip SageMaker, use OpenAI: Save $20-50/month

## 📦 What Gets Deployed

### Core Infrastructure
- ✅ VPC with 2 AZs
- ✅ RDS PostgreSQL 15 with pgvector
- ✅ ElastiCache Redis 7
- ✅ S3 buckets (uploads, artifacts, logs)
- ✅ SQS queues with DLQ

### Compute
- ✅ ECS Fargate cluster
- ✅ ECR repositories (API + Worker)
- ✅ Lambda functions (validator + feedback)
- ✅ SageMaker serverless endpoint

### Networking
- ✅ Application Load Balancer
- ✅ API Gateway with VPC Link
- ✅ NAT Gateway
- ✅ Security groups

### Auth & Monitoring
- ✅ Cognito User Pool
- ✅ CloudWatch dashboards
- ✅ X-Ray tracing
- ✅ AppConfig feature flags

## 🔑 Post-Deployment Steps

### 1. Set Up Database
```powershell
# Get RDS endpoint
cd infra/Development
$RDS_HOST = terraform output -raw rds_endpoint

# Apply schema
psql -h $RDS_HOST -U pbl_admin -d pbl_development -f ../database/schema.sql
```

### 2. Store API Keys
```powershell
aws secretsmanager update-secret `
  --secret-id pbl/development/dev/api-keys `
  --secret-string '{
    "llamaparse": "YOUR_KEY_HERE",
    "elevenlabs": "YOUR_KEY_HERE",
    "brainfm": "YOUR_KEY_HERE"
  }'
```

### 3. Build & Push Docker Images
```powershell
cd backend

# Get ECR URLs
$API_REPO = terraform output -raw ecr_api_repository_url
$WORKER_REPO = terraform output -raw ecr_worker_repository_url

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $API_REPO

# Build and push API
docker build -t pbl-api .
docker tag pbl-api:latest $API_REPO:latest
docker push $API_REPO:latest

# Build and push Worker
docker build -f Dockerfile.worker -t pbl-worker .
docker tag pbl-worker:latest $WORKER_REPO:latest
docker push $WORKER_REPO:latest
```

### 4. Update Frontend Config
```env
# .env.local
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=us-east-1
VITE_S3_UPLOAD_BUCKET=pbl-development-dev-pdf-uploads-xxxxxxxxxxxx
```

## 🧪 Test Your Deployment

```powershell
# Get API URL
$API_URL = terraform output -raw api_gateway_url

# Test health endpoint
curl "$API_URL/health"

# Upload a test PDF
curl -X POST "$API_URL/documents/upload" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -F "file=@test.pdf"
```

## 📊 Monitor Your Deployment

```powershell
# View CloudWatch Dashboard
terraform output cloudwatch_dashboard_url | Start-Process

# View API logs
aws logs tail /ecs/pbl-development-dev/api --follow

# Check SQS queue
aws sqs get-queue-attributes `
  --queue-url $(terraform output -raw sqs_queue_url) `
  --attribute-names ApproximateNumberOfMessages
```

## 🐛 Troubleshooting

### Terraform fails
```powershell
# Re-initialize
terraform init -reconfigure

# Check state
terraform state list
```

### Docker push fails
```powershell
# Re-authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO
```

### Can't connect to RDS
- Check security group allows connection from Fargate
- Verify you're in the VPC or using bastion host
- Check credentials in Secrets Manager

### Lambda timeout
- Increase timeout in `lambda.tf`
- Check VPC configuration
- Verify NAT gateway is working

## 🗑️ Clean Up

```powershell
# Destroy all resources
.\deploy-aws.ps1 -Action destroy

# Or manually
cd infra/Development
terraform destroy -auto-approve
```

## 📚 Full Documentation

- **Complete Guide**: `AWS-DEPLOYMENT-GUIDE.md`
- **Architecture Details**: `AWS-FULL-STACK-SUMMARY.md`
- **Implementation Roadmap**: `IMPLEMENTATION-ROADMAP.md`
- **Local Development**: `PHASE-1-IMPLEMENTATION.md`

## 🆘 Need Help?

1. Check `AWS-DEPLOYMENT-GUIDE.md` troubleshooting section
2. Review CloudWatch logs
3. Verify IAM permissions
4. Check AWS service quotas

## ⏱️ Timeline

- **Prerequisites**: 30 min
- **Infrastructure Deploy**: 20-30 min
- **Database Setup**: 10 min
- **Docker Build/Push**: 20 min
- **Testing**: 30 min
- **Total**: ~2-3 hours

## ✅ Success Checklist

- [ ] All prerequisites installed
- [ ] AWS credentials configured
- [ ] Terraform backend initialized
- [ ] Infrastructure deployed
- [ ] Database schema applied
- [ ] API keys stored
- [ ] Docker images pushed
- [ ] Health check passes
- [ ] Test PDF uploaded
- [ ] Monitoring dashboard accessible

---

**Ready to deploy?** Start with: `.\deploy-aws.ps1 -Action check`

Good luck! 🚀
