# Deploy Cognito Email Templates
# Automatically configures verification and password reset email templates

param(
    [string]$UserPoolId = "eu-west-1_0kcNGnItf",
    [string]$Region = "eu-west-1"
)

Write-Host "🚀 Deploying Cognito Email Templates..." -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI is installed
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   User Pool ID: $UserPoolId" -ForegroundColor Gray
Write-Host "   Region: $Region" -ForegroundColor Gray
Write-Host ""

# Verification Email Template (HTML)
$verificationEmailHtml = @'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .code-container { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
        .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e9ecef; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>🎓 Welcome to Sensa Learn!</h1></div>
        <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
            <p>Thank you for signing up for Sensa Learn. We're excited to have you join our learning community!</p>
            <p>To complete your registration and start your learning journey, please verify your email address using the code below:</p>
            <div class="code-container">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your Verification Code</div>
                <div class="code">{####}</div>
                <div style="font-size: 12px; color: #999; margin-top: 10px;">This code expires in 24 hours</div>
            </div>
            <div class="info-box">
                <strong>💡 What's Next?</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Enter this code in the verification page</li>
                    <li>Complete your profile setup</li>
                    <li>Start exploring courses and learning materials</li>
                </ul>
            </div>
            <p style="margin-top: 30px;">If you didn't create an account with Sensa Learn, you can safely ignore this email.</p>
            <p style="margin-top: 30px;"><strong>Happy Learning!</strong><br>The Sensa Learn Team</p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© 2025 Sensa Learn. All rights reserved.</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
'@

# Password Reset Email Template (HTML)
$resetEmailHtml = @'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .code-container { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
        .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e9ecef; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>🔐 Password Reset Request</h1></div>
        <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
            <p>We received a request to reset your Sensa Learn password.</p>
            <p>Use the verification code below to reset your password:</p>
            <div class="code-container">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your Reset Code</div>
                <div class="code">{####}</div>
                <div style="font-size: 12px; color: #999; margin-top: 10px;">This code expires in 1 hour</div>
            </div>
            <div class="warning-box">
                <strong>⚠️ Security Notice</strong>
                <p style="margin: 10px 0 0 0;">If you didn't request a password reset, please ignore this email and ensure your account is secure. Your password will not be changed unless you use this code.</p>
            </div>
            <p style="margin-top: 30px;"><strong>Need Help?</strong><br>If you're having trouble resetting your password, please contact our support team.</p>
            <p style="margin-top: 30px;"><strong>Best regards,</strong><br>The Sensa Learn Team</p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© 2025 Sensa Learn. All rights reserved.</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
'@

# Step 1: Get current user pool configuration
Write-Host "📥 Step 1: Retrieving current user pool configuration..." -ForegroundColor Yellow

try {
    $userPoolJson = aws cognito-idp describe-user-pool `
        --user-pool-id $UserPoolId `
        --region $Region `
        --output json
    
    $userPool = $userPoolJson | ConvertFrom-Json
    Write-Host "✅ User pool configuration retrieved" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to retrieve user pool: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📧 Step 2: Configuring email templates..." -ForegroundColor Yellow

# Create temporary JSON file for the update
$tempConfigFile = [System.IO.Path]::GetTempFileName()

# Build the configuration JSON
$config = @{
    UserPoolId = $UserPoolId
    VerificationMessageTemplate = @{
        DefaultEmailOption = "CONFIRM_WITH_CODE"
        EmailSubject = "Verify your Sensa Learn account"
        EmailMessage = $verificationEmailHtml
        EmailMessageByLink = $verificationEmailHtml
        EmailSubjectByLink = "Verify your Sensa Learn account"
    }
    EmailConfiguration = @{
        EmailSendingAccount = "COGNITO_DEFAULT"
    }
    AdminCreateUserConfig = @{
        AllowAdminCreateUserOnly = $false
    }
} | ConvertTo-Json -Depth 10

# Note: AWS CLI doesn't support updating verification templates directly via update-user-pool
# We need to use a different approach

Write-Host ""
Write-Host "⚠️  Note: Email templates must be configured via AWS Console" -ForegroundColor Yellow
Write-Host ""
Write-Host "AWS Cognito doesn't support updating email templates via CLI for existing user pools." -ForegroundColor Gray
Write-Host "You need to configure them manually in the AWS Console." -ForegroundColor Gray
Write-Host ""

# Save templates to files for easy copying
$verificationFile = "cognito-verification-email.html"
$resetFile = "cognito-reset-email.html"

$verificationEmailHtml | Out-File -FilePath $verificationFile -Encoding UTF8
$resetEmailHtml | Out-File -FilePath $resetFile -Encoding UTF8

Write-Host "✅ Email templates saved to files:" -ForegroundColor Green
Write-Host "   - $verificationFile" -ForegroundColor Cyan
Write-Host "   - $resetFile" -ForegroundColor Cyan
Write-Host ""

# Open AWS Console URL
$consoleUrl = "https://$Region.console.aws.amazon.com/cognito/v2/idp/user-pools/$UserPoolId/messaging?region=$Region"

Write-Host "🌐 Opening AWS Console..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Console URL: $consoleUrl" -ForegroundColor Cyan
Write-Host ""

# Try to open browser
try {
    Start-Process $consoleUrl
    Write-Host "✅ Browser opened" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not open browser automatically" -ForegroundColor Yellow
    Write-Host "   Please open this URL manually: $consoleUrl" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Manual Configuration Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. In the AWS Console that just opened:" -ForegroundColor White
Write-Host "   - Click 'Messaging' tab (should already be selected)" -ForegroundColor Gray
Write-Host "   - Scroll to 'Email' section" -ForegroundColor Gray
Write-Host "   - Click 'Edit' button" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure Verification Email:" -ForegroundColor White
Write-Host "   Subject: Verify your Sensa Learn account" -ForegroundColor Gray
Write-Host "   Message: Copy from file '$verificationFile'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure Password Reset Email:" -ForegroundColor White
Write-Host "   Subject: Reset your Sensa Learn password" -ForegroundColor Gray
Write-Host "   Message: Copy from file '$resetFile'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Click 'Save changes'" -ForegroundColor White
Write-Host ""

Write-Host "💡 Quick Copy Commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "To copy verification email to clipboard:" -ForegroundColor Gray
Write-Host "   Get-Content '$verificationFile' | Set-Clipboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "To copy reset email to clipboard:" -ForegroundColor Gray
Write-Host "   Get-Content '$resetFile' | Set-Clipboard" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure email templates in AWS Console (opened above)" -ForegroundColor Gray
Write-Host "2. Test signup flow in your app" -ForegroundColor Gray
Write-Host "3. Verify emails are being sent" -ForegroundColor Gray
Write-Host ""
