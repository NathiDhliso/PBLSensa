# ============================================================================
# Terraform Configuration for Perspective-Based Learning Platform
# Version: 7.0 (Development Environment)
# ============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "pbl-terraform-state-dev"
    key            = "development/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "pbl-terraform-locks-dev"
  }
}

# ============================================================================
# Variables
# ============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "developer_id" {
  description = "Unique identifier for developer (e.g., initials or username)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "pbl"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
  default     = "pbl_admin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.1.0.0/16"
}

# ============================================================================
# Provider Configuration
# ============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      Developer   = var.developer_id
      ManagedBy   = "Terraform"
      CostCenter  = "Development"
    }
  }
}

# ============================================================================
# Data Sources
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ============================================================================
# KMS Encryption Key
# ============================================================================

resource "aws_kms_key" "main" {
  description             = "${var.project_name}-${var.environment}-${var.developer_id}-key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-kms"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}-${var.developer_id}"
  target_key_id = aws_kms_key.main.key_id
}

# ============================================================================
# VPC and Networking
# ============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-igw"
  }
}

# Public Subnets (2 AZs for cost optimization)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-public-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets (2 AZs)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-private-${count.index + 1}"
    Type = "Private"
  }
}

# Single NAT Gateway for cost optimization
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-nat-eip"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-nat"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-public-rt"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-private-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ============================================================================
# Security Groups
# ============================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-${var.developer_id}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-alb-sg"
  }
}

# Fargate Security Group
resource "aws_security_group" "fargate" {
  name_prefix = "${var.project_name}-${var.environment}-${var.developer_id}-fargate-"
  description = "Security group for Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-fargate-sg"
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-${var.environment}-${var.developer_id}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.fargate.id]
    description     = "PostgreSQL from Fargate"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-rds-sg"
  }
}

# ElastiCache Security Group
resource "aws_security_group" "elasticache" {
  name_prefix = "${var.project_name}-${var.environment}-${var.developer_id}-redis-"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.fargate.id]
    description     = "Redis from Fargate"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-redis-sg"
  }
}

# ============================================================================
# S3 Buckets
# ============================================================================

# PDF Uploads Bucket
resource "aws_s3_bucket" "pdf_uploads" {
  bucket = "${var.project_name}-${var.environment}-${var.developer_id}-pdf-uploads-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-pdf-uploads"
  }
}

resource "aws_s3_bucket_versioning" "pdf_uploads" {
  bucket = aws_s3_bucket.pdf_uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pdf_uploads" {
  bucket = aws_s3_bucket.pdf_uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "pdf_uploads" {
  bucket = aws_s3_bucket.pdf_uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Artifacts Bucket
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.project_name}-${var.environment}-${var.developer_id}-artifacts-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-artifacts"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# Logs Bucket
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-${var.environment}-${var.developer_id}-logs-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-logs"
  }
}

# ============================================================================
# RDS PostgreSQL
# ============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-${var.developer_id}-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-db-subnet"
  }
}

resource "aws_db_parameter_group" "postgres15" {
  name        = "${var.project_name}-${var.environment}-${var.developer_id}-pg15"
  family      = "postgres15"
  description = "Development parameter group for PostgreSQL 15"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-pg15-params"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment}-${var.developer_id}-db"
  engine         = "postgres"
  engine_version = "15.10"  # Updated from 15.8 (no longer available)
  instance_class = "db.t4g.medium"

  allocated_storage     = 50
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = replace("${var.project_name}_${var.environment}", "-", "_")
  username = var.db_username
  password = var.db_password

  multi_az               = false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres15.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  deletion_protection = false
  skip_final_snapshot = true
  publicly_accessible = false

  performance_insights_enabled = false

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-db"
  }
}

# ============================================================================
# ElastiCache Redis
# ============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-${var.developer_id}-cache-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-cache-subnet"
  }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.project_name}-${var.environment}-${var.developer_id}-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-redis"
  }
}

# ============================================================================
# SQS Queues
# ============================================================================

resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project_name}-${var.environment}-${var.developer_id}-documents-dlq"
  message_retention_seconds = 1209600

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-dlq"
  }
}

resource "aws_sqs_queue" "documents" {
  name                       = "${var.project_name}-${var.environment}-${var.developer_id}-documents-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 5
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-documents-queue"
  }
}

