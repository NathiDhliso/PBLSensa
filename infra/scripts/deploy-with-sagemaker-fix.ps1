# ============================================================================
# Deploy Terraform with SageMaker Fix
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Deploying with SageMaker Fix" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

cd "$PSScriptRoot\..\Development"

Write-Host "`nSageMaker Fix Applied:" -ForegroundColor Green
Write-Host "  Old Model: HDT-E (13.6 GB) ❌" -ForegroundColor Gray
Write-Host "  New Model: all-MiniLM-L6-v2 (~80 MB) ✅" -ForegroundColor White
Write-Host ""

# Validate
Write-Host "Validating configuration..." -ForegroundColor Cyan
terraform validate

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Validation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration valid`n" -ForegroundColor Green

# Plan
Write-Host "Creating deployment plan..." -ForegroundColor Cyan
terraform plan -out=tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Plan failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Plan created successfully`n" -ForegroundColor Green

# Confirm
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  • Destroy old SageMaker endpoint (hdt_e)" -ForegroundColor White
Write-Host "  • Create new SageMaker endpoint (embeddings)" -ForegroundColor White
Write-Host "  • Use smaller, faster model (all-MiniLM-L6-v2)" -ForegroundColor White
Write-Host "  • Deploy time: ~5-7 minutes" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue with deployment? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "`nDeployment cancelled." -ForegroundColor Yellow
    Remove-Item tfplan -ErrorAction SilentlyContinue
    exit 0
}

# Apply
Write-Host "`nApplying changes..." -ForegroundColor Cyan
terraform apply tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Remove-Item tfplan -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item tfplan -ErrorAction SilentlyContinue

Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`nSageMaker Endpoint:" -ForegroundColor Yellow
$endpoint = terraform output -raw sagemaker_endpoint_name
Write-Host "  Name: $endpoint" -ForegroundColor White
Write-Host "  Model: sentence-transformers/all-MiniLM-L6-v2" -ForegroundColor White
Write-Host "  Dimensions: 384" -ForegroundColor White
Write-Host "  Memory: 2048 MB" -ForegroundColor White

Write-Host "`n🎉 All infrastructure deployed successfully!" -ForegroundColor Green
