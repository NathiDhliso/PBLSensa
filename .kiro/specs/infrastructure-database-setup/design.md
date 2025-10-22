# Design Document

## Overview

This design document outlines the complete infrastructure and database architecture for the Sensa Learn platform. The solution includes Terraform configurations for development and production environments, comprehensive PostgreSQL database schemas with pgvector support, automated triggers and functions, row-level security policies, and a robust migration system with AI-friendly guardrails.

## Architecture

### Infrastructure Architecture

```
Development Environment
├── VPC (10.1.0.0/16)
│   ├── Public Subnets (2 AZs)
│   ├── Private Subnets (2 AZs)
│   └── NAT Gateway (single)
├── RDS PostgreSQL 15
│   ├── Instance: db.t4g.medium
│   ├── Storage: 50GB gp3
│   └── Single-AZ
├── ElastiCache Redis
│   ├── Node: cache.t4g.micro
│   └── Single node
├── ECS Fargate
│   ├── API Service (1 task)
│   └── Worker Service (1 task)
├── S3 Buckets
│   ├── PDF Uploads
│   ├── Artifacts
│   └── Logs
└── Supporting Services
    ├── ALB
    ├── API Gateway
    ├── Lambda Functions
    ├── SQS Queues
    └── CloudWatch

Production Environment (from existing main.tf)
├── VPC (10.0.0.0/16)
├── Multi-AZ RDS (db.r6g.large)
├── Multi-node Redis Cluster
├── Auto-scaling Fargate
└── Full monitoring & alerting
```

### Database Architecture

```
PostgreSQL 15 + pgvector Extension

Core Tables:
├── users (Cognito integration)
├── user_profiles (Sensa Learn personalization)
├── courses
├── course_documents
├── processed_documents (concept maps, embeddings)
├── chapters
├── keywords
├── relationships
├── user_annotations (feedback)
├── analogy_feedback
├── user_progress (streaks, badges)
├── chapter_complexity
└── migrations_log

Supporting Objects:
├── Custom Types & Enums
├── Indexes (B-tree, HNSW vector)
├── Triggers (timestamps, cascades)
├── Functions (utilities, calculations)
└── RLS Policies (user isolation)
```

## Components and Interfaces

### 1. Terraform Modules

#### Development Environment Module

**File:** `infra/Development/main.tf`

**Purpose:** Cost-optimized development environment

**Key Differences from Production:**
- Smaller instance sizes (t4g vs r6g)
- Single-AZ deployments
- Reduced redundancy
- Deletion protection disabled
- Lower auto-scaling limits
- Shorter log retention (7 days vs 30)

**Variables:**
```hcl
variable "environment" {
  default = "development"
}

variable "developer_id" {
  description = "Unique identifier for developer (e.g., initials)"
  type        = string
}

variable "aws_region" {
  default = "us-east-1"
}

variable "vpc_cidr" {
  default = "10.1.0.0/16"
}
```

#### Shared Variables Module

**File:** `infra/shared/variables.tf`

**Purpose:** Common variables across environments

### 2. Database Schema Design

#### Core Tables

