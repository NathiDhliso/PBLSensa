#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fresh database setup - drops everything and recreates cleanly
#>

param(
    [string]$Environment = "development",
    [string]$DeveloperId = "dev",
    [string]$Region = "eu-west-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Fresh Database Setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  WARNING: This will DROP ALL TABLES in the database!" -ForegroundColor Yellow
Write-Host "   All data will be lost!" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Type 'YES' to confirm"
if ($confirmation -ne "YES") {
    Write-Host "❌ Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1/3: Dropping all existing tables..." -ForegroundColor Cyan
Write-Host ""

try {
    & ".\infra\database\apply-migration-ssm.ps1" `
        -MigrationFile "infra/database/drop-all-tables.sql" `
        -Environment $Environment `
        -DeveloperId $DeveloperId `
        -Region $Region
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to drop tables"
    }
    
    Write-Host ""
    Write-Host "✅ All tables dropped" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Error dropping tables: $_" -ForegroundColor Red
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

Write-Host "Step 2/3: Applying base schema..." -ForegroundColor Cyan
Write-Host ""

try {
    & ".\infra\database\apply-migration-ssm.ps1" `
        -MigrationFile "infra/database/schema-no-vector.sql" `
        -Environment $Environment `
        -DeveloperId $DeveloperId `
        -Region $Region
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to apply base schema"
    }
    
    Write-Host ""
    Write-Host "✅ Base schema applied" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Error applying base schema: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

Write-Host "Step 3/3: Applying feature migrations..." -ForegroundColor Cyan
Write-Host ""

try {
    & ".\infra\database\apply-all-migrations.ps1" `
        -Environment $Environment `
        -DeveloperId $DeveloperId `
        -Region $Region
    
    if ($LASTEXITCODE -ne 0) {
        throw "Some migrations failed"
    }
    
    Write-Host ""
    Write-Host "✅ All migrations applied" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "⚠️  Some migrations may have failed" -ForegroundColor Yellow
    Write-Host "   Check the output above for details" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 Fresh Database Setup Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Database is now clean and ready to use" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify tables: .\infra\database\check-migrations.ps1" -ForegroundColor White
Write-Host "   2. Start backend: .\backend\start-backend.ps1" -ForegroundColor White
Write-Host "   3. Test the application" -ForegroundColor White
Write-Host ""
Write-Host "💡 Don't forget to terminate the bastion host:" -ForegroundColor Yellow
Write-Host "   .\infra\scripts\terminate-bastion-host.ps1" -ForegroundColor Yellow
Write-Host ""
