#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Terminate the temporary bastion host
#>

param(
    [string]$Region = "eu-west-1",
    [string]$InstanceId = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🗑️  Terminating Bastion Host" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Get instance ID from file if not provided
if ([string]::IsNullOrWhiteSpace($InstanceId)) {
    if (Test-Path ".bastion-instance-id") {
        $InstanceId = Get-Content ".bastion-instance-id"
        Write-Host "📋 Found instance ID: $InstanceId" -ForegroundColor Cyan
    } else {
        Write-Host "❌ No instance ID provided and .bastion-instance-id file not found" -ForegroundColor Red
        Write-Host "   Usage: .\terminate-bastion-host.ps1 -InstanceId <instance-id>" -ForegroundColor Yellow
        exit 1
    }
}

# Confirm
Write-Host "⚠️  About to terminate instance: $InstanceId" -ForegroundColor Yellow
$confirmation = Read-Host "Continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🗑️  Terminating instance..." -ForegroundColor Cyan

aws ec2 terminate-instances `
    --region $Region `
    --instance-ids $InstanceId | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to terminate instance" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Instance termination initiated" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Bastion host terminated!" -ForegroundColor Green
Write-Host ""

# Clean up file
if (Test-Path ".bastion-instance-id") {
    Remove-Item ".bastion-instance-id"
}
