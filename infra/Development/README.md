# Development Environment Infrastructure

Complete AWS infrastructure for the PBL platform development environment with authentication, API management, and container orchestration.

## 📋 Overview

This Terraform configuration deploys a fully functional development environment including:

- **Authentication**: AWS Cognito User Pool
- **API Management**: API Gateway with VPC Link
- **Load Balancing**: Application Load Balancer
- **Compute**: ECS Fargate (API + Worker services)
- **Database**: RDS PostgreSQL 15 with pgvector
- **Cache**: ElastiCache Redis
- **Storage**: S3 buckets with event notifications
- **Queues**: SQS for async processing
- **Secrets**: AWS Secrets Manager
- **Networking**: VPC with public/private subnets

## 🚀 Quick Start

```bash
# 1. Initialize and deploy
terraform init
terraform apply -var="developer_id=yourname" -var="db_password=SecurePass123!"

# 2. Get outputs
terraform output > outputs.txt

# 3. Run database migrations
cd ../../database/migrations
psql -h $(terraform output -raw rds_address) -U pbl_admin -d $(terraform output -raw rds_database_name) -f *.sql

# 4. Test deployment
curl http://$(terraform output -raw alb_dns_name)/health
```

See [QUICK_START.md](QUICK_START.md) for more commands.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | Essential commands and quick reference |
| [DEPLOY_UPDATED.md](DEPLOY_UPDATED.md) | Complete deployment guide with troubleshooting |
| [CHANGES.md](CHANGES.md) | Detailed changelog of recent updates |
| [DEPLOY.md](DEPLOY.md) | Original deployment guide |

## 🏗️ Architecture

```
Internet
    ↓
[API Gateway] ← Regional endpoint
    ↓
[VPC Link]
    ↓
[Application Load Balancer] ← HTTP (port 80)
    ↓
[ECS Fargate Services]
    ├── API Service (1 task)
    └── Worker Service (1 task)
    ↓
[Private Subnets]
    ├── RDS PostgreSQL (db.t4g.medium)
    ├── ElastiCache Redis (cache.t4g.micro)
    └── NAT Gateway → Internet

[Cognito User Pool] ← Authentication
[S3 Buckets] ← Storage
    ├── PDF Uploads → [SQS Queue] → Worker
    └── Artifacts
[Secrets Manager] ← API Keys & Credentials
```

## 📦 Resources Created

### Authentication & API
- 1 Cognito User Pool with web client
- 1 API Gateway REST API with VPC Link
- 1 Application Load Balancer

### Compute
- 1 ECS Cluster
- 2 ECS Task Definitions (API + Worker)
- 2 ECS Services
- 2 ECR Repositories

### Data & Storage
- 1 RDS PostgreSQL instance (db.t4g.medium)
- 1 ElastiCache Redis cluster (cache.t4g.micro)
- 3 S3 Buckets (uploads, artifacts, logs)
- 2 SQS Queues (main + DLQ)

### Networking
- 1 VPC (10.1.0.0/16)
- 2 Public Subnets
- 2 Private Subnets
- 1 NAT Gateway
- 1 Internet Gateway
- 5 Security Groups

### Security & Secrets
- 2 Secrets Manager secrets
- 1 KMS Key
- 4 IAM Roles with policies

**Total: ~60 resources**

## 💰 Cost Estimate

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS PostgreSQL | db.t4g.medium, 50GB | $50 |
| ElastiCache Redis | cache.t4g.micro | $12 |
| NAT Gateway | Single AZ | $32 |
| ECS Fargate | 2 tasks (3 vCPU, 6GB total) | $35 |
| ALB | Application Load Balancer | $16 |
| API Gateway | Regional, low traffic | $3-5 |
| Cognito | < 50K MAU | Free |
| S3 + CloudWatch | Storage & logs | $10 |
| **Total** | | **~$158-170/month** |

### Cost Optimization Tips

1. **Stop when not in use** (saves ~$100/month):
   ```bash
   # Stop RDS
   aws rds stop-db-instance --db-instance-identifier pbl-development-yourname-db
   
   # Scale down ECS
   aws ecs update-service --cluster pbl-development-yourname-cluster \
       --service pbl-development-yourname-api-service --desired-count 0
   ```

2. **Use AWS Instance Scheduler** for automatic start/stop

3. **Destroy when not actively developing** (can recreate in 20 minutes)

## 🔧 Configuration

### Required Variables

```hcl
developer_id = "yourname"  # Your unique identifier
db_password  = "SecurePass123!"  # RDS master password
aws_region   = "us-east-1"  # AWS region
```

### Optional Variables

All other variables have sensible defaults for development.

## 📤 Outputs

```bash
# Authentication
cognito_user_pool_id
cognito_client_id
cognito_domain

# API Endpoints
alb_dns_name
api_gateway_url

# Database
rds_address
rds_port
rds_database_name

# Cache
redis_endpoint
redis_port

# Storage
s3_pdf_uploads_bucket
s3_artifacts_bucket

# Queues
sqs_documents_queue_url

# Container Registries
ecr_api_repository_url
ecr_worker_repository_url

# Secrets
db_secret_arn
api_keys_secret_arn
```

## 🧪 Testing

### Health Checks
```bash
# ALB health
curl http://$(terraform output -raw alb_dns_name)/health

# API Gateway health
curl $(terraform output -raw api_gateway_url)/health
```

### Create Test User
```bash
aws cognito-idp admin-create-user \
    --user-pool-id $(terraform output -raw cognito_user_pool_id) \
    --username test@example.com \
    --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
    --temporary-password TempPass123!
```

### Database Connection
```bash
psql -h $(terraform output -raw rds_address) \
     -p $(terraform output -raw rds_port) \
     -U pbl_admin \
     -d $(terraform output -raw rds_database_name)
```

## 🔄 Updates

To update your infrastructure:

```bash
# Pull latest changes
git pull

# Review changes
terraform plan

# Apply updates
terraform apply
```

## 🗑️ Cleanup

```bash
# Empty S3 buckets first
aws s3 rm s3://$(terraform output -raw s3_pdf_uploads_bucket) --recursive
aws s3 rm s3://$(terraform output -raw s3_artifacts_bucket) --recursive

# Destroy all resources
terraform destroy
```

## 🐛 Troubleshooting

### Common Issues

1. **Terraform state lock**: `terraform force-unlock <LOCK_ID>`
2. **ECS tasks not starting**: Check CloudWatch logs
3. **Cannot connect to RDS**: Verify security groups
4. **API Gateway 502**: Check VPC Link and ALB health

See [DEPLOY_UPDATED.md](DEPLOY_UPDATED.md) for detailed troubleshooting.

## 📖 Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [PostgreSQL with pgvector](https://github.com/pgvector/pgvector)

## 🆘 Support

For issues or questions:
1. Check the documentation files in this directory
2. Review the main infrastructure README: `../README.md`
3. Check database migration guidelines: `../../database/MIGRATION_GUIDELINES.md`
4. Review architecture documentation: `../../src/documentation/architecture.md`

## 📝 License

Proprietary - Sensa Learn Platform
