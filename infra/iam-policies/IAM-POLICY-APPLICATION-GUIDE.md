# IAM Policy Application Guide

## Overview
The IAM policy has been successfully updated with all required permissions for Terraform deployment. However, the `PBL_Sensa` IAM user cannot update its own policy (security best practice). You need to apply this policy using an account with administrative privileges.

## ✓ Completed Tasks

### 1. Backup and Validation ✓
- ✅ Created timestamped backup of original policy
- ✅ Validated current JSON syntax
- ✅ Documented current policy structure

### 2. Policy Updates ✓
- ✅ Added `cloudwatch:*` to AllowAllCoreServices
- ✅ Added `events:*` to AllowAllCoreServices
- ✅ Created new "AllowMLAndServerlessServices" statement with:
  - ✅ AppConfig permissions (`appconfig:*`)
  - ✅ Lambda permissions (`lambda:*`)
  - ✅ SageMaker permissions (`sagemaker:*`)
  - ✅ SNS permissions (`sns:*`)
  - ✅ Textract permissions (DetectDocumentText, AnalyzeDocument)
- ✅ Configured resource scoping:
  - Lambda: `arn:aws:lambda:*:*:function:pbl-development-*`
  - AppConfig: `arn:aws:appconfig:*:*:application/*` and `deploymentstrategy/*`
  - SNS: `arn:aws:sns:*:*:pbl-development-*`
  - SageMaker: `arn:aws:sagemaker:*:*:*` (requires broad access)

### 3. Validation ✓
- ✅ JSON syntax validated successfully
- ✅ Resource ARN patterns verified
- ✅ Security scoping reviewed
- ✅ Three-statement structure confirmed:
  1. AllowAllCoreServices (19 actions)
  2. AllowScopedResourceManagement (15 actions, 9 resource ARNs)
  3. AllowMLAndServerlessServices (6 action groups, 6 resource ARNs)

## 📋 Next Steps - Manual Policy Application

Since the `PBL_Sensa` user cannot update its own policy, you need to apply it using an AWS account with admin privileges:

### Option 1: AWS Console (Recommended)

1. **Login to AWS Console** with an administrator account
2. **Navigate to IAM** → Users → `PBL_Sensa`
3. **Go to Permissions tab** → Add inline policy
4. **Policy Name**: `PBLDevelopmentPolicy`
5. **Policy Document**: Copy the contents from:
   ```
   infra/iam-policies/pbl-development-policy.json
   ```
6. **Review and Create** the policy

### Option 2: AWS CLI with Admin Credentials

If you have AWS CLI configured with admin credentials:

```powershell
# Set AWS profile to your admin account (if using profiles)
$env:AWS_PROFILE = "your-admin-profile"

# Apply the policy
aws iam put-user-policy `
    --user-name PBL_Sensa `
    --policy-name PBLDevelopmentPolicy `
    --policy-document file://infra/iam-policies/pbl-development-policy.json

# Verify the policy
aws iam get-user-policy `
    --user-name PBL_Sensa `
    --policy-name PBLDevelopmentPolicy
```

### Option 3: Use Root Account (Not Recommended)

If you don't have an admin IAM user, you can use the root account, but this is not recommended for security reasons.

## 🔍 Verification Steps

After applying the policy, verify it worked:

1. **Check Policy Attachment**:
   ```powershell
   aws iam list-user-policies --user-name PBL_Sensa
   ```
   Should show: `PBLDevelopmentPolicy`

2. **Verify Policy Content**:
   ```powershell
   aws iam get-user-policy --user-name PBL_Sensa --policy-name PBLDevelopmentPolicy --output json
   ```
   Should show 3 statements with all permissions

3. **Test Terraform**:
   ```powershell
   cd infra/Development
   terraform plan
   ```
   Should complete without permission errors

## 📊 New Permissions Summary

| Service | Actions | Resource Scope | Purpose |
|---------|---------|----------------|---------|
| **CloudWatch** | `cloudwatch:*` | `*` | Monitoring dashboards and alarms |
| **EventBridge** | `events:*` | `*` | Scheduled event rules |
| **AppConfig** | `appconfig:*` | `application/*`, `deploymentstrategy/*` | Application configuration |
| **Lambda** | `lambda:*` | `function:pbl-development-*` | Serverless functions |
| **SageMaker** | `sagemaker:*` | `*` | ML models and endpoints |
| **SNS** | `sns:*` | `pbl-development-*` | Notifications |
| **Textract** | AnalyzeDocument, DetectDocumentText | `*` | Document processing |

## 🔐 Security Notes

- ✅ Resource scoping applied where AWS supports it
- ✅ Wildcards only used where AWS requires it (Textract) or for monitoring (CloudWatch/EventBridge)
- ✅ All new resources follow `pbl-development-*` naming convention
- ✅ Existing permissions preserved unchanged

## 📝 Files Modified

- ✅ `infra/iam-policies/pbl-development-policy.json` - Updated policy
- ✅ `infra/iam-policies/pbl-development-policy.backup.*.json` - Backup created
- ✅ `infra/iam-policies/apply-policy.ps1` - Application script (for admin use)

## ⚠️ Important Notes

1. **Policy Size**: The updated policy is well within AWS's 2048-character inline policy limit
2. **Backward Compatibility**: All existing permissions remain unchanged
3. **Resource Naming**: All resources must use `pbl-development-*` prefix for Lambda, SNS, and S3
4. **SageMaker Scope**: SageMaker requires broad resource access for models, endpoints, and configurations

## 🎯 Expected Terraform Results

Once the policy is applied, Terraform should be able to:

- ✅ Create AppConfig applications and deployment strategies
- ✅ Deploy Lambda functions for document processing
- ✅ Set up EventBridge rules for scheduled tasks
- ✅ Create CloudWatch dashboards and alarms
- ✅ Configure SNS topics for notifications
- ✅ Deploy SageMaker endpoints for ML inference
- ✅ Use Textract for document analysis

## 🔄 Rollback Procedure

If you need to rollback to the previous policy:

```powershell
# The backup file is in infra/iam-policies/
# Find the most recent backup
Get-ChildItem infra/iam-policies/pbl-development-policy.backup.*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# Apply the backup (using admin credentials)
aws iam put-user-policy `
    --user-name PBL_Sensa `
    --policy-name PBLDevelopmentPolicy `
    --policy-document file://infra/iam-policies/pbl-development-policy.backup.YYYY-MM-DD-HHMMSS.json
```

## 📞 Support

If you encounter issues after applying the policy:

1. Check CloudTrail logs for denied API calls
2. Verify resource naming follows `pbl-development-*` convention
3. Ensure AWS region matches your Terraform configuration
4. Review Terraform error messages for specific missing permissions

---

**Status**: ✅ Policy updated and ready for application by admin account
**Next Action**: Apply policy using AWS Console or admin AWS CLI credentials
