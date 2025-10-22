# Implementation Plan

- [ ] 1. Create Development Environment Terraform Configuration
  - Create `infra/Development/main.tf` with cost-optimized AWS resources
  - Configure VPC with 10.1.0.0/16 CIDR, 2 AZs, single NAT Gateway
  - Configure RDS PostgreSQL 15 (db.t4g.medium, single-AZ, 50GB storage)
  - Configure ElastiCache Redis (cache.t4g.micro, single node)
  - Configure ECS Fargate with minimal task counts (1 API, 1 worker)
  - Configure S3 buckets for uploads, artifacts, and logs
  - Configure ALB, API Gateway, Lambda, SQS with development settings
  - Set deletion_protection to false for easy teardown
  - Add developer_id variable for resource naming isolation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Create Database Migration System Structure
  - Create `infra/database/` directory structure
  - Create `migrations/`, `seeds/`, `rollback/`, and `scripts/` subdirectories
  - Create `MIGRATION_GUIDELINES.md` with AI system prompt and rules
  - Create `run_migrations.sh` script for applying migrations in order
  - Create `rollback_migration.sh` script for reverting migrations
  - Create `seed_database.sh` script for loading test data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 3. Create Initial Schema Migration
  - Create `20250122_0001_initial_schema.sql` migration file
  - Define all custom types and enums (user_role, processing_status_enum, feedback_type_enum, learning_style_enum, complexity_level_enum)
  - Create pgvector extension
  - Create all core tables (users, user_profiles, courses, course_documents, processed_documents, chapters, keywords, relationships)
  - Create supporting tables (user_annotations, analogy_feedback, user_progress, chapter_complexity, migrations_log)
  - Add all primary keys, foreign keys, and constraints
  - Add CHECK constraints for score ranges and data validation
  - Wrap in transaction with error handling
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4. Create Indexes Migration
  - Create `20250122_0002_add_indexes.sql` migration file
  - Add B-tree indexes for all foreign keys and common query patterns
  - Add indexes for user lookups (cognito_sub, email, is_active)
  - Add indexes for course and document queries
  - Add indexes for chapter, keyword, and relationship queries
  - Add indexes for feedback and progress queries
  - Add HNSW vector indexes for embeddings (processed_documents, keywords)
  - Configure HNSW parameters (m=16, ef_construction=64)
  - _Requirements: 2.4, 2.5_

- [ ] 5. Create Triggers and Functions Migration
  - Create `20250122_0003_add_triggers.sql` migration file
  - Create `update_updated_at_column()` function for automatic timestamp updates
  - Create triggers for all tables with updated_at columns
  - Create `update_user_streak()` function for streak calculation
  - Create trigger for user_progress streak updates
  - Create `check_feedback_consensus()` function for feedback processing
  - Create trigger for feedback consensus detection
  - Create `update_course_document_count()` function placeholder
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 6. Create Row-Level Security Policies Migration
  - Create `20250122_0004_add_rls_policies.sql` migration file
  - Enable RLS on user_profiles, courses, user_annotations, user_progress tables
  - Create user isolation policies using current_setting('app.current_user_id')
  - Create admin bypass policies for admin_role
  - Add policy documentation comments
  - Test policies with different user contexts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Create Utility Functions Migration
  - Create `20250122_0005_add_utility_functions.sql` migration file
  - Create `cosine_similarity(vector, vector)` function for vector comparisons
  - Create `get_course_stats(UUID)` function returning course statistics
  - Create `get_user_progress_summary(UUID, UUID)` function for progress tracking
  - Add function documentation comments
  - Mark functions as IMMUTABLE where appropriate for query optimization
  - _Requirements: 2.4, 3.1_

- [ ] 8. Create Rollback Scripts
  - Create `20250122_0001_rollback.sql` to drop all tables and types
  - Create `20250122_0002_rollback.sql` to drop all indexes
  - Create `20250122_0003_rollback.sql` to drop all triggers and functions
  - Create `20250122_0004_rollback.sql` to disable RLS and drop policies
  - Create `20250122_0005_rollback.sql` to drop utility functions
  - Test rollback scripts on development database
  - _Requirements: 5.3, 5.4_

