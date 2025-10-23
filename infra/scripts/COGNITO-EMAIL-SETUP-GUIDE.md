# Cognito Email Templates Setup Guide

## 🎯 Quick Fix for "400 Unauthorized Attribute" Error

### Problem
You're getting: `A client attempted to write unauthorized attribute`

### Solution
✅ **FIXED** - Updated `src/services/auth.ts` to only send `email` during signup, not `name`.

The `name` attribute was causing the error because it's not configured as writable in your Cognito User Pool during the signup process.

---

## 📧 Email Templates Configuration

You need to configure 3 email templates in AWS Cognito:

1. **Verification Email** - Sent when users sign up
2. **Password Reset Email** - Sent when users request password reset  
3. **Welcome Email** (Optional) - Sent after successful verification

---

## 🚀 Setup Instructions

### Step 1: Access Cognito Console

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **Cognito** service
3. Click on **User Pools**
4. Select your pool: `eu-west-1_0kcNGnItf`

### Step 2: Configure Verification Email

1. Click **Messaging** tab in the left sidebar
2. Scroll to **Email** section
3. Click **Edit** button
4. Configure the following:

#### Verification Email Subject:
```
Verify your Sensa Learn account
```

#### Verification Email Message (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .code-container {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
        }
        .info-box {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Welcome to Sensa Learn!</h1>
        </div>
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
            
            <p style="margin-top: 30px;">
                <strong>Happy Learning!</strong><br>
                The Sensa Learn Team
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© 2025 Sensa Learn. All rights reserved.</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
                This is an automated message, please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
```

### Step 3: Configure Password Reset Email

Still in the **Messaging** > **Email** section:

#### Password Reset Email Subject:
```
Reset your Sensa Learn password
```

#### Password Reset Email Message (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .code-container {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
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
                <p style="margin: 10px 0 0 0;">
                    If you didn't request a password reset, please ignore this email and ensure your account is secure. 
                    Your password will not be changed unless you use this code.
                </p>
            </div>
            
            <p style="margin-top: 30px;">
                <strong>Need Help?</strong><br>
                If you're having trouble resetting your password, please contact our support team.
            </p>
            
            <p style="margin-top: 30px;">
                <strong>Best regards,</strong><br>
                The Sensa Learn Team
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© 2025 Sensa Learn. All rights reserved.</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
                This is an automated message, please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
```

### Step 4: Save Configuration

1. Click **Save changes** at the bottom of the page
2. Wait for confirmation message

---

## 🧪 Testing the Email Templates

### Test Verification Email:
1. Try signing up with a new email address
2. Check your inbox for the verification email
3. Verify the code works

### Test Password Reset Email:
1. Go to login page
2. Click "Forgot Password?"
3. Enter your email
4. Check inbox for reset code
5. Verify the code works

---

## 📝 Alternative: Simple Text Templates

If HTML emails don't work, use these simple text versions:

### Verification Email (Text):
```
Welcome to Sensa Learn!

Your verification code is: {####}

This code will expire in 24 hours.

If you didn't sign up for Sensa Learn, please ignore this email.

- The Sensa Learn Team
```

### Password Reset Email (Text):
```
Password Reset Request

Your password reset code is: {####}

This code will expire in 1 hour.

If you didn't request this, please ignore this email.

- The Sensa Learn Team
```

---

## 🔧 Troubleshooting

### Emails Not Sending?

1. **Check SES Configuration**:
   - Go to AWS SES (Simple Email Service)
   - Verify your sending email address
   - Check if you're in SES Sandbox mode (limits sending)

2. **Check Cognito Email Settings**:
   - Messaging tab > Email configuration
   - Ensure "Send email with Cognito" is selected
   - Or configure custom SES settings

3. **Check Spam Folder**:
   - Cognito emails might go to spam initially
   - Mark as "Not Spam" to train filters

### Still Getting 400 Error?

The code fix should resolve this, but if not:

1. Check browser console for exact error message
2. Verify you're using the latest code (name attribute removed from signup)
3. Clear browser cache and try again
4. Check Cognito CloudWatch logs for detailed errors

---

## ✅ Verification Checklist

- [ ] Accessed Cognito User Pool in AWS Console
- [ ] Configured verification email template
- [ ] Configured password reset email template
- [ ] Saved all changes
- [ ] Tested signup flow with verification email
- [ ] Tested password reset flow
- [ ] Verified emails are not going to spam
- [ ] Updated frontend code (already done)

---

## 🎉 You're All Set!

Once you've completed these steps:
1. Users will receive beautiful, branded emails
2. The 400 error will be resolved
3. Your authentication flow will work smoothly

Need help? Check the AWS Cognito documentation or contact support.
