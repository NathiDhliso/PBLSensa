#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Allow bastion host to access RDS database
.DESCRIPTION
    Adds the bastion security group to the RDS security group ingress rules
#>

param(
    [string]$Environment = "development",
    [string]$Region = "eu-west-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🔐 Configuring RDS Access for Bastion Host" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Get bastion instance ID
if (Test-Path ".bastion-instance-id") {
    $instanceId = Get-Content ".bastion-instance-id"
    Write-Host "📋 Bastion Instance: $instanceId" -ForegroundColor Cyan
} else {
    Write-Host "❌ No bastion instance found. Run create-bastion-host.ps1 first" -ForegroundColor Red
    exit 1
}

# Get bastion security group
Write-Host "🔍 Finding bastion security group..." -ForegroundColor Cyan
$bastionSgId = aws ec2 describe-instances `
    --region $Region `
    --instance-ids $instanceId `
    --query "Reservations[0].Instances[0].SecurityGroups[0].GroupId" `
    --output text

if ([string]::IsNullOrWhiteSpace($bastionSgId) -or $bastionSgId -eq "None") {
    Write-Host "❌ Could not find bastion security group" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Bastion SG: $bastionSgId" -ForegroundColor Green

# Get RDS security group
Write-Host "🔍 Finding RDS security group..." -ForegroundColor Cyan
$rdsSecurityGroups = aws rds describe-db-instances `
    --region $Region `
    --db-instance-identifier "pbl-development-dev-db" `
    --query "DBInstances[0].VpcSecurityGroups[*].VpcSecurityGroupId" `
    --output text

if ([string]::IsNullOrWhiteSpace($rdsSecurityGroups) -or $rdsSecurityGroups -eq "None") {
    Write-Host "❌ Could not find RDS security groups" -ForegroundColor Red
    exit 1
}

$rdsSgId = $rdsSecurityGroups.Split()[0]
Write-Host "   ✅ RDS SG: $rdsSgId" -ForegroundColor Green

# Check if rule already exists
Write-Host ""
Write-Host "🔍 Checking existing rules..." -ForegroundColor Cyan
$existingRules = aws ec2 describe-security-group-rules `
    --region $Region `
    --filters "Name=group-id,Values=$rdsSgId" `
    --query "SecurityGroupRules[?ReferencedGroupInfo.GroupId=='$bastionSgId' && FromPort==``5432``].SecurityGroupRuleId" `
    --output text

if (-not [string]::IsNullOrWhiteSpace($existingRules) -and $existingRules -ne "None") {
    Write-Host "   ✅ Rule already exists - bastion can access RDS" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Configuration complete!" -ForegroundColor Green
    exit 0
}

# Add ingress rule
Write-Host "   Adding ingress rule..." -ForegroundColor Yellow
Write-Host ""

try {
    aws ec2 authorize-security-group-ingress `
        --region $Region `
        --group-id $rdsSgId `
        --protocol tcp `
        --port 5432 `
        --source-group $bastionSgId | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add security group rule" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Security group rule added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Configuration:" -ForegroundColor Cyan
    Write-Host "   RDS Security Group: $rdsSgId" -ForegroundColor White
    Write-Host "   Bastion Security Group: $bastionSgId" -ForegroundColor White
    Write-Host "   Port: 5432 (PostgreSQL)" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Bastion can now access RDS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next: Run the migration script" -ForegroundColor Cyan
    Write-Host "   .\infra\database\apply-migration-ssm.ps1 -MigrationFile 'infra/database/migrations/20250124_0002_layer0_tables.sql'" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
