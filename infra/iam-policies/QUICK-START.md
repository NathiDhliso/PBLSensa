# 🚀 Quick Start - Apply IAM Policy

## ⚡ What Was Done

✅ Updated `infra/iam-policies/pbl-development-policy.json` with:
- CloudWatch and EventBridge permissions
- Lambda, AppConfig, SageMaker, SNS, Textract permissions
- Proper resource scoping for security

## 🎯 What You Need to Do Now

### Apply the Policy (Required - One Time Only)

**You MUST have AWS admin access for this step.**

#### Method 1: AWS Console (Recommended - 2 minutes)

1. **Login**: https://console.aws.amazon.com (use admin account)
2. **Navigate**: IAM → Users → `PBL_Sensa` → Permissions → Add inline policy
3. **Copy**: Contents of `infra/iam-policies/pbl-development-policy.json`
4. **Name**: `PBLDevelopmentPolicy`
5. **Save**: Click "Create policy"

✅ Done!

#### Method 2: AWS CLI (If you have admin credentials)

```powershell
# Apply policy (replace 'admin' with your admin profile name)
aws iam put-user-policy `
    --user-name PBL_Sensa `
    --policy-name PBLDevelopmentPolicy `
    --policy-document file://infra/iam-policies/pbl-development-policy.json `
    --profile admin
```

✅ Done!

## ✔️ Verify It Worked

```powershell
# Check policy exists
aws iam list-user-policies --user-name PBL_Sensa

# Should show: PBLDevelopmentPolicy
```

## 🧪 Test Terraform

```powershell
cd infra/Development
terraform plan
```

**Expected**: No permission errors for AppConfig, Lambda, EventBridge, CloudWatch, SNS, SageMaker, or Textract.

## 🆘 If You Don't Have Admin Access

Contact your AWS account administrator and send them:
- File: `infra/iam-policies/pbl-development-policy.json`
- Instructions: `infra/iam-policies/IAM-POLICY-APPLICATION-GUIDE.md`

## 📊 What Permissions Were Added

| Service | Purpose |
|---------|---------|
| CloudWatch | Monitoring dashboards & alarms |
| EventBridge | Scheduled events |
| Lambda | Serverless functions |
| AppConfig | Configuration management |
| SageMaker | ML models & endpoints |
| SNS | Notifications |
| Textract | Document processing |

## 📁 Files to Review

- `infra/iam-policies/pbl-development-policy.json` - Updated policy
- `infra/iam-policies/IAM-POLICY-APPLICATION-GUIDE.md` - Full guide
- `infra/iam-policies/IMPLEMENTATION-COMPLETE.md` - Complete details

---

**Status**: ✅ Policy ready - just needs admin to apply it!
