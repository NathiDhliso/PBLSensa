#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Create a temporary bastion host for database access
.DESCRIPTION
    Creates a small EC2 instance in the same VPC as RDS to run migrations
#>

param(
    [string]$Environment = "development",
    [string]$DeveloperId = "dev",
    [string]$Region = "eu-west-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Creating Bastion Host for Database Access" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get VPC ID
Write-Host "🔍 Finding VPC..." -ForegroundColor Cyan
$vpcId = aws ec2 describe-vpcs `
    --region $Region `
    --filters "Name=tag:Environment,Values=$Environment" `
    --query "Vpcs[0].VpcId" `
    --output text

if ([string]::IsNullOrWhiteSpace($vpcId) -or $vpcId -eq "None") {
    Write-Host "❌ VPC not found" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ VPC: $vpcId" -ForegroundColor Green

# Get public subnet
Write-Host "🔍 Finding public subnet..." -ForegroundColor Cyan
$subnetId = aws ec2 describe-subnets `
    --region $Region `
    --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=*public*" `
    --query "Subnets[0].SubnetId" `
    --output text

if ([string]::IsNullOrWhiteSpace($subnetId) -or $subnetId -eq "None") {
    Write-Host "❌ Public subnet not found" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Subnet: $subnetId" -ForegroundColor Green

# Get or create security group
Write-Host "🔍 Finding/creating security group..." -ForegroundColor Cyan
$sgId = aws ec2 describe-security-groups `
    --region $Region `
    --filters "Name=vpc-id,Values=$vpcId" "Name=group-name,Values=bastion-sg" `
    --query "SecurityGroups[0].GroupId" `
    --output text

if ([string]::IsNullOrWhiteSpace($sgId) -or $sgId -eq "None") {
    Write-Host "   Creating new security group..." -ForegroundColor Yellow
    $sgId = aws ec2 create-security-group `
        --region $Region `
        --group-name "bastion-sg" `
        --description "Temporary bastion host security group" `
        --vpc-id $vpcId `
        --query "GroupId" `
        --output text
    
    # Allow SSM access (no inbound SSH needed)
    Write-Host "   Configuring security group..." -ForegroundColor Yellow
}

Write-Host "   ✅ Security Group: $sgId" -ForegroundColor Green

# Get latest Amazon Linux 2023 AMI
Write-Host "🔍 Finding latest Amazon Linux AMI..." -ForegroundColor Cyan
$amiId = aws ec2 describe-images `
    --region $Region `
    --owners amazon `
    --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" `
    --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" `
    --output text

Write-Host "   ✅ AMI: $amiId" -ForegroundColor Green

# Create IAM role for SSM if it doesn't exist
Write-Host "🔍 Checking IAM role for SSM..." -ForegroundColor Cyan
$roleName = "BastionSSMRole"
$roleExists = aws iam get-role --role-name $roleName 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "   Creating IAM role..." -ForegroundColor Yellow
    
    $trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@
    
    aws iam create-role `
        --role-name $roleName `
        --assume-role-policy-document $trustPolicy | Out-Null
    
    aws iam attach-role-policy `
        --role-name $roleName `
        --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" | Out-Null
    
    # Create instance profile
    aws iam create-instance-profile --instance-profile-name $roleName | Out-Null
    aws iam add-role-to-instance-profile --instance-profile-name $roleName --role-name $roleName | Out-Null
    
    Write-Host "   Waiting for IAM role to propagate..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host "   ✅ IAM Role: $roleName" -ForegroundColor Green

# Launch EC2 instance
Write-Host ""
Write-Host "🚀 Launching bastion host..." -ForegroundColor Cyan
$instanceId = aws ec2 run-instances `
    --region $Region `
    --image-id $amiId `
    --instance-type t3.micro `
    --subnet-id $subnetId `
    --security-group-ids $sgId `
    --iam-instance-profile "Name=$roleName" `
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=pbl-bastion-temp},{Key=Environment,Value=$Environment},{Key=Purpose,Value=database-migration}]" `
    --query "Instances[0].InstanceId" `
    --output text

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to launch instance" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Instance launched: $instanceId" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Waiting for instance to be ready..." -ForegroundColor Cyan

# Wait for instance to be running
aws ec2 wait instance-running --region $Region --instance-ids $instanceId

Write-Host "   ✅ Instance is running" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Waiting for SSM agent to be ready (this may take 2-3 minutes)..." -ForegroundColor Cyan

$attempts = 0
$maxAttempts = 30
$ready = $false

while ($attempts -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 10
    $attempts++
    
    $status = aws ssm describe-instance-information `
        --region $Region `
        --filters "Key=InstanceIds,Values=$instanceId" `
        --query "InstanceInformationList[0].PingStatus" `
        --output text 2>&1
    
    if ($status -eq "Online") {
        $ready = $true
    } else {
        Write-Host "   Attempt $attempts/$maxAttempts - Status: $status" -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "❌ Instance did not become ready in time" -ForegroundColor Red
    Write-Host "   You can check status later with: aws ssm describe-instance-information --region $Region --instance-ids $instanceId" -ForegroundColor Yellow
    exit 1
}

Write-Host "   ✅ SSM agent is ready" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Bastion host created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Instance Details:" -ForegroundColor Cyan
Write-Host "   Instance ID: $instanceId" -ForegroundColor White
Write-Host "   Region: $Region" -ForegroundColor White
Write-Host "   Type: t3.micro (~$0.01/hour)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run the migration script:" -ForegroundColor White
Write-Host "      .\infra\database\apply-migration-ssm.ps1 -MigrationFile 'infra/database/migrations/20250124_0002_layer0_tables.sql'" -ForegroundColor Yellow
Write-Host ""
Write-Host "   2. When done, terminate the instance:" -ForegroundColor White
Write-Host "      .\infra\scripts\terminate-bastion-host.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 The bastion host costs ~$0.01/hour. Don't forget to terminate it when done!" -ForegroundColor Yellow
Write-Host ""

# Save instance ID for cleanup
$instanceId | Out-File -FilePath ".bastion-instance-id" -NoNewline
