# ============================================================================
# Amazon SageMaker - Layer 3: Hierarchical Document Processing
# ============================================================================

# SageMaker Execution Role
resource "aws_iam_role" "sagemaker" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-sagemaker"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "sagemaker.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-sagemaker-role"
  }
}

resource "aws_iam_role_policy_attachment" "sagemaker_full_access" {
  role       = aws_iam_role.sagemaker.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
}

resource "aws_iam_role_policy" "sagemaker_s3_access" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-sagemaker-s3"
  role = aws_iam_role.sagemaker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      }
    ]
  })
}

# SageMaker Model (HDT-E for embeddings)
# Note: You'll need to deploy the model manually first or use a pre-existing endpoint
resource "aws_sagemaker_model" "hdt_e" {
  name               = "${var.project_name}-${var.environment}-${var.developer_id}-hdt-e"
  execution_role_arn = aws_iam_role.sagemaker.arn

  primary_container {
    # This is a placeholder - you'll need to build and push the model container
    # Or use HuggingFace inference container
    image = "763104351884.dkr.ecr.${var.aws_region}.amazonaws.com/huggingface-pytorch-inference:2.0.0-transformers4.28.1-cpu-py310-ubuntu20.04"
    
    environment = {
      HF_MODEL_ID = "howey/HDT-E"
      HF_TASK     = "feature-extraction"
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-hdt-e-model"
  }
}

# SageMaker Serverless Endpoint Config
resource "aws_sagemaker_endpoint_configuration" "hdt_e_serverless" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-hdt-e-serverless"

  production_variants {
    variant_name = "AllTraffic"
    model_name   = aws_sagemaker_model.hdt_e.name

    serverless_config {
      memory_size_in_mb = 4096
      max_concurrency   = 5
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-hdt-e-endpoint-config"
  }
}

# SageMaker Endpoint
resource "aws_sagemaker_endpoint" "hdt_e" {
  name                 = "${var.project_name}-${var.environment}-${var.developer_id}-hdt-e"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.hdt_e_serverless.name

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-hdt-e-endpoint"
  }
}

# Add SageMaker permissions to ECS task role
resource "aws_iam_role_policy" "ecs_task_sagemaker" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-ecs-sagemaker"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sagemaker:InvokeEndpoint"
        ]
        Resource = aws_sagemaker_endpoint.hdt_e.arn
      }
    ]
  })
}
