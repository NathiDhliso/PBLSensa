# 🔐 Fix Amplify Permissions Error

## ❌ Current Error

```
AccessDeniedException: User: arn:aws:iam::202717921808:user/PBL_Sensa 
is not authorized to perform: amplify:ListApps
```

## 🎯 Two Issues Found

1. **Wrong Region** - Your Amplify app is in **us-east-1**, not eu-west-1
2. **Missing IAM Permissions** - User `PBL_Sensa` needs Amplify access

---

## ✅ Solution 1: Add IAM Permissions (REQUIRED)

### Option A: Using AWS Console (Recommended)

1. **Go to IAM Console**
   - Open: https://console.aws.amazon.com/iam
   
2. **Find Your User**
   - Click: **Users** in left sidebar
   - Click: **PBL_Sensa**
   
3. **Add Permissions**
   - Click: **Add permissions** → **Attach policies directly**
   - Search for: `AWSAmplifyFullAccess`
   - Check the box next to it
   - Click: **Next** → **Add permissions**

### Option B: Using AWS CLI

```powershell
# Attach the AWS managed policy
aws iam attach-user-policy `
  --user-name PBL_Sensa `
  --policy-arn arn:aws:iam::aws:policy/AWSAmplifyFullAccess
```

### Option C: Custom Policy (More Restrictive)

If you want minimal permissions, use the custom policy:

```powershell
# Create the policy
aws iam create-policy `
  --policy-name PBL-Amplify-Access `
  --policy-document file://iam-amplify-policy.json

# Attach it to the user
aws iam attach-user-policy `
  --user-name PBL_Sensa `
  --policy-arn arn:aws:iam::202717921808:policy/PBL-Amplify-Access
```

---

## ✅ Solution 2: Manual Configuration (Skip Script)

Since you may have permission issues, here's the **manual way**:

### Step 1: Find Your Amplify App

1. **Go to Amplify Console**
   - Open: https://console.aws.amazon.com/amplify
   - **Switch region to:** us-east-1 (top-right dropdown)
   
2. **Note your app details**
   - App name: _______________
   - App ID: _______________

### Step 2: Add Environment Variables

1. **Click your app name**

2. **Click "Environment variables"** (left sidebar)

3. **Click "Manage variables"**

4. **Add these variables ONE BY ONE:**

   ```
   VITE_API_BASE_URL = http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com
   VITE_API_TIMEOUT = 30000
   VITE_AWS_REGION = eu-west-1
   VITE_COGNITO_USER_POOL_ID = eu-west-1_0kcNGnItf
   VITE_COGNITO_CLIENT_ID = 45fjtlck1bpvuealdo1nepikr4
   VITE_ENABLE_MOCK_API = false
   VITE_ENABLE_API_LOGGING = false
   VITE_ENABLE_MOCK_AUTH = false
   ```

5. **Click "Save"**

### Step 3: Redeploy

1. **Go to "Hosting environments"** (left sidebar)
2. **Click "Redeploy this version"** on your main branch
3. **Wait for build to complete** (3-5 minutes)

---

## 🔄 After Fixing Permissions

Once you've added the IAM permissions, you can try the script again:

```powershell
.\configure-amplify.ps1
```

It will now ask you to choose the region - select option 1 for us-east-1.

---

## 🧪 Test Permissions

To verify permissions are working:

```powershell
# Test listing apps in us-east-1
aws amplify list-apps --region us-east-1

# Should show your Amplify app(s)
```

---

## 📊 Quick Reference

| Setting | Value |
|---------|-------|
| **IAM User** | PBL_Sensa |
| **Account ID** | 202717921808 |
| **Amplify Region** | us-east-1 |
| **Infrastructure Region** | eu-west-1 |
| **Policy Needed** | AWSAmplifyFullAccess |

**Note:** It's normal for Amplify to be in a different region than your infrastructure!
- Amplify (frontend): **us-east-1**
- Backend/DB/Cognito: **eu-west-1**

---

## ✅ Checklist

- [ ] Add IAM permissions to user `PBL_Sensa`
- [ ] Verify with: `aws amplify list-apps --region us-east-1`
- [ ] Go to Amplify Console (region: us-east-1)
- [ ] Add environment variables manually
- [ ] Save variables
- [ ] Redeploy app
- [ ] Verify app loads without errors

---

**Estimated Time:** 10 minutes
**Difficulty:** Easy ⭐

---

## 🆘 Still Having Issues?

### Permission denied errors
- Make sure you're logged in with correct AWS credentials
- Check: `aws sts get-caller-identity`
- Verify you're using user `PBL_Sensa`

### Can't find Amplify app
- Switch region to **us-east-1** in console (top-right)
- Check all regions if unsure where it's deployed

### Variables not taking effect
- Make sure you clicked "Save" after adding them
- Trigger a new build (not just redeploy)
- Check build logs for errors

---

**Created:** 2025-10-22
**User:** PBL_Sensa
**Account:** 202717921808
