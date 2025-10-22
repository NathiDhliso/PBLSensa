# ============================================================================
# Terraform Outputs - Additional Outputs Only
# (Base outputs like vpc_id, rds_endpoint, etc. are already in main.tf)
# ============================================================================

# Networking (additional details)
output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_zone_id" {
  description = "ALB Zone ID for Route53"
  value       = aws_lb.main.zone_id
}

# API Gateway (additional)
output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.dev.stage_name
}

# Storage (additional)
output "logs_bucket" {
  description = "S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

# Queues (additional)
output "sqs_dlq_url" {
  description = "SQS dead letter queue URL"
  value       = aws_sqs_queue.dlq.url
}

output "sqs_dlq_arn" {
  description = "SQS dead letter queue ARN"
  value       = aws_sqs_queue.dlq.arn
}

# ECS (additional)
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

# Cognito (additional)
output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_user_pool_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

# ============================================================================
# NEW Resource Outputs (from new modules)
# ============================================================================

# SageMaker
output "sagemaker_endpoint_name" {
  description = "SageMaker endpoint name for embeddings"
  value       = aws_sagemaker_endpoint.hdt_e.name
}

output "sagemaker_endpoint_arn" {
  description = "SageMaker endpoint ARN"
  value       = aws_sagemaker_endpoint.hdt_e.arn
}

output "sagemaker_model_name" {
  description = "SageMaker model name"
  value       = aws_sagemaker_model.hdt_e.name
}

# Lambda Functions
output "pdf_validator_function_name" {
  description = "PDF validator Lambda function name"
  value       = aws_lambda_function.pdf_validator.function_name
}

output "pdf_validator_function_arn" {
  description = "PDF validator Lambda function ARN"
  value       = aws_lambda_function.pdf_validator.arn
}

output "feedback_processor_function_name" {
  description = "Feedback processor Lambda function name"
  value       = aws_lambda_function.feedback_processor.function_name
}

output "feedback_processor_function_arn" {
  description = "Feedback processor Lambda function ARN"
  value       = aws_lambda_function.feedback_processor.arn
}

# CloudWatch Monitoring
output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_alarms_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = aws_sns_topic.alarms.arn
}

# AppConfig
output "appconfig_application_id" {
  description = "AppConfig application ID"
  value       = aws_appconfig_application.main.id
}

output "appconfig_environment_id" {
  description = "AppConfig environment ID"
  value       = aws_appconfig_environment.dev.environment_id
}

output "appconfig_configuration_profile_id" {
  description = "AppConfig feature flags configuration profile ID"
  value       = aws_appconfig_configuration_profile.feature_flags.configuration_profile_id
}

# Security Groups (additional)
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "fargate_security_group_id" {
  description = "Fargate security group ID"
  value       = aws_security_group.fargate.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "elasticache_security_group_id" {
  description = "ElastiCache security group ID"
  value       = aws_security_group.elasticache.id
}

# IAM Roles (additional)
output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_execution_role_arn" {
  description = "ECS execution role ARN"
  value       = aws_iam_role.ecs_execution.arn
}

output "lambda_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda.arn
}

output "sagemaker_role_arn" {
  description = "SageMaker execution role ARN"
  value       = aws_iam_role.sagemaker.arn
}

# Deployment Summary
output "deployment_summary" {
  description = "Deployment summary with key endpoints"
  value = {
    environment         = var.environment
    developer_id        = var.developer_id
    region              = var.aws_region
    api_endpoint        = aws_api_gateway_stage.dev.invoke_url
    alb_endpoint        = "http://${aws_lb.main.dns_name}"
    dashboard_url       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
    cognito_pool_id     = aws_cognito_user_pool.main.id
    s3_upload_bucket    = aws_s3_bucket.pdf_uploads.id
    sqs_queue_url       = aws_sqs_queue.documents.url
    sagemaker_endpoint  = aws_sagemaker_endpoint.hdt_e.name
  }
}
