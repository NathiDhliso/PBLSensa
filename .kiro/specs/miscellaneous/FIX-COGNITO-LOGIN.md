# Fix Cognito Sign-In Issues

## Problem
```
POST https://cognito-idp.eu-west-1.amazonaws.com/ 400 (Bad Request)
```

## Quick Solutions

### Option 1: Enable Mock Auth (Fastest - 1 minute)

Temporarily bypass Cognito to test your app:

1. **In Amplify Console**, add this variable:
   ```
   Name:  VITE_ENABLE_MOCK_AUTH
   Value: true
   ```

2. **Save and Redeploy**

3. **Use these credentials:**
   - Email: `test@example.com`
   - Password: `Test123!`

This bypasses Cognito entirely for testing.

---

### Option 2: Create a Test User in Cognito (Recommended)

Run this PowerShell script:

```powershell
# Create a test user
$password = "TempPassword123!"

# Create user
aws cognito-idp admin-create-user `
  --user-pool-id eu-west-1_0kcNGnItf `
  --username testuser@example.com `
  --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true `
  --temporary-password $password `
  --message-action SUPPRESS `
  --region eu-west-1

# Set permanent password
aws cognito-idp admin-set-user-password `
  --user-pool-id eu-west-1_0kcNGnItf `
  --username testuser@example.com `
  --password "TestUser123!" `
  --permanent `
  --region eu-west-1

Write-Host "✅ Test user created!" -ForegroundColor Green
Write-Host "Email: testuser@example.com" -ForegroundColor Cyan
Write-Host "Password: TestUser123!" -ForegroundColor Cyan
```

---

### Option 3: Reset Existing User Password

Your existing user `test@example.com` might not have a password set. Fix it:

```powershell
# Set a permanent password for existing user
aws cognito-idp admin-set-user-password `
  --user-pool-id eu-west-1_0kcNGnItf `
  --username test@example.com `
  --password "Test123!@#" `
  --permanent `
  --region eu-west-1

Write-Host "✅ Password reset for test@example.com" -ForegroundColor Green
Write-Host "New password: Test123!@#" -ForegroundColor Cyan
```

---

## Why 400 Error Happens

1. **No password set** - User created but password not initialized
2. **Wrong auth flow** - Client not configured properly (but yours looks OK)
3. **Client secret required** - But your client doesn't use secrets
4. **User not confirmed** - But your user shows CONFIRMED

## Most Likely Cause

The user `test@example.com` was created but **doesn't have a password set**. 

Run **Option 3** to fix this immediately.

---

## Test After Fix

1. Go to your Amplify app URL
2. Use credentials:
   - Email: `test@example.com`
   - Password: `Test123!@#`
3. Should log in successfully!

---

## Quick Test Script

```powershell
# Test all fixes at once
Write-Host "🔧 Fixing Cognito Sign-In..." -ForegroundColor Yellow

# Reset existing user password
aws cognito-idp admin-set-user-password `
  --user-pool-id eu-west-1_0kcNGnItf `
  --username test@example.com `
  --password "Test123!@#" `
  --permanent `
  --region eu-west-1

Write-Host "✅ Fixed!" -ForegroundColor Green
Write-Host "`nLogin with:" -ForegroundColor Cyan
Write-Host "  Email: test@example.com"
Write-Host "  Password: Test123!@#"
```

Save this as `fix-cognito-login.ps1` and run it!
