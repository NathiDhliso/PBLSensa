# Infrastructure Setup Complete ✅

## What Was Added

Your Development Terraform configuration now includes all the services needed for your PBL platform:

### 🔐 Authentication & API
- ✅ **AWS Cognito User Pool** - User authentication and management
- ✅ **Cognito Web Client** - Frontend authentication client
- ✅ **Cognito Domain** - Hosted UI domain
- ✅ **API Gateway** - Regional REST API with VPC Link
- ✅ **Application Load Balancer** - HTTP load balancer for ECS services

### 🚀 Compute & Containers
- ✅ **ECS Task Definitions** - API and Worker service configurations
- ✅ **ECS Services** - Running API and Worker containers
- ✅ **ECR Repositories** - Container image storage

### 💾 Data & Storage
- ✅ **RDS PostgreSQL** - Database with pgvector
- ✅ **ElastiCache Redis** - Caching layer
- ✅ **S3 Buckets** - PDF uploads, artifacts, logs
- ✅ **SQS Queues** - Document processing queue + DLQ

### 🔒 Security & Secrets
- ✅ **Secrets Manager** - DB credentials and API keys
- ✅ **KMS Encryption** - Data encryption at rest
- ✅ **IAM Roles & Policies** - Service permissions
- ✅ **Security Groups** - Network isolation

### 🌐 Networking
- ✅ **VPC** - Isolated network (10.1.0.0/16)
- ✅ **Subnets** - 2 public, 2 private across 2 AZs
- ✅ **NAT Gateway** - Internet access for private subnets
- ✅ **Route Tables** - Network routing

## Current Deployment Status

Run this command to check progress:
```powershell
cd infra/scripts
.\check-deployment-status.ps1
```

## Automatic Configuration Scripts

Three scripts have been created to automate configuration:

### 1. **update-env-config.ps1** (Windows)
Automatically updates your application configuration with AWS resource IDs.

```powershell
cd infra/scripts
.\update-env-config.ps1
```

### 2. **update-env-config.sh** (Linux/Mac)
Same functionality for Unix-based systems.

```bash
cd infra/scripts
chmod +x update-env-config.sh
./update-env-config.sh
```

### 3. **check-deployment-status.ps1**
Monitor deployment progress in real-time.

```powershell
cd infra/scripts
.\check-deployment-status.ps1
```

## What Gets Configured

### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://[ALB-DNS]
VITE_AWS_REGION=eu-west-1
VITE_COGNITO_USER_POOL_ID=[USER-POOL-ID]
VITE_COGNITO_CLIENT_ID=[CLIENT-ID]
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_API_LOGGING=true
```

### Backend (.env.development)
```env
ENVIRONMENT=development
AWS_REGION=eu-west-1
DB_HOST=[RDS-ENDPOINT]
DB_PORT=5432
DB_NAME=[DATABASE-NAME]
REDIS_HOST=[REDIS-ENDPOINT]
REDIS_PORT=6379
S3_UPLOAD_BUCKET=[BUCKET-NAME]
S3_ARTIFACTS_BUCKET=[BUCKET-NAME]
SQS_QUEUE_URL=[QUEUE-URL]
COGNITO_USER_POOL_ID=[USER-POOL-ID]
COGNITO_CLIENT_ID=[CLIENT-ID]
ECR_API_REPOSITORY=[ECR-URL]
ECR_WORKER_REPOSITORY=[ECR-URL]
```

### Infrastructure Outputs (JSON)
A structured JSON file with all resource details at `infra/infrastructure-outputs.json`.

## Next Steps (After Deployment Completes)

### 1. Update Configuration
```powershell
cd infra/scripts
.\update-env-config.ps1
```

### 2. Update API Keys in Secrets Manager
```powershell
# Get the secret ARN
cd ..\Development
$secretArn = terraform output -raw api_keys_secret_arn

# Update with your actual API keys
aws secretsmanager put-secret-value `
  --secret-id $secretArn `
  --secret-string '{"llamaparse":"YOUR_LLAMAPARSE_KEY","elevenlabs":"YOUR_ELEVENLABS_KEY","brainfm":"YOUR_BRAINFM_KEY"}'
```

### 3. Run Database Migrations
```powershell
# Get database connection details
$dbHost = terraform output -raw rds_address
$dbPort = terraform output -raw rds_port
$dbName = terraform output -raw rds_database_name

# Run migrations
cd ..\..\database\migrations
psql -h $dbHost -p $dbPort -U pbl_admin -d $dbName -f 20250122_0001_initial_schema.sql
psql -h $dbHost -p $dbPort -U pbl_admin -d $dbName -f 20250122_0002_add_indexes.sql
psql -h $dbHost -p $dbPort -U pbl_admin -d $dbName -f 20250122_0003_add_triggers.sql
psql -h $dbHost -p $dbPort -U pbl_admin -d $dbName -f 20250122_0004_add_rls_policies.sql
psql -h $dbHost -p $dbPort -U pbl_admin -d $dbName -f 20250122_0005_fix_critical_issues.sql
```

### 4. Create Test User in Cognito
```powershell
$userPoolId = terraform output -raw cognito_user_pool_id

