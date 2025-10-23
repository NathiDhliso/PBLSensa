#!/usr/bin/env pwsh
# Restart Backend Script
# This script stops any running backend process and starts a new one

Write-Host "🔄 Restarting PBL Backend..." -ForegroundColor Cyan

# Kill any existing Python processes running main.py
Write-Host "Stopping existing backend processes..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*main.py*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 1

# Start the backend
Write-Host "Starting backend server..." -ForegroundColor Green
Set-Location $PSScriptRoot
python main.py
