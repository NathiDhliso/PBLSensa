#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Apply database migration to AWS RDS
.DESCRIPTION
    This script retrieves database credentials from AWS Secrets Manager
    and applies the AI analogy generation migration to the RDS instance.
#>

param(
    [string]$Environment = "development",
    [string]$DeveloperId = "dev",
    [string]$Region = "eu-west-1",
    [switch]$Rollback = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🗄️  Database Migration Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SecretName = "pbl/$Environment/$DeveloperId/db-credentials"
$RdsEndpoint = "pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com"
$DatabaseName = "pbl_development"
$Port = 5432

if ($Rollback) {
    $MigrationFile = "migrations/20250122_0006_ai_analogy_generation_rollback.sql"
    Write-Host "⚠️  ROLLBACK MODE - This will remove the AI analogy tables!" -ForegroundColor Yellow
} else {
    $MigrationFile = "migrations/20250122_0006_ai_analogy_generation.sql"
    Write-Host "✅ MIGRATION MODE - This will create AI analogy tables" -ForegroundColor Green
}

Write-Host ""

# Check if migration file exists
if (-not (Test-Path $MigrationFile)) {
    Write-Host "❌ Migration file not found: $MigrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Environment: $Environment"
Write-Host "   Region: $Region"
Write-Host "   RDS Endpoint: $RdsEndpoint"
Write-Host "   Database: $DatabaseName"
Write-Host "   Migration File: $MigrationFile"
Write-Host ""

# Check if AWS CLI is installed
Write-Host "🔍 Checking AWS CLI..." -ForegroundColor Cyan
try {
    $awsVersion = aws --version 2>&1
    Write-Host "   ✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if psql is installed
Write-Host "🔍 Checking PostgreSQL client..." -ForegroundColor Cyan
try {
    $psqlVersion = psql --version 2>&1
    Write-Host "   ✅ psql found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ psql not found. Please install PostgreSQL client." -ForegroundColor Red
    Write-Host "   Windows: Download from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "   Or use: winget install PostgreSQL.PostgreSQL" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Retrieve database credentials from AWS Secrets Manager
Write-Host "🔐 Retrieving database credentials from AWS Secrets Manager..." -ForegroundColor Cyan
try {
    $secretJson = aws secretsmanager get-secret-value `
        --secret-id $SecretName `
        --region $Region `
        --query SecretString `
        --output text 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to retrieve secret: $secretJson" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Possible issues:" -ForegroundColor Yellow
        Write-Host "   1. AWS credentials not configured (run 'aws configure')" -ForegroundColor Yellow
        Write-Host "   2. Insufficient IAM permissions" -ForegroundColor Yellow
        Write-Host "   3. Secret does not exist in region $Region" -ForegroundColor Yellow
        exit 1
    }
    
    $secret = $secretJson | ConvertFrom-Json
    $DbUsername = $secret.username
    $DbPassword = $secret.password
    
    Write-Host "   ✅ Credentials retrieved successfully" -ForegroundColor Green
    Write-Host "   Username: $DbUsername" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error retrieving credentials: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Confirm before proceeding
if ($Rollback) {
    Write-Host "⚠️  WARNING: You are about to ROLLBACK the migration!" -ForegroundColor Yellow
    Write-Host "   This will DROP the following tables:" -ForegroundColor Yellow
    Write-Host "   - chapter_analogies" -ForegroundColor Yellow
    Write-Host "   - memory_techniques" -ForegroundColor Yellow
    Write-Host "   - learning_mantras" -ForegroundColor Yellow
    Write-Host "   - analogy_feedback" -ForegroundColor Yellow
    Write-Host "   - chapter_complexity" -ForegroundColor Yellow
} else {
    Write-Host "📝 Ready to apply migration:" -ForegroundColor Cyan
    Write-Host "   This will CREATE the following tables:" -ForegroundColor Cyan
    Write-Host "   - chapter_analogies (with indexes and triggers)" -ForegroundColor Cyan
    Write-Host "   - memory_techniques" -ForegroundColor Cyan
    Write-Host "   - learning_mantras" -ForegroundColor Cyan
    Write-Host "   - analogy_feedback" -ForegroundColor Cyan
    Write-Host "   - chapter_complexity" -ForegroundColor Cyan
    Write-Host "   - analogy_statistics (view)" -ForegroundColor Cyan
    Write-Host "   - user_generation_stats (view)" -ForegroundColor Cyan
}

Write-Host ""
$confirmation = Read-Host "Do you want to proceed? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Migration cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $DbPassword

# Apply migration
Write-Host "🚀 Applying migration to database..." -ForegroundColor Cyan
Write-Host ""

try {
    # Run psql command
    $output = psql `
        -h $RdsEndpoint `
        -p $Port `
        -U $DbUsername `
        -d $DatabaseName `
        -f $MigrationFile `
        2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error output:" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        exit 1
    }
    
    Write-Host $output -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    
    if (-not $Rollback) {
        Write-Host ""
        Write-Host "📊 New tables created:" -ForegroundColor Cyan
        Write-Host "   ✅ chapter_analogies" -ForegroundColor Green
        Write-Host "   ✅ memory_techniques" -ForegroundColor Green
        Write-Host "   ✅ learning_mantras" -ForegroundColor Green
        Write-Host "   ✅ analogy_feedback" -ForegroundColor Green
        Write-Host "   ✅ chapter_complexity" -ForegroundColor Green
        Write-Host ""
        Write-Host "📈 Views created:" -ForegroundColor Cyan
        Write-Host "   ✅ analogy_statistics" -ForegroundColor Green
        Write-Host "   ✅ user_generation_stats" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error applying migration: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🎉 Database migration complete!" -ForegroundColor Green
Write-Host ""

# Verify tables were created (only for forward migration)
if (-not $Rollback) {
    Write-Host "🔍 Verifying tables..." -ForegroundColor Cyan
    $env:PGPASSWORD = $DbPassword
    
    $verifyQuery = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'chapter_analogies',
    'memory_techniques',
    'learning_mantras',
    'analogy_feedback',
    'chapter_complexity'
)
ORDER BY table_name;
"@
    
    try {
        $tables = psql `
            -h $RdsEndpoint `
            -p $Port `
            -U $DbUsername `
            -d $DatabaseName `
            -t `
            -c $verifyQuery `
            2>&1
        
        Write-Host ""
        Write-Host "Tables found in database:" -ForegroundColor Cyan
        Write-Host $tables -ForegroundColor Gray
        
    } catch {
        Write-Host "⚠️  Could not verify tables (but migration may have succeeded)" -ForegroundColor Yellow
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "✨ Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test the new endpoints in your backend" -ForegroundColor White
Write-Host "   2. Generate some test analogies" -ForegroundColor White
Write-Host "   3. Check the CloudWatch dashboard for any errors" -ForegroundColor White
Write-Host ""