- [ ] 9. Create Database Seed Scripts
  - Create `01_seed_users.sql` with sample users and profiles
  - Create `02_seed_courses.sql` with sample courses, documents, and concept maps
  - Include examples of all enum values and data types
  - Include edge cases (empty courses, failed processing, cross-chapter relationships)
  - Make scripts idempotent with ON CONFLICT clauses
  - Add environment check to prevent running in production
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Create Migration Runner Scripts
  - Implement `run_migrations.sh` with sequential execution
  - Add checksum validation for migration files
  - Add logging to migrations_log table
  - Add execution time tracking
  - Implement `rollback_migration.sh` with safety checks
  - Implement `seed_database.sh` with environment validation
  - Add error handling and rollback on failure
  - _Requirements: 5.1, 5.4, 7.3_

- [ ] 11. Create Migration Guidelines Document
  - Write `MIGRATION_GUIDELINES.md` with comprehensive rules
  - Document naming convention (YYYYMMDD_HHMM_description.sql)
  - Document transaction wrapping requirements
  - Document idempotency rules (IF NOT EXISTS, IF EXISTS)
  - Document fix application procedure (update original + create apply_fix.sql)
  - Document testing requirements before committing
  - Document forbidden operations and safety checks
  - Add examples of good and bad migrations
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Configure Database Monitoring and Alerting
  - Add CloudWatch alarms for RDS CPU > 80%
  - Add CloudWatch alarms for RDS connections > 80% of max
  - Add CloudWatch alarms for storage > 80%
  - Add CloudWatch alarms for replication lag > 30 seconds
  - Configure slow query log with 1 second threshold
  - Create CloudWatch dashboard for database metrics
  - Configure SNS topic for database alerts
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 13. Configure Backup and Recovery Procedures
  - Configure automated backups with 30-day retention (production)
  - Configure automated backups with 7-day retention (development)
  - Enable point-in-time recovery
  - Configure backup encryption with KMS
  - Create `backup_procedures.md` documentation
  - Create `recovery_procedures.md` with step-by-step instructions
  - Test backup and restore process in development
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 14. Create Terraform Variables and Outputs
  - Create `infra/Development/variables.tf` with all input variables
  - Create `infra/Development/outputs.tf` with useful outputs
  - Add outputs for RDS endpoint, Redis endpoint, S3 buckets
  - Add outputs for ALB DNS, API Gateway URL, CloudFront domain
  - Add outputs for ECR repository URLs
  - Document all variables with descriptions and defaults
  - _Requirements: 1.1, 1.5_

- [ ] 15. Create Terraform Backend Configuration
  - Create S3 bucket for Terraform state (per developer)
  - Create DynamoDB table for state locking
  - Configure backend in Development/main.tf
  - Add .terraform/ to .gitignore
  - Document backend setup in README
  - _Requirements: 1.1_

- [ ] 16. Validate and Test Complete Setup
  - Run `terraform plan` and verify all resources
  - Run `terraform apply` to provision development environment
  - Connect to RDS and run all migrations
  - Run seed scripts and verify data
  - Test vector similarity queries with sample embeddings
  - Test RLS policies with different user contexts
  - Test triggers by inserting/updating data
  - Run rollback scripts and verify clean state
  - Document any issues and create apply_fix.sql if needed
  - _Requirements: 1.1, 2.1, 2.4, 3.1, 4.5, 5.4, 7.3_

- [ ] 17. Create Documentation and README
  - Create `infra/README.md` with setup instructions
  - Create `infra/database/README.md` with migration instructions
  - Document environment variables required
  - Document AWS credentials setup
  - Document how to run migrations, seeds, and rollbacks
  - Document troubleshooting common issues
  - Add architecture diagrams
  - _Requirements: 5.5, 10.5_

- [ ]* 18. Create Integration Tests
  - Create test suite for database schema validation
  - Create tests for trigger functionality
  - Create tests for RLS policy enforcement
  - Create tests for utility functions
  - Create tests for migration idempotency
  - Create performance tests for vector similarity searches
  - _Requirements: 2.4, 3.1, 4.5_

- [ ]* 19. Create CI/CD Pipeline for Infrastructure
  - Create GitHub Actions workflow for Terraform validation
  - Create workflow for running migration tests
  - Create workflow for security scanning (tfsec, checkov)
  - Create workflow for cost estimation (Infracost)
  - Add manual approval step for production deployments
  - _Requirements: 1.1_

- [ ]* 20. Create Database Performance Tuning Guide
  - Document query optimization techniques
  - Document index maintenance procedures
  - Document vacuum and analyze schedules
  - Document connection pooling best practices
  - Document vector index tuning parameters
  - _Requirements: 2.4, 2.5_
