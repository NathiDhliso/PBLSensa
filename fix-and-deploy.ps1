# ============================================================================
# One-Command Fix and Deploy
# ============================================================================

Write-Host "🚀 Fixing and deploying Terraform infrastructure..." -ForegroundColor Cyan
Write-Host ""

# Run the comprehensive fix script
& ".\infra\scripts\apply-all-fixes.ps1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Infrastructure deployed." -ForegroundColor Green
    Write-Host "`nNext: Run .\infra\scripts\update-env-config.ps1" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Deployment failed. Check errors above." -ForegroundColor Red
    exit 1
}