**users**
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    role user_role DEFAULT 'user'
);
```

**user_profiles**
```sql
CREATE TABLE user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    age_range VARCHAR(20),
    location VARCHAR(100),
    interests JSONB DEFAULT '[]'::jsonb,
    learning_style learning_style_enum,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE(user_id)
);
```

**courses**
```sql
CREATE TABLE courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE
);
```

**course_documents**
```sql
CREATE TABLE course_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    s3_key VARCHAR(1000) NOT NULL,
    s3_bucket VARCHAR(255) NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    page_count INTEGER,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    processing_status processing_status_enum DEFAULT 'pending',
    task_id VARCHAR(255),
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    CONSTRAINT unique_hash_per_course UNIQUE(course_id, sha256_hash)
);
```

**processed_documents**
```sql
CREATE TABLE processed_documents (
    processed_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES course_documents(document_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    concept_map JSONB NOT NULL,
    pipeline_version VARCHAR(20) NOT NULL,
    subject VARCHAR(100),
    embedding vector(768),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    cache_key VARCHAR(255) UNIQUE,
    CONSTRAINT unique_doc_processing UNIQUE(document_id)
);
```

**chapters**
```sql
CREATE TABLE chapters (
    chapter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processed_id UUID REFERENCES processed_documents(processed_id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    exam_relevance_score INTEGER CHECK (exam_relevance_score BETWEEN 0 AND 100),
    complexity_score INTEGER CHECK (complexity_score BETWEEN 0 AND 100),
    complexity_level complexity_level_enum,
    estimated_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_chapter_per_doc UNIQUE(processed_id, chapter_number)
);
```

**keywords**
```sql
CREATE TABLE keywords (
    keyword_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    context TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    exam_relevant BOOLEAN DEFAULT FALSE,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**relationships**
```sql
CREATE TABLE relationships (
    relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    source_keyword_id UUID REFERENCES keywords(keyword_id) ON DELETE CASCADE,
    target_keyword_id UUID REFERENCES keywords(keyword_id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    is_cross_chapter BOOLEAN DEFAULT FALSE,
    strength DECIMAL(3,2) CHECK (strength BETWEEN 0 AND 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_reference CHECK (source_keyword_id != target_keyword_id)
);
```

**user_annotations**
```sql
CREATE TABLE user_annotations (
    annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    feedback_type feedback_type_enum NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    metadata JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    consensus_count INTEGER DEFAULT 1
);
```

**analogy_feedback**
```sql
CREATE TABLE analogy_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    analogy_id UUID NOT NULL,
    helpful BOOLEAN NOT NULL,
    comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

**user_progress**
```sql
CREATE TABLE user_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    badges JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT unique_user_chapter_progress UNIQUE(user_id, chapter_id)
);
```

**chapter_complexity**
```sql
CREATE TABLE chapter_complexity (
    complexity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    complexity_level complexity_level_enum NOT NULL,
    complexity_score INTEGER CHECK (complexity_score BETWEEN 0 AND 100),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_chapter_complexity UNIQUE(chapter_id)
);
```

**migrations_log**
```sql
CREATE TABLE migrations_log (
    migration_id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER
);
```

#### Custom Types and Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Processing status
CREATE TYPE processing_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

-- Feedback types
CREATE TYPE feedback_type_enum AS ENUM (
    'concept_map',
    'processing',
    'general',
    'analogy'
);

-- Learning styles
CREATE TYPE learning_style_enum AS ENUM (
    'visual',
    'auditory',
    'kinesthetic',
    'reading'
);

-- Complexity levels
CREATE TYPE complexity_level_enum AS ENUM (
    'high',
    'medium',
    'low'
);
```

### 3. Indexes

#### Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Course queries
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX idx_courses_archived ON courses(is_archived) WHERE is_archived = FALSE;

-- Document queries
CREATE INDEX idx_documents_course_id ON course_documents(course_id);
CREATE INDEX idx_documents_status ON course_documents(processing_status);
CREATE INDEX idx_documents_hash ON course_documents(sha256_hash);
CREATE INDEX idx_documents_upload_date ON course_documents(upload_date DESC);

-- Chapter queries
CREATE INDEX idx_chapters_processed_id ON chapters(processed_id);
CREATE INDEX idx_chapters_number ON chapters(chapter_number);

-- Keyword queries
CREATE INDEX idx_keywords_chapter_id ON keywords(chapter_id);
CREATE INDEX idx_keywords_term ON keywords(term);
CREATE INDEX idx_keywords_primary ON keywords(is_primary) WHERE is_primary = TRUE;

-- Relationship queries
CREATE INDEX idx_relationships_chapter_id ON relationships(chapter_id);
CREATE INDEX idx_relationships_source ON relationships(source_keyword_id);
CREATE INDEX idx_relationships_target ON relationships(target_keyword_id);
CREATE INDEX idx_relationships_cross_chapter ON relationships(is_cross_chapter) WHERE is_cross_chapter = TRUE;

-- Feedback queries
CREATE INDEX idx_annotations_user_id ON user_annotations(user_id);
CREATE INDEX idx_annotations_course_id ON user_annotations(course_id);
CREATE INDEX idx_annotations_type ON user_annotations(feedback_type);
CREATE INDEX idx_annotations_unprocessed ON user_annotations(processed) WHERE processed = FALSE;

-- Progress queries
CREATE INDEX idx_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_progress_course_id ON user_progress(course_id);
CREATE INDEX idx_progress_completed ON user_progress(completed) WHERE completed = TRUE;
CREATE INDEX idx_progress_activity_date ON user_progress(last_activity_date DESC);

-- Vector similarity indexes (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_processed_docs_embedding ON processed_documents 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_keywords_embedding ON keywords 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```

### 4. Triggers and Functions

#### Timestamp Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### Streak Calculation Trigger

```sql
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- If activity is on a new day
    IF NEW.last_activity_date IS NULL OR NEW.last_activity_date < CURRENT_DATE THEN
        -- Check if streak continues (activity yesterday)
        IF NEW.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
            NEW.current_streak_days = NEW.current_streak_days + 1;
            NEW.longest_streak_days = GREATEST(NEW.longest_streak_days, NEW.current_streak_days);
        ELSIF NEW.last_activity_date < CURRENT_DATE - INTERVAL '1 day' THEN
            -- Streak broken
            NEW.current_streak_days = 1;
        END IF;
        NEW.last_activity_date = CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streak_on_progress
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    WHEN (NEW.time_spent_seconds > OLD.time_spent_seconds)
    EXECUTE FUNCTION update_user_streak();
```

#### Feedback Consensus Trigger

```sql
CREATE OR REPLACE FUNCTION check_feedback_consensus()
RETURNS TRIGGER AS $$
BEGIN
    -- Count similar feedback for the same course/type
    UPDATE user_annotations
    SET consensus_count = (
        SELECT COUNT(*)
        FROM user_annotations ua
        WHERE ua.course_id = NEW.course_id
        AND ua.feedback_type = NEW.feedback_type
        AND ua.rating = NEW.rating
        AND ua.processed = FALSE
    )
    WHERE annotation_id = NEW.annotation_id;
    
    -- Flag for processing if consensus reached
    IF NEW.consensus_count >= 3 THEN
        NEW.processed = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_consensus_on_feedback
    AFTER INSERT ON user_annotations
    FOR EACH ROW
    EXECUTE FUNCTION check_feedback_consensus();
```

#### Document Count Update Trigger

```sql
CREATE OR REPLACE FUNCTION update_course_document_count()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be used if we add a document_count column to courses
    -- For now, we calculate it dynamically in queries
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5. Row-Level Security Policies

```sql
-- Enable RLS on sensitive tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY user_profile_isolation ON user_profiles
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Users can only see their own courses
CREATE POLICY course_isolation ON courses
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Users can only see their own feedback
CREATE POLICY feedback_isolation ON user_annotations
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Users can only see their own progress
CREATE POLICY progress_isolation ON user_progress
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Admin bypass policy
CREATE POLICY admin_all_access ON user_profiles
    FOR ALL
    TO admin_role
    USING (true);

-- Similar admin policies for other tables
CREATE POLICY admin_courses_access ON courses
    FOR ALL
    TO admin_role
    USING (true);
```

### 6. Utility Functions

```sql
-- Calculate cosine similarity between vectors
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS FLOAT AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get course statistics
CREATE OR REPLACE FUNCTION get_course_stats(p_course_id UUID)
RETURNS TABLE (
    total_documents INTEGER,
    completed_documents INTEGER,
    pending_documents INTEGER,
    failed_documents INTEGER,
    total_chapters INTEGER,
    total_keywords INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT cd.document_id)::INTEGER,
        COUNT(DISTINCT CASE WHEN cd.processing_status = 'completed' THEN cd.document_id END)::INTEGER,
        COUNT(DISTINCT CASE WHEN cd.processing_status = 'pending' THEN cd.document_id END)::INTEGER,
        COUNT(DISTINCT CASE WHEN cd.processing_status = 'failed' THEN cd.document_id END)::INTEGER,
        COUNT(DISTINCT c.chapter_id)::INTEGER,
        COUNT(DISTINCT k.keyword_id)::INTEGER
    FROM courses co
    LEFT JOIN course_documents cd ON co.course_id = cd.course_id
    LEFT JOIN processed_documents pd ON cd.document_id = pd.document_id
    LEFT JOIN chapters c ON pd.processed_id = c.processed_id
    LEFT JOIN keywords k ON c.chapter_id = k.chapter_id
    WHERE co.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- Get user progress summary
CREATE OR REPLACE FUNCTION get_user_progress_summary(p_user_id UUID, p_course_id UUID)
RETURNS TABLE (
    total_chapters INTEGER,
    completed_chapters INTEGER,
    completion_percentage DECIMAL,
    current_streak INTEGER,
    total_time_spent INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(c.chapter_id)::INTEGER,
        COUNT(CASE WHEN up.completed THEN 1 END)::INTEGER,
        ROUND((COUNT(CASE WHEN up.completed THEN 1 END)::DECIMAL / NULLIF(COUNT(c.chapter_id), 0)) * 100, 2),
        MAX(up.current_streak_days)::INTEGER,
        SUM(up.time_spent_seconds)::INTEGER
    FROM chapters c
    JOIN processed_documents pd ON c.processed_id = pd.processed_id
    LEFT JOIN user_progress up ON c.chapter_id = up.chapter_id AND up.user_id = p_user_id
    WHERE pd.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;
```

## Data Models

### Entity Relationship Diagram

```
users (1) ----< (M) user_profiles
users (1) ----< (M) courses
users (1) ----< (M) user_annotations
users (1) ----< (M) user_progress

courses (1) ----< (M) course_documents
courses (1) ----< (M) processed_documents

course_documents (1) ----< (1) processed_documents

processed_documents (1) ----< (M) chapters

chapters (1) ----< (M) keywords
chapters (1) ----< (M) relationships
chapters (1) ----< (M) user_progress
chapters (1) ----< (M) analogy_feedback
chapters (1) ----< (1) chapter_complexity

keywords (1) ----< (M) relationships (as source)
keywords (1) ----< (M) relationships (as target)
```

## Error Handling

### Database Error Codes

- **23505**: Unique violation (duplicate key)
- **23503**: Foreign key violation
- **23514**: Check constraint violation
- **42P01**: Undefined table
- **42703**: Undefined column

### Migration Error Handling

```sql
-- Wrap migrations in transactions
BEGIN;

-- Migration code here

-- Rollback on error
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    ROLLBACK;
END;
```

## Testing Strategy

### Unit Tests

1. Test each trigger function independently
2. Test RLS policies with different user contexts
3. Test utility functions with edge cases
4. Test constraint violations

### Integration Tests

1. Test full document upload → processing → concept map flow
2. Test user progress tracking across multiple sessions
3. Test feedback consensus mechanism
4. Test cascade deletions

### Performance Tests

1. Benchmark vector similarity searches with 10K+ embeddings
2. Test query performance with 100K+ documents
3. Test concurrent user access with RLS enabled
4. Test index effectiveness with EXPLAIN ANALYZE

### Migration Tests

1. Test idempotency (run twice, verify no errors)
2. Test rollback procedures
3. Test migration on empty database
4. Test migration on database with existing data

## Migration System Design

### File Structure

```
infra/database/
├── MIGRATION_GUIDELINES.md (AI system prompt)
├── migrations/
│   ├── 20250122_0001_initial_schema.sql
│   ├── 20250122_0002_add_indexes.sql
│   ├── 20250122_0003_add_triggers.sql
│   ├── 20250122_0004_add_rls_policies.sql
│   └── 20250122_0005_add_utility_functions.sql
├── seeds/
│   ├── 01_seed_users.sql
│   └── 02_seed_courses.sql
├── rollback/
│   ├── 20250122_0001_rollback.sql
│   └── 20250122_0002_rollback.sql
└── scripts/
    ├── run_migrations.sh
    ├── rollback_migration.sh
    └── seed_database.sh
```

### Migration Naming Convention

Format: `YYYYMMDD_HHMM_description.sql`

Example: `20250122_1430_add_user_badges.sql`

### Fix Application Process

1. Developer identifies bug in migration `20250122_1430_add_user_badges.sql`
2. Developer updates the original file with the fix
3. Developer creates `apply_fix.sql` with the corrective SQL
4. Developer applies `apply_fix.sql` to affected environments
5. Developer deletes `apply_fix.sql` after successful application
6. Original migration file now contains the correct version for future deployments

### Migration Guidelines (AI System Prompt)

The MIGRATION_GUIDELINES.md file will contain:

1. **Naming conventions** for migration files
2. **Transaction wrapping** requirements
3. **Idempotency** rules (use IF NOT EXISTS, IF EXISTS)
4. **Rollback script** requirements
5. **Fix application** procedure
6. **Testing** requirements before committing
7. **Documentation** standards
8. **Forbidden operations** (e.g., DROP TABLE without backup)

## Deployment Strategy

### Development Environment

1. Run Terraform to provision infrastructure
2. Wait for RDS to be available
3. Connect to RDS and run migrations in order
4. Run seed scripts for test data
5. Verify with smoke tests

### Production Environment

1. Create RDS snapshot before migration
2. Run migrations during maintenance window
3. Monitor for errors
4. Run validation queries
5. If errors, rollback using snapshot
6. Update migrations_log table

## Monitoring and Maintenance

### Database Metrics to Monitor

- Connection count
- Query latency (p50, p95, p99)
- Cache hit ratio
- Replication lag
- Storage usage
- CPU and memory utilization
- Slow query log

### Maintenance Tasks

- Weekly: Review slow query log
- Monthly: Analyze and vacuum tables
- Quarterly: Review and optimize indexes
- Annually: Review RLS policy performance

## Security Considerations

1. **Encryption**: All data encrypted at rest (KMS) and in transit (TLS)
2. **Access Control**: IAM roles for RDS access, no hardcoded credentials
3. **RLS Policies**: Enforce user data isolation at database level
4. **Audit Logging**: All DDL and DML operations logged
5. **Secrets Management**: Database credentials in AWS Secrets Manager
6. **Network Security**: RDS in private subnets, security groups restrict access
7. **Backup Encryption**: All backups encrypted with KMS

## Cost Optimization

### Development Environment

- Use t4g instances (ARM-based, cheaper)
- Single-AZ deployment
- Smaller storage allocation
- Shorter backup retention
- Auto-pause for idle databases (if using Aurora Serverless)

### Production Environment

- Reserved instances for predictable workloads
- Intelligent-Tiering for S3
- Lifecycle policies for old data
- Monitor and right-size instances based on actual usage
