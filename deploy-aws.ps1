# ============================================================================
# AWS Full Stack Deployment Script
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('check', 'init', 'plan', 'deploy', 'destroy', 'status')]
    [string]$Action = 'check',
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = 'development',
    
    [Parameter(Mandatory=$false)]
    [string]$DeveloperId = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoApprove
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Banner
Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║   PBL Platform - AWS Full Stack Deployment               ║
║   Environment: $Environment                              ║
║   Developer: $DeveloperId                                ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Check prerequisites
function Test-Prerequisites {
    Write-Info "`n[1/5] Checking prerequisites..."
    
    $missing = @()
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version 2>&1
        Write-Success "✓ AWS CLI: $awsVersion"
    } catch {
        $missing += "AWS CLI"
        Write-Error "✗ AWS CLI not found"
    }
    
    # Check Terraform
    try {
        $tfVersion = terraform version -json | ConvertFrom-Json
        Write-Success "✓ Terraform: $($tfVersion.terraform_version)"
    } catch {
        $missing += "Terraform"
        Write-Error "✗ Terraform not found"
    }
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Success "✓ Docker: $dockerVersion"
    } catch {
        $missing += "Docker"
        Write-Error "✗ Docker not found"
    }
    
    # Check AWS credentials
    try {
        $identity = aws sts get-caller-identity | ConvertFrom-Json
        Write-Success "✓ AWS Account: $($identity.Account)"
        Write-Success "✓ AWS User: $($identity.Arn)"
    } catch {
        $missing += "AWS Credentials"
        Write-Error "✗ AWS credentials not configured"
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "`nMissing prerequisites: $($missing -join ', ')"
        Write-Info "Please install missing tools and try again."
        Write-Info "See AWS-DEPLOYMENT-GUIDE.md for installation instructions."
        exit 1
    }
    
    Write-Success "`n✓ All prerequisites met!"
}

