# PowerShell script to check Terraform deployment status
# Run this while deployment is in progress

Write-Host "🔍 Checking Terraform Deployment Status..." -ForegroundColor Cyan
Write-Host ""

# Navigate to Terraform directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\..\Development"

# Check if deployment is running
$lockFile = ".terraform\terraform.tfstate.lock.info"
if (Test-Path $lockFile) {
    Write-Host "⏳ Deployment is currently in progress..." -ForegroundColor Yellow
    $lockInfo = Get-Content $lockFile | ConvertFrom-Json
    Write-Host "   Operation: $($lockInfo.Operation)" -ForegroundColor Gray
    Write-Host "   Started: $($lockInfo.Created)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ No active deployment detected" -ForegroundColor Green
    Write-Host ""
}

# Try to get current outputs (may fail if deployment incomplete)
Write-Host "📊 Current Infrastructure Status:" -ForegroundColor Cyan
Write-Host ""

$resources = @(
    @{Name="Cognito User Pool"; Output="cognito_user_pool_id"},
    @{Name="Cognito Client"; Output="cognito_client_id"},
    @{Name="ALB DNS Name"; Output="alb_dns_name"},
    @{Name="API Gateway URL"; Output="api_gateway_url"},
    @{Name="RDS Endpoint"; Output="rds_address"},
    @{Name="Redis Endpoint"; Output="redis_endpoint"},
    @{Name="S3 PDF Bucket"; Output="s3_pdf_uploads_bucket"},
    @{Name="SQS Queue URL"; Output="sqs_documents_queue_url"}
)

$completedCount = 0
$totalCount = $resources.Count

foreach ($resource in $resources) {
    try {
        $value = terraform output -raw $resource.Output 2>$null
        if (-not [string]::IsNullOrEmpty($value)) {
            Write-Host "  ✅ $($resource.Name)" -ForegroundColor Green
            $completedCount++
        } else {
            Write-Host "  ⏳ $($resource.Name) - Pending" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⏳ $($resource.Name) - Pending" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Progress: $completedCount/$totalCount resources ready" -ForegroundColor Cyan

if ($completedCount -eq $totalCount) {
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run configuration update script:"
    Write-Host "     .\update-env-config.ps1" -ForegroundColor Yellow
    Write-Host "  2. Review updated .env.local file"
    Write-Host "  3. Start your application: npm run dev"
} else {
    Write-Host ""
    Write-Host "⏳ Deployment still in progress. Run this script again to check status." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To monitor in real-time, check the other terminal where 'terraform apply' is running." -ForegroundColor Gray
}

Write-Host ""
