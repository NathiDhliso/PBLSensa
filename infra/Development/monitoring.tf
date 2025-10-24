# ============================================================================
# AWS X-Ray and CloudWatch Monitoring
# ============================================================================

# API Gateway stage is commented out - method settings disabled
# Enable X-Ray tracing for API Gateway
# resource "aws_api_gateway_method_settings" "all" {
#   rest_api_id = aws_api_gateway_rest_api.main.id
#   stage_name  = aws_api_gateway_stage.dev.stage_name
#   method_path = "*/*"
#
#   settings {
#     metrics_enabled    = true
#     logging_level      = "INFO"
#     data_trace_enabled = true
#     
#     throttling_burst_limit = 100
#     throttling_rate_limit  = 50
#   }
# }

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-${var.developer_id}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average", label = "Queue Depth" }],
            [".", "NumberOfMessagesSent", { stat = "Sum", label = "Messages Sent" }],
            [".", "NumberOfMessagesDeleted", { stat = "Sum", label = "Messages Processed" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "SQS Queue Metrics"
          dimensions = {
            QueueName = aws_sqs_queue.documents.name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Fargate Resource Utilization"
          dimensions = {
            ServiceName = "${var.project_name}-${var.environment}-${var.developer_id}-api"
            ClusterName = aws_ecs_cluster.main.name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CacheHits", { stat = "Sum" }],
            [".", "CacheMisses", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Cache Hit/Miss Rate"
          dimensions = {
            CacheClusterId = aws_elasticache_cluster.main.cluster_id
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }],
            [".", "CPUUtilization", { stat = "Average" }],
            [".", "FreeableMemory", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Performance"
          dimensions = {
            DBInstanceIdentifier = aws_db_instance.main.identifier
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "Total Requests" }],
            [".", "4XXError", { stat = "Sum", label = "Client Errors" }],
            [".", "5XXError", { stat = "Sum", label = "Server Errors" }],
            [".", "Latency", { stat = "Average", label = "Latency" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "API Gateway Metrics"
          dimensions = {
            ApiName = aws_api_gateway_rest_api.main.name
          }
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.api.name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent API Errors"
        }
      }
    ]
  })
}

# CloudWatch Alarms

# P1: Critical - SQS Queue Depth
resource "aws_cloudwatch_metric_alarm" "sqs_queue_depth_critical" {
  alarm_name          = "${var.project_name}-${var.environment}-${var.developer_id}-sqs-depth-critical"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "SQS queue depth is critically high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.documents.name
  }

  tags = {
    Name     = "${var.project_name}-${var.environment}-${var.developer_id}-sqs-alarm"
    Severity = "P1"
  }
}

# P2: Error - Fargate Task Failures
resource "aws_cloudwatch_metric_alarm" "fargate_task_failures" {
  alarm_name          = "${var.project_name}-${var.environment}-${var.developer_id}-fargate-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TasksStoppedReason"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Multiple Fargate tasks have failed"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name     = "${var.project_name}-${var.environment}-${var.developer_id}-fargate-alarm"
    Severity = "P2"
  }
}

# P2: Error - RDS CPU High
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-${var.developer_id}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Name     = "${var.project_name}-${var.environment}-${var.developer_id}-rds-cpu-alarm"
    Severity = "P2"
  }
}

# P3: Warning - Cache Hit Rate Low
resource "aws_cloudwatch_metric_alarm" "cache_hit_rate_low" {
  alarm_name          = "${var.project_name}-${var.environment}-${var.developer_id}-cache-hit-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  threshold           = 0.7
  alarm_description   = "Cache hit rate is below 70%"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "hit_rate"
    expression  = "hits / (hits + misses)"
    label       = "Cache Hit Rate"
    return_data = true
  }

  metric_query {
    id = "hits"
    metric {
      metric_name = "CacheHits"
      namespace   = "AWS/ElastiCache"
      period      = 300
      stat        = "Sum"
      dimensions = {
        CacheClusterId = aws_elasticache_cluster.main.cluster_id
      }
    }
  }

  metric_query {
    id = "misses"
    metric {
      metric_name = "CacheMisses"
      namespace   = "AWS/ElastiCache"
      period      = 300
      stat        = "Sum"
      dimensions = {
        CacheClusterId = aws_elasticache_cluster.main.cluster_id
      }
    }
  }

  tags = {
    Name     = "${var.project_name}-${var.environment}-${var.developer_id}-cache-alarm"
    Severity = "P3"
  }
}

# P2: API Gateway 5XX Errors
# API Gateway stage is commented out - alarm disabled
# resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
#   alarm_name          = "${var.project_name}-${var.environment}-${var.developer_id}-api-5xx"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = 1
#   metric_name         = "5XXError"
#   namespace           = "AWS/ApiGateway"
#   period              = 300
#   statistic           = "Sum"
#   threshold           = 10
#   alarm_description   = "API Gateway is returning 5XX errors"
#   treat_missing_data  = "notBreaching"
#
#   dimensions = {
#     ApiName = aws_api_gateway_rest_api.main.name
#     Stage   = aws_api_gateway_stage.dev.stage_name
#   }
#
#   tags = {
#     Name     = "${var.project_name}-${var.environment}-${var.developer_id}-api-5xx-alarm"
#     Severity = "P2"
#   }
# }

# SNS Topic for Alarms (optional - for email notifications)
resource "aws_sns_topic" "alarms" {
  name = "${var.project_name}-${var.environment}-${var.developer_id}-alarms"

  tags = {
    Name = "${var.project_name}-${var.environment}-${var.developer_id}-alarms-topic"
  }
}

# Add alarm actions (uncomment and add email after creating SNS subscription)
# resource "aws_sns_topic_subscription" "alarm_email" {
#   topic_arn = aws_sns_topic.alarms.arn
#   protocol  = "email"
#   endpoint  = "your-email@example.com"
# }
