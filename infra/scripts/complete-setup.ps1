# Complete Setup Script
# Run this after Terraform deployment completes to configure everything

param(
    [switch]$SkipMigrations,
    [switch]$SkipTestUser
)

Write-Host "🚀 PBL Platform - Complete Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check deployment status
Write-Host "Step 1: Checking deployment status..." -ForegroundColor Yellow
& "$PSScriptRoot\check-deployment-status.ps1"

$continue = Read-Host "`nIs deployment complete? (y/n)"
if ($continue -ne 'y') {
    Write-Host "Please wait for deployment to complete and run this script again." -ForegroundColor Yellow
    exit 0
}

# Step 2: Update configuration
Write-Host "`nStep 2: Updating application configuration..." -ForegroundColor Yellow
& "$PSScriptRoot\update-env-config.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Configuration update failed. Please check errors above." -ForegroundColor Red
    exit 1
}

# Step 3: Update API keys
Write-Host "`nStep 3: Update API Keys in Secrets Manager" -ForegroundColor Yellow
Write-Host "Do you want to update API keys now? (y/n)" -ForegroundColor Cyan
$updateKeys = Read-Host

if ($updateKeys -eq 'y') {
    Set-Location "$PSScriptRoot\..\Development"
    $secretArn = terraform output -raw api_keys_secret_arn
    
    Write-Host "Enter your LlamaParse API key (or press Enter to skip):" -ForegroundColor Cyan
    $llamaKey = Read-Host
    
    Write-Host "Enter your Eleven Labs API key (or press Enter to skip):" -ForegroundColor Cyan
    $elevenKey = Read-Host
    
    Write-Host "Enter your Brain.fm API key (or press Enter to skip):" -ForegroundColor Cyan
    $brainKey = Read-Host
    
    if ($llamaKey -or $elevenKey -or $brainKey) {
        $secretValue = @{
            llamaparse = if ($llamaKey) { $llamaKey } else { "PLACEHOLDER" }
            elevenlabs = if ($elevenKey) { $elevenKey } else { "PLACEHOLDER" }
            brainfm = if ($brainKey) { $brainKey } else { "PLACEHOLDER" }
        } | ConvertTo-Json -Compress
        
        aws secretsmanager put-secret-value --secret-id $secretArn --secret-string $secretValue
        Write-Host "✅ API keys updated" -ForegroundColor Green
    }
    
    Set-Location "..\..\"
} else {
    Write-Host "⏭️  Skipping API keys update" -ForegroundColor Gray
}

# Step 4: Run database migrations
if (-not $SkipMigrations) {
    Write-Host "`nStep 4: Run Database Migrations" -ForegroundColor Yellow
    Write-Host "Do you want to run database migrations now? (y/n)" -ForegroundColor Cyan
    $runMigrations = Read-Host
    
    if ($runMigrations -eq 'y') {
        Set-Location "$PSScriptRoot\..\Development"
        $dbHost = terraform output -raw rds_address
        $dbPort = terraform output -raw rds_port
        $dbName = terraform output -raw rds_database_name
        
        Write-Host "Enter database password:" -ForegroundColor Cyan
        $dbPassword = Read-Host -AsSecureString
        $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
        
        Set-Location "..\..\database\migrations"
        
        $env:PGPASSWORD = $dbPasswordPlain
        
        Write-Host "Running migrations..." -ForegroundColor Cyan
        $migrations = Get-ChildItem -Filter "*.sql" | Sort-Object Name
        
        foreach ($migration in $migrations) {
            Write-Host "  Running $($migration.Name)..." -ForegroundColor Gray
            psql -h $dbHost -p $dbPort -U pbl_admin -d $dbName -f $migration.FullName
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ $($migration.Name)" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $($migration.Name) failed" -ForegroundColor Red
            }
        }
        
        Remove-Item Env:\PGPASSWORD
        Set-Location "..\..\..\..\"
        
        Write-Host "✅ Database migrations complete" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Skipping database migrations" -ForegroundColor Gray
    }
} else {
    Write-Host "`nStep 4: Skipping database migrations (--SkipMigrations flag)" -ForegroundColor Gray
}

# Step 5: Create test user
if (-not $SkipTestUser) {
    Write-Host "`nStep 5: Create Test User in Cognito" -ForegroundColor Yellow
    Write-Host "Do you want to create a test user? (y/n)" -ForegroundColor Cyan
    $createUser = Read-Host
    
    if ($createUser -eq 'y') {
        Set-Location "$PSScriptRoot\..\Development"
        $userPoolId = terraform output -raw cognito_user_pool_id
        
        Write-Host "Enter test user email:" -ForegroundColor Cyan
        $email = Read-Host
        
        Write-Host "Enter test user password:" -ForegroundColor Cyan
        $password = Read-Host -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        
        # Create user
        aws cognito-idp admin-create-user `
            --user-pool-id $userPoolId `
            --username $email `
            --user-attributes Name=email,Value=$email Name=email_verified,Value=true `
            --temporary-password "TempPass123!" `
            --message-action SUPPRESS
        
        # Set permanent password
        aws cognito-idp admin-set-user-password `
            --user-pool-id $userPoolId `
            --username $email `
            --password $passwordPlain `
            --permanent
        
        Write-Host "✅ Test user created: $email" -ForegroundColor Green
        
        Set-Location "..\..\"
    } else {
        Write-Host "⏭️  Skipping test user creation" -ForegroundColor Gray
    }
} else {
    Write-Host "`nStep 5: Skipping test user creation (--SkipTestUser flag)" -ForegroundColor Gray
}

# Step 6: Summary
Write-Host "`n" -NoNewline
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "Your infrastructure is ready! Here's what was configured:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Environment variables updated (.env.local, .env.development)" -ForegroundColor Green
Write-Host "✅ Infrastructure outputs saved (infra/infrastructure-outputs.json)" -ForegroundColor Green

if ($runMigrations -eq 'y') {
    Write-Host "✅ Database migrations completed" -ForegroundColor Green
}

if ($createUser -eq 'y') {
    Write-Host "✅ Test user created in Cognito" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start the frontend:"
Write-Host "     npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Open your browser:"
Write-Host "     http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Test authentication with your test user"
Write-Host ""
Write-Host "  4. When ready, build and push Docker images:"
Write-Host "     See INFRASTRUCTURE-SETUP-COMPLETE.md for instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - INFRASTRUCTURE-SETUP-COMPLETE.md - Complete setup guide"
Write-Host "  - infra/Development/README.md - Infrastructure overview"
Write-Host "  - infra/scripts/README-CONFIG-UPDATE.md - Configuration details"
Write-Host ""
