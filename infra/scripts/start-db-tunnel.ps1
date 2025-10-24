#!/usr/bin/env pwsh
# Start Database Tunnel via SSM
# This creates a local port forward to RDS through the bastion host

Write-Host "🔌 Starting Database Tunnel via SSM" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$REGION = "eu-west-1"
$LOCAL_PORT = 5432
$REMOTE_PORT = 5432

# Get RDS endpoint
Write-Host "🔍 Getting RDS endpoint..." -ForegroundColor Yellow
$RDS_ENDPOINT = "pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com"
Write-Host "   ✅ RDS: $RDS_ENDPOINT" -ForegroundColor Green

# Find bastion instance (try multiple tag patterns)
Write-Host "🔍 Finding bastion instance..." -ForegroundColor Yellow
$BASTION_ID = (aws ec2 describe-instances `
    --region $REGION `
    --filters "Name=tag:Purpose,Values=database-migration" "Name=instance-state-name,Values=running" `
    --query 'Reservations[0].Instances[0].InstanceId' `
    --output text 2>$null)

if (-not $BASTION_ID -or $BASTION_ID -eq "None") {
    # Try by name tag
    $BASTION_ID = (aws ec2 describe-instances `
        --region $REGION `
        --filters "Name=tag:Name,Values=pbl-bastion-temp,pbl-development-bastion" "Name=instance-state-name,Values=running" `
        --query 'Reservations[0].Instances[0].InstanceId' `
        --output text 2>$null)
}

if (-not $BASTION_ID -or $BASTION_ID -eq "None") {
    # Try finding by security group name
    $BASTION_ID = (aws ec2 describe-instances `
        --region $REGION `
        --filters "Name=instance.group-name,Values=pbl-development-bastion-sg" "Name=instance-state-name,Values=running" `
        --query 'Reservations[0].Instances[0].InstanceId' `
        --output text 2>$null)
}

if (-not $BASTION_ID -or $BASTION_ID -eq "None") {
    Write-Host "   ❌ No running bastion instance found" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Start the bastion first:" -ForegroundColor Yellow
    Write-Host "   .\infra\scripts\create-bastion-host.ps1" -ForegroundColor White
    exit 1
}

Write-Host "   ✅ Bastion: $BASTION_ID" -ForegroundColor Green

# Check if port is already in use
Write-Host "🔍 Checking if port $LOCAL_PORT is available..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort $LOCAL_PORT -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "   ⚠️  Port $LOCAL_PORT is already in use - auto-killing process" -ForegroundColor Yellow
    $portInUse | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Port cleared" -ForegroundColor Green
} else {
    Write-Host "   ✅ Port $LOCAL_PORT is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting SSM port forwarding..." -ForegroundColor Cyan
Write-Host "   Local: localhost:$LOCAL_PORT" -ForegroundColor White
Write-Host "   Remote: $RDS_ENDPOINT`:$REMOTE_PORT" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Keep this window open while using the database" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

# Start the tunnel
aws ssm start-session `
    --region $REGION `
    --target $BASTION_ID `
    --document-name AWS-StartPortForwardingSessionToRemoteHost `
    --parameters "{`"host`":[`"$RDS_ENDPOINT`"],`"portNumber`":[`"$REMOTE_PORT`"],`"localPortNumber`":[`"$LOCAL_PORT`"]}"
