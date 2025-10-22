# Development Infrastructure Changes

## Summary

Added complete authentication, API Gateway, and load balancing infrastructure to the Development Terraform configuration.

## What Was Added

### 1. AWS Cognito User Pool
**Resources:**
- `aws_cognito_user_pool.main` - User pool for authentication
- `aws_cognito_user_pool_client.web` - Web application client
- `aws_cognito_user_pool_domain.main` - Hosted UI domain

**Configuration:**
- Email-based authentication
- Password policy: 8+ chars, uppercase, lowercase, numbers
- MFA disabled (development)
- Token validity: 1 hour (access/id), 30 days (refresh)

**Outputs:**
- `cognito_user_pool_id`
- `cognito_client_id`
- `cognito_domain`

### 2. Application Load Balancer
**Resources:**
- `aws_lb.main` - Application Load Balancer
- `aws_lb_target_group.api` - Target group for ECS tasks
- `aws_lb_listener.http` - HTTP listener (port 80)

**Configuration:**
- Internet-facing
- HTTP only (no HTTPS for dev to save on ACM costs)
- Health checks on `/health` endpoint
- Deregistration delay: 30 seconds

**Outputs:**
- `alb_dns_name`

### 3. API Gateway
**Resources:**
- `aws_api_gateway_rest_api.main` - REST API
- `aws_api_gateway_vpc_link.main` - VPC Link to ALB
- `aws_api_gateway_deployment.main` - API deployment
- `aws_api_gateway_stage.dev` - Development stage
- `aws_cloudwatch_log_group.api_gateway` - API Gateway logs

**Configuration:**
- Regional endpoint
- VPC Link integration with ALB
- CloudWatch logging (7-day retention)
- Stage name: `dev`

**Outputs:**
- `api_gateway_url`

### 4. ECS Task Definitions
**Resources:**
- `aws_ecs_task_definition.api` - API service task
- `aws_ecs_task_definition.worker` - Worker service task

**API Task Configuration:**
- CPU: 1024 (1 vCPU)
- Memory: 2048 MB (2 GB)
- Port: 8000
- Health check: curl on /health
- Environment variables: DB, Redis, Cognito, S3 configs
- Secrets: DB credentials, API keys

**Worker Task Configuration:**
- CPU: 2048 (2 vCPU)
- Memory: 4096 MB (4 GB)
- Environment variables: DB, Redis, SQS, S3 configs
- Secrets: DB credentials, LlamaParse API key

### 5. ECS Services
**Resources:**
- `aws_ecs_service.api` - API service
- `aws_ecs_service.worker` - Worker service

**Configuration:**
- Launch type: FARGATE
- Desired count: 1 each
- Network: Private subnets
- API service connected to ALB target group

### 6. Secrets Manager
**Resources:**
- `aws_secretsmanager_secret.api_keys` - Third-party API keys
- `aws_secretsmanager_secret_version.api_keys` - API keys values

**Stored Keys:**
- LlamaParse API key
- Eleven Labs API key
- Brain.fm API key

**Outputs:**
- `api_keys_secret_arn`

### 7. S3 Event Notifications
**Resources:**
- `aws_s3_bucket_notification.pdf_upload` - S3 to SQS notification
- `aws_sqs_queue_policy.pdf_uploads` - SQS policy for S3

**Configuration:**
- Trigger: S3 ObjectCreated events
- Filter: `.pdf` files only
- Target: SQS documents queue

### 8. Enhanced IAM Policies
**Updated Resources:**
- `aws_iam_role_policy.ecs_execution_secrets` - Secrets Manager access
- `aws_iam_role_policy.ecs_task_permissions` - Enhanced permissions

**New Permissions:**
- Bedrock: InvokeModel for Claude 3.5 Sonnet
- Textract: Document analysis
- Cognito: User management
- S3: ListBucket
- SQS: GetQueueAttributes

## Resource Count

**Before:** ~40 resources
**After:** ~60 resources

**New Resources:** 20+
- Cognito: 3
- API Gateway: 5
- ALB: 3
- ECS: 4
- Secrets: 2
- IAM: 2
- S3 Notifications: 2

## Configuration Changes

### terraform.tfvars
No changes required - same variables work.

### Outputs
Added 4 new outputs:
- `cognito_user_pool_id`
- `cognito_client_id`
- `cognito_domain`
- `alb_dns_name`
- `api_gateway_url`
- `api_keys_secret_arn`

## Cost Impact

**Additional Monthly Costs:**
- ALB: +$16/month
- API Gateway: +$3-5/month
- Cognito: $0 (free tier < 50K MAU)

**New Total:** ~$158-170/month (was ~$140-150/month)

## Migration Steps

If you have existing infrastructure:

1. **Backup current state:**
   ```bash
   terraform state pull > backup.tfstate
   ```

2. **Update configuration:**
   ```bash
   git pull
   ```

3. **Review changes:**
   ```bash
   terraform plan
   ```

4. **Apply updates:**
   ```bash
   terraform apply
   ```

5. **Update frontend .env:**
   ```bash
   # Add new Cognito variables
   VITE_COGNITO_USER_POOL_ID=<from terraform output>
   VITE_COGNITO_CLIENT_ID=<from terraform output>
   ```

6. **Update API keys in Secrets Manager:**
   ```bash
   aws secretsmanager put-secret-value \
       --secret-id $(terraform output -raw api_keys_secret_arn) \
       --secret-string '{"llamaparse":"YOUR_KEY","elevenlabs":"YOUR_KEY","brainfm":"YOUR_KEY"}'
   ```

## Breaking Changes

None - all changes are additive. Existing resources are not modified.

## Testing Checklist

- [ ] Cognito user pool created
- [ ] Can create test user in Cognito
- [ ] ALB health check passes
- [ ] API Gateway returns 200 on /health
- [ ] ECS tasks running (API + Worker)
- [ ] S3 upload triggers SQS message
- [ ] Frontend can authenticate with Cognito
- [ ] API can access Secrets Manager
- [ ] Worker can process SQS messages

## Rollback Plan

If issues occur:

```bash
# Revert to previous Terraform configuration
git checkout HEAD~1 infra/Development/main.tf

# Apply previous configuration
terraform apply

# Or destroy new resources manually
terraform destroy -target=aws_cognito_user_pool.main
terraform destroy -target=aws_lb.main
terraform destroy -target=aws_api_gateway_rest_api.main
```

## Documentation Updates

- [x] Updated main.tf with new resources
- [x] Created DEPLOY_UPDATED.md with deployment guide
- [x] Created CHANGES.md (this file)
- [ ] Update main README.md with Cognito setup
- [ ] Update architecture.md with new components
- [ ] Update API documentation with authentication

## Next Steps

1. Deploy the updated infrastructure
2. Test all new components
3. Update application code to use Cognito
4. Configure CI/CD for automatic deployments
5. Set up monitoring for new services
6. Document authentication flows
7. Create user management scripts

## Support

Questions or issues? Check:
- DEPLOY_UPDATED.md for deployment instructions
- ../README.md for infrastructure overview
- ../../src/documentation/architecture.md for architecture details
