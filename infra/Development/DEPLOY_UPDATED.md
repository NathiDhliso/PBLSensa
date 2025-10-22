# PBL Development Environment - Complete Deployment Guide

This guide walks you through deploying the complete development infrastructure including Cognito, API Gateway, ALB, and all required services.

## What's New

This updated configuration includes:
- ✅ **AWS Cognito** - User authentication and management
- ✅ **API Gateway** - Regional API Gateway with VPC Link
- ✅ **Application Load Balancer** - HTTP load balancer for ECS services
- ✅ **ECS Task Definitions** - Complete API and Worker configurations
- ✅ **S3 Event Notifications** - Automatic PDF processing triggers
- ✅ **Enhanced IAM Policies** - Bedrock, Textract, Cognito permissions
- ✅ **Secrets Manager** - API keys storage

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.5.0 installed
- PostgreSQL client (psql) for database operations
- Docker installed for building container images
- Access to AWS account with necessary permissions

## Quick Start

```bash
# 1. Set up backend
cd infra/scripts
./setup-terraform-backend.sh

# 2. Configure variables
cd ../Development
cat > terraform.tfvars << 'EOF'
developer_id = "yourname"
db_password  = "YourSecurePassword123!"
aws_region   = "us-east-1"
EOF

# 3. Deploy infrastructure
terraform init
terraform plan
terraform apply

# 4. Save outputs
terraform output > outputs.txt

# 5. Run database migrations
export DB_HOST=$(terraform output -raw rds_address)
export DB_PORT=$(terraform output -raw rds_port)
export DB_NAME=$(terraform output -raw rds_database_name)
export DB_USER="pbl_admin"
export DB_PASSWORD="YourSecurePassword123!"

cd ../../database/migrations
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0001_initial_schema.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0002_add_indexes.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0003_add_triggers.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0004_add_rls_policies.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0005_fix_critical_issues.sql
```

## Key Outputs

After deployment, you'll have:

```bash
# Authentication
cognito_user_pool_id    = "us-east-1_XXXXXXXXX"
cognito_client_id       = "XXXXXXXXXXXXXXXXXXXXXXXXXX"
cognito_domain          = "pbl-development-yourname-auth"

# API Endpoints
alb_dns_name           = "pbl-development-yourname-alb-XXXXXXXXX.us-east-1.elb.amazonaws.com"
api_gateway_url        = "https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/dev"

# Database
rds_address            = "pbl-development-yourname-db.XXXXXXXXX.us-east-1.rds.amazonaws.com"
rds_port               = 5432

# Cache
redis_endpoint         = "pbl-development-yourname-redis.XXXXXX.0001.use1.cache.amazonaws.com"

# Storage
s3_pdf_uploads_bucket  = "pbl-development-yourname-pdf-uploads-XXXXXXXXXXXX"
s3_artifacts_bucket    = "pbl-development-yourname-artifacts-XXXXXXXXXXXX"

# Queues
sqs_documents_queue_url = "https://sqs.us-east-1.amazonaws.com/XXXXXXXXXXXX/pbl-development-yourname-documents-queue"
```

## Testing Your Deployment

### 1. Test ALB Health Endpoint

```bash
export ALB_DNS=$(terraform output -raw alb_dns_name)
curl http://$ALB_DNS/health
# Expected: {"status": "healthy"}
```

### 2. Create Test Cognito User

```bash
export USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
export CLIENT_ID=$(terraform output -raw cognito_client_id)

aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username testuser@example.com \
    --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true \
    --temporary-password TempPass123!

aws cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username testuser@example.com \
    --password SecurePass123! \
    --permanent
```

### 3. Test API Gateway

```bash
export API_URL=$(terraform output -raw api_gateway_url)
curl $API_URL/health
```

### 4. Update Frontend Configuration

```bash
cd ../../../src
cat > .env << EOF
VITE_API_BASE_URL=http://$(terraform output -raw alb_dns_name)
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
VITE_COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)
EOF
```

## Architecture Components

### Cognito Configuration
- **Password Policy**: Min 8 chars, uppercase, lowercase, numbers
- **MFA**: Disabled for development
- **Auto-verify**: Email
- **Token Validity**: 1 hour (access/id), 30 days (refresh)

### API Gateway
- **Type**: Regional REST API
- **Integration**: VPC Link to ALB
- **Stage**: dev
- **Logging**: CloudWatch Logs (7-day retention)

### Load Balancer
- **Type**: Application Load Balancer
- **Scheme**: Internet-facing
- **Protocol**: HTTP (port 80)
- **Health Check**: /health endpoint
- **Target**: ECS Fargate tasks

### ECS Services
- **API Service**: 1 task (1 vCPU, 2GB RAM)
- **Worker Service**: 1 task (2 vCPU, 4GB RAM)
- **Network**: Private subnets with NAT Gateway
- **Logging**: CloudWatch Logs

## Cost Estimate

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS PostgreSQL | db.t4g.medium | $50 |
| ElastiCache Redis | cache.t4g.micro | $12 |
| NAT Gateway | Single AZ | $32 |
| ECS Fargate | 2 tasks | $35 |
| ALB | Application LB | $16 |
| API Gateway | Regional | $3-5 |
| Cognito | < 50K MAU | Free |
| S3 + Other | Various | $10 |
| **Total** | | **~$158-170/month** |

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
    --cluster pbl-development-yourname-cluster \
    --services pbl-development-yourname-api-service

# View logs
aws logs tail /ecs/pbl-development-yourname/api --follow
```

### Cognito Issues

```bash
# Verify user pool
aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID

# List users
aws cognito-idp list-users --user-pool-id $USER_POOL_ID
```

### API Gateway 502 Errors

```bash
# Check VPC Link status
aws apigateway get-vpc-links

# Check ALB target health
aws elbv2 describe-target-health \
    --target-group-arn $(aws elbv2 describe-target-groups \
        --names pbl-development-yourname-api-tg \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text)
```

## Cleanup

```bash
# Empty S3 buckets first
aws s3 rm s3://$(terraform output -raw s3_pdf_uploads_bucket) --recursive
aws s3 rm s3://$(terraform output -raw s3_artifacts_bucket) --recursive

# Destroy infrastructure
terraform destroy
```

## Next Steps

1. ✅ Infrastructure deployed
2. ✅ Cognito configured
3. ✅ Database migrated
4. 🔲 Build and push Docker images
5. 🔲 Deploy ECS services
6. 🔲 Configure CI/CD
7. 🔲 Set up monitoring

## Support

- Main README: `../../README.md`
- Infrastructure docs: `../README.md`
- Database migrations: `../database/MIGRATION_GUIDELINES.md`
- Architecture: `../../src/documentation/architecture.md`
