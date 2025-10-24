# Quick script to update user's name in Cognito
# Usage: .\update-user-name.ps1 -Email "your@email.com" -Name "Your Name"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Name
)

$UserPoolId = "eu-west-1_PV9hUfWHM"
$Region = "eu-west-1"

Write-Host "🔍 Finding user with email: $Email" -ForegroundColor Cyan

# Find the user by email
$users = aws cognito-idp list-users `
    --user-pool-id $UserPoolId `
    --region $Region `
    --filter "email = `"$Email`"" `
    --query 'Users[0].Username' `
    --output text 2>&1

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($users)) {
    Write-Host "❌ User not found with email: $Email" -ForegroundColor Red
    exit 1
}

$Username = $users.Trim()
Write-Host "✅ Found user: $Username" -ForegroundColor Green

Write-Host "📝 Updating name to: $Name" -ForegroundColor Cyan

# Update the name attribute
aws cognito-idp admin-update-user-attributes `
    --user-pool-id $UserPoolId `
    --username $Username `
    --user-attributes Name=name,Value="$Name" `
    --region $Region 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully updated user's name!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Please refresh your browser to see the changes" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to update user's name" -ForegroundColor Red
    exit 1
}