# ============================================================================
# ECR Repositories
# ============================================================================

resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}/${var.environment}/${var.developer_id}/api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-repo"
  }
}

resource "aws_ecr_repository" "worker" {
  name                 = "${var.project_name}/${var.environment}/${var.developer_id}/worker"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-worker-repo"
  }
}

# ============================================================================
# ECS Cluster
# ============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-cluster"

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-cluster"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-${var.environment}-${var.developer_id}/api"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${var.project_name}-${var.environment}-${var.developer_id}/worker"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-worker-logs"
  }
}

# ============================================================================
# IAM Roles
# ============================================================================

# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-ecs-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-ecs-exec-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-ecs-exec-secrets"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.api_keys.arn,
          aws_kms_key.main.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-ecs-task-role"
  }
}

resource "aws_iam_role_policy" "ecs_task_permissions" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.pdf_uploads.arn,
          "${aws_s3_bucket.pdf_uploads.arn}/*",
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.documents.arn,
          aws_sqs_queue.dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-5-sonnet-*"
      },
      {
        Effect = "Allow"
        Action = [
          "textract:AnalyzeDocument",
          "textract:DetectDocumentText"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes"
        ]
        Resource = aws_cognito_user_pool.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.api.arn}:*",
          "${aws_cloudwatch_log_group.worker.arn}:*"
        ]
      }
    ]
  })
}

# ============================================================================
# Cognito User Pool
# ============================================================================

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  mfa_configuration = "OFF"

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = true
    required            = true

    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-user-pool"
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project_name}-${var.environment}-${var.developer_id}-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret        = false
  refresh_token_validity = 30
  access_token_validity  = 1
  id_token_validity      = 1
  token_validity_units {
    refresh_token = "days"
    access_token  = "hours"
    id_token      = "hours"
  }

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"

  read_attributes  = ["email", "email_verified"]
  write_attributes = ["email"]
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}-${var.developer_id}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# ============================================================================
# Application Load Balancer
# ============================================================================

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-${var.developer_id}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-alb"
  }
}

resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-${var.environment}-${var.developer_id}-api-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# ============================================================================
# API Gateway
# ============================================================================

resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment}-${var.developer_id}-api"
  description = "PBL Platform API Gateway - Development"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-gateway"
  }
}

# VPC Link requires Network Load Balancer (NLB), not Application Load Balancer (ALB)
# Commented out until NLB is created or API Gateway is configured differently
# resource "aws_api_gateway_vpc_link" "main" {
#   name        = "${var.project_name}-${var.environment}-${var.developer_id}-vpc-link"
#   target_arns = [aws_lb.main.arn]
#
#   tags = {
#     Name = "${var.project_name}-${var.environment}-${var.developer_id}-vpc-link"
#   }
# }

# Deployment requires methods to be defined in the REST API
# Commented out until API methods are configured
# resource "aws_api_gateway_deployment" "main" {
#   rest_api_id = aws_api_gateway_rest_api.main.id
#
#   triggers = {
#     redeployment = sha1(jsonencode(aws_api_gateway_rest_api.main.body))
#   }
#
#   lifecycle {
#     create_before_destroy = true
#   }
# }

# Stage depends on deployment
# Commented out until deployment is configured
# resource "aws_api_gateway_stage" "dev" {
#   deployment_id = aws_api_gateway_deployment.main.id
#   rest_api_id   = aws_api_gateway_rest_api.main.id
#   stage_name    = "dev"
#
#   tags = {
#     Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-stage"
#   }
# }

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}-${var.developer_id}"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-gateway-logs"
  }
}

# ============================================================================
# Secrets Manager
# ============================================================================

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/${var.developer_id}/db-credentials"
  description             = "Database credentials for development RDS"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-db-creds"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

