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

# SageMaker Model - Using HuggingFace container with HDT-E model
# Note: Container is 13.6 GB, requires real-time endpoint (not serverless)
resource "aws_sagemaker_model" "embeddings" {
  name               = "${var.project_name}-${var.environment}-${var.developer_id}-embeddings"
  execution_role_arn = aws_iam_role.sagemaker.arn

  primary_container {
    # HuggingFace PyTorch inference container
    image = "763104351884.dkr.ecr.${var.aws_region}.amazonaws.com/huggingface-pytorch-inference:2.0.0-transformers4.28.1-cpu-py310-ubuntu20.04"
    
    environment = {
      HF_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
      HF_TASK     = "feature-extraction"
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-embeddings-model"
  }
}

# SageMaker Real-Time Endpoint Config
# Using real-time endpoint because container is 13.6 GB (serverless limit is 10 GB)
# Cost: ~$42/month for ml.t2.medium instance (runs continuously)
resource "aws_sagemaker_endpoint_configuration" "embeddings_realtime" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-embeddings-realtime"

  production_variants {
    variant_name           = "AllTraffic"
    model_name             = aws_sagemaker_model.embeddings.name
    instance_type          = "ml.t2.medium"  # Cheapest valid SageMaker instance ($0.0582/hour)
    initial_instance_count = 1
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-embeddings-endpoint-config"
  }
}

# SageMaker Endpoint
resource "aws_sagemaker_endpoint" "embeddings" {
  name                 = "${var.project_name}-${var.environment}-${var.developer_id}-embeddings"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.embeddings_realtime.name

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-embeddings-endpoint"
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
        Resource = aws_sagemaker_endpoint.embeddings.arn
      }
    ]
  })
}

