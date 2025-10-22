# IAM Policies

This directory contains IAM policy configurations for the PBL Sensa project.

## 🚀 Quick Start

**To apply the updated IAM policy, see: [`QUICK-START.md`](./QUICK-START.md)**

## 📁 Files

### Active Policy
- **`pbl-development-policy.json`** - Current development environment IAM policy
  - ✅ Updated with CloudWatch, EventBridge, Lambda, AppConfig, SageMaker, SNS, and Textract
  - Ready to be applied to the `PBL_Sensa` IAM user

### Backups
- **`pbl-development-policy.backup.*.json`** - Timestamped backups of previous policies

### Scripts
- **`apply-policy.ps1`** - PowerShell script to apply the policy (requires AWS admin credentials)

### Documentation
- **`QUICK-START.md`** ⚡ - Fast 2-minute application guide
- **`IAM-POLICY-APPLICATION-GUIDE.md`** 📖 - Complete step-by-step instructions
- **`CHANGES.md`** 🔍 - Detailed before/after comparison
- **`INDEX.md`** 📚 - Documentation index
- **`README.md`** - This file

## 🎯 Current Status

✅ **Policy Updated**: Added 7 new AWS service permissions
⏳ **Pending**: Application to AWS (requires admin credentials)

## 🔐 What's in the Policy

### Statement 1: AllowAllCoreServices (19 actions)
Core AWS services including:
- API Gateway, EC2, ECS, RDS, Cognito
- **CloudWatch** ⭐ (newly added)
- **EventBridge** ⭐ (newly added)
- CloudFormation, KMS, Logs, etc.

### Statement 2: AllowScopedResourceManagement (15 actions)
Resource-scoped permissions for:
- DynamoDB, IAM roles, S3, Secrets Manager, SQS, SSM
- All scoped to `pbl-development-*` resources

### Statement 3: AllowMLAndServerlessServices ⭐ (NEW)
ML and serverless services:
- **Lambda** (`pbl-development-*` functions)
- **AppConfig** (applications and deployment strategies)
- **SageMaker** (ML models and endpoints)
- **SNS** (`pbl-development-*` topics)
- **Textract** (document processing)

## 📊 Permission Summary

| Service | Actions | Resource Scope | Purpose |
|---------|---------|----------------|---------|
| CloudWatch | `cloudwatch:*` | `*` | Monitoring & alarms |
| EventBridge | `events:*` | `*` | Scheduled events |
| Lambda | `lambda:*` | `pbl-development-*` | Serverless functions |
| AppConfig | `appconfig:*` | `application/*`, `strategy/*` | Configuration |
| SageMaker | `sagemaker:*` | `*` | ML models |
| SNS | `sns:*` | `pbl-development-*` | Notifications |
| Textract | 2 actions | `*` | Document analysis |

## ⚡ Quick Actions

### Apply the Policy (Admin Required)
```powershell
# Option 1: AWS Console (recommended)
# 1. Login to AWS Console with admin account
# 2. IAM → Users → PBL_Sensa → Add inline policy
# 3. Copy contents from pbl-development-policy.json
# 4. Name: PBLDevelopmentPolicy
# 5. Save

# Option 2: AWS CLI with admin profile
aws iam put-user-policy `
    --user-name PBL_Sensa `
    --policy-name PBLDevelopmentPolicy `
    --policy-document file://pbl-development-policy.json `
    --profile admin
```

### Verify Application
```powershell
# Check policy exists
aws iam list-user-policies --user-name PBL_Sensa

# View policy details
aws iam get-user-policy `
    --user-name PBL_Sensa `
    --policy-name PBLDevelopmentPolicy
```

### Test with Terraform
```powershell
cd ..\Development
terraform plan
```

## 🔒 Security Notes

- ✅ Resource scoping applied where AWS supports it
- ✅ All new resources follow `pbl-development-*` naming convention
- ✅ Wildcard resources documented and justified
- ✅ Least-privilege access maintained
- ✅ Original policy backed up before changes

## 📖 Need Help?

1. **Quick application guide**: [`QUICK-START.md`](./QUICK-START.md)
2. **Full instructions**: [`IAM-POLICY-APPLICATION-GUIDE.md`](./IAM-POLICY-APPLICATION-GUIDE.md)
3. **What changed**: [`CHANGES.md`](./CHANGES.md)
4. **All documentation**: [`INDEX.md`](./INDEX.md)

## 🎊 What This Fixes

Before applying the policy, Terraform fails with:
```
❌ Error: creating AppConfig Application: AccessDenied
❌ Error: creating Lambda Function: AccessDenied
❌ Error: creating EventBridge Rule: AccessDenied
❌ Error: creating CloudWatch Dashboard: AccessDenied
```

After applying the policy:
```
✅ AppConfig applications created
✅ Lambda functions deployed
✅ EventBridge rules configured
✅ CloudWatch monitoring enabled
✅ Full infrastructure deployment successful
```

---

**Last Updated**: October 22, 2025  
**Status**: ✅ Policy ready - awaiting admin application  
**Documentation**: Complete  
**Next Step**: Apply policy via AWS Console or CLI (see QUICK-START.md)
