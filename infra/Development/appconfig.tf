# ============================================================================
# AWS AppConfig - Layer 11: Feature Flags
# ============================================================================

# AppConfig Application
resource "aws_appconfig_application" "main" {
  name        = "${var.project_name}-${var.environment}-${var.developer_id}"
  description = "Feature flags and configuration for PBL platform"

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-appconfig"
  }
}

# AppConfig Environment
resource "aws_appconfig_environment" "dev" {
  name           = "development"
  description    = "Development environment configuration"
  application_id = aws_appconfig_application.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-appconfig-env"
  }
}

# AppConfig Configuration Profile for Feature Flags
resource "aws_appconfig_configuration_profile" "feature_flags" {
  application_id = aws_appconfig_application.main.id
  name           = "feature-flags"
  description    = "Feature flags for A/B testing and gradual rollouts"
  location_uri   = "hosted"
  type           = "AWS.AppConfig.FeatureFlags"

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-feature-flags"
  }
}

# Initial Feature Flags Configuration
# Simplified format compatible with AWS AppConfig Feature Flags
resource "aws_appconfig_hosted_configuration_version" "feature_flags_v1" {
  application_id           = aws_appconfig_application.main.id
  configuration_profile_id = aws_appconfig_configuration_profile.feature_flags.configuration_profile_id
  description              = "Initial feature flags configuration"
  content_type             = "application/json"

  content = jsonencode({
    flags = {
      use_llamaparse = {
        name = "use_llamaparse"
      }
      use_claude_35_sonnet = {
        name = "use_claude_35_sonnet"
      }
      enable_exam_relevance = {
        name = "enable_exam_relevance"
      }
      enable_multi_document_synthesis = {
        name = "enable_multi_document_synthesis"
      }
      use_sagemaker_embeddings = {
        name = "use_sagemaker_embeddings"
      }
    }
    values = {
      use_llamaparse = {
        enabled = true
      }
      use_claude_35_sonnet = {
        enabled = true
      }
      enable_exam_relevance = {
        enabled = false
      }
      enable_multi_document_synthesis = {
        enabled = false
      }
      use_sagemaker_embeddings = {
        enabled = false
      }
    }
    version = "1"
  })
}

# Deployment Strategy
resource "aws_appconfig_deployment_strategy" "gradual_rollout" {
  name                           = "${var.project_name}-${var.environment}-${var.developer_id}-gradual"
  description                    = "Gradual rollout over 10 minutes with monitoring"
  deployment_duration_in_minutes = 10
  growth_factor                  = 10
  replicate_to                   = "NONE"
  final_bake_time_in_minutes     = 5

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-deployment-strategy"
  }
}

# Add AppConfig permissions to ECS task role
resource "aws_iam_role_policy" "ecs_task_appconfig" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-ecs-appconfig"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "appconfig:GetLatestConfiguration",
          "appconfig:StartConfigurationSession"
        ]
        Resource = "*"
      }
    ]
  })
}
