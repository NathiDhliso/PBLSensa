-- ============================================================================
-- Migration: Add Performance Indexes
-- Created: 2025-01-22 00:02
-- Author: System
-- Description: Creates all B-tree and vector indexes for optimal query performance
-- ============================================================================

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM migrations_log 
        WHERE filename = '20250122_0002_add_indexes.sql'
    ) THEN
        RAISE NOTICE 'Migration already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- User Indexes
-- ============================================================================

-- User lookups by Cognito sub
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);

-- User lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Active users filter
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- User role filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- User last login tracking
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

-- ============================================================================
-- User Profile Indexes
-- ============================================================================

-- Profile lookup by user
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Learning style filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_learning_style ON user_profiles(learning_style);

-- GIN index for interests JSONB array
CREATE INDEX IF NOT EXISTS idx_user_profiles_interests ON user_profiles USING gin(interests);

-- ============================================================================
-- Course Indexes
-- ============================================================================

-- Courses by user
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);

-- Recent courses
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

-- Active (non-archived) courses
CREATE INDEX IF NOT EXISTS idx_courses_archived ON courses(is_archived) WHERE is_archived = FALSE;

-- Course subject filtering
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject);

-- Full-text search on course name and description
CREATE INDEX IF NOT EXISTS idx_courses_name_trgm ON courses USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_description_trgm ON courses USING gin(description gin_trgm_ops);

-- ============================================================================
-- Document Indexes
-- ============================================================================

-- Documents by course
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON course_documents(course_id);

-- Document processing status
CREATE INDEX IF NOT EXISTS idx_documents_status ON course_documents(processing_status);

-- Document hash lookup for deduplication
CREATE INDEX IF NOT EXISTS idx_documents_hash ON course_documents(sha256_hash);

-- Recent uploads
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON course_documents(upload_date DESC);

-- Task ID lookup for status tracking
CREATE INDEX IF NOT EXISTS idx_documents_task_id ON course_documents(task_id) WHERE task_id IS NOT NULL;

-- Failed documents for retry
CREATE INDEX IF NOT EXISTS idx_documents_failed ON course_documents(processing_status) 
WHERE processing_status = 'failed';

-- Pending documents for processing
CREATE INDEX IF NOT EXISTS idx_documents_pending ON course_documents(processing_status) 
WHERE processing_status = 'pending';

-- ============================================================================
-- Processed Document Indexes
-- ============================================================================

-- Processed documents by document ID
CREATE INDEX IF NOT EXISTS idx_processed_docs_document_id ON processed_documents(document_id);

-- Processed documents by course
CREATE INDEX IF NOT EXISTS idx_processed_docs_course_id ON processed_documents(course_id);

-- Cache key lookup
CREATE INDEX IF NOT EXISTS idx_processed_docs_cache_key ON processed_documents(cache_key);

-- Pipeline version filtering
CREATE INDEX IF NOT EXISTS idx_processed_docs_pipeline_version ON processed_documents(pipeline_version);

-- Subject filtering
CREATE INDEX IF NOT EXISTS idx_processed_docs_subject ON processed_documents(subject);

-- GIN index for concept_map JSONB
CREATE INDEX IF NOT EXISTS idx_processed_docs_concept_map ON processed_documents USING gin(concept_map);

-- Vector similarity index (HNSW for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_processed_docs_embedding ON processed_documents 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- Chapter Indexes
-- ============================================================================

-- Chapters by processed document
CREATE INDEX IF NOT EXISTS idx_chapters_processed_id ON chapters(processed_id);

-- Chapter number ordering
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(chapter_number);

-- Composite index for document + chapter number
CREATE INDEX IF NOT EXISTS idx_chapters_processed_number ON chapters(processed_id, chapter_number);

-- Exam relevance filtering
CREATE INDEX IF NOT EXISTS idx_chapters_exam_relevance ON chapters(exam_relevance_score DESC) 
WHERE exam_relevance_score IS NOT NULL;

-- Complexity level filtering
CREATE INDEX IF NOT EXISTS idx_chapters_complexity_level ON chapters(complexity_level);

-- Full-text search on chapter title
CREATE INDEX IF NOT EXISTS idx_chapters_title_trgm ON chapters USING gin(title gin_trgm_ops);

-- ============================================================================
-- Keyword Indexes
-- ============================================================================

-- Keywords by chapter
CREATE INDEX IF NOT EXISTS idx_keywords_chapter_id ON keywords(chapter_id);

-- Keyword term lookup
CREATE INDEX IF NOT EXISTS idx_keywords_term ON keywords(term);

-- Primary keywords filtering
CREATE INDEX IF NOT EXISTS idx_keywords_primary ON keywords(is_primary) WHERE is_primary = TRUE;

-- Exam relevant keywords
CREATE INDEX IF NOT EXISTS idx_keywords_exam_relevant ON keywords(exam_relevant) WHERE exam_relevant = TRUE;

-- Full-text search on term and definition
CREATE INDEX IF NOT EXISTS idx_keywords_term_trgm ON keywords USING gin(term gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_keywords_definition_trgm ON keywords USING gin(definition gin_trgm_ops);

-- Vector similarity index for keywords
CREATE INDEX IF NOT EXISTS idx_keywords_embedding ON keywords 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- Relationship Indexes
-- ============================================================================

-- Relationships by chapter
CREATE INDEX IF NOT EXISTS idx_relationships_chapter_id ON relationships(chapter_id);

-- Source keyword lookup
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_keyword_id);

-- Target keyword lookup
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_keyword_id);

