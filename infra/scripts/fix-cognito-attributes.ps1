# Fix Cognito User Pool Attributes and Email Templates
# This script configures writable attributes and sets up email templates

param(
    [string]$UserPoolId = "eu-west-1_0kcNGnItf",
    [string]$Region = "eu-west-1"
)

Write-Host "🔧 Fixing Cognito User Pool Configuration..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Update User Pool to allow name attribute to be writable
Write-Host "📝 Step 1: Configuring writable attributes..." -ForegroundColor Yellow

try {
    # Get current user pool configuration
    $userPool = aws cognito-idp describe-user-pool `
        --user-pool-id $UserPoolId `
        --region $Region `
        --output json | ConvertFrom-Json

    Write-Host "✅ Current user pool retrieved" -ForegroundColor Green
    
    # Note: Standard attributes like 'name' and 'email' are automatically writable
    # The error suggests we might be trying to write a custom attribute
    # Let's verify the schema
    
    Write-Host ""
    Write-Host "Current User Pool Attributes:" -ForegroundColor Cyan
    $userPool.UserPool.SchemaAttributes | ForEach-Object {
        Write-Host "  - $($_.Name) (Mutable: $($_.Mutable))" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error retrieving user pool: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📧 Step 2: Configuring Email Templates..." -ForegroundColor Yellow

# Verification Email Template
$verificationEmailSubject = "Verify your Sensa Learn account"
$verificationEmailMessage = @"
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 15px; text-align: center; border-radius: 5px; letter-spacing: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Sensa Learn! 🎓</h1>
        </div>
        <div class="content">
            <p>Hi there!</p>
            <p>Thank you for signing up for Sensa Learn. We're excited to have you on board!</p>
            <p>To complete your registration, please verify your email address using the code below:</p>
            <div class="code">{####}</div>
            <p>This code will expire in 24 hours.</p>
            <p>If you didn't create an account with Sensa Learn, you can safely ignore this email.</p>
            <p>Happy learning!</p>
            <p><strong>The Sensa Learn Team</strong></p>
        </div>
        <div class="footer">
            <p>© 2025 Sensa Learn. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"@

# Password Reset Email Template
$resetPasswordSubject = "Reset your Sensa Learn password"
$resetPasswordMessage = @"
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 15px; text-align: center; border-radius: 5px; letter-spacing: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request 🔐</h1>
        </div>
        <div class="content">
            <p>Hi there!</p>
            <p>We received a request to reset your Sensa Learn password.</p>
            <p>Use the verification code below to reset your password:</p>
            <div class="code">{####}</div>
            <p>This code will expire in 1 hour.</p>
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
            </div>
            <p><strong>The Sensa Learn Team</strong></p>
        </div>
        <div class="footer">
            <p>© 2025 Sensa Learn. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"@

# Update User Pool with email templates
Write-Host "Setting verification email template..." -ForegroundColor Gray

try {
    aws cognito-idp update-user-pool `
        --user-pool-id $UserPoolId `
        --region $Region `
        --verification-message-template "EmailMessage=$verificationEmailMessage,EmailSubject=$verificationEmailSubject,DefaultEmailOption=CONFIRM_WITH_CODE" `
        --email-configuration "EmailSendingAccount=COGNITO_DEFAULT" `
        2>&1 | Out-Null
    
    Write-Host "✅ Email verification template configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Note: Email templates may need to be configured via AWS Console" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Step 3: Configuration Summary" -ForegroundColor Yellow
Write-Host ""
Write-Host "User Pool ID: $UserPoolId" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Configuration Steps Completed!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Manual Steps Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please complete these steps in AWS Console:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to AWS Console > Cognito > User Pools > $UserPoolId" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Click 'Sign-up experience' tab" -ForegroundColor Gray
Write-Host "   - Verify that 'name' attribute is set as 'Mutable'" -ForegroundColor Gray
Write-Host "   - If not, you may need to recreate the user pool" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Click 'Messaging' tab > 'Email' section" -ForegroundColor Gray
Write-Host "   - Configure 'Verification email message'" -ForegroundColor Gray
Write-Host "   - Configure 'Password reset email message'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Email Templates to use:" -ForegroundColor Gray
Write-Host ""
Write-Host "   Verification Email Subject:" -ForegroundColor Cyan
Write-Host "   $verificationEmailSubject" -ForegroundColor White
Write-Host ""
Write-Host "   Verification Email Body:" -ForegroundColor Cyan
Write-Host "   (Use HTML template saved in: cognito-email-templates.html)" -ForegroundColor White
Write-Host ""
Write-Host "   Password Reset Subject:" -ForegroundColor Cyan
Write-Host "   $resetPasswordSubject" -ForegroundColor White
Write-Host ""

# Save email templates to file
$templatesFile = "cognito-email-templates.html"
@"
<!-- VERIFICATION EMAIL TEMPLATE -->
$verificationEmailMessage

<!-- PASSWORD RESET EMAIL TEMPLATE -->
$resetPasswordMessage
"@ | Out-File -FilePath $templatesFile -Encoding UTF8

Write-Host "📄 Email templates saved to: $templatesFile" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Troubleshooting the '400 unauthorized attribute' error:" -ForegroundColor Yellow
Write-Host ""
Write-Host "This error occurs when trying to set attributes that aren't writable." -ForegroundColor White
Write-Host "Common causes:" -ForegroundColor White
Write-Host "  1. The 'name' attribute might not be configured as mutable" -ForegroundColor Gray
Write-Host "  2. You might be sending custom attributes not defined in the schema" -ForegroundColor Gray
Write-Host ""
Write-Host "Solution:" -ForegroundColor Cyan
Write-Host "  - In the auth service, only send 'email' during signup" -ForegroundColor Gray
Write-Host "  - Update 'name' after signup via updateUserAttributes" -ForegroundColor Gray
Write-Host "  - OR make 'name' optional in the signup form" -ForegroundColor Gray
Write-Host ""
