#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automatically configure backend/.env with RDS credentials
#>

Write-Host "🔧 Setting up backend/.env file..." -ForegroundColor Cyan
Write-Host ""

$region = "eu-west-1"

# Get RDS password from Secrets Manager
Write-Host "🔐 Retrieving database password from AWS Secrets Manager..." -ForegroundColor Yellow

try {
    $secretJson = aws secretsmanager get-secret-value --secret-id pbl-dev-rds-password --region $region --query SecretString --output text 2>$null
    
    if ($secretJson) {
        $secret = $secretJson | ConvertFrom-Json
        $dbPassword = $secret.password
        $dbUsername = $secret.username
        
        Write-Host "✅ Retrieved credentials from Secrets Manager" -ForegroundColor Green
    } else {
        Write-Host "❌ Could not retrieve secret. Using default values." -ForegroundColor Red
        $dbUsername = "postgres"
        $dbPassword = "REPLACE_WITH_YOUR_PASSWORD"
    }
} catch {
    Write-Host "❌ Error accessing Secrets Manager: $_" -ForegroundColor Red
    $dbUsername = "postgres"
    $dbPassword = "REPLACE_WITH_YOUR_PASSWORD"
}

# Database configuration
$dbHost = "pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com"
$dbPort = "5432"
$dbName = "pbl_development"

# Create .env content
$envContent = @"
# Backend Environment Variables
# Auto-generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# AWS Configuration
AWS_REGION=$region

# Database Configuration (AWS RDS)
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_NAME=$dbName
DB_USER=$dbUsername
DB_PASSWORD=$dbPassword

# Application Settings
LOG_LEVEL=INFO
"@

# Write to file
$envPath = "backend/.env"
$envContent | Out-File -FilePath $envPath -Encoding UTF8 -Force

Write-Host ""
Write-Host "✅ Created $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Host: $dbHost" -ForegroundColor White
Write-Host "  Port: $dbPort" -ForegroundColor White
Write-Host "  Database: $dbName" -ForegroundColor White
Write-Host "  Username: $dbUsername" -ForegroundColor White
Write-Host "  Password: $(if ($dbPassword -eq 'REPLACE_WITH_YOUR_PASSWORD') { '⚠️  NOT SET' } else { '✅ Retrieved' })" -ForegroundColor White
Write-Host ""

if ($dbPassword -eq "REPLACE_WITH_YOUR_PASSWORD") {
    Write-Host "⚠️  WARNING: Could not retrieve password automatically" -ForegroundColor Yellow
    Write-Host "Please edit backend/.env and set DB_PASSWORD manually" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "📦 Installing required Python packages..." -ForegroundColor Cyan
    pip install asyncpg python-dotenv boto3 2>$null
    
    Write-Host ""
    Write-Host "✅ Setup complete! Ready to start backend." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: .\restart-backend.ps1" -ForegroundColor Cyan
}
