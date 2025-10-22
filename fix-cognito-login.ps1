# Fix Cognito Sign-In - Reset User Password
# Run this to fix the 400 Bad Request error

Write-Host "`n🔧 Fixing Cognito Authentication...`n" -ForegroundColor Yellow

$userPoolId = "eu-west-1_0kcNGnItf"
$region = "eu-west-1"
$username = "test@example.com"
$newPassword = "Test123!@#"

Write-Host "Setting password for user: $username" -ForegroundColor Cyan

try {
    # Set permanent password
    aws cognito-idp admin-set-user-password `
        --user-pool-id $userPoolId `
        --username $username `
        --password $newPassword `
        --permanent `
        --region $region

    Write-Host "`n✅ Password set successfully!`n" -ForegroundColor Green
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  🔐 Login Credentials" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  Email:    $username" -ForegroundColor White
    Write-Host "  Password: $newPassword" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    Write-Host "✨ You can now sign in to your Amplify app!`n" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error setting password:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    Write-Host "`nMake sure you have the correct permissions.`n" -ForegroundColor Yellow
}