# Create test user
aws cognito-idp admin-create-user `
  --user-pool-id $userPoolId `
  --username testuser@example.com `
  --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true `
  --temporary-password TempPass123!

# Set permanent password
aws cognito-idp admin-set-user-password `
  --user-pool-id $userPoolId `
  --username testuser@example.com `
  --password SecurePass123! `
  --permanent
```

### 5. Test the Application
```powershell
# Start frontend
cd ..\..\..\..
npm run dev

# Open browser to http://localhost:5173
# Try logging in with testuser@example.com / SecurePass123!
```

### 6. Build and Push Docker Images (When Ready)
```powershell
# Login to ECR
$ecrRegistry = (terraform output -raw ecr_api_repository_url).Split('/')[0]
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin $ecrRegistry

# Build and push API image (when you have Dockerfile.api)
$apiRepo = terraform output -raw ecr_api_repository_url
docker build -t ${apiRepo}:latest -f Dockerfile.api .
docker push ${apiRepo}:latest

# Build and push Worker image (when you have Dockerfile.worker)
$workerRepo = terraform output -raw ecr_worker_repository_url
docker build -t ${workerRepo}:latest -f Dockerfile.worker .
docker push ${workerRepo}:latest
```

## Documentation

Comprehensive documentation has been created:

- **`infra/Development/README.md`** - Main infrastructure overview
- **`infra/Development/QUICK_START.md`** - Essential commands
- **`infra/Development/DEPLOY_UPDATED.md`** - Complete deployment guide
- **`infra/Development/CHANGES.md`** - Detailed changelog
- **`infra/scripts/README-CONFIG-UPDATE.md`** - Configuration update guide

## Resource Summary

### Total Resources Created: ~60

| Category | Count | Resources |
|----------|-------|-----------|
| Authentication | 3 | Cognito User Pool, Client, Domain |
| API | 5 | API Gateway, VPC Link, Deployment, Stage, Logs |
| Load Balancing | 3 | ALB, Target Group, Listener |
| Compute | 6 | ECS Cluster, 2 Task Defs, 2 Services, 2 ECR Repos |
| Database | 3 | RDS Instance, Subnet Group, Parameter Group |
| Cache | 2 | Redis Cluster, Subnet Group |
| Storage | 6 | 3 S3 Buckets + configurations |
| Queues | 3 | SQS Queue, DLQ, Policy |
| Networking | 15 | VPC, Subnets, NAT, IGW, Route Tables, etc. |
| Security | 10 | 5 Security Groups, IAM Roles, Policies, KMS |
| Secrets | 4 | 2 Secrets Manager secrets + versions |

## Cost Estimate

**Monthly Cost: ~$158-170**

| Service | Cost |
|---------|------|
| RDS PostgreSQL (db.t4g.medium) | $50 |
| ElastiCache Redis (cache.t4g.micro) | $12 |
| NAT Gateway | $32 |
| ECS Fargate (2 tasks) | $35 |
| ALB | $16 |
| API Gateway | $3-5 |
| Cognito | Free (< 50K MAU) |
| S3 + Other | $10 |

### Cost Optimization Tips:
- Stop RDS when not in use: `aws rds stop-db-instance --db-instance-identifier pbl-development-dev-db`
- Scale ECS to 0: `aws ecs update-service --cluster ... --desired-count 0`
- Use AWS Instance Scheduler for automatic start/stop

## Troubleshooting

### Check Deployment Status
```powershell
cd infra/scripts
.\check-deployment-status.ps1
```

### View Terraform Outputs
```powershell
cd infra/Development
terraform output
```

### Check Specific Resource
```powershell
terraform output -raw cognito_user_pool_id
terraform output -raw alb_dns_name
```

### View Terraform State
```powershell
terraform show
```

### Check AWS Resources
```powershell
# Cognito
aws cognito-idp describe-user-pool --user-pool-id [USER-POOL-ID]

# ALB
aws elbv2 describe-load-balancers --names pbl-development-dev-alb

# ECS Services
aws ecs describe-services --cluster pbl-development-dev-cluster --services pbl-development-dev-api-service
```

## Support

For issues or questions:
1. Check deployment status with `check-deployment-status.ps1`
2. Review Terraform logs in the deployment terminal
3. Check AWS Console for resource status
4. Review documentation in `infra/Development/`
5. Verify IAM permissions with `infra/iam-policies/pbl-development-policy.json`

## Security Reminders

⚠️ **Important:**
- Never commit `.env.local` or `.env.development` to version control
- Store API keys in AWS Secrets Manager only
- Use IAM roles for AWS service access
- Rotate database passwords regularly
- Review security groups and network access

## Success Criteria

✅ Deployment is complete when:
1. All 8 resources show as ready in status check
2. Configuration update script runs successfully
3. `.env.local` is populated with real values
4. Frontend can connect to Cognito
5. Database migrations run successfully
6. Test user can log in

## Congratulations! 🎉

Your infrastructure is now deployed and ready for development. The automatic configuration scripts will connect everything to your codebase once deployment completes.

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Environment:** Development
**Region:** eu-west-1
**Terraform Version:** 1.13.4
