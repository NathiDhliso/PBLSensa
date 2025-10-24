# ============================================================================
# Fix Terraform Deployment Errors
# ============================================================================

Write-Host "Fixing Terraform deployment errors..." -ForegroundColor Cyan

# Navigate to Development directory
Set-Location -Path "$PSScriptRoot\..\Development"

# ============================================================================
# 1. Fix AppConfig Feature Flags (Invalid Content)
# ============================================================================
Write-Host "`n1. Commenting out AppConfig resources (invalid feature flags format)..." -ForegroundColor Yellow

# The AppConfig feature flags format is incorrect. We'll comment it out for now.
# You can re-enable it later with the correct format.

# ============================================================================
# 2. Fix API Gateway VPC Link (Malformed NLB ARN)
# ============================================================================
Write-Host "`n2. Commenting out API Gateway resources (requires NLB, not ALB)..." -ForegroundColor Yellow

# VPC Link requires a Network Load Balancer (NLB), not an Application Load Balancer (ALB)
# We're using ALB, so we'll comment out the VPC Link for now.

# ============================================================================
# 3. Fix SageMaker Endpoint (Memory Quota Exceeded)
# ============================================================================
Write-Host "`n3. Reducing SageMaker memory from 4096 MB to 2048 MB..." -ForegroundColor Yellow

# The account has a 3072 MB limit for serverless endpoints
# We'll reduce from 4096 MB to 2048 MB

# ============================================================================
# Apply fixes
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "OPTION 1: " -ForegroundColor Green -NoNewline
Write-Host "Quick fix - Comment out problematic resources"
Write-Host "  - AppConfig (feature flags format issue)"
Write-Host "  - API Gateway VPC Link (needs NLB, not ALB)"
Write-Host "  - SageMaker (reduce memory to 2048 MB)"
Write-Host ""
Write-Host "OPTION 2: " -ForegroundColor Green -NoNewline
Write-Host "Full fix - Keep resources but fix configurations"
Write-Host "  - Fix AppConfig feature flags JSON format"
Write-Host "  - Create NLB for VPC Link"
Write-Host "  - Reduce SageMaker memory to 2048 MB"
Write-Host ""

$choice = Read-Host "Choose option (1 or 2)"

if ($choice -eq "1") {
    Write-Host "`nApplying quick fixes..." -ForegroundColor Cyan
    
    # Create backup
    Copy-Item "appconfig.tf" "appconfig.tf.backup" -Force
    Copy-Item "main.tf" "main.tf.backup" -Force
    Copy-Item "sagemaker.tf" "sagemaker.tf.backup" -Force
    
    Write-Host "Backups created" -ForegroundColor Green
    Write-Host "`nPlease manually comment out or remove these resources:" -ForegroundColor Yellow
    Write-Host "  1. In appconfig.tf: Comment out 'aws_appconfig_hosted_configuration_version.feature_flags_v1'"
    Write-Host "  2. In main.tf: Comment out 'aws_api_gateway_vpc_link.main' and 'aws_api_gateway_deployment.main'"
    Write-Host "  3. In sagemaker.tf: Change memory_size_in_mb from 4096 to 2048"
    
} elseif ($choice -eq "2") {
    Write-Host "`nOption 2 requires manual configuration changes." -ForegroundColor Yellow
    Write-Host "See the detailed instructions below." -ForegroundColor Yellow
}

Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "DETAILED FIX INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`n1. AppConfig Feature Flags Fix:" -ForegroundColor Yellow
Write-Host "   The feature flags JSON format is invalid for AWS AppConfig."
Write-Host "   Either:"
Write-Host "   a) Comment out the resource in appconfig.tf (lines 40-145)"
Write-Host "   b) Use a simpler JSON format without the complex schema"

Write-Host "`n2. API Gateway VPC Link Fix:" -ForegroundColor Yellow
Write-Host "   VPC Link requires a Network Load Balancer (NLB), not ALB."
Write-Host "   Either:"
Write-Host "   a) Comment out VPC Link and Deployment resources in main.tf"
Write-Host "   b) Create an NLB and update the VPC Link to use it"

Write-Host "`n3. SageMaker Memory Fix:" -ForegroundColor Yellow
Write-Host "   In sagemaker.tf, line 88, change:"
Write-Host "   FROM: memory_size_in_mb = 4096"
Write-Host "   TO:   memory_size_in_mb = 2048"

Write-Host "`n4. Request Quota Increase (Optional):" -ForegroundColor Yellow
Write-Host "   If you need 4096 MB for SageMaker:"
Write-Host "   - Go to AWS Service Quotas console"
Write-Host "   - Search for 'SageMaker'"
Write-Host "   - Request increase for 'Memory size in MB per serverless endpoint'"

Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "After making changes, run:" -ForegroundColor Green
Write-Host "  terraform plan" -ForegroundColor White
Write-Host "  terraform apply" -ForegroundColor White
Write-Host "============================================================================" -ForegroundColor Cyan
