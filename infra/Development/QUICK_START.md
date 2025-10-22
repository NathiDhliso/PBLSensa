# Quick Start - Development Infrastructure

## One-Command Deploy

```bash
# From project root
cd infra/Development && \
terraform init && \
terraform apply -var="developer_id=yourname" -var="db_password=SecurePass123!" -auto-approve
```

## Essential Commands

### Deploy
```bash
terraform apply
```

### Get Outputs
```bash
# All outputs
terraform output

# Specific values
terraform output -raw cognito_user_pool_id
terraform output -raw alb_dns_name
terraform output -raw rds_address
```

### Test Deployment
```bash
# Test ALB
curl http://$(terraform output -raw alb_dns_name)/health

# Test API Gateway
curl $(terraform output -raw api_gateway_url)/health
```

### Create Test User
```bash
aws cognito-idp admin-create-user \
    --user-pool-id $(terraform output -raw cognito_user_pool_id) \
    --username test@example.com \
    --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
    --temporary-password TempPass123!

aws cognito-idp admin-set-user-password \
    --user-pool-id $(terraform output -raw cognito_user_pool_id) \
    --username test@example.com \
    --password SecurePass123! \
    --permanent
```

### Update API Keys
```bash
aws secretsmanager put-secret-value \
    --secret-id $(terraform output -raw api_keys_secret_arn) \
    --secret-string '{
        "llamaparse": "YOUR_LLAMAPARSE_KEY",
        "elevenlabs": "YOUR_ELEVENLABS_KEY",
        "brainfm": "YOUR_BRAINFM_KEY"
    }'
```

### Run Database Migrations
```bash
export DB_HOST=$(terraform output -raw rds_address)
export DB_PORT=$(terraform output -raw rds_port)
export DB_NAME=$(terraform output -raw rds_database_name)

cd ../../database/migrations
psql -h $DB_HOST -p $DB_PORT -U pbl_admin -d $DB_NAME -f 20250122_0001_initial_schema.sql
psql -h $DB_HOST -p $DB_PORT -U pbl_admin -d $DB_NAME -f 20250122_0002_add_indexes.sql
psql -h $DB_HOST -p $DB_PORT -U pbl_admin -d $DB_NAME -f 20250122_0003_add_triggers.sql
psql -h $DB_HOST -p $DB_PORT -U pbl_admin -d $DB_NAME -f 20250122_0004_add_rls_policies.sql
psql -h $DB_HOST -p $DB_PORT -U pbl_admin -d $DB_NAME -f 20250122_0005_fix_critical_issues.sql
```

### Frontend Configuration
```bash
cd ../../../src
cat > .env << EOF
VITE_API_BASE_URL=http://$(terraform output -raw alb_dns_name)
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
VITE_COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)
EOF
```

### Scale Down (Save Costs)
```bash
# Stop ECS services
aws ecs update-service \
    --cluster pbl-development-yourname-cluster \
    --service pbl-development-yourname-api-service \
    --desired-count 0

aws ecs update-service \
    --cluster pbl-development-yourname-cluster \
    --service pbl-development-yourname-worker-service \
    --desired-count 0

# Stop RDS
aws rds stop-db-instance \
    --db-instance-identifier pbl-development-yourname-db
```

### Scale Up
```bash
# Start RDS
aws rds start-db-instance \
    --db-instance-identifier pbl-development-yourname-db

# Start ECS services
aws ecs update-service \
    --cluster pbl-development-yourname-cluster \
    --service pbl-development-yourname-api-service \
    --desired-count 1

aws ecs update-service \
    --cluster pbl-development-yourname-cluster \
    --service pbl-development-yourname-worker-service \
    --desired-count 1
```

### Destroy Everything
```bash
# Empty S3 buckets first
aws s3 rm s3://$(terraform output -raw s3_pdf_uploads_bucket) --recursive
aws s3 rm s3://$(terraform output -raw s3_artifacts_bucket) --recursive

# Destroy infrastructure
terraform destroy
```

## Key Resources Created

| Resource | Count | Purpose |
|----------|-------|---------|
| VPC | 1 | Network isolation |
| Subnets | 4 | 2 public, 2 private |
| NAT Gateway | 1 | Internet access for private subnets |
| RDS PostgreSQL | 1 | Database (db.t4g.medium) |
| ElastiCache Redis | 1 | Cache (cache.t4g.micro) |
| Cognito User Pool | 1 | Authentication |
| API Gateway | 1 | API management |
| ALB | 1 | Load balancing |
| ECS Cluster | 1 | Container orchestration |
| ECS Services | 2 | API + Worker |
| ECR Repositories | 2 | Container images |
| S3 Buckets | 3 | Uploads, artifacts, logs |
| SQS Queues | 2 | Main + DLQ |
| Secrets | 2 | DB credentials, API keys |

## Estimated Costs

| Service | Monthly Cost |
|---------|--------------|
| RDS | $50 |
| ElastiCache | $12 |
| NAT Gateway | $32 |
| ECS Fargate | $35 |
| ALB | $16 |
| API Gateway | $3-5 |
| Other | $10 |
| **Total** | **~$158-170** |

## Troubleshooting

### Terraform Errors
```bash
# Validate configuration
terraform validate

# Format files
terraform fmt

# Check state
terraform state list
```

### ECS Issues
```bash
# Check service status
aws ecs describe-services \
    --cluster pbl-development-yourname-cluster \
    --services pbl-development-yourname-api-service

# View logs
aws logs tail /ecs/pbl-development-yourname/api --follow
```

### Database Issues
```bash
# Test connection
psql -h $(terraform output -raw rds_address) \
     -p $(terraform output -raw rds_port) \
     -U pbl_admin \
     -d $(terraform output -raw rds_database_name) \
     -c "SELECT version();"
```

### Cognito Issues
```bash
# List users
aws cognito-idp list-users \
    --user-pool-id $(terraform output -raw cognito_user_pool_id)

# Describe user pool
aws cognito-idp describe-user-pool \
    --user-pool-id $(terraform output -raw cognito_user_pool_id)
```

## Documentation

- **Full Deployment Guide**: DEPLOY_UPDATED.md
- **Changes Log**: CHANGES.md
- **Infrastructure Overview**: ../README.md
- **Database Migrations**: ../../database/MIGRATION_GUIDELINES.md

## Support

Need help? Check the documentation above or review the Terraform configuration in `main.tf`.
