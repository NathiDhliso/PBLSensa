#!/usr/bin/env pwsh
# Restart Backend Server Script

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔄 RESTARTING BACKEND SERVER" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Kill processes on port 8000
Write-Host "Step 1: Killing processes on port 8000..." -ForegroundColor Yellow

$connections = netstat -ano | Select-String ":8000"

if ($connections) {
    Write-Host "Found processes:" -ForegroundColor Gray
    $connections | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    
    $pids = $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') { $matches[1] }
    } | Select-Object -Unique
    
    foreach ($processId in $pids) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "  ✅ Killed process $processId" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Could not kill process $processId (may already be stopped)" -ForegroundColor Yellow
        }
    }
    
    Start-Sleep -Seconds 2
} else {
    Write-Host "  ✅ No processes found on port 8000" -ForegroundColor Green
}

# Step 2: Start the backend server
Write-Host "`nStep 2: Starting backend server..." -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Python is available
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "🚀 Starting server with: python backend/main.py`n" -ForegroundColor Green
    python backend/main.py
} else {
    Write-Host "❌ Python not found in PATH" -ForegroundColor Red
    Write-Host "Please ensure Python is installed and in your PATH" -ForegroundColor Yellow
    exit 1
}
