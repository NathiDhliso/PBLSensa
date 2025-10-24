# ============================================================================
# Apply All Terraform Fixes and Deploy
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Terraform Deployment - All Fixes Applied" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

# Navigate to Development directory
Set-Location -Path "$PSScriptRoot\..\Development"

Write-Host "`nCurrent directory: $(Get-Location)" -ForegroundColor Gray

# ============================================================================
# Show all fixes applied
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "FIXES APPLIED:" -ForegroundColor Green
Write-Host ""
Write-Host "1. SageMaker Memory" -ForegroundColor Yellow
Write-Host "   ✅ Reduced from 4096 MB to 2048 MB" -ForegroundColor White
Write-Host "   📄 File: sagemaker.tf (line 88)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. AppConfig Feature Flags" -ForegroundColor Yellow
Write-Host "   ✅ Simplified JSON format" -ForegroundColor White
Write-Host "   📄 File: appconfig.tf (lines 40-75)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. API Gateway VPC Link" -ForegroundColor Yellow
Write-Host "   ✅ Commented out (needs NLB)" -ForegroundColor White
Write-Host "   📄 File: main.tf (lines 945-980)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. API Gateway References" -ForegroundColor Yellow
Write-Host "   ✅ Fixed all references to commented stage" -ForegroundColor White
Write-Host "   📄 Files: main.tf, outputs.tf, monitoring.tf" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Validate Terraform configuration
# ============================================================================
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Step 1: Validating Terraform Configuration" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

terraform validate

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Terraform validation failed!" -ForegroundColor Red
    Write-Host "Please review the errors above." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Terraform configuration is valid!" -ForegroundColor Green

# ============================================================================
# Run terraform plan
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "Step 2: Running Terraform Plan" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

terraform plan -out=tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Terraform plan failed!" -ForegroundColor Red
    Write-Host "Please review the errors above." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Terraform plan succeeded!" -ForegroundColor Green

# ============================================================================
# Show plan summary
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "Plan Summary" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`nReview the plan above carefully." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor White
Write-Host "  • Update SageMaker endpoint configuration (memory change)" -ForegroundColor Gray
Write-Host "  • Update AppConfig feature flags (format change)" -ForegroundColor Gray
Write-Host "  • Remove API Gateway stage and related resources" -ForegroundColor Gray
Write-Host "  • Keep all other infrastructure unchanged" -ForegroundColor Gray

# ============================================================================
# Confirm before applying
# ============================================================================
Write-Host "`n" -NoNewline
$confirm = Read-Host "Do you want to apply these changes? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "`nDeployment cancelled." -ForegroundColor Yellow
    Remove-Item tfplan -ErrorAction SilentlyContinue
    exit 0
}

# ============================================================================
# Apply terraform changes
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "Step 3: Applying Terraform Changes" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

terraform apply tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Terraform apply failed!" -ForegroundColor Red
    Write-Host "Please review the errors above." -ForegroundColor Yellow
    Remove-Item tfplan -ErrorAction SilentlyContinue
    exit 1
}

# Clean up plan file
Remove-Item tfplan -ErrorAction SilentlyContinue

# ============================================================================
# Show outputs
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`nFetching deployment outputs..." -ForegroundColor Cyan
terraform output

# ============================================================================
# Save important outputs
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "Saving Deployment Information" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$alb_dns = terraform output -raw alb_dns_name
$db_endpoint = terraform output -raw rds_endpoint
$cognito_pool_id = terraform output -raw cognito_user_pool_id
$cognito_client_id = terraform output -raw cognito_client_id

Write-Host "`nKey Endpoints:" -ForegroundColor Yellow
Write-Host "  API Endpoint: http://$alb_dns" -ForegroundColor White
Write-Host "  Database: $db_endpoint" -ForegroundColor White
Write-Host "  Cognito Pool: $cognito_pool_id" -ForegroundColor White

# ============================================================================
# Next steps
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`n1. Update Environment Variables" -ForegroundColor Yellow
Write-Host "   cd ..\.." -ForegroundColor White
Write-Host "   .\infra\scripts\update-env-config.ps1" -ForegroundColor White

Write-Host "`n2. Apply Database Migrations" -ForegroundColor Yellow
Write-Host "   .\infra\scripts\create-bastion-host.ps1" -ForegroundColor White
Write-Host "   cd infra\database" -ForegroundColor White
Write-Host "   .\apply-all-migrations.ps1" -ForegroundColor White

Write-Host "`n3. Build and Deploy Docker Images" -ForegroundColor Yellow
Write-Host "   cd ..\.." -ForegroundColor White
Write-Host "   .\deploy-aws.ps1" -ForegroundColor White

Write-Host "`n4. Verify Deployment" -ForegroundColor Yellow
Write-Host "   .\infra\scripts\check-deployment-status.ps1" -ForegroundColor White

Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "Documentation:" -ForegroundColor Gray
Write-Host "  • TERRAFORM-FIXES-APPLIED.md - Detailed fix information" -ForegroundColor White
Write-Host "  • REFERENCES-FIXED.md - API Gateway reference fixes" -ForegroundColor White
Write-Host "  • QUICK-FIX-SUMMARY.md - Quick reference" -ForegroundColor White
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`n🎉 Infrastructure is ready!" -ForegroundColor Green
