#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Retrieve RDS database credentials from AWS
.DESCRIPTION
    Gets RDS endpoint and credentials from Terraform outputs or AWS SSM
#>

Write-Host "🔍 Retrieving RDS Database Credentials..." -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is available
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Set region
$region = "eu-west-1"
$env = "Development"

Write-Host "📍 Region: $region" -ForegroundColor Yellow
Write-Host "🏷️  Environment: $env" -ForegroundColor Yellow
Write-Host ""

# Try to get from Terraform outputs first
Write-Host "Checking Terraform outputs..." -ForegroundColor Gray
Push-Location "infra/$env"

try {
    $tfOutput = terraform output -json 2>$null | ConvertFrom-Json
    
    if ($tfOutput) {
        Write-Host "✅ Found Terraform outputs" -ForegroundColor Green
        Write-Host ""
        
        # Extract RDS info
        $rdsEndpoint = $tfOutput.rds_endpoint.value
        $rdsDbName = $tfOutput.rds_database_name.value
        
        Write-Host "Database Configuration:" -ForegroundColor Cyan
        Write-Host "  DB_HOST=$rdsEndpoint" -ForegroundColor White
        Write-Host "  DB_PORT=5432" -ForegroundColor White
        Write-Host "  DB_NAME=$rdsDbName" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  Database credentials (username/password) are in AWS Secrets Manager" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "⚠️  Could not read Terraform outputs" -ForegroundColor Yellow
}

Pop-Location

# Try to get from SSM Parameter Store
Write-Host "Checking AWS SSM Parameter Store..." -ForegroundColor Gray
Write-Host ""

$ssmPrefix = "/pbl/dev"
$params = @("db/host", "db/port", "db/name", "db/username")

foreach ($param in $params) {
    $paramName = "$ssmPrefix/$param"
    try {
        $value = aws ssm get-parameter --name $paramName --region $region --query "Parameter.Value" --output text 2>$null
        if ($value) {
            $envVar = "DB_" + ($param.Split('/')[-1].ToUpper())
            Write-Host "  $envVar=$value" -ForegroundColor White
        }
    } catch {
        # Parameter doesn't exist
    }
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the values above to backend/.env" -ForegroundColor White
Write-Host "2. Get the database password from AWS Secrets Manager:" -ForegroundColor White
Write-Host "   aws secretsmanager get-secret-value --secret-id pbl-dev-rds-password --region $region" -ForegroundColor Gray
Write-Host "3. Add DB_PASSWORD to backend/.env" -ForegroundColor White
Write-Host "4. Restart the backend: .\restart-backend.ps1" -ForegroundColor White
Write-Host ""
