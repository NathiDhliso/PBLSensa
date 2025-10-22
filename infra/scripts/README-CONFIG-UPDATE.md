# Automatic Configuration Update

This directory contains scripts to automatically update your application configuration with AWS resource IDs after Terraform deployment.

## Overview

After deploying infrastructure with Terraform, these scripts will:
1. Query Terraform outputs for all AWS resource IDs
2. Update frontend environment variables (`.env.local`)
3. Create backend environment variables (`.env.development`)
4. Generate a JSON file with all infrastructure outputs

## Usage

### Windows (PowerShell)

```powershell
# After Terraform deployment completes
cd infra/scripts
.\update-env-config.ps1
```

### Linux/Mac (Bash)

```bash
# After Terraform deployment completes
cd infra/scripts
chmod +x update-env-config.sh
./update-env-config.sh
```

## What Gets Updated

### 1. Frontend Configuration (`.env.local`)

Located at project root, this file is used by Vite for frontend development:

```env
VITE_API_BASE_URL=http://[ALB-DNS-NAME]
VITE_API_TIMEOUT=30000
VITE_AWS_REGION=eu-west-1
VITE_COGNITO_USER_POOL_ID=[USER-POOL-ID]
VITE_COGNITO_CLIENT_ID=[CLIENT-ID]
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_API_LOGGING=true
```

### 2. Backend Configuration (`.env.development`)

Located at project root, this file is used by backend services:

```env
ENVIRONMENT=development
AWS_REGION=eu-west-1
DB_HOST=[RDS-ENDPOINT]
DB_PORT=5432
DB_NAME=[DATABASE-NAME]
DB_SECRET_ARN=[SECRET-ARN]
REDIS_HOST=[REDIS-ENDPOINT]
REDIS_PORT=6379
S3_UPLOAD_BUCKET=[BUCKET-NAME]
S3_ARTIFACTS_BUCKET=[BUCKET-NAME]
SQS_QUEUE_URL=[QUEUE-URL]
API_KEYS_SECRET_ARN=[SECRET-ARN]
COGNITO_USER_POOL_ID=[USER-POOL-ID]
COGNITO_CLIENT_ID=[CLIENT-ID]
COGNITO_DOMAIN=[DOMAIN]
ECR_API_REPOSITORY=[ECR-URL]
ECR_WORKER_REPOSITORY=[ECR-URL]
```

### 3. Infrastructure Outputs JSON (`infra/infrastructure-outputs.json`)

A structured JSON file with all infrastructure details:

```json
{
  "lastUpdated": "2025-10-22T10:00:00Z",
  "environment": "development",
  "cognito": {
    "userPoolId": "...",
    "clientId": "...",
    "domain": "...",
    "region": "..."
  },
  "api": {
    "albDnsName": "...",
    "apiGatewayUrl": "...",
    "baseUrl": "..."
  },
  "database": { ... },
  "cache": { ... },
  "storage": { ... },
  "queue": { ... },
  "secrets": { ... },
  "ecr": { ... }
}
```

## Prerequisites

1. **Terraform deployment must be complete**
   - Run `terraform apply` in `infra/Development`
   - Wait for all resources to be created

2. **AWS CLI must be configured**
   - Credentials should be set up
   - Region should match your deployment

3. **Terraform outputs must be available**
   - The script reads from Terraform state
   - Ensure `.terraform/terraform.tfstate` exists

## Verification

After running the script, verify the configuration:

### 1. Check Frontend Config

```bash
cat .env.local
```

Ensure all values are populated (no placeholders).

### 2. Test Frontend

```bash
npm run dev
```

The app should connect to AWS Cognito for authentication.

### 3. Check Backend Config

```bash
cat .env.development
```

Verify all AWS resource IDs are present.

### 4. Review Infrastructure Outputs

```bash
cat infra/infrastructure-outputs.json
```

## Troubleshooting

### Error: "Terraform state not found"

**Cause**: Terraform hasn't been initialized or applied.

**Solution**:
```bash
cd infra/Development
terraform init
terraform apply
```

### Error: "Could not fetch Cognito configuration"

**Cause**: Terraform deployment is incomplete or failed.

**Solution**:
1. Check Terraform deployment status
2. Review Terraform outputs: `terraform output`
3. Re-run deployment if needed

### Empty or Missing Values

**Cause**: Terraform outputs not available yet.

**Solution**:
1. Wait for deployment to complete
2. Check Terraform state: `terraform show`
3. Verify outputs: `terraform output -json`

### Permission Errors (Windows)

**Cause**: PowerShell execution policy.

**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Manual Configuration

If automatic update fails, you can manually configure:

### 1. Get Terraform Outputs

```bash
cd infra/Development
terraform output
```

### 2. Update .env.local Manually

Copy values from Terraform outputs to `.env.local`:

```bash
# Get specific values
terraform output -raw cognito_user_pool_id
terraform output -raw cognito_client_id
terraform output -raw alb_dns_name
```

### 3. Update Application Code

The frontend automatically reads from `.env.local` via `src/config/env.ts`.

No code changes needed - just restart the dev server:

```bash
npm run dev
```

## Next Steps After Configuration

1. **Update API Keys in Secrets Manager**
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id $(terraform output -raw api_keys_secret_arn) \
     --secret-string '{"llamaparse":"YOUR_KEY","elevenlabs":"YOUR_KEY","brainfm":"YOUR_KEY"}'
   ```

2. **Build and Push Docker Images**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region eu-west-1 | \
     docker login --username AWS --password-stdin $(terraform output -raw ecr_api_repository_url | cut -d'/' -f1)
   
   # Build and push (when you have Dockerfiles)
   docker build -t $(terraform output -raw ecr_api_repository_url):latest -f Dockerfile.api .
   docker push $(terraform output -raw ecr_api_repository_url):latest
   ```

3. **Run Database Migrations**
   ```bash
   cd infra/database/migrations
   export DB_HOST=$(terraform output -raw rds_address)
   export DB_PORT=$(terraform output -raw rds_port)
   export DB_NAME=$(terraform output -raw rds_database_name)
   
   psql -h $DB_HOST -p $DB_PORT -U pbl_admin -d $DB_NAME -f *.sql
   ```

4. **Test the Application**
   ```bash
   # Start frontend
   npm run dev
   
   # Test authentication
   # Navigate to http://localhost:5173
   # Try signing up/logging in
   ```

## Integration with CI/CD

To use in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Update Configuration
  run: |
    cd infra/scripts
    ./update-env-config.sh
    
- name: Commit Updated Config
  run: |
    git config user.name "GitHub Actions"
    git config user.email "actions@github.com"
    git add .env.local .env.development infra/infrastructure-outputs.json
    git commit -m "chore: update infrastructure configuration"
    git push
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env.local` or `.env.development` to version control**
   - These files contain sensitive configuration
   - They are in `.gitignore` by default

2. **API Keys and Secrets**
   - Store in AWS Secrets Manager
   - Never hardcode in environment files
   - Use IAM roles for AWS service access

3. **Database Credentials**
   - Retrieved from Secrets Manager at runtime
   - Never expose in environment variables in production

4. **Infrastructure Outputs JSON**
   - Can be committed (contains no secrets)
   - Useful for documentation and reference
   - Contains only resource identifiers

## Support

For issues or questions:
- Check Terraform deployment logs
- Review AWS Console for resource status
- Verify IAM permissions
- See main documentation in `infra/README.md`
