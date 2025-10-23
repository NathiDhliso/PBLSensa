# 🎯 QUICK FIX - Copy These Values to Amplify Console

## ❌ Problem
```
Uncaught Error: Missing required environment variables
```

## ✅ Solution - Add These in Amplify Console

### 🔗 Go Here:
1. Open: https://console.aws.amazon.com/amplify
2. **IMPORTANT:** Switch region to **us-east-1** (top-right dropdown)
3. Select your app
4. Click: **Environment variables** (left sidebar)
5. Click: **Manage variables**
6. Add each variable below
7. Click: **Save**
8. Go to Hosting > **Redeploy this version**

---

## 📋 COPY THESE EXACT VALUES:

### Variable 1:
```
Name:  VITE_API_BASE_URL
Value: http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com
```

### Variable 2:
```
Name:  VITE_API_TIMEOUT
Value: 30000
```

### Variable 3:
```
Name:  VITE_AWS_REGION
Value: eu-west-1
```

### Variable 4:
```
Name:  VITE_COGNITO_USER_POOL_ID
Value: eu-west-1_0kcNGnItf
```

### Variable 5:
```
Name:  VITE_COGNITO_CLIENT_ID
Value: 45fjtlck1bpvuealdo1nepikr4
```

### Variable 6 (Optional):
```
Name:  VITE_ENABLE_MOCK_API
Value: false
```

### Variable 7 (Optional):
```
Name:  VITE_ENABLE_API_LOGGING
Value: false
```

### Variable 8 (Optional):
```
Name:  VITE_ENABLE_MOCK_AUTH
Value: false
```

---

## ⚡ Alternative: Use PowerShell Script

Run this command from your project root:
```powershell
.\configure-amplify.ps1
```

This will automatically configure all variables for you!

---

## ✅ Verification

After redeploying, the error should be gone and you should see:
- ✓ App loads without console errors
- ✓ Login page appears
- ✓ Cognito authentication works

---

**Time to fix: ~5 minutes**
**Last updated: 2025-10-22**
