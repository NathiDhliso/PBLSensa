# Configure AWS Amplify Environment Variables
# This script helps set up environment variables for your Amplify deployment

Write-Host "`n🚀 AWS Amplify Environment Configuration`n" -ForegroundColor Cyan

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Region - Amplify is typically in us-east-1
Write-Host "Which AWS region is your Amplify app in?" -ForegroundColor Yellow
Write-Host "  1. us-east-1 (N. Virginia) - Most common" -ForegroundColor Cyan
Write-Host "  2. eu-west-1 (Ireland)" -ForegroundColor Cyan
Write-Host "  3. Other" -ForegroundColor Cyan
$regionChoice = Read-Host "Enter choice (1-3, or press Enter for us-east-1)"

switch ($regionChoice) {
    "2" { $region = "eu-west-1" }
    "3" { 
        $region = Read-Host "Enter AWS region (e.g., us-east-1)"
    }
    default { $region = "us-east-1" }
}

Write-Host "Using region: $region" -ForegroundColor Green

Write-Host "`n📋 Step 1: Finding your Amplify App..." -ForegroundColor Yellow
Write-Host "Running: aws amplify list-apps --region $region`n" -ForegroundColor Gray

try {
    $apps = aws amplify list-apps --region $region --output json | ConvertFrom-Json
    
    if ($apps.apps.Count -eq 0) {
        Write-Host "❌ No Amplify apps found in region $region" -ForegroundColor Red
        Write-Host "Please create an Amplify app first through the console." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Found $($apps.apps.Count) Amplify app(s):" -ForegroundColor Green
    $apps.apps | ForEach-Object { 
        Write-Host "  • $($_.name) (ID: $($_.appId))" -ForegroundColor Cyan 
    }
    
    # If only one app, use it automatically
    if ($apps.apps.Count -eq 1) {
        $appId = $apps.apps[0].appId
        $appName = $apps.apps[0].name
        Write-Host "`n✓ Using app: $appName" -ForegroundColor Green
    } else {
        # Let user choose
        Write-Host "`nEnter the App ID you want to configure:" -ForegroundColor Yellow
        $appId = Read-Host "App ID"
        $appName = ($apps.apps | Where-Object { $_.appId -eq $appId }).name
    }
    
} catch {
    Write-Host "❌ Error listing Amplify apps: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Step 2: Reading environment configuration..." -ForegroundColor Yellow

# Read from infrastructure outputs
$infraOutputsPath = Join-Path $PSScriptRoot "infra\infrastructure-outputs.json"
if (Test-Path $infraOutputsPath) {
    $infra = Get-Content $infraOutputsPath | ConvertFrom-Json
    Write-Host "✓ Loaded infrastructure configuration" -ForegroundColor Green
    
    # Extract values
    $apiBaseUrl = $infra.api.baseUrl
    $awsRegion = $infra.cognito.region
    $userPoolId = $infra.cognito.userPoolId
    $clientId = $infra.cognito.clientId
    
    Write-Host "`nConfiguration to apply:" -ForegroundColor Cyan
    Write-Host "  API Base URL: $apiBaseUrl" -ForegroundColor White
    Write-Host "  AWS Region: $awsRegion" -ForegroundColor White
    Write-Host "  User Pool ID: $userPoolId" -ForegroundColor White
    Write-Host "  Client ID: $clientId" -ForegroundColor White
    
} else {
    Write-Host "⚠ infrastructure-outputs.json not found" -ForegroundColor Yellow
    Write-Host "Please enter values manually:" -ForegroundColor Yellow
    
    $apiBaseUrl = Read-Host "API Base URL"
    $awsRegion = Read-Host "AWS Region"
    $userPoolId = Read-Host "Cognito User Pool ID"
    $clientId = Read-Host "Cognito Client ID"
}

Write-Host "`n🔧 Step 3: Applying environment variables to Amplify..." -ForegroundColor Yellow

# Prepare environment variables JSON
$envVars = @{
    VITE_API_BASE_URL = $apiBaseUrl
    VITE_API_TIMEOUT = "30000"
    VITE_AWS_REGION = $awsRegion
    VITE_COGNITO_USER_POOL_ID = $userPoolId
    VITE_COGNITO_CLIENT_ID = $clientId
    VITE_ENABLE_MOCK_API = "false"
    VITE_ENABLE_API_LOGGING = "false"
    VITE_ENABLE_MOCK_AUTH = "false"
}

# Convert to JSON string for AWS CLI
$envVarsJson = $envVars | ConvertTo-Json -Compress

Write-Host "Updating Amplify app environment variables..." -ForegroundColor Gray

try {
    # Update app with environment variables
    $result = aws amplify update-app `
        --app-id $appId `
        --environment-variables ($envVars | ConvertTo-Json -Compress) `
        --region $region `
        --output json
    
    Write-Host "✓ Environment variables updated successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error updating environment variables: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nYou can set them manually in the Amplify Console:" -ForegroundColor Yellow
    Write-Host "https://console.aws.amazon.com/amplify/home?region=$region#/$appId" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n🔄 Step 4: Triggering new deployment..." -ForegroundColor Yellow

try {
    # Get the main branch
    $branches = aws amplify list-branches --app-id $appId --region $region --output json | ConvertFrom-Json
    $mainBranch = $branches.branches | Where-Object { $_.branchName -eq "main" -or $_.branchName -eq "master" } | Select-Object -First 1
    
    if ($mainBranch) {
        Write-Host "Starting new build for branch: $($mainBranch.branchName)" -ForegroundColor Gray
        
        $job = aws amplify start-job `
            --app-id $appId `
            --branch-name $mainBranch.branchName `
            --job-type RELEASE `
            --region $region `
            --output json | ConvertFrom-Json
        
        Write-Host "✓ Build started! Job ID: $($job.jobSummary.jobId)" -ForegroundColor Green
        Write-Host "`n📊 Monitor build progress:" -ForegroundColor Cyan
        Write-Host "https://console.aws.amazon.com/amplify/home?region=$region#/$appId/$($mainBranch.branchName)/$($job.jobSummary.jobId)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠ No main/master branch found. Please trigger build manually." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠ Could not trigger automatic build: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Please trigger a build manually in the Amplify Console." -ForegroundColor Yellow
}

Write-Host "`n✅ Configuration Complete!`n" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait for build to complete (3-5 minutes)" -ForegroundColor White
Write-Host "  2. Open your Amplify app URL" -ForegroundColor White
Write-Host "  3. Check that the error is gone" -ForegroundColor White
Write-Host "  4. Test login functionality`n" -ForegroundColor White

# Display the app URL
if ($mainBranch) {
    $appUrl = "https://$($mainBranch.branchName).$($appId).amplifyapp.com"
    Write-Host "🌐 Your app URL: $appUrl`n" -ForegroundColor Cyan
}
