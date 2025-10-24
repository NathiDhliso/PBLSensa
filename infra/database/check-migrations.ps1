#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check which migrations have been applied to the database
#>

param(
    [string]$Environment = "development",
    [string]$DeveloperId = "dev",
    [string]$Region = "eu-west-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Checking Database Migration Status" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Get bastion instance
if (-not (Test-Path ".bastion-instance-id")) {
    Write-Host "❌ No bastion instance found. Run create-bastion-host.ps1 first" -ForegroundColor Red
    exit 1
}

$instanceId = Get-Content ".bastion-instance-id"
Write-Host "📋 Using bastion: $instanceId" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SecretName = "pbl/$Environment/$DeveloperId/db-credentials"
$RdsEndpoint = "pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com"
$DatabaseName = "pbl_development"
$Port = 5432

# Retrieve credentials
Write-Host "🔐 Retrieving credentials..." -ForegroundColor Cyan
$secretJson = aws secretsmanager get-secret-value `
    --secret-id $SecretName `
    --region $Region `
    --query SecretString `
    --output text

$secret = $secretJson | ConvertFrom-Json
$DbUsername = $secret.username
$DbPassword = $secret.password

# Read check query
$CheckQuery = Get-Content "infra/database/check-migrations.sql" -Raw
$EncodedQuery = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($CheckQuery))

# Create command
$CommandLines = @(
    "#!/bin/bash",
    "set -e",
    "",
    "# Decode query",
    "echo '$EncodedQuery' | base64 -d > /tmp/check.sql",
    "",
    "# Run query",
    "export PGPASSWORD='$DbPassword'",
    "psql -h $RdsEndpoint -p $Port -U $DbUsername -d $DatabaseName -f /tmp/check.sql",
    "",
    "# Cleanup",
    "rm -f /tmp/check.sql",
    "unset PGPASSWORD"
)

Write-Host "📤 Sending command..." -ForegroundColor Cyan
$CommandJson = $CommandLines | ConvertTo-Json -Compress

$commandId = aws ssm send-command `
    --region $Region `
    --instance-ids $instanceId `
    --document-name "AWS-RunShellScript" `
    --parameters "commands=$CommandJson" `
    --query "Command.CommandId" `
    --output text

Write-Host "   Command ID: $commandId" -ForegroundColor Gray
Write-Host ""
Write-Host "⏳ Waiting for results..." -ForegroundColor Cyan

Start-Sleep -Seconds 3

$attempts = 0
$maxAttempts = 20
$status = "InProgress"

while ($status -eq "InProgress" -and $attempts -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempts++
    
    $status = aws ssm get-command-invocation `
        --region $Region `
        --command-id $commandId `
        --instance-id $instanceId `
        --query "Status" `
        --output text
}

# Get output
$output = aws ssm get-command-invocation `
    --region $Region `
    --command-id $commandId `
    --instance-id $instanceId `
    --query "StandardOutputContent" `
    --output text

Write-Host ""
Write-Host "📊 Database Status:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host $output
Write-Host ""
