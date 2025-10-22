# Requirements Document

## Introduction

The PBL Sensa AWS infrastructure deployment is failing due to insufficient IAM permissions for the `PBL_Sensa` IAM user. The Terraform deployment requires additional permissions for AppConfig, Lambda, EventBridge, CloudWatch, SNS, and SageMaker services to successfully create and manage infrastructure resources. This feature will update the IAM policy to include all necessary permissions while maintaining security best practices through least-privilege access and resource-scoped permissions where possible.

## Requirements

### Requirement 1: AppConfig Service Permissions

**User Story:** As a DevOps engineer, I want the IAM user to have AppConfig permissions, so that Terraform can create and manage application configuration resources.

#### Acceptance Criteria

1. WHEN Terraform attempts to create an AppConfig application THEN the IAM user SHALL have `appconfig:CreateApplication` permission
2. WHEN Terraform attempts to create a deployment strategy THEN the IAM user SHALL have `appconfig:CreateDeploymentStrategy` permission
3. WHEN Terraform manages AppConfig resources THEN the IAM user SHALL have full AppConfig permissions including `appconfig:*` for resource management
4. IF AppConfig resources are tagged THEN the IAM user SHALL have permissions to add and manage tags

### Requirement 2: Lambda Service Permissions

**User Story:** As a DevOps engineer, I want the IAM user to have Lambda permissions, so that Terraform can create and deploy Lambda functions for document processing and feedback handling.

#### Acceptance Criteria

1. WHEN Terraform attempts to create a Lambda function THEN the IAM user SHALL have `lambda:CreateFunction` permission
2. WHEN Lambda functions are configured THEN the IAM user SHALL have `lambda:*` permissions for complete function lifecycle management
3. WHEN Lambda functions require VPC access THEN the IAM user SHALL have permissions to configure VPC settings
4. IF Lambda functions are tagged THEN the IAM user SHALL have permissions to add and manage tags

### Requirement 3: EventBridge Service Permissions

**User Story:** As a DevOps engineer, I want the IAM user to have EventBridge permissions, so that Terraform can create scheduled event rules for automated feedback processing.

#### Acceptance Criteria

1. WHEN Terraform creates an EventBridge rule THEN the IAM user SHALL have `events:PutRule` permission
2. WHEN EventBridge rules are tagged THEN the IAM user SHALL have `events:TagResource` permission
3. WHEN EventBridge rules target Lambda functions THEN the IAM user SHALL have `events:PutTargets` permission
4. WHEN managing event rules THEN the IAM user SHALL have full EventBridge permissions including `events:*`

### Requirement 4: CloudWatch Monitoring Permissions

**User Story:** As a DevOps engineer, I want the IAM user to have CloudWatch permissions, so that Terraform can create dashboards and alarms for infrastructure monitoring.

#### Acceptance Criteria

1. WHEN Terraform creates a CloudWatch dashboard THEN the IAM user SHALL have `cloudwatch:PutDashboard` permission
2. WHEN Terraform creates metric alarms THEN the IAM user SHALL have `cloudwatch:PutMetricAlarm` permission
3. WHEN managing CloudWatch resources THEN the IAM user SHALL have full CloudWatch permissions including `cloudwatch:*`
4. IF CloudWatch resources are tagged THEN the IAM user SHALL have permissions to add and manage tags

### Requirement 5: SNS Service Permissions

**User Story:** As a DevOps engineer, I want the IAM user to have SNS permissions, so that Terraform can create topics for alarm notifications.

#### Acceptance Criteria

1. WHEN Terraform creates an SNS topic THEN the IAM user SHALL have `sns:CreateTopic` permission
2. WHEN SNS topics are configured THEN the IAM user SHALL have `sns:*` permissions for complete topic management
3. WHEN SNS topics are subscribed THEN the IAM user SHALL have permissions to manage subscriptions
4. IF SNS topics are tagged THEN the IAM user SHALL have permissions to add and manage tags

### Requirement 6: SageMaker Service Permissions

**User Story:** As a DevOps engineer, I want the IAM user to have SageMaker permissions, so that Terraform can create and deploy ML models for document analysis.

#### Acceptance Criteria

1. WHEN Terraform creates a SageMaker model THEN the IAM user SHALL have `sagemaker:CreateModel` permission
2. WHEN SageMaker resources are tagged THEN the IAM user SHALL have `sagemaker:AddTags` permission
3. WHEN managing SageMaker endpoints THEN the IAM user SHALL have `sagemaker:*` permissions for complete lifecycle management
4. WHEN SageMaker accesses S3 resources THEN the IAM user SHALL have permissions to configure IAM roles for SageMaker

### Requirement 7: Textract Service Permissions

**User Story:** As a DevOps engineer, I want the IAM user to have Textract permissions, so that Lambda functions can perform document text extraction and analysis.

#### Acceptance Criteria

1. WHEN Lambda functions call Textract THEN the IAM user SHALL have `textract:DetectDocumentText` permission
2. WHEN Lambda functions analyze documents THEN the IAM user SHALL have `textract:AnalyzeDocument` permission
3. WHEN Textract processes documents THEN the IAM user SHALL have permissions for all document analysis operations

### Requirement 8: Resource Scoping and Security

**User Story:** As a security engineer, I want IAM permissions to follow least-privilege principles, so that the deployment user has only necessary permissions scoped to specific resources where possible.

#### Acceptance Criteria

1. WHEN permissions can be resource-scoped THEN the IAM policy SHALL limit permissions to `pbl-development-*` resources
2. WHEN permissions require wildcard resources THEN the policy SHALL document the reason for broad access
3. WHEN the policy is updated THEN it SHALL maintain existing resource scoping for S3, IAM roles, and other scopable services
4. IF new services are added THEN they SHALL use resource scoping where AWS service capabilities allow

### Requirement 9: Policy Update and Validation

**User Story:** As a DevOps engineer, I want to safely update and apply the IAM policy, so that permissions are granted without disrupting existing infrastructure.

#### Acceptance Criteria

1. WHEN the policy is updated THEN it SHALL be validated for correct JSON syntax
2. WHEN the policy is applied THEN existing permissions SHALL be preserved
3. WHEN the policy is applied THEN the user SHALL verify successful application through AWS Console or CLI
4. IF policy application fails THEN the system SHALL provide clear error messages for troubleshooting
