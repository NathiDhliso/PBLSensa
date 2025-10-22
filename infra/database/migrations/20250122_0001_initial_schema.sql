-- ============================================================================
-- Migration: Initial Database Schema
-- Created: 2025-01-22 00:01
-- Author: System
-- Description: Creates the complete initial database schema for Sensa Learn
--              including all tables, custom types, enums, and the pgvector extension
-- ============================================================================

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'migrations_log'
    ) AND EXISTS (
        SELECT 1 FROM migrations_log 
        WHERE filename = '20250122_0001_initial_schema.sql'
    ) THEN
        RAISE NOTICE 'Migration already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- Extensions
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- Custom Types and Enums
-- ============================================================================

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type user_role already exists, skipping...';
END $$;

-- Processing status for documents
DO $$ BEGIN
    CREATE TYPE processing_status_enum AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type processing_status_enum already exists, skipping...';
END $$;

-- Feedback types
DO $$ BEGIN
    CREATE TYPE feedback_type_enum AS ENUM (
        'concept_map',
        'processing',
        'general',
        'analogy'
    );
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type feedback_type_enum already exists, skipping...';
END $$;

-- Learning styles for personalization
DO $$ BEGIN
    CREATE TYPE learning_style_enum AS ENUM (
        'visual',
        'auditory',
        'kinesthetic',
        'reading'
    );
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type learning_style_enum already exists, skipping...';
END $$;

-- Complexity levels
DO $$ BEGIN
    CREATE TYPE complexity_level_enum AS ENUM (
        'high',
        'medium',
        'low'
    );
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type complexity_level_enum already exists, skipping...';
END $$;

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Users table (integrates with AWS Cognito)
CREATE TABLE IF NOT EXISTS users (
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

COMMENT ON TABLE users IS 'User accounts integrated with AWS Cognito authentication';
COMMENT ON COLUMN users.cognito_sub IS 'Cognito user pool subject identifier';
COMMENT ON COLUMN users.role IS 'User role for authorization (user, admin, moderator)';

-- User profiles for Sensa Learn personalization
CREATE TABLE IF NOT EXISTS user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    age_range VARCHAR(20),
    location VARCHAR(100),
    interests JSONB DEFAULT '[]'::jsonb,
    learning_style learning_style_enum,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE(user_id),
    CONSTRAINT interests_max_10 CHECK (jsonb_array_length(interests) <= 10)
);

COMMENT ON TABLE user_profiles IS 'User profiles for personalized learning experiences';
COMMENT ON COLUMN user_profiles.interests IS 'Array of user interests (max 10) stored as JSONB';
COMMENT ON COLUMN user_profiles.learning_style IS 'Preferred learning style for content personalization';

-- Courses
CREATE TABLE IF NOT EXISTS courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE courses IS 'Courses created by users containing learning materials';
COMMENT ON COLUMN courses.subject IS 'Subject area for the course (e.g., Biology, Mathematics)';

-- Course documents
CREATE TABLE IF NOT EXISTS course_documents (
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
    CONSTRAINT unique_hash_per_course UNIQUE(course_id, sha256_hash),
    CONSTRAINT positive_file_size CHECK (file_size > 0),
    CONSTRAINT positive_page_count CHECK (page_count IS NULL OR page_count > 0)
);

COMMENT ON TABLE course_documents IS 'Documents uploaded to courses for processing';
COMMENT ON COLUMN course_documents.sha256_hash IS 'SHA256 hash for deduplication and caching';
COMMENT ON COLUMN course_documents.task_id IS 'SQS task ID for tracking processing status';

