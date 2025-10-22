# Requirements Document

## Introduction

This specification defines the infrastructure and database requirements for the Sensa Learn platform. The system requires a complete Infrastructure as Code (IaC) setup for both development and production environments, along with a comprehensive database schema that supports the Perspective-Based Learning (PBL) core features and Sensa Learn personalization features. The database must include proper indexing, triggers, policies, and functions to ensure data integrity, performance, and security.

## Requirements

### Requirement 1: Development Environment Infrastructure

**User Story:** As a developer, I want a complete development environment infrastructure defined in Terraform, so that I can quickly spin up isolated development environments that mirror production.

#### Acceptance Criteria

1. WHEN a developer runs `terraform apply` in the Development folder THEN a complete AWS infrastructure SHALL be provisioned with all necessary services
2. WHEN the development environment is created THEN it SHALL use cost-optimized instance sizes compared to production
3. WHEN the development environment is provisioned THEN it SHALL include VPC, subnets, security groups, RDS PostgreSQL, ElastiCache Redis, S3 buckets, ECS Fargate, and all supporting services
4. IF the environment variable is set to "development" THEN deletion protection SHALL be disabled for easier teardown
5. WHEN multiple developers provision environments THEN each SHALL have isolated resources with unique naming based on developer identifier

### Requirement 2: Complete Database Schema

**User Story:** As a backend developer, I want a complete database schema with all tables, relationships, indexes, and constraints, so that the application can store and retrieve data efficiently and reliably.

#### Acceptance Criteria

1. WHEN the database migration scripts are executed THEN all tables SHALL be created with proper primary keys, foreign keys, and constraints
2. WHEN data is inserted THEN all timestamps SHALL automatically populate with created_at and updated_at values
3. WHEN a parent record is deleted THEN related child records SHALL be handled according to cascade rules
4. WHEN queries are executed THEN proper indexes SHALL exist to optimize common query patterns
5. WHEN vector similarity searches are performed THEN pgvector extension SHALL be installed and configured with HNSW indexes

### Requirement 3: Database Triggers and Functions

**User Story:** As a database administrator, I want automated triggers and functions, so that data integrity is maintained and common operations are automated.

#### Acceptance Criteria

1. WHEN any record is updated THEN the updated_at timestamp SHALL automatically be set to the current time
2. WHEN a course is deleted THEN all associated documents, concept maps, and user progress SHALL be cascade deleted
3. WHEN a document is uploaded THEN a trigger SHALL validate the file hash uniqueness within the course
4. WHEN feedback reaches consensus threshold (3+ users) THEN a trigger SHALL flag it for processing
5. WHEN user progress is updated THEN streak calculations SHALL be automatically maintained

### Requirement 4: Row-Level Security Policies

**User Story:** As a security engineer, I want row-level security policies implemented, so that users can only access their own data and authorized course content.

#### Acceptance Criteria

1. WHEN a user queries their profile THEN they SHALL only see their own profile data
2. WHEN a user queries courses THEN they SHALL only see courses they have created or have been granted access to
3. WHEN a user submits feedback THEN they SHALL only be able to update their own feedback
4. WHEN an admin role is used THEN all data SHALL be accessible for administrative purposes
5. WHEN RLS policies are enabled THEN performance SHALL not degrade by more than 10%

### Requirement 5: Database Migration System with Guardrails

**User Story:** As a developer, I want a structured database migration system with clear guidelines, so that schema changes are applied safely and can be rolled back if needed.

#### Acceptance Criteria

1. WHEN a migration script is created THEN it SHALL follow the naming convention `YYYYMMDD_HHMM_description.sql`
2. WHEN a bug fix is needed THEN the developer SHALL update the original migration script AND create a temporary `apply_fix.sql` file
3. WHEN `apply_fix.sql` is applied THEN it SHALL be deleted after successful execution
4. WHEN migrations are run THEN they SHALL be idempotent and safe to run multiple times
5. WHEN a migration fails THEN it SHALL provide clear error messages and rollback instructions

### Requirement 6: Custom Data Types and Enums

**User Story:** As a backend developer, I want custom PostgreSQL data types and enums, so that data validation happens at the database level and code is more maintainable.

#### Acceptance Criteria

1. WHEN processing_status is stored THEN it SHALL use an ENUM type with values: pending, processing, completed, failed
2. WHEN feedback_type is stored THEN it SHALL use an ENUM type with values: concept_map, processing, general
3. WHEN learning_style is stored THEN it SHALL use an ENUM type with values: visual, auditory, kinesthetic, reading
4. WHEN complexity_level is stored THEN it SHALL use an ENUM type with values: high, medium, low
5. WHEN invalid enum values are inserted THEN the database SHALL reject them with a clear error message

### Requirement 7: Database Seeding and Test Data

**User Story:** As a developer, I want database seeding scripts with realistic test data, so that I can develop and test features without manually creating data.

#### Acceptance Criteria

1. WHEN the seed script is run THEN it SHALL create sample users, courses, documents, and concept maps
2. WHEN seed data is created THEN it SHALL include realistic relationships and edge cases
3. WHEN the seed script is run multiple times THEN it SHALL be idempotent and not create duplicates
4. WHEN seed data is created THEN it SHALL include examples of all enum values and data types
5. WHEN the environment is production THEN seed scripts SHALL NOT be executable

### Requirement 8: Database Backup and Recovery Procedures

**User Story:** As a DevOps engineer, I want automated backup procedures and recovery scripts, so that data can be restored in case of failure or corruption.

#### Acceptance Criteria

1. WHEN RDS is provisioned THEN automated backups SHALL be enabled with 30-day retention for production
2. WHEN a backup is needed THEN point-in-time recovery SHALL be available for the last 30 days
3. WHEN a recovery is performed THEN a documented procedure SHALL exist with step-by-step instructions
4. WHEN backups are created THEN they SHALL be encrypted using KMS
5. WHEN a disaster recovery test is performed THEN RTO SHALL be under 1 hour and RPO under 15 minutes

### Requirement 9: Database Monitoring and Alerting

**User Story:** As a DevOps engineer, I want database monitoring and alerting configured, so that performance issues and failures are detected proactively.

#### Acceptance Criteria

1. WHEN database CPU exceeds 80% THEN an alert SHALL be sent to the DevOps team
2. WHEN database connections exceed 80% of max THEN an alert SHALL be sent
3. WHEN slow queries exceed 1 second THEN they SHALL be logged for analysis
4. WHEN database storage exceeds 80% THEN an alert SHALL be sent
5. WHEN replication lag exceeds 30 seconds THEN an alert SHALL be sent

### Requirement 10: Migration Guardrails System Prompt

**User Story:** As a team lead, I want a system prompt document in the migration folder, so that AI coding assistants follow best practices and don't violate migration rules.

#### Acceptance Criteria

1. WHEN an AI assistant reads the migration folder THEN it SHALL find a MIGRATION_GUIDELINES.md file
2. WHEN the guidelines are followed THEN migrations SHALL be created with proper naming and structure
3. WHEN a fix is needed THEN the AI SHALL update the original script and create apply_fix.sql
4. WHEN the guidelines are violated THEN the AI SHALL be reminded of the correct procedure
5. WHEN new developers join THEN the guidelines SHALL serve as onboarding documentation
