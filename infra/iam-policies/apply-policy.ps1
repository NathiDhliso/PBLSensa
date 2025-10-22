# Apply IAM Policy to PBL_Sensa User
# This script applies the updated development policy to the PBL_Sensa IAM user

param(
    [string]$PolicyFile = "pbl-development-policy.json",
    [string]$UserName = "PBL_Sensa",
    [string]$PolicyName = "PBLDevelopmentPolicy"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IAM Policy Application Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$policyPath = Join-Path $scriptDir $PolicyFile

# Validate policy file exists
if (-not (Test-Path $policyPath)) {
    Write-Host "✗ Error: Policy file not found at $policyPath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Policy file found: $policyPath" -ForegroundColor Green

# Validate JSON syntax
try {
    $policyContent = Get-Content $policyPath -Raw
    $policyJson = $policyContent | ConvertFrom-Json
    Write-Host "✓ Policy JSON is valid" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Invalid JSON in policy file" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Check if AWS CLI is available
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI is available: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: AWS CLI not found. Please install AWS CLI." -ForegroundColor Red
    exit 1
}

# Create a backup of the current policy
Write-Host ""
Write-Host "Creating backup of current policy..." -ForegroundColor Yellow
$backupFile = "pbl-development-policy.backup.$(Get-Date -Format 'yyyy-MM-dd-HHmmss').json"
$backupPath = Join-Path $scriptDir $backupFile

try {
    # Get current policy if it exists
    $currentPolicy = aws iam get-user-policy --user-name $UserName --policy-name $PolicyName 2>&1
    if ($LASTEXITCODE -eq 0) {
        $currentPolicy | Out-File -FilePath $backupPath -Encoding utf8
        Write-Host "✓ Current policy backed up to: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "! No existing policy found (this may be the first application)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "! Could not backup existing policy (may not exist)" -ForegroundColor Yellow
}

# Apply the policy
Write-Host ""
Write-Host "Applying policy to IAM user '$UserName'..." -ForegroundColor Yellow

try {
    # Apply the policy using AWS CLI
    $result = aws iam put-user-policy `
        --user-name $UserName `
        --policy-name $PolicyName `
        --policy-document "file://$policyPath" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Policy successfully applied!" -ForegroundColor Green
    } else {
        Write-Host "✗ Error applying policy:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error applying policy:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Verify the policy was applied
Write-Host ""
Write-Host "Verifying policy application..." -ForegroundColor Yellow

try {
    $verifyResult = aws iam get-user-policy `
        --user-name $UserName `
        --policy-name $PolicyName `
        --output json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $appliedPolicy = $verifyResult | ConvertFrom-Json
        Write-Host "✓ Policy verified successfully" -ForegroundColor Green
        
        # Compare statement counts
        $localStatementCount = $policyJson.Statement.Count
        $appliedStatementCount = $appliedPolicy.PolicyDocument.Statement.Count
        
        if ($localStatementCount -eq $appliedStatementCount) {
            Write-Host "✓ Statement count matches: $appliedStatementCount statements" -ForegroundColor Green
        } else {
            Write-Host "! Warning: Statement count mismatch" -ForegroundColor Yellow
            Write-Host "  Local: $localStatementCount, Applied: $appliedStatementCount" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Error verifying policy:" -ForegroundColor Red
        Write-Host $verifyResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error verifying policy:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Policy Application Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  User: $UserName" -ForegroundColor White
Write-Host "  Policy: $PolicyName" -ForegroundColor White
Write-Host "  Statements: $appliedStatementCount" -ForegroundColor White
Write-Host ""
Write-Host "New Permissions Added:" -ForegroundColor Cyan
Write-Host "  ✓ CloudWatch (cloudwatch:*)" -ForegroundColor Green
Write-Host "  ✓ EventBridge (events:*)" -ForegroundColor Green
Write-Host "  ✓ AppConfig (appconfig:*)" -ForegroundColor Green
Write-Host "  ✓ Lambda (lambda:*)" -ForegroundColor Green
Write-Host "  ✓ SageMaker (sagemaker:*)" -ForegroundColor Green
Write-Host "  ✓ SNS (sns:*)" -ForegroundColor Green
Write-Host "  ✓ Textract (textract:AnalyzeDocument, DetectDocumentText)" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Navigate to infra/Development/" -ForegroundColor White
Write-Host "  2. Run: terraform plan" -ForegroundColor White
Write-Host "  3. Verify no permission errors appear" -ForegroundColor White
Write-Host ""
