#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Apply all database migrations in order
.DESCRIPTION
    Applies all pending migrations to set up the complete database schema
#>

param(
    [string]$Environment = "development",
    [string]$DeveloperId = "dev",
    [string]$Region = "eu-west-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🗄️  Applying All Database Migrations" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# List of migrations in order
$migrations = @(
    @{
        File = "infra/database/migrations/20250122_0006_ai_analogy_generation.sql"
        Name = "AI Analogy Generation"
        Description = "Creates tables for AI-powered analogies, memory techniques, and learning mantras"
    },
    @{
        File = "infra/database/migrations/20250123_0001_two_view_integration.sql"
        Name = "Two-View Integration (Sensa Learn)"
        Description = "Creates tables for Sensa Learn portal with user profiles and questions"
    },
    @{
        File = "infra/database/migrations/20250124_0001_pbl_view_tables.sql"
        Name = "PBL View Tables"
        Description = "Creates tables for Problem-Based Learning portal with concepts and relationships"
    },
    @{
        File = "infra/database/migrations/20250124_0002_layer0_tables.sql"
        Name = "Layer 0 Optimization"
        Description = "Creates tables for PDF caching, cost tracking, and performance monitoring"
    }
)

Write-Host "📋 Migrations to Apply:" -ForegroundColor Cyan
for ($i = 0; $i -lt $migrations.Count; $i++) {
    $num = $i + 1
    Write-Host "   $num. $($migrations[$i].Name)" -ForegroundColor White
    Write-Host "      $($migrations[$i].Description)" -ForegroundColor Gray
}
Write-Host ""

# Confirm
Write-Host "⚠️  This will apply $($migrations.Count) migrations to your database" -ForegroundColor Yellow
$confirmation = Read-Host "Continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Apply each migration
$successCount = 0
$failedMigrations = @()

foreach ($migration in $migrations) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📦 Applying: $($migration.Name)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        # Run migration
        & ".\infra\database\apply-migration-ssm.ps1" `
            -MigrationFile $migration.File `
            -Environment $Environment `
            -DeveloperId $DeveloperId `
            -Region $Region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ $($migration.Name) - SUCCESS" -ForegroundColor Green
            Write-Host ""
            $successCount++
        } else {
            throw "Migration failed with exit code $LASTEXITCODE"
        }
        
    } catch {
        Write-Host ""
        Write-Host "❌ $($migration.Name) - FAILED" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        Write-Host ""
        $failedMigrations += $migration.Name
        
        # Ask if should continue
        $continue = Read-Host "Continue with remaining migrations? (yes/no)"
        if ($continue -ne "yes") {
            break
        }
    }
    
    # Small delay between migrations
    Start-Sleep -Seconds 2
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Migration Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Migrations: $($migrations.Count)" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $($failedMigrations.Count)" -ForegroundColor $(if ($failedMigrations.Count -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($failedMigrations.Count -gt 0) {
    Write-Host "❌ Failed Migrations:" -ForegroundColor Red
    foreach ($failed in $failedMigrations) {
        Write-Host "   - $failed" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}

Write-Host "✅ All migrations applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify tables: .\infra\database\check-migrations.ps1" -ForegroundColor White
Write-Host "   2. Start your backend: .\backend\start-backend.ps1" -ForegroundColor White
Write-Host "   3. Test PDF upload and processing" -ForegroundColor White
Write-Host ""
