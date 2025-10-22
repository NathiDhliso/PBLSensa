# PowerShell script to start the backend server
# Run this from the backend directory or anywhere in the project

Write-Host "🚀 Starting PBL Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11 or higher." -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check and install required dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
try {
    python -c "import flask, flask_cors" 2>$null
    Write-Host "✅ All dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "� Installing flask and flask-cors..." -ForegroundColor Yellow
    pip install flask flask-cors --quiet
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Starting server on http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python app.py