-- Processed documents with concept maps
CREATE TABLE IF NOT EXISTS processed_documents (
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

COMMENT ON TABLE processed_documents IS 'Processed documents with generated concept maps and embeddings';
COMMENT ON COLUMN processed_documents.concept_map IS 'Complete concept map structure stored as JSONB';
COMMENT ON COLUMN processed_documents.pipeline_version IS 'Version of processing pipeline used';
COMMENT ON COLUMN processed_documents.embedding IS '768-dimensional vector embedding for similarity search';
COMMENT ON COLUMN processed_documents.cache_key IS 'Cache key for deduplication (hash + version)';

-- Chapters within processed documents
CREATE TABLE IF NOT EXISTS chapters (
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
    CONSTRAINT unique_chapter_per_doc UNIQUE(processed_id, chapter_number),
    CONSTRAINT positive_chapter_number CHECK (chapter_number > 0),
    CONSTRAINT positive_estimated_time CHECK (estimated_time_minutes IS NULL OR estimated_time_minutes > 0)
);

COMMENT ON TABLE chapters IS 'Chapters extracted from processed documents';
COMMENT ON COLUMN chapters.exam_relevance_score IS 'Score indicating relevance for exam preparation (0-100)';
COMMENT ON COLUMN chapters.complexity_score IS 'Complexity score for Sensa Learn (0-100)';
COMMENT ON COLUMN chapters.estimated_time_minutes IS 'Estimated reading time in minutes';

-- Keywords/concepts within chapters
CREATE TABLE IF NOT EXISTS keywords (
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

COMMENT ON TABLE keywords IS 'Keywords and concepts extracted from chapters';
COMMENT ON COLUMN keywords.is_primary IS 'Whether this is a primary concept (vs reference)';
COMMENT ON COLUMN keywords.exam_relevant IS 'Whether this concept is relevant for exams';
COMMENT ON COLUMN keywords.embedding IS '768-dimensional vector embedding for similarity search';

-- Relationships between keywords
CREATE TABLE IF NOT EXISTS relationships (
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

COMMENT ON TABLE relationships IS 'Relationships between keywords/concepts';
COMMENT ON COLUMN relationships.relationship_type IS 'Type of relationship (e.g., causes, is-a, part-of)';
COMMENT ON COLUMN relationships.is_cross_chapter IS 'Whether this relationship crosses chapter boundaries';
COMMENT ON COLUMN relationships.strength IS 'Strength or confidence of the relationship (0-1)';

-- User annotations and feedback
CREATE TABLE IF NOT EXISTS user_annotations (
    annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    feedback_type feedback_type_enum NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    metadata JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    consensus_count INTEGER DEFAULT 1,
    CONSTRAINT positive_consensus CHECK (consensus_count > 0)
);

COMMENT ON TABLE user_annotations IS 'User feedback and annotations on courses and content';
COMMENT ON COLUMN user_annotations.consensus_count IS 'Number of users with similar feedback';
COMMENT ON COLUMN user_annotations.processed IS 'Whether feedback has been processed by the system';

-- Analogy feedback for Sensa Learn
CREATE TABLE IF NOT EXISTS analogy_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    analogy_id UUID NOT NULL,
    helpful BOOLEAN NOT NULL,
    comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE analogy_feedback IS 'User feedback on generated analogies';
COMMENT ON COLUMN analogy_feedback.helpful IS 'Whether the user found the analogy helpful';

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
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
    CONSTRAINT unique_user_chapter_progress UNIQUE(user_id, chapter_id),
    CONSTRAINT non_negative_time CHECK (time_spent_seconds >= 0),
    CONSTRAINT non_negative_streak CHECK (current_streak_days >= 0 AND longest_streak_days >= 0),
    CONSTRAINT longest_streak_valid CHECK (longest_streak_days >= current_streak_days)
);

COMMENT ON TABLE user_progress IS 'User progress tracking for chapters and courses';
COMMENT ON COLUMN user_progress.current_streak_days IS 'Current consecutive days of activity';
COMMENT ON COLUMN user_progress.longest_streak_days IS 'Longest streak ever achieved';
COMMENT ON COLUMN user_progress.badges IS 'Array of earned badges stored as JSONB';

-- Chapter complexity metadata
CREATE TABLE IF NOT EXISTS chapter_complexity (
    complexity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    complexity_level complexity_level_enum NOT NULL,
    complexity_score INTEGER CHECK (complexity_score BETWEEN 0 AND 100),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_chapter_complexity UNIQUE(chapter_id)
);

COMMENT ON TABLE chapter_complexity IS 'Complexity analysis for chapters';
COMMENT ON COLUMN chapter_complexity.complexity_level IS 'Categorical complexity level (high, medium, low)';
COMMENT ON COLUMN chapter_complexity.complexity_score IS 'Numerical complexity score (0-100)';

-- Migrations log table
CREATE TABLE IF NOT EXISTS migrations_log (
    migration_id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER
);

COMMENT ON TABLE migrations_log IS 'Log of applied database migrations';
COMMENT ON COLUMN migrations_log.checksum IS 'MD5 checksum of migration file for verification';
COMMENT ON COLUMN migrations_log.execution_time_ms IS 'Migration execution time in milliseconds';

-- ============================================================================
-- Log Migration
-- ============================================================================

INSERT INTO migrations_log (filename, checksum, execution_time_ms)
VALUES (
    '20250122_0001_initial_schema.sql',
    md5('20250122_0001_initial_schema.sql'),
    extract(epoch from (clock_timestamp() - transaction_timestamp())) * 1000
)
ON CONFLICT (filename) DO NOTHING;

COMMIT;

-- Rollback on error
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    ROLLBACK;
