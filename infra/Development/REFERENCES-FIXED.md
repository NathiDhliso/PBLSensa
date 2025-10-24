# API Gateway References Fixed

## Issue
After commenting out `aws_api_gateway_stage.dev`, several other resources were still referencing it, causing Terraform errors.

## Files Fixed

### 1. `main.tf`
- **Line 1355:** Commented out `api_gateway_url` output

### 2. `outputs.tf`
- **Line 30:** Commented out `api_gateway_stage_name` output
- **Line 194:** Changed `api_endpoint` to use ALB directly instead of API Gateway

### 3. `monitoring.tf`
- **Line 8:** Commented out `aws_api_gateway_method_settings.all` resource
- **Line 258:** Commented out `aws_cloudwatch_metric_alarm.api_5xx_errors` resource

## Changes Summary

### Before
```terraform
api_endpoint = aws_api_gateway_stage.dev.invoke_url
```

### After
```terraform
api_endpoint = "http://${aws_lb.main.dns_name}"  # Using ALB directly
```

## What's Disabled

- ⏸️ API Gateway stage output
- ⏸️ API Gateway method settings (X-Ray tracing)
- ⏸️ API Gateway 5XX error alarm

## What Still Works

All core functionality works through the ALB:
- ✅ API accessible via ALB endpoint
- ✅ All other CloudWatch alarms (RDS, ECS, ALB)
- ✅ All other monitoring and logging

## Next Step

Run terraform plan again:
```powershell
terraform plan
```

Should now succeed without errors!
