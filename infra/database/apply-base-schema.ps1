#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Apply base schema directly to RDS via bastion
.DESCRIPTION
    Applies the base schema.sql file to create core tables
#>

param(
    [string]$Environment = "development",
    [string]$DeveloperId = "dev",
    [string]$Region = "eu-west-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🗄️  Applying Base Schema" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$schemaFile = Join-Path $scriptDir "schema.sql"

if (-not (Test-Path $schemaFile)) {
    Write-Host "❌ Schema file not found: $schemaFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Schema file: $schemaFile" -ForegroundColor Gray
Write-Host ""

# Call the SSM migration script
$ssmScript = Join-Path $scriptDir "apply-migration-ssm.ps1"

Write-Host "Applying base schema via SSM..." -ForegroundColor Cyan
& $ssmScript `
    -MigrationFile $schemaFile `
    -Environment $Environment `
    -DeveloperId $DeveloperId `
    -Region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Base schema applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Core tables created:" -ForegroundColor Cyan
    Write-Host "  • users" -ForegroundColor White
    Write-Host "  • courses" -ForegroundColor White
    Write-Host "  • processed_documents" -ForegroundColor White
    Write-Host "  • course_documents" -ForegroundColor White
    Write-Host "  • document_chunks" -ForegroundColor White
    Write-Host "  • concepts" -ForegroundColor White
    Write-Host "  • relationships" -ForegroundColor White
    Write-Host "  • chapters" -ForegroundColor White
    Write-Host "  • user_progress" -ForegroundColor White
    Write-Host "  • badges" -ForegroundColor White
    Write-Host "  • streaks" -ForegroundColor White
    Write-Host ""
    Write-Host "Next: Run .\apply-all-migrations.ps1 to add feature tables" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Failed to apply base schema" -ForegroundColor Red
    exit 1
}
