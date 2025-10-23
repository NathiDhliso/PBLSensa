# 🚀 AWS Amplify Configuration Guide

## ❌ Current Issue
Your Amplify app is missing required environment variables, causing this error:
```
Missing required environment variables:
  - VITE_API_BASE_URL
  - VITE_AWS_REGION
  - VITE_COGNITO_USER_POOL_ID
  - VITE_COGNITO_CLIENT_ID
```

## ✅ Solution: Configure Environment Variables in Amplify Console

### Step 1: Go to Amplify Console
1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app: **PBL_Sensa** (or whatever you named it)
3. Click on **Environment variables** in the left sidebar

### Step 2: Add Required Environment Variables

Add the following variables exactly as shown:

#### API Configuration
```
VITE_API_BASE_URL = http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com
VITE_API_TIMEOUT = 30000
```

#### AWS Configuration
```
VITE_AWS_REGION = eu-west-1
```

#### Cognito Configuration
```
VITE_COGNITO_USER_POOL_ID = eu-west-1_0kcNGnItf
VITE_COGNITO_CLIENT_ID = 45fjtlck1bpvuealdo1nepikr4
```

#### Feature Flags (Optional but Recommended)
```
VITE_ENABLE_MOCK_API = false
VITE_ENABLE_API_LOGGING = false
VITE_ENABLE_MOCK_AUTH = false
```

### Step 3: Save and Redeploy
1. Click **Save** button
2. Go to **Hosting environments** in the left sidebar
3. Click **Redeploy this version** on your main branch
4. Wait for build to complete (usually 3-5 minutes)

---

## 📋 Quick Copy-Paste Format (For Amplify Console)

If Amplify Console allows bulk import, use this format:

```env
VITE_API_BASE_URL=http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com
VITE_API_TIMEOUT=30000
VITE_AWS_REGION=eu-west-1
VITE_COGNITO_USER_POOL_ID=eu-west-1_0kcNGnItf
VITE_COGNITO_CLIENT_ID=45fjtlck1bpvuealdo1nepikr4
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_API_LOGGING=false
VITE_ENABLE_MOCK_AUTH=false
```

---

## 🔧 Alternative: Using AWS CLI

If you prefer using the CLI, run these commands:

```bash
# Get your Amplify App ID first
aws amplify list-apps --region eu-west-1

# Set each environment variable (replace YOUR_APP_ID)
aws amplify update-app --app-id YOUR_APP_ID \
  --environment-variables \
    VITE_API_BASE_URL=http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com \
    VITE_API_TIMEOUT=30000 \
    VITE_AWS_REGION=eu-west-1 \
    VITE_COGNITO_USER_POOL_ID=eu-west-1_0kcNGnItf \
    VITE_COGNITO_CLIENT_ID=45fjtlck1bpvuealdo1nepikr4 \
    VITE_ENABLE_MOCK_API=false \
    VITE_ENABLE_API_LOGGING=false \
    VITE_ENABLE_MOCK_AUTH=false \
  --region eu-west-1
```

---

## 🔍 Verify Configuration

After redeploying, verify by:

1. Open your Amplify app URL
2. Open browser DevTools (F12)
3. Check Console - the error should be gone
4. Try logging in with Cognito credentials

---

## 📝 Important Notes

### About VITE_API_BASE_URL
- Currently using: **HTTP** (not HTTPS)
- ALB endpoint: `pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com`
- For production, you should:
  - Add an SSL certificate to your ALB
  - Use HTTPS instead of HTTP
  - Optionally set up a custom domain

### About Mock Flags
- Set `VITE_ENABLE_MOCK_API=true` if backend is not ready
- Set `VITE_ENABLE_MOCK_AUTH=true` to bypass Cognito login
- For production, both should be `false`

### Security Considerations
- These are **frontend** environment variables (exposed to browser)
- They don't contain sensitive secrets
- Cognito Client ID is safe to expose (it's public by design)
- Never put API keys or secrets in VITE_ variables

---

## 🚨 Troubleshooting

### Error persists after adding variables
1. Make sure you clicked **Save** in Amplify Console
2. Trigger a **new build** (not just redeploy)
3. Clear your browser cache (Ctrl+Shift+Delete)
4. Try in incognito/private mode

### CORS errors after fixing env vars
- Check that your backend ALB allows requests from Amplify domain
- Update CORS settings in `backend/app.py`

### Still can't log in
- Verify Cognito User Pool and Client ID are correct
- Check that Cognito callback URL includes your Amplify domain
- Go to Cognito Console > App Integration > App client settings

---

## 📞 Need Help?

If you're still having issues:
1. Check Amplify build logs for errors
2. Verify all environment variables are set correctly
3. Test backend health: `http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com/health`

---

Generated: 2025-10-22
Infrastructure Region: eu-west-1
Environment: development
