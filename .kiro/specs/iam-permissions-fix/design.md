# Design Document

## Overview

This design addresses the IAM permission gaps preventing successful Terraform deployment of the PBL Sensa AWS infrastructure. The solution involves updating the existing IAM policy JSON file (`infra/iam-policies/pbl-development-policy.json`) to include permissions for AppConfig, Lambda, EventBridge, CloudWatch, SNS, SageMaker, and Textract services. The design maintains security best practices by using resource scoping where possible and organizing permissions into logical statement groups.

## Architecture

### Current State

The existing IAM policy has two main statements:
1. **AllowAllCoreServices**: Broad permissions for API Gateway, EC2, ECS, RDS, Cognito, and other core services
2. **AllowScopedResourceManagement**: Resource-scoped permissions for S3, IAM roles, Secrets Manager, SQS, and SSM

### Proposed State

The updated policy will add a third statement for the missing services:
1. **AllowAllCoreServices**: Keep existing + add CloudWatch, EventBridge
2. **AllowScopedResourceManagement**: Keep existing
3. **AllowMLAndServerlessServices**: New statement for Lambda, AppConfig, SageMaker, SNS, Textract with appropriate scoping

### Design Rationale

- **Grouped by Service Type**: Organizing permissions by service category (core, scoped, ML/serverless) improves maintainability
- **Resource Scoping**: Lambda, AppConfig, and SNS will be scoped to `pbl-development-*` resources
- **Wildcard Resources**: SageMaker and Textract require wildcard resources due to AWS service limitations
- **Backward Compatibility**: Existing permissions remain unchanged to avoid disrupting current infrastructure

## Components and Interfaces

### IAM Policy Structure

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAllCoreServices",
      "Effect": "Allow",
      "Action": [...existing + cloudwatch:*, events:*],
      "Resource": "*"
    },
    {
      "Sid": "AllowScopedResourceManagement",
      "Effect": "Allow",
      "Action": [...existing],
      "Resource": [...existing]
    },
    {
      "Sid": "AllowMLAndServerlessServices",
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "appconfig:*",
        "sns:*",
        "sagemaker:*",
        "textract:DetectDocumentText",
        "textract:AnalyzeDocument"
      ],
      "Resource": [
        "arn:aws:lambda:*:*:function:pbl-development-*",
        "arn:aws:appconfig:*:*:application/*",
        "arn:aws:appconfig:*:*:deploymentstrategy/*",
        "arn:aws:sns:*:*:pbl-development-*",
        "arn:aws:sagemaker:*:*:*"
      ]
    }
  ]
}
```

### Permission Mapping

| Service | Actions | Resource Scope | Justification |
|---------|---------|----------------|---------------|
| CloudWatch | `cloudwatch:*` | `*` | Monitoring requires access to all metrics and dashboards |
| EventBridge | `events:*` | `*` | Event rules can target multiple services |
| Lambda | `lambda:*` | `arn:aws:lambda:*:*:function:pbl-development-*` | Scoped to project functions |
| AppConfig | `appconfig:*` | `arn:aws:appconfig:*:*:application/*`, `arn:aws:appconfig:*:*:deploymentstrategy/*` | Scoped to applications and strategies |
| SNS | `sns:*` | `arn:aws:sns:*:*:pbl-development-*` | Scoped to project topics |
| SageMaker | `sagemaker:*` | `arn:aws:sagemaker:*:*:*` | Broad access needed for models, endpoints, configs |
| Textract | `textract:DetectDocumentText`, `textract:AnalyzeDocument` | `*` | Textract doesn't support resource-level permissions |

## Data Models

### Policy Document Structure

```typescript
interface IAMPolicy {
  Version: string;
  Statement: PolicyStatement[];
}

interface PolicyStatement {
  Sid: string;
  Effect: "Allow" | "Deny";
  Action: string[];
  Resource: string | string[];
  Condition?: Record<string, any>;
}
```

### Resource ARN Patterns

- Lambda: `arn:aws:lambda:{region}:{account}:function:pbl-development-*`
- AppConfig: `arn:aws:appconfig:{region}:{account}:application/*`
- SNS: `arn:aws:sns:{region}:{account}:pbl-development-*`
- SageMaker: `arn:aws:sagemaker:{region}:{account}:*`

## Error Handling

### Policy Validation

1. **JSON Syntax Validation**: Validate JSON structure before applying
2. **ARN Format Validation**: Ensure ARN patterns follow AWS conventions
3. **Permission Conflicts**: Check for overlapping or conflicting permissions

### Application Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Invalid JSON | Provide syntax error details and line number |
| Policy Size Limit | Split into managed policies if needed |
| Permission Denied | Verify user has `iam:PutUserPolicy` permission |
| Resource Not Found | Verify IAM user exists before applying |

### Rollback Strategy

1. Keep backup of original policy file
2. If application fails, restore from backup
3. Document the error for troubleshooting
4. Verify restoration through AWS Console

## Testing Strategy

### Pre-Deployment Validation

1. **JSON Validation**: Use `jq` or Python to validate JSON syntax
2. **Policy Simulator**: Use AWS IAM Policy Simulator to test permissions
3. **Dry Run**: Review policy changes in AWS Console before applying

### Post-Deployment Verification

1. **Permission Check**: Verify each required permission is granted
2. **Terraform Plan**: Run `terraform plan` to confirm no permission errors
3. **Service Access**: Test access to each service (Lambda, SageMaker, etc.)

### Test Cases

```bash
# Test 1: Validate JSON syntax
jq empty infra/iam-policies/pbl-development-policy.json

# Test 2: Apply policy (requires AWS CLI configured)
aws iam put-user-policy \
  --user-name PBL_Sensa \
  --policy-name pbl-development-policy \
  --policy-document file://infra/iam-policies/pbl-development-policy.json

# Test 3: Verify policy attached
aws iam get-user-policy \
  --user-name PBL_Sensa \
  --policy-name pbl-development-policy

# Test 4: Run Terraform plan
cd infra/Development
terraform plan
```

### Success Criteria

- JSON validation passes without errors
- Policy applies successfully via AWS CLI or Console
- Terraform plan executes without permission errors
- All previously failing resources can now be created

## Implementation Notes

### Security Considerations

1. **Least Privilege**: Use resource scoping wherever AWS service supports it
2. **Regular Review**: Schedule quarterly reviews of IAM permissions
3. **Audit Logging**: Enable CloudTrail to monitor IAM policy usage
4. **Separation of Duties**: Consider separate policies for different environments (dev, staging, prod)

### Maintenance

1. **Version Control**: Track all policy changes in Git
2. **Documentation**: Update this design doc when adding new services
3. **Naming Convention**: Maintain `pbl-development-*` prefix for all resources
4. **Policy Updates**: Test in development environment before applying to production

### Alternative Approaches Considered

1. **Managed Policies**: Using AWS managed policies (rejected due to overly broad permissions)
2. **Multiple Policies**: Splitting into service-specific policies (rejected for simplicity)
3. **IAM Roles**: Using roles instead of user policies (future consideration for CI/CD)