# Initialize Terraform backend
function Initialize-Backend {
    Write-Info "`n[2/5] Initializing Terraform backend..."
    
    $bucketName = "pbl-terraform-state-$Environment"
    $tableName = "pbl-terraform-locks-$Environment"
    $region = "us-east-1"
    
    # Check if bucket exists
    try {
        aws s3 ls "s3://$bucketName" 2>&1 | Out-Null
        Write-Success "✓ S3 bucket exists: $bucketName"
    } catch {
        Write-Info "Creating S3 bucket: $bucketName"
        aws s3 mb "s3://$bucketName" --region $region
        aws s3api put-bucket-versioning --bucket $bucketName --versioning-configuration Status=Enabled
        Write-Success "✓ S3 bucket created"
    }
    
    # Check if DynamoDB table exists
    try {
        aws dynamodb describe-table --table-name $tableName --region $region 2>&1 | Out-Null
        Write-Success "✓ DynamoDB table exists: $tableName"
    } catch {
        Write-Info "Creating DynamoDB table: $tableName"
        aws dynamodb create-table `
            --table-name $tableName `
            --attribute-definitions AttributeName=LockID,AttributeType=S `
            --key-schema AttributeName=LockID,KeyType=HASH `
            --billing-mode PAY_PER_REQUEST `
            --region $region | Out-Null
        Write-Success "✓ DynamoDB table created"
    }
    
    # Initialize Terraform
    Push-Location "infra/Development"
    try {
        terraform init -reconfigure
        Write-Success "✓ Terraform initialized"
    } finally {
        Pop-Location
    }
}

# Plan deployment
function Show-Plan {
    Write-Info "`n[3/5] Creating deployment plan..."
    
    Push-Location "infra/Development"
    try {
        if (Test-Path "terraform.tfvars.local") {
            terraform plan -var-file="terraform.tfvars.local" -out=tfplan
        } else {
            Write-Warning "terraform.tfvars.local not found, using defaults"
            terraform plan -out=tfplan
        }
        Write-Success "`n✓ Plan created successfully"
        Write-Info "Review the plan above before deploying."
    } finally {
        Pop-Location
    }
}

# Deploy infrastructure
function Deploy-Infrastructure {
    Write-Info "`n[4/5] Deploying infrastructure..."
    Write-Warning "This will create AWS resources and incur costs!"
    
    if (-not $AutoApprove) {
        $confirm = Read-Host "Continue? (yes/no)"
        if ($confirm -ne 'yes') {
            Write-Info "Deployment cancelled."
            exit 0
        }
    }
    
    Push-Location "infra/Development"
    try {
        if (Test-Path "terraform.tfvars.local") {
            if ($AutoApprove) {
                terraform apply -var-file="terraform.tfvars.local" -auto-approve
            } else {
                terraform apply -var-file="terraform.tfvars.local"
            }
        } else {
            if ($AutoApprove) {
                terraform apply -auto-approve
            } else {
                terraform apply
            }
        }
        
        Write-Success "`n✓ Infrastructure deployed successfully!"
        
        # Show outputs
        Write-Info "`n[5/5] Deployment Summary:"
        terraform output -json | ConvertFrom-Json | ConvertTo-Json -Depth 10
        
    } finally {
        Pop-Location
    }
}

# Show deployment status
function Show-Status {
    Write-Info "`nDeployment Status:"
    
    Push-Location "infra/Development"
    try {
        # Check if state exists
        if (-not (Test-Path ".terraform/terraform.tfstate")) {
            Write-Warning "No deployment found. Run with -Action init first."
            return
        }
        
        # Show outputs
        $outputs = terraform output -json | ConvertFrom-Json
        
        Write-Info "`nEndpoints:"
        Write-Host "  API Gateway: $($outputs.api_gateway_url.value)" -ForegroundColor White
        Write-Host "  ALB: http://$($outputs.alb_dns_name.value)" -ForegroundColor White
        Write-Host "  Dashboard: $($outputs.cloudwatch_dashboard_url.value)" -ForegroundColor White
        
        Write-Info "`nResources:"
        Write-Host "  RDS Endpoint: $($outputs.rds_endpoint.value)" -ForegroundColor White
        Write-Host "  Redis Endpoint: $($outputs.redis_endpoint.value)" -ForegroundColor White
        Write-Host "  S3 Bucket: $($outputs.pdf_uploads_bucket.value)" -ForegroundColor White
        Write-Host "  SQS Queue: $($outputs.sqs_queue_url.value)" -ForegroundColor White
        
        Write-Info "`nCognito:"
        Write-Host "  User Pool ID: $($outputs.cognito_user_pool_id.value)" -ForegroundColor White
        Write-Host "  Client ID: $($outputs.cognito_user_pool_client_id.value)" -ForegroundColor White
        
        # Check service health
        Write-Info "`nService Health:"
        
        # Check RDS
        try {
            $rdsStatus = aws rds describe-db-instances --db-instance-identifier "pbl-$Environment-$DeveloperId-db" --query 'DBInstances[0].DBInstanceStatus' --output text
            Write-Host "  RDS: $rdsStatus" -ForegroundColor $(if ($rdsStatus -eq 'available') { 'Green' } else { 'Yellow' })
        } catch {
            Write-Host "  RDS: Unknown" -ForegroundColor Gray
        }
        
        # Check ElastiCache
        try {
            $cacheStatus = aws elasticache describe-cache-clusters --cache-cluster-id "pbl-$Environment-$DeveloperId-redis" --query 'CacheClusters[0].CacheClusterStatus' --output text
            Write-Host "  Redis: $cacheStatus" -ForegroundColor $(if ($cacheStatus -eq 'available') { 'Green' } else { 'Yellow' })
        } catch {
            Write-Host "  Redis: Unknown" -ForegroundColor Gray
        }
        
        # Check ECS services
        try {
            $ecsServices = aws ecs list-services --cluster "pbl-$Environment-$DeveloperId-cluster" --query 'serviceArns' --output json | ConvertFrom-Json
            Write-Host "  ECS Services: $($ecsServices.Count)" -ForegroundColor $(if ($ecsServices.Count -gt 0) { 'Green' } else { 'Yellow' })
        } catch {
            Write-Host "  ECS Services: Unknown" -ForegroundColor Gray
        }
        
    } finally {
        Pop-Location
    }
}

# Destroy infrastructure
function Remove-Infrastructure {
    Write-Warning "`nWARNING: This will destroy all AWS resources!"
    Write-Warning "This action cannot be undone."
    
    if (-not $AutoApprove) {
        $confirm = Read-Host "Type 'destroy' to confirm"
        if ($confirm -ne 'destroy') {
            Write-Info "Destruction cancelled."
            exit 0
        }
    }
    
    Push-Location "infra/Development"
    try {
        if (Test-Path "terraform.tfvars.local") {
            terraform destroy -var-file="terraform.tfvars.local" -auto-approve
        } else {
            terraform destroy -auto-approve
        }
        
        Write-Success "`n✓ Infrastructure destroyed"
        
    } finally {
        Pop-Location
    }
}

# Main execution
switch ($Action) {
    'check' {
        Test-Prerequisites
        Write-Info "`nNext steps:"
        Write-Host "  1. Run: .\deploy-aws.ps1 -Action init" -ForegroundColor White
        Write-Host "  2. Update: infra/Development/terraform.tfvars.local" -ForegroundColor White
        Write-Host "  3. Run: .\deploy-aws.ps1 -Action plan" -ForegroundColor White
        Write-Host "  4. Run: .\deploy-aws.ps1 -Action deploy" -ForegroundColor White
    }
    
    'init' {
        Test-Prerequisites
        Initialize-Backend
        Write-Success "`n✓ Initialization complete!"
        Write-Info "Next: .\deploy-aws.ps1 -Action plan"
    }
    
    'plan' {
        Test-Prerequisites
        Show-Plan
        Write-Info "Next: .\deploy-aws.ps1 -Action deploy"
    }
    
    'deploy' {
        Test-Prerequisites
        Deploy-Infrastructure
        Write-Success "`n✓ Deployment complete!"
        Write-Info "`nNext steps:"
        Write-Host "  1. Apply database schema: See AWS-DEPLOYMENT-GUIDE.md" -ForegroundColor White
        Write-Host "  2. Update API keys in Secrets Manager" -ForegroundColor White
        Write-Host "  3. Build and push Docker images" -ForegroundColor White
        Write-Host "  4. Deploy Lambda functions" -ForegroundColor White
    }
    
    'status' {
        Show-Status
    }
    
    'destroy' {
        Remove-Infrastructure
    }
}

Write-Host "`n" -NoNewline
