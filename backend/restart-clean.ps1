# Kill any Python processes on port 8000
$processes = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($processId in $processes) {
    Write-Host "Killing process $processId on port 8000..."
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

# Start the backend
Write-Host "Starting backend..."
python main.py
