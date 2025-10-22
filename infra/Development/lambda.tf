# ============================================================================
# AWS Lambda Functions
# ============================================================================

# Lambda Execution Role
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-lambda-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.pdf_uploads.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.documents.arn
      },
      {
        Effect = "Allow"
        Action = [
          "textract:DetectDocumentText",
          "textract:AnalyzeDocument"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement"
        ]
        Resource = aws_db_instance.main.arn
      }
    ]
  })
}

# CloudWatch Log Groups for Lambda
resource "aws_cloudwatch_log_group" "pdf_validator" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-${var.developer_id}-pdf-validator"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-pdf-validator-logs"
  }
}

resource "aws_cloudwatch_log_group" "feedback_processor" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-${var.developer_id}-feedback-processor"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-feedback-processor-logs"
  }
}

# Layer 0: PDF Validator Lambda
resource "aws_lambda_function" "pdf_validator" {
  function_name = "${var.project_name}-${var.environment}-${var.developer_id}-pdf-validator"
  role          = aws_iam_role.lambda.arn
  
  # Placeholder - you'll need to build and upload the deployment package
  filename         = "lambda_placeholder.zip"
  source_code_hash = fileexists("lambda_placeholder.zip") ? filebase64sha256("lambda_placeholder.zip") : ""
  
  handler = "validator.handler"
  runtime = "python3.11"
  timeout = 60
  memory_size = 512

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      SQS_QUEUE_URL     = aws_sqs_queue.documents.url
      S3_BUCKET         = aws_s3_bucket.pdf_uploads.id
      PIPELINE_VERSION  = "1.0.0"
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.fargate.id]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-pdf-validator"
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# S3 Trigger for PDF Validator
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pdf_validator.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.pdf_uploads.arn
}

# Note: S3 bucket notification is already defined in main.tf
# It sends events to SQS, which the worker processes
# The Lambda validator is triggered by the worker, not directly by S3

# Layer 9: Feedback Processor Lambda
resource "aws_lambda_function" "feedback_processor" {
  function_name = "${var.project_name}-${var.environment}-${var.developer_id}-feedback-processor"
  role          = aws_iam_role.lambda.arn
  
  # Placeholder - you'll need to build and upload the deployment package
  filename         = "lambda_placeholder.zip"
  source_code_hash = fileexists("lambda_placeholder.zip") ? filebase64sha256("lambda_placeholder.zip") : ""
  
  handler = "feedback.handler"
  runtime = "python3.11"
  timeout = 300
  memory_size = 1024

  environment {
    variables = {
      ENVIRONMENT      = var.environment
      DB_SECRET_ARN    = aws_secretsmanager_secret.db_credentials.arn
      CONSENSUS_THRESHOLD = "3"
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.fargate.id]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-feedback-processor"
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# EventBridge Rule for Weekly Feedback Processing
resource "aws_cloudwatch_event_rule" "weekly_feedback" {
  name                = "${var.project_name}-${var.environment}-${var.developer_id}-weekly-feedback"
  description         = "Trigger feedback processor weekly"
  schedule_expression = "cron(0 2 ? * MON *)"  # Every Monday at 2 AM UTC

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-weekly-feedback-rule"
  }
}

resource "aws_cloudwatch_event_target" "feedback_processor" {
  rule      = aws_cloudwatch_event_rule.weekly_feedback.name
  target_id = "FeedbackProcessor"
  arn       = aws_lambda_function.feedback_processor.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.feedback_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_feedback.arn
}

# Note: Lambda placeholder zip needs to be created manually
# Run this in PowerShell from infra/Development directory:
# echo 'def handler(event, context): return {"statusCode": 200}' > lambda_placeholder.py
# Compress-Archive -Path lambda_placeholder.py -DestinationPath lambda_placeholder.zip -Force
# Remove-Item lambda_placeholder.py
