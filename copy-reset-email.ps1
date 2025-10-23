# Quick script to copy password reset email to clipboard

Write-Host ""
Write-Host "📋 Copying Password Reset Email to Clipboard..." -ForegroundColor Cyan
Write-Host ""

Get-Content 'cognito-reset-email.html' -Raw | Set-Clipboard

Write-Host "✅ Password reset email copied to clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "Now paste it in AWS Console:" -ForegroundColor Yellow
Write-Host "1. Scroll to 'Password reset message' section" -ForegroundColor Gray
Write-Host "2. Subject: Reset your Sensa Learn password" -ForegroundColor Gray
Write-Host "3. Click in the message box and press Ctrl+V" -ForegroundColor Gray
Write-Host "4. Click 'Save changes'" -ForegroundColor Gray
Write-Host ""
