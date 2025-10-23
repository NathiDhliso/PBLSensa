# Kill any process using port 8000
Write-Host "Finding processes using port 8000..." -ForegroundColor Yellow

$connections = netstat -ano | Select-String ":8000"

if ($connections) {
    Write-Host "Found processes on port 8000:" -ForegroundColor Cyan
    $connections | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    
    # Extract PIDs
    $pids = $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $matches[1]
        }
    } | Select-Object -Unique
    
    foreach ($processId in $pids) {
        Write-Host "`nKilling process $processId..." -ForegroundColor Red
        try {
            Stop-Process -Id $processId -Force
            Write-Host "✅ Process $processId killed" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to kill process ${processId}: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No processes found on port 8000" -ForegroundColor Green
}

Write-Host "`nYou can now start the backend server:" -ForegroundColor Yellow
Write-Host "  python backend/main.py" -ForegroundColor Cyan
