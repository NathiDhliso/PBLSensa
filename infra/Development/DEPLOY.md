# Development Environment Deployment Guide

## Prerequisites

✅ Backend setup complete (S3 bucket + DynamoDB table in us-east-1) ✅ AWS
credentials configured ✅ IAM permissions applied

## Step-by-Step Deployment

### 1. Navigate to Development Directory

```powershell
cd infra/Development
```

### 2. Initialize Terraform

This downloads providers and configures the backend:

```powershell
terraform init
```

Expected output:

```
Initializing the backend...
Successfully configured the backend "s3"!
Initializing provider plugins...
Terraform has been successfully initialized!
```

### 3. Create terraform.tfvars

Create a file with your specific values:

```powershell
# Create terraform.tfvars
@"
developer_id = "yourname"
db_password  = "YourSecurePassword123!"
"@ | Out-File -FilePath terraform.tfvars -Encoding utf8
```

Or manually create `terraform.tfvars`:

```hcl
developer_id = "yourname"
db_password  = "YourSecurePassword123!"
```

### 4. Plan the Deployment

Review what will be created:

```powershell
terraform plan
```

This will show you:

- VPC with subnets, NAT gateway, internet gateway
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- ECS cluster
- S3 buckets
- Security groups
- IAM roles
- And more...

### 5. Apply the Configuration

Create the infrastructure:

```powershell
terraform apply
```

Type `yes` when prompted.

**Estimated time:** 15-20 minutes (RDS takes the longest)

### 6. Save the Outputs

After successful apply:

```powershell
terraform output > outputs.txt
```

Important outputs:

- `rds_address` - Database endpoint
- `rds_port` - Database port (5432)
- `rds_database_name` - Database name
- `redis_endpoint` - Redis endpoint
- `s3_pdf_uploads_bucket` - Upload bucket name
- `ecr_api_repository_url` - API Docker repository
- `ecr_worker_repository_url` - Worker Docker repository

## Post-Deployment Steps

### 1. Connect to Database

```powershell
# Set environment variables
$env:DB_HOST = terraform output -raw rds_address
$env:DB_PORT = terraform output -raw rds_port
$env:DB_NAME = terraform output -raw rds_database_name
$env:DB_USER = "pbl_admin"
$env:DB_PASSWORD = "YourSecurePassword123!"

# Test connection (requires psql)
psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER -d $env:DB_NAME
```

### 2. Run Database Migrations

```powershell
cd ../database/migrations

# Run all migrations
Get-ChildItem -Filter *.sql | Sort-Object Name | ForEach-Object {
    Write-Host "Running migration: $($_.Name)" -ForegroundColor Blue
    psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER -d $env:DB_NAME -f $_.FullName
}
```

Or use the migration script:

```bash
# In Git Bash or WSL
cd ../database/scripts
chmod +x run_migrations.sh
./run_migrations.sh
```

### 3. Verify Setup

```sql
-- Connect to database
psql -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME

-- Check migrations
SELECT * FROM migrations_log ORDER BY applied_at;

-- Check tables
\dt

-- Check extensions
\dx

-- Exit
\q
```

## Common Issues

### Issue: "Error acquiring the state lock"

**Cause:** Previous Terraform run didn't complete cleanly

**Solution:**

```powershell
# Get the lock ID from the error message
terraform force-unlock <LOCK_ID>
```

### Issue: "InvalidParameterValue: DB Instance class db.t4g.medium"

**Cause:** Instance type not available in your region

**Solution:** Update `main.tf`:

```hcl
instance_class = "db.t3.medium"  # Change from t4g to t3
```

### Issue: "Error creating DB Instance: DBInstanceAlreadyExists"

**Cause:** Instance with same name exists

**Solution:** Either:

1. Delete the existing instance
2. Change `developer_id` variable to make names unique

### Issue: "Access Denied" errors

**Cause:** Missing IAM permissions

**Solution:** Verify IAM policy is applied:

```powershell
aws iam get-user-policy --user-name your-username --policy-name PBLDevelopmentAccess
```

### Issue: RDS takes too long

**Cause:** RDS creation is slow (10-15 minutes is normal)

**Solution:** Be patient. You can check progress:

```powershell
aws rds describe-db-instances --db-instance-identifier pbl-development-yourname-db
```

## Updating Infrastructure

### Modify Resources

1. Edit `main.tf`
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply changes

### Add New Resources

1. Add resource blocks to `main.tf`
2. Run `terraform plan`
3. Run `terraform apply`

## Destroying Infrastructure

**⚠️ WARNING: This will delete ALL resources!**

```powershell
terraform destroy
```

Type `yes` when prompted.

**Note:** Some resources may fail to delete (like S3 buckets with objects).
You'll need to:

1. Empty S3 buckets manually
2. Run `terraform destroy` again

## Cost Management

### Check Current Costs

```powershell
# Get resource counts
terraform state list | Measure-Object -Line

# Estimate monthly cost (approximate)
# - RDS db.t4g.medium: ~$50-70/month
# - ElastiCache t4g.micro: ~$15-20/month
# - NAT Gateway: ~$30-40/month
# - ECS Fargate: ~$30-50/month (minimal usage)
# - S3 + Data Transfer: ~$10-20/month
# Total: ~$150-250/month
```

### Stop Resources to Save Money

```powershell
# Stop RDS (saves ~70% of RDS costs)
aws rds stop-db-instance --db-instance-identifier pbl-development-yourname-db

# Start RDS when needed
aws rds start-db-instance --db-instance-identifier pbl-development-yourname-db
```

**Note:** RDS auto-starts after 7 days

### Delete When Not in Use

If you won't use the environment for a while:

```powershell
terraform destroy
```

You can always recreate it later with `terraform apply`.

## Terraform Commands Reference

```powershell
# Initialize
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt

# Plan changes
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# List resources
terraform state list

# Show specific resource
terraform state show aws_db_instance.main

# Get outputs
terraform output

# Get specific output
terraform output rds_address

# Destroy everything
terraform destroy

# Import existing resource
terraform import aws_s3_bucket.example bucket-name

# Refresh state
terraform refresh
```

## Next Steps

After successful deployment:

1. ✅ Database migrations applied
2. ✅ Test database connection
3. ✅ Build and push Docker images to ECR
4. ✅ Deploy ECS tasks
5. ✅ Test API endpoints
6. ✅ Configure frontend to use API

## Support

- Terraform Documentation: https://www.terraform.io/docs
- AWS Provider Docs:
  https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- Project README: `../README.md`
- Database Guide: `../database/README.md`
