# Implementation Plan

- [ ] 1. Backup and validate current IAM policy
  - Create a backup copy of the existing policy file with timestamp
  - Validate current JSON syntax using jq or Python
  - Document current policy structure and permissions
  - _Requirements: 9.1, 9.2_

- [ ] 2. Update IAM policy with missing permissions
  - [ ] 2.1 Add CloudWatch and EventBridge to core services statement
    - Add `cloudwatch:*` to AllowAllCoreServices actions array
    - Add `events:*` to AllowAllCoreServices actions array
    - Maintain existing action order and formatting
    - _Requirements: 3.4, 4.3_

  - [ ] 2.2 Create new ML and serverless services statement
    - Add new statement with Sid "AllowMLAndServerlessServices"
    - Include Lambda, AppConfig, SNS, SageMaker, Textract actions
    - Define resource ARN patterns for each service
    - _Requirements: 1.3, 2.2, 5.2, 6.3, 7.2_

  - [ ] 2.3 Configure resource scoping for Lambda functions
    - Add Lambda resource ARN: `arn:aws:lambda:*:*:function:pbl-development-*`
    - Include all Lambda actions: `lambda:*`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 2.4 Configure resource scoping for AppConfig
    - Add AppConfig application ARN: `arn:aws:appconfig:*:*:application/*`
    - Add AppConfig deployment strategy ARN: `arn:aws:appconfig:*:*:deploymentstrategy/*`
    - Include all AppConfig actions: `appconfig:*`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.5 Configure resource scoping for SNS topics
    - Add SNS resource ARN: `arn:aws:sns:*:*:pbl-development-*`
    - Include all SNS actions: `sns:*`
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 2.6 Configure SageMaker permissions
    - Add SageMaker resource ARN: `arn:aws:sagemaker:*:*:*`
    - Include all SageMaker actions: `sagemaker:*`
    - Document reason for wildcard resource scope
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 2.7 Configure Textract permissions
    - Add Textract actions: `textract:DetectDocumentText`, `textract:AnalyzeDocument`
    - Use wildcard resource (Textract doesn't support resource-level permissions)
    - Document reason for wildcard resource scope
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 3. Validate updated policy structure
  - [ ] 3.1 Validate JSON syntax
    - Run JSON validation using jq or Python json module
    - Check for proper bracket matching and comma placement
    - Verify all ARN patterns follow AWS conventions
    - _Requirements: 9.1_

  - [ ] 3.2 Review security and resource scoping
    - Verify resource scoping is applied where possible
    - Confirm wildcard resources are documented and justified
    - Check that existing permissions are preserved
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 4. Apply IAM policy to AWS
  - [ ] 4.1 Create policy application script
    - Write PowerShell script to apply policy using AWS CLI
    - Include error handling and validation checks
    - Add rollback capability if application fails
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ] 4.2 Apply policy to PBL_Sensa IAM user
    - Execute AWS CLI command to update user policy
    - Capture and log the response
    - Verify successful application through AWS CLI
    - _Requirements: 9.2, 9.3_

  - [ ] 4.3 Verify policy application
    - Retrieve applied policy from AWS
    - Compare applied policy with local file
    - Confirm all permissions are granted
    - _Requirements: 9.3_

- [ ] 5. Test Terraform deployment with new permissions
  - [ ] 5.1 Run Terraform plan
    - Navigate to infra/Development directory
    - Execute `terraform plan` command
    - Verify no permission-related errors appear
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

  - [ ] 5.2 Verify service-specific permissions
    - Check AppConfig resources can be planned
    - Check Lambda resources can be planned
    - Check EventBridge resources can be planned
    - Check CloudWatch resources can be planned
    - Check SNS resources can be planned
    - Check SageMaker resources can be planned
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

  - [ ] 5.3 Document any remaining issues
    - Log any permission errors that still occur
    - Identify root cause of remaining issues
    - Update policy if additional permissions needed
    - _Requirements: 9.4_

- [ ] 6. Create documentation and cleanup
  - [ ] 6.1 Update deployment documentation
    - Document the IAM policy changes made
    - Add troubleshooting guide for permission issues
    - Include instructions for applying policy updates
    - _Requirements: 9.1, 9.2_

  - [ ] 6.2 Create policy update script for future use
    - Write reusable script for applying IAM policy updates
    - Include validation and rollback capabilities
    - Add to infra/scripts directory
    - _Requirements: 9.2, 9.3_
