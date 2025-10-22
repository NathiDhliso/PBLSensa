-- ============================================================================
-- Migration: Add Utility Functions
-- Created: 2025-01-22 00:05
-- Author: System
-- Description: Creates utility functions for common operations like vector
--              similarity, course statistics, and user progress summaries
-- ============================================================================

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM migrations_log 
        WHERE filename = '20250122_0005_add_utility_functions.sql'
    ) THEN
        RAISE NOTICE 'Migration already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- Vector Similarity Functions
-- ============================================================================

-- Calculate cosine similarity between two vectors
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS FLOAT AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION cosine_similarity(vector, vector) IS 'Calculates cosine similarity between two vectors (returns 0-1, higher is more similar)';

-- Find similar documents by embedding
CREATE OR REPLACE FUNCTION find_similar_documents(
    p_embedding vector,
    p_limit INTEGER DEFAULT 10,
    p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    processed_id UUID,
    document_id UUID,
    course_id UUID,
    similarity FLOAT,
    subject VARCHAR,
    pipeline_version VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.processed_id,
        pd.document_id,
        pd.course_id,
        cosine_similarity(pd.embedding, p_embedding) AS similarity,
        pd.subject,
        pd.pipeline_version
    FROM processed_documents pd
    WHERE pd.embedding IS NOT NULL
    AND cosine_similarity(pd.embedding, p_embedding) >= p_threshold
    ORDER BY pd.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_similar_documents(vector, INTEGER, FLOAT) IS 'Finds similar documents based on embedding similarity';

-- Find similar keywords
CREATE OR REPLACE FUNCTION find_similar_keywords(
    p_embedding vector,
    p_chapter_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    keyword_id UUID,
    chapter_id UUID,
    term VARCHAR,
    definition TEXT,
    similarity FLOAT,
    is_primary BOOLEAN,
    exam_relevant BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.keyword_id,
        k.chapter_id,
        k.term,
        k.definition,
        cosine_similarity(k.embedding, p_embedding) AS similarity,
        k.is_primary,
        k.exam_relevant
    FROM keywords k
    WHERE k.embedding IS NOT NULL
    AND (p_chapter_id IS NULL OR k.chapter_id = p_chapter_id)
    AND cosine_similarity(k.embedding, p_embedding) >= p_threshold
    ORDER BY k.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_similar_keywords(vector, UUID, INTEGER, FLOAT) IS 'Finds similar keywords based on embedding similarity, optionally filtered by chapter';

-- ============================================================================
-- Course Statistics Functions
-- ============================================================================

-- Get comprehensive course statistics
CREATE OR REPLACE FUNCTION get_course_stats(p_course_id UUID)
RETURNS TABLE (
    total_documents INTEGER,
    completed_documents INTEGER,
    pending_documents INTEGER,
    processing_documents INTEGER,
    failed_documents INTEGER,
    total_chapters INTEGER,
    total_keywords INTEGER,
    total_relationships INTEGER,
    avg_exam_relevance DECIMAL,
    avg_complexity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT cd.document_id)::INTEGER AS total_documents,
        COUNT(DISTINCT CASE WHEN cd.processing_status = 'completed' THEN cd.document_id END)::INTEGER AS completed_documents,
        COUNT(DISTINCT CASE WHEN cd.processing_status = 'pending' THEN cd.document_id END)::INTEGER AS pending_documents,
        COUNT(DISTINCT CASE WHEN cd.processing_status = 'processing' THEN cd.document_id END)::INTEGER AS processing_documents,
        COUNT(DISTINCT CASE WHEN cd.processing_status = 'failed' THEN cd.document_id END)::INTEGER AS failed_documents,
        COUNT(DISTINCT c.chapter_id)::INTEGER AS total_chapters,
        COUNT(DISTINCT k.keyword_id)::INTEGER AS total_keywords,
        COUNT(DISTINCT r.relationship_id)::INTEGER AS total_relationships,
        ROUND(AVG(c.exam_relevance_score), 2) AS avg_exam_relevance,
        ROUND(AVG(c.complexity_score), 2) AS avg_complexity
    FROM courses co
    LEFT JOIN course_documents cd ON co.course_id = cd.course_id
    LEFT JOIN processed_documents pd ON cd.document_id = pd.document_id
    LEFT JOIN chapters c ON pd.processed_id = c.processed_id
    LEFT JOIN keywords k ON c.chapter_id = k.chapter_id
    LEFT JOIN relationships r ON c.chapter_id = r.chapter_id
    WHERE co.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_course_stats(UUID) IS 'Returns comprehensive statistics for a course including document counts, chapters, keywords, and averages';

-- Get document processing summary
CREATE OR REPLACE FUNCTION get_document_summary(p_document_id UUID)
RETURNS TABLE (
    document_id UUID,
    filename VARCHAR,
    processing_status processing_status_enum,
    total_chapters INTEGER,
    total_keywords INTEGER,
    total_relationships INTEGER,
    processing_time_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.document_id,
        cd.filename,
        cd.processing_status,
        COUNT(DISTINCT c.chapter_id)::INTEGER AS total_chapters,
        COUNT(DISTINCT k.keyword_id)::INTEGER AS total_keywords,
        COUNT(DISTINCT r.relationship_id)::INTEGER AS total_relationships,
        EXTRACT(EPOCH FROM (cd.processed_at - cd.upload_date))::INTEGER AS processing_time_seconds
    FROM course_documents cd
    LEFT JOIN processed_documents pd ON cd.document_id = pd.document_id
    LEFT JOIN chapters c ON pd.processed_id = c.processed_id
    LEFT JOIN keywords k ON c.chapter_id = k.chapter_id
    LEFT JOIN relationships r ON c.chapter_id = r.chapter_id
    WHERE cd.document_id = p_document_id
    GROUP BY cd.document_id, cd.filename, cd.processing_status, cd.processed_at, cd.upload_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_document_summary(UUID) IS 'Returns processing summary for a specific document';

-- ============================================================================
-- User Progress Functions
-- ============================================================================

-- Get user progress summary for a course
CREATE OR REPLACE FUNCTION get_user_progress_summary(p_user_id UUID, p_course_id UUID)
RETURNS TABLE (
    total_chapters INTEGER,
    completed_chapters INTEGER,
    completion_percentage DECIMAL,
    current_streak INTEGER,
    longest_streak INTEGER,
    total_time_spent_seconds INTEGER,
    total_time_spent_hours DECIMAL,
    last_activity_date DATE,
    total_badges INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(c.chapter_id)::INTEGER AS total_chapters,
        COUNT(CASE WHEN up.completed THEN 1 END)::INTEGER AS completed_chapters,
        ROUND((COUNT(CASE WHEN up.completed THEN 1 END)::DECIMAL / NULLIF(COUNT(c.chapter_id), 0)) * 100, 2) AS completion_percentage,
        COALESCE(MAX(up.current_streak_days), 0)::INTEGER AS current_streak,
        COALESCE(MAX(up.longest_streak_days), 0)::INTEGER AS longest_streak,
        COALESCE(SUM(up.time_spent_seconds), 0)::INTEGER AS total_time_spent_seconds,
        ROUND(COALESCE(SUM(up.time_spent_seconds), 0)::DECIMAL / 3600, 2) AS total_time_spent_hours,
        MAX(up.last_activity_date) AS last_activity_date,
        COUNT(DISTINCT jsonb_array_elements(up.badges))::INTEGER AS total_badges
    FROM chapters c
    JOIN processed_documents pd ON c.processed_id = pd.processed_id
    LEFT JOIN user_progress up ON c.chapter_id = up.chapter_id AND up.user_id = p_user_id
    WHERE pd.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_progress_summary(UUID, UUID) IS 'Returns comprehensive progress summary for a user in a specific course';

-- Get user's overall learning statistics
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS TABLE (
    total_courses INTEGER,
    total_chapters_completed INTEGER,
    total_time_spent_hours DECIMAL,
    current_longest_streak INTEGER,
    all_time_longest_streak INTEGER,
    total_unique_badges INTEGER,
    courses_in_progress INTEGER,
    courses_completed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.course_id)::INTEGER AS total_courses,
        COUNT(CASE WHEN up.completed THEN 1 END)::INTEGER AS total_chapters_completed,
        ROUND(COALESCE(SUM(up.time_spent_seconds), 0)::DECIMAL / 3600, 2) AS total_time_spent_hours,
        COALESCE(MAX(up.current_streak_days), 0)::INTEGER AS current_longest_streak,
        COALESCE(MAX(up.longest_streak_days), 0)::INTEGER AS all_time_longest_streak,
        COUNT(DISTINCT jsonb_array_elements(up.badges))::INTEGER AS total_unique_badges,
        COUNT(DISTINCT CASE 
            WHEN up.completed = FALSE THEN c.course_id 
        END)::INTEGER AS courses_in_progress,
        COUNT(DISTINCT CASE 
            WHEN up.completed = TRUE THEN c.course_id 
        END)::INTEGER AS courses_completed
    FROM courses c
    LEFT JOIN course_documents cd ON c.course_id = cd.course_id
    LEFT JOIN processed_documents pd ON cd.document_id = pd.document_id
    LEFT JOIN chapters ch ON pd.processed_id = ch.processed_id
    LEFT JOIN user_progress up ON ch.chapter_id = up.chapter_id AND up.user_id = p_user_id
    WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_learning_stats(UUID) IS 'Returns overall learning statistics for a user across all courses';

-- ============================================================================
-- Feedback Analysis Functions
-- ============================================================================

-- Get feedback summary for a course
CREATE OR REPLACE FUNCTION get_course_feedback_summary(p_course_id UUID)
RETURNS TABLE (
    feedback_type feedback_type_enum,
    total_feedback INTEGER,
    avg_rating DECIMAL,
    consensus_feedback INTEGER,
    processed_feedback INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.feedback_type,
        COUNT(*)::INTEGER AS total_feedback,
        ROUND(AVG(ua.rating), 2) AS avg_rating,
        COUNT(CASE WHEN ua.consensus_count >= 3 THEN 1 END)::INTEGER AS consensus_feedback,
        COUNT(CASE WHEN ua.processed THEN 1 END)::INTEGER AS processed_feedback
    FROM user_annotations ua
    WHERE ua.course_id = p_course_id
    GROUP BY ua.feedback_type;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_course_feedback_summary(UUID) IS 'Returns feedback summary grouped by type for a course';

-- ============================================================================
-- Search and Discovery Functions
-- ============================================================================

-- Search courses by name or description
CREATE OR REPLACE FUNCTION search_courses(
    p_user_id UUID,
    p_search_term VARCHAR,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    course_id UUID,
    name VARCHAR,
    description TEXT,
    subject VARCHAR,
    created_at TIMESTAMPTZ,
    document_count BIGINT,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.course_id,
        c.name,
        c.description,
        c.subject,
        c.created_at,
        COUNT(cd.document_id) AS document_count,
        GREATEST(
            similarity(c.name, p_search_term),
            similarity(COALESCE(c.description, ''), p_search_term)
        ) AS relevance
    FROM courses c
    LEFT JOIN course_documents cd ON c.course_id = cd.course_id
    WHERE c.user_id = p_user_id
    AND c.is_archived = FALSE
    AND (
        c.name ILIKE '%' || p_search_term || '%'
        OR c.description ILIKE '%' || p_search_term || '%'
        OR c.subject ILIKE '%' || p_search_term || '%'
    )
    GROUP BY c.course_id, c.name, c.description, c.subject, c.created_at
    ORDER BY relevance DESC, c.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_courses(UUID, VARCHAR, INTEGER) IS 'Searches user courses by name, description, or subject with relevance ranking';

-- Search keywords across all chapters
CREATE OR REPLACE FUNCTION search_keywords(
    p_course_id UUID,
    p_search_term VARCHAR,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    keyword_id UUID,
    chapter_id UUID,
    chapter_number INTEGER,
    chapter_title VARCHAR,
    term VARCHAR,
    definition TEXT,
    is_primary BOOLEAN,
    exam_relevant BOOLEAN,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.keyword_id,
        k.chapter_id,
        c.chapter_number,
        c.title AS chapter_title,
        k.term,
        k.definition,
        k.is_primary,
        k.exam_relevant,
        GREATEST(
            similarity(k.term, p_search_term),
            similarity(k.definition, p_search_term)
        ) AS relevance
    FROM keywords k
    JOIN chapters c ON k.chapter_id = c.chapter_id
    JOIN processed_documents pd ON c.processed_id = pd.processed_id
    WHERE pd.course_id = p_course_id
    AND (
        k.term ILIKE '%' || p_search_term || '%'
        OR k.definition ILIKE '%' || p_search_term || '%'
    )
    ORDER BY relevance DESC, k.is_primary DESC, k.exam_relevant DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_keywords(UUID, VARCHAR, INTEGER) IS 'Searches keywords within a course with relevance ranking';

-- ============================================================================
-- Utility Helper Functions
-- ============================================================================

-- Check if a document hash already exists in a course (for deduplication)
CREATE OR REPLACE FUNCTION document_hash_exists(
    p_course_id UUID,
    p_sha256_hash CHAR(64)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM course_documents
        WHERE course_id = p_course_id
        AND sha256_hash = p_sha256_hash
    ) INTO v_exists;
    
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION document_hash_exists(UUID, CHAR) IS 'Checks if a document with the given hash already exists in the course';

-- Get cache key for document processing
CREATE OR REPLACE FUNCTION generate_cache_key(
    p_sha256_hash CHAR(64),
    p_pipeline_version VARCHAR(20)
)
RETURNS VARCHAR AS $$
BEGIN
    RETURN p_sha256_hash || '_v' || p_pipeline_version;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_cache_key(CHAR, VARCHAR) IS 'Generates a cache key from document hash and pipeline version';

-- ============================================================================
-- Log Migration
-- ============================================================================

INSERT INTO migrations_log (filename, checksum, execution_time_ms)
VALUES (
    '20250122_0005_add_utility_functions.sql',
    md5('20250122_0005_add_utility_functions.sql'),
    extract(epoch from (clock_timestamp() - transaction_timestamp())) * 1000
)
ON CONFLICT (filename) DO NOTHING;

COMMIT;

-- Rollback on error
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    ROLLBACK;