-- Relationship type filtering
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Cross-chapter relationships
CREATE INDEX IF NOT EXISTS idx_relationships_cross_chapter ON relationships(is_cross_chapter) 
WHERE is_cross_chapter = TRUE;

-- Composite index for bidirectional relationship lookup
CREATE INDEX IF NOT EXISTS idx_relationships_source_target ON relationships(source_keyword_id, target_keyword_id);

-- Relationship strength ordering
CREATE INDEX IF NOT EXISTS idx_relationships_strength ON relationships(strength DESC) 
WHERE strength IS NOT NULL;

-- ============================================================================
-- Feedback Indexes
-- ============================================================================

-- Annotations by user
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON user_annotations(user_id);

-- Annotations by course
CREATE INDEX IF NOT EXISTS idx_annotations_course_id ON user_annotations(course_id);

-- Feedback type filtering
CREATE INDEX IF NOT EXISTS idx_annotations_type ON user_annotations(feedback_type);

-- Unprocessed feedback
CREATE INDEX IF NOT EXISTS idx_annotations_unprocessed ON user_annotations(processed) 
WHERE processed = FALSE;

-- Recent feedback
CREATE INDEX IF NOT EXISTS idx_annotations_submitted_at ON user_annotations(submitted_at DESC);

-- Consensus feedback (3+ users)
CREATE INDEX IF NOT EXISTS idx_annotations_consensus ON user_annotations(consensus_count) 
WHERE consensus_count >= 3;

-- Composite index for feedback aggregation
CREATE INDEX IF NOT EXISTS idx_annotations_course_type_rating ON user_annotations(course_id, feedback_type, rating);

-- ============================================================================
-- Analogy Feedback Indexes
-- ============================================================================

-- Analogy feedback by user
CREATE INDEX IF NOT EXISTS idx_analogy_feedback_user_id ON analogy_feedback(user_id);

-- Analogy feedback by chapter
CREATE INDEX IF NOT EXISTS idx_analogy_feedback_chapter_id ON analogy_feedback(chapter_id);

-- Analogy feedback by analogy ID
CREATE INDEX IF NOT EXISTS idx_analogy_feedback_analogy_id ON analogy_feedback(analogy_id);

-- Helpful analogies
CREATE INDEX IF NOT EXISTS idx_analogy_feedback_helpful ON analogy_feedback(helpful) 
WHERE helpful = TRUE;

-- Recent analogy feedback
CREATE INDEX IF NOT EXISTS idx_analogy_feedback_submitted_at ON analogy_feedback(submitted_at DESC);

-- ============================================================================
-- Progress Indexes
-- ============================================================================

-- Progress by user
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON user_progress(user_id);

-- Progress by course
CREATE INDEX IF NOT EXISTS idx_progress_course_id ON user_progress(course_id);

-- Progress by chapter
CREATE INDEX IF NOT EXISTS idx_progress_chapter_id ON user_progress(chapter_id);

-- Completed chapters
CREATE INDEX IF NOT EXISTS idx_progress_completed ON user_progress(completed) 
WHERE completed = TRUE;

-- Recent activity
CREATE INDEX IF NOT EXISTS idx_progress_activity_date ON user_progress(last_activity_date DESC);

-- Active streaks
CREATE INDEX IF NOT EXISTS idx_progress_current_streak ON user_progress(current_streak_days DESC) 
WHERE current_streak_days > 0;

-- Composite index for user course progress
CREATE INDEX IF NOT EXISTS idx_progress_user_course ON user_progress(user_id, course_id);

-- GIN index for badges JSONB
CREATE INDEX IF NOT EXISTS idx_progress_badges ON user_progress USING gin(badges);

-- ============================================================================
-- Chapter Complexity Indexes
-- ============================================================================

-- Complexity by chapter
CREATE INDEX IF NOT EXISTS idx_chapter_complexity_chapter_id ON chapter_complexity(chapter_id);

-- Complexity level filtering
CREATE INDEX IF NOT EXISTS idx_chapter_complexity_level ON chapter_complexity(complexity_level);

-- Complexity score ordering
CREATE INDEX IF NOT EXISTS idx_chapter_complexity_score ON chapter_complexity(complexity_score DESC);

-- ============================================================================
-- Migrations Log Indexes
-- ============================================================================

-- Migration filename lookup
CREATE INDEX IF NOT EXISTS idx_migrations_filename ON migrations_log(filename);

-- Recent migrations
CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON migrations_log(applied_at DESC);

-- ============================================================================
-- Log Migration
-- ============================================================================

INSERT INTO migrations_log (filename, checksum, execution_time_ms)
VALUES (
    '20250122_0002_add_indexes.sql',
    md5('20250122_0002_add_indexes.sql'),
    extract(epoch from (clock_timestamp() - transaction_timestamp())) * 1000
)
ON CONFLICT (filename) DO NOTHING;

COMMIT;

-- Rollback on error
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    ROLLBACK;