resource "aws_secretsmanager_secret" "api_keys" {
  name                    = "${var.project_name}/${var.environment}/${var.developer_id}/api-keys"
  description             = "Third-party API keys (LlamaParse, Eleven Labs, Brain.fm)"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-keys"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    llamaparse = "PLACEHOLDER_REPLACE_MANUALLY"
    elevenlabs = "PLACEHOLDER_REPLACE_MANUALLY"
    brainfm    = "PLACEHOLDER_REPLACE_MANUALLY"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# ============================================================================
# ECS Task Definitions
# ============================================================================

# API Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-${var.environment}-${var.developer_id}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${aws_ecr_repository.api.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "DB_PORT"
          value = tostring(aws_db_instance.main.port)
        },
        {
          name  = "DB_NAME"
          value = aws_db_instance.main.db_name
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_cluster.main.cache_nodes[0].address
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        },
        {
          name  = "COGNITO_USER_POOL_ID"
          value = aws_cognito_user_pool.main.id
        },
        {
          name  = "COGNITO_CLIENT_ID"
          value = aws_cognito_user_pool_client.web.id
        },
        {
          name  = "S3_UPLOAD_BUCKET"
          value = aws_s3_bucket.pdf_uploads.id
        },
        {
          name  = "S3_ARTIFACTS_BUCKET"
          value = aws_s3_bucket.artifacts.id
        }
      ]

      secrets = [
        {
          name      = "DB_USERNAME"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:username::"
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:password::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-task"
  }
}

# Worker Task Definition
resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.project_name}-${var.environment}-${var.developer_id}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "2048"
  memory                   = "4096"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = "${aws_ecr_repository.worker.repository_url}:latest"
      essential = true

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "DB_PORT"
          value = tostring(aws_db_instance.main.port)
        },
        {
          name  = "DB_NAME"
          value = aws_db_instance.main.db_name
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_cluster.main.cache_nodes[0].address
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        },
        {
          name  = "SQS_QUEUE_URL"
          value = aws_sqs_queue.documents.url
        },
        {
          name  = "S3_UPLOAD_BUCKET"
          value = aws_s3_bucket.pdf_uploads.id
        },
        {
          name  = "S3_ARTIFACTS_BUCKET"
          value = aws_s3_bucket.artifacts.id
        }
      ]

      secrets = [
        {
          name      = "DB_USERNAME"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:username::"
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:password::"
        },
        {
          name      = "LLAMAPARSE_API_KEY"
          valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:llamaparse::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.worker.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-worker-task"
  }
}

# ============================================================================
# ECS Services
# ============================================================================

resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-${var.environment}-${var.developer_id}-api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.fargate.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8000
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-api-service"
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "worker" {
  name            = "${var.project_name}-${var.environment}-${var.developer_id}-worker-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.fargate.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-worker-service"
  }
}

# ============================================================================
# S3 Event Notification for PDF Processing
# ============================================================================

resource "aws_s3_bucket_notification" "pdf_upload" {
  bucket = aws_s3_bucket.pdf_uploads.id

  queue {
    queue_arn     = aws_sqs_queue.documents.arn
    events        = ["s3:ObjectCreated:*"]
    filter_suffix = ".pdf"
  }
}

resource "aws_sqs_queue_policy" "pdf_uploads" {
  queue_url = aws_sqs_queue.documents.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.documents.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.pdf_uploads.arn
          }
        }
      }
    ]
  })
}

# ============================================================================
# Outputs
# ============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_domain" {
  description = "Cognito Domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS Name"
  value       = aws_lb.main.dns_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_stage.dev.invoke_url
}

output "rds_endpoint" {
  description = "RDS Endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_address" {
  description = "RDS Address"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "RDS Port"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "RDS Database Name"
  value       = aws_db_instance.main.db_name
}

output "redis_endpoint" {
  description = "Redis Endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis Port"
  value       = aws_elasticache_cluster.main.cache_nodes[0].port
}

output "s3_pdf_uploads_bucket" {
  description = "S3 PDF Uploads Bucket"
  value       = aws_s3_bucket.pdf_uploads.id
}

output "s3_artifacts_bucket" {
  description = "S3 Artifacts Bucket"
  value       = aws_s3_bucket.artifacts.id
}

output "sqs_documents_queue_url" {
  description = "SQS Documents Queue URL"
  value       = aws_sqs_queue.documents.url
}

output "ecr_api_repository_url" {
  description = "ECR API Repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_worker_repository_url" {
  description = "ECR Worker Repository URL"
  value       = aws_ecr_repository.worker.repository_url
}

output "db_secret_arn" {
  description = "Database Credentials Secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "api_keys_secret_arn" {
  description = "API Keys Secret ARN"
  value       = aws_secretsmanager_secret.api_keys.arn
}
