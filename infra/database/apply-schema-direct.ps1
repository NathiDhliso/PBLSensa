#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Apply database schema directly using psql
.DESCRIPTION
    Simpler approach - applies schema.sql directly to RDS
#>

Write-Host "🗄️  Database Schema Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Get database credentials from Terraform outputs
Write-Host "📋 Getting database connection info..." -ForegroundColor Cyan
cd "..\..\infra\Development"

$dbHost = terraform output -raw rds_address
$dbName = terraform output -raw rds_database_name
$dbUser = "pbl_admin"

Write-Host "  Host: $dbHost" -ForegroundColor Gray
Write-Host "  Database: $dbName" -ForegroundColor Gray
Write-Host ""

# Get password from AWS Secrets Manager
Write-Host "🔐 Getting database password from Secrets Manager..." -ForegroundColor Cyan
$secretArn = terraform output -raw db_secret_arn
$secretJson = aws secretsmanager get-secret-value --secret-id $secretArn --query SecretString --output text --region eu-west-1
$secret = $secretJson | ConvertFrom-Json
$dbPassword = $secret.password

Write-Host "✅ Credentials retrieved" -ForegroundColor Green
Write-Host ""

# Set environment variable for psql
$env:PGPASSWORD = $dbPassword

# Apply schema
Write-Host "📦 Applying base schema..." -ForegroundColor Cyan
Write-Host ""

cd "..\..\infra\database"

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "❌ psql not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Or use: winget install PostgreSQL.PostgreSQL" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Use the SSM-based migration scripts" -ForegroundColor Yellow
    exit 1
}

# Apply schema
psql -h $dbHost -U $dbUser -d $dbName -f schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Base schema applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\apply-all-migrations.ps1" -ForegroundColor White
    Write-Host "  2. Then: cd ..\.. && .\deploy-aws.ps1" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to apply schema" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  • Check if bastion host is running" -ForegroundColor White
    Write-Host "  • Verify security group allows your IP" -ForegroundColor White
    Write-Host "  • Try: .\..\..\infra\scripts\create-bastion-host.ps1" -ForegroundColor White
    exit 1
}

# Clear password
$env:PGPASSWORD = ""
