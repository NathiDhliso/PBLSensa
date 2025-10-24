# ============================================================================
# Retry Terraform Deployment After Fixes
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Retrying Terraform Deployment" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

# Navigate to Development directory
Set-Location -Path "$PSScriptRoot\..\Development"

Write-Host "`nCurrent directory: $(Get-Location)" -ForegroundColor Gray

# ============================================================================
# Show what was fixed
# ============================================================================
Write-Host "`nFixes applied:" -ForegroundColor Green
Write-Host "  ✅ SageMaker memory reduced from 4096 MB to 2048 MB" -ForegroundColor White
Write-Host "  ✅ AppConfig feature flags format simplified" -ForegroundColor White
Write-Host "  ✅ API Gateway VPC Link commented out (needs NLB)" -ForegroundColor White
Write-Host "  ✅ API Gateway Deployment commented out (needs methods)" -ForegroundColor White

# ============================================================================
# Run terraform plan
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "Step 1: Running terraform plan..." -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

terraform plan -out=tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Terraform plan failed!" -ForegroundColor Red
    Write-Host "Please review the errors above and fix them." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Terraform plan succeeded!" -ForegroundColor Green

# ============================================================================
# Confirm before applying
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "Step 2: Apply changes" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`nReview the plan above." -ForegroundColor Yellow
$confirm = Read-Host "Do you want to apply these changes? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "`nDeployment cancelled." -ForegroundColor Yellow
    Remove-Item tfplan -ErrorAction SilentlyContinue
    exit 0
}

# ============================================================================
# Apply terraform changes
# ============================================================================
Write-Host "`nApplying terraform changes..." -ForegroundColor Cyan

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
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`nFetching outputs..." -ForegroundColor Cyan
terraform output

# ============================================================================
# Next steps
# ============================================================================
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`n1. Update environment variables:" -ForegroundColor Yellow
Write-Host "   .\scripts\update-env-config.ps1" -ForegroundColor White

Write-Host "`n2. Apply database migrations:" -ForegroundColor Yellow
Write-Host "   cd ..\database" -ForegroundColor White
Write-Host "   .\apply-all-migrations.ps1" -ForegroundColor White

Write-Host "`n3. Build and push Docker images:" -ForegroundColor Yellow
Write-Host "   cd ..\.." -ForegroundColor White
Write-Host "   .\deploy-aws.ps1" -ForegroundColor White

Write-Host "`n4. Check deployment status:" -ForegroundColor Yellow
Write-Host "   .\infra\scripts\check-deployment-status.ps1" -ForegroundColor White

Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "For detailed information, see:" -ForegroundColor Gray
Write-Host "  infra/Development/TERRAFORM-FIXES-APPLIED.md" -ForegroundColor White
Write-Host "============================================================================" -ForegroundColor Cyan
