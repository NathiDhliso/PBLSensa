#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Apply database migration via AWS Systems Manager
.DESCRIPTION
    This script uses AWS Systems Manager to run the migration from within AWS,
    bypassing network connectivity issues.
#>

param(
    [string]$Environment = "development",
    [string]$DeveloperId = "dev",
    [string]$Region = "eu-west-1",
    [switch]$Rollback = $false,
    [string]$MigrationFile = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🗄️  Database Migration via AWS SSM" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SecretName = "pbl/$Environment/$DeveloperId/db-credentials"
$RdsEndpoint = "pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com"
$DatabaseName = "pbl_development"
$Port = 5432

if ([string]::IsNullOrWhiteSpace($MigrationFile)) {
    if ($Rollback) {
        $MigrationFile = "migrations/20250122_0006_ai_analogy_generation_rollback.sql"
        Write-Host "⚠️  ROLLBACK MODE - This will remove the AI analogy tables!" -ForegroundColor Yellow
    } else {
        $MigrationFile = "migrations/20250122_0006_ai_analogy_generation.sql"
        Write-Host "✅ MIGRATION MODE - This will create AI analogy tables" -ForegroundColor Green
    }
} else {
    # Check if it's a rollback file
    if ($MigrationFile -like "*rollback*") {
        Write-Host "⚠️  ROLLBACK MODE - This will revert database changes!" -ForegroundColor Yellow
    } else {
        Write-Host "✅ MIGRATION MODE - This will apply database changes" -ForegroundColor Green
    }
}

Write-Host ""

# Read migration file content
$MigrationPath = $MigrationFile
if (-not (Test-Path $MigrationPath)) {
    Write-Host "❌ Migration file not found: $MigrationPath" -ForegroundColor Red
    exit 1
}

$MigrationSQL = Get-Content $MigrationPath -Raw

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
    exit 1
}

Write-Host ""

# Retrieve database credentials
Write-Host "🔐 Retrieving database credentials..." -ForegroundColor Cyan
try {
    $secretJson = aws secretsmanager get-secret-value `
        --secret-id $SecretName `
        --region $Region `
        --query SecretString `
        --output text 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to retrieve secret" -ForegroundColor Red
        exit 1
    }
    
    $secret = $secretJson | ConvertFrom-Json
    $DbUsername = $secret.username
    $DbPassword = $secret.password
    
    Write-Host "   ✅ Credentials retrieved successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error retrieving credentials: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create temporary SQL script with embedded credentials
$TempSQL = @"
-- Temporary migration script with connection
\set ON_ERROR_STOP on

-- Migration content
$MigrationSQL
"@

# Encode SQL for command
$EncodedSQL = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($TempSQL))

# Create SSM command as array of lines
$CommandLines = @(
    "#!/bin/bash",
    "set -e",
    "",
    "# Decode SQL",
    "echo '$EncodedSQL' | base64 -d > /tmp/migration.sql",
    "",
    "# Install psql if not present",
    "if ! command -v psql &> /dev/null; then",
    "    echo 'Installing PostgreSQL client...'",
    "    yum install -y postgresql15",
    "fi",
    "",
    "# Run migration",
    "export PGPASSWORD='$DbPassword'",
    "psql -h $RdsEndpoint -p $Port -U $DbUsername -d $DatabaseName -f /tmp/migration.sql",
    "",
    "# Cleanup",
    "rm -f /tmp/migration.sql",
    "unset PGPASSWORD",
    "",
    "echo 'Migration completed successfully'"
)

Write-Host "📝 Migration approach:" -ForegroundColor Cyan
Write-Host "   Using AWS Systems Manager Run Command" -ForegroundColor White
Write-Host "   This will execute the migration from within AWS" -ForegroundColor White
Write-Host ""

# Confirm
$confirmation = Read-Host "Do you want to proceed? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Executing migration via SSM..." -ForegroundColor Cyan
Write-Host ""

# Find an EC2 instance to run the command on
Write-Host "🔍 Finding EC2 instance..." -ForegroundColor Cyan
$instances = aws ec2 describe-instances `
    --region $Region `
    --filters "Name=tag:Environment,Values=$Environment" "Name=instance-state-name,Values=running" `
    --query "Reservations[0].Instances[0].InstanceId" `
    --output text 2>&1

if ($LASTEXITCODE -ne 0 -or $instances -eq "None" -or [string]::IsNullOrWhiteSpace($instances)) {
    Write-Host "   ⚠️  No running EC2 instances found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Alternative: Use RDS Query Editor" -ForegroundColor Cyan
    Write-Host "   1. Go to AWS Console > RDS > Query Editor" -ForegroundColor White
    Write-Host "   2. Connect to: $RdsEndpoint" -ForegroundColor White
    Write-Host "   3. Database: $DatabaseName" -ForegroundColor White
    Write-Host "   4. Copy and paste the SQL from: $MigrationPath" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or create a temporary EC2 instance in the same VPC" -ForegroundColor White
    exit 1
}

Write-Host "   ✅ Found instance: $instances" -ForegroundColor Green
Write-Host ""

# Execute via SSM
Write-Host "📤 Sending command to instance..." -ForegroundColor Cyan
try {
    # Convert command lines to JSON array
    $CommandJson = $CommandLines | ConvertTo-Json -Compress
    
    $commandId = aws ssm send-command `
        --region $Region `
        --instance-ids $instances `
        --document-name "AWS-RunShellScript" `
        --parameters "commands=$CommandJson" `
        --query "Command.CommandId" `
        --output text 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to send command" -ForegroundColor Red
        Write-Host $commandId
        exit 1
    }
    
    Write-Host "   ✅ Command sent: $commandId" -ForegroundColor Green
    Write-Host ""
    
    # Wait for command to complete
    Write-Host "⏳ Waiting for command to complete..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    $status = "InProgress"
    $attempts = 0
    $maxAttempts = 30
    
    while ($status -eq "InProgress" -and $attempts -lt $maxAttempts) {
        $commandStatus = aws ssm get-command-invocation `
            --region $Region `
            --command-id $commandId `
            --instance-id $instances `
            --query "Status" `
            --output text 2>&1
        
        $status = $commandStatus
        Write-Host "   Status: $status" -ForegroundColor Gray
        
        if ($status -eq "InProgress") {
            Start-Sleep -Seconds 2
            $attempts++
        }
    }
    
    # Get command output
    $output = aws ssm get-command-invocation `
        --region $Region `
        --command-id $commandId `
        --instance-id $instances `
        --query "StandardOutputContent" `
        --output text 2>&1
    
    $errorOutput = aws ssm get-command-invocation `
        --region $Region `
        --command-id $commandId `
        --instance-id $instances `
        --query "StandardErrorContent" `
        --output text 2>&1
    
    Write-Host ""
    if ($status -eq "Success") {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Output:" -ForegroundColor Cyan
        Write-Host $output -ForegroundColor Gray
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error output:" -ForegroundColor Red
        Write-Host $errorOutput -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error executing command: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Database migration complete!" -ForegroundColor Green
Write-Host ""
