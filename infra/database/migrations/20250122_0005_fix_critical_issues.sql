-- ============================================================================
-- Migration: Fix Critical Security and Performance Issues
-- Created: 2025-01-22 00:05
-- Author: System
-- Description: Addresses critical RLS, trigger, and index issues identified in review
-- ============================================================================

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM migrations_log 
        WHERE filename = '20250122_0005_fix_critical_issues.sql'
    ) THEN
        RAISE NOTICE 'Migration already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- FIX #1: Safe User Context Function with Proper Error Handling
-- ============================================================================

-- Replace the unsafe get_current_user_id function
CREATE OR REPLACE FUNCTION get_current_user_id_safe()
RETURNS UUID AS $$
DECLARE
    v_user_id TEXT;
BEGIN
    v_user_id := current_setting('app.current_user_id', true);
    
    IF v_user_id IS NULL OR v_user_id = '' THEN
        RAISE EXCEPTION 'User context not set. Call set_current_user_id() before accessing user data.';
    END IF;
    
    RETURN v_user_id::UUID;
EXCEPTION
    WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Invalid user ID format: %', v_user_id;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error getting user context: %', SQLERRM;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_current_user_id_safe() IS 'Safely gets current user ID with explicit error handling';

-- ============================================================================
-- FIX #2: Update All RLS Policies to Use Safe Function
-- ============================================================================

-- User Profiles
DROP POLICY IF EXISTS user_profile_select_own ON user_profiles;
CREATE POLICY user_profile_select_own ON user_profiles
    FOR SELECT
    USING (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS user_profile_insert_own ON user_profiles;
CREATE POLICY user_profile_insert_own ON user_profiles
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS user_profile_update_own ON user_profiles;
CREATE POLICY user_profile_update_own ON user_profiles
    FOR UPDATE
    USING (user_id = get_current_user_id_safe())
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS user_profile_delete_own ON user_profiles;
CREATE POLICY user_profile_delete_own ON user_profiles
    FOR DELETE
    USING (user_id = get_current_user_id_safe());

-- Courses
DROP POLICY IF EXISTS course_select_own ON courses;
CREATE POLICY course_select_own ON courses
    FOR SELECT
    USING (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS course_insert_own ON courses;
CREATE POLICY course_insert_own ON courses
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS course_update_own ON courses;
CREATE POLICY course_update_own ON courses
    FOR UPDATE
    USING (user_id = get_current_user_id_safe())
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS course_delete_own ON courses;
CREATE POLICY course_delete_own ON courses
    FOR DELETE
    USING (user_id = get_current_user_id_safe());

-- User Annotations
DROP POLICY IF EXISTS annotation_select_own ON user_annotations;
CREATE POLICY annotation_select_own ON user_annotations
    FOR SELECT
    USING (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS annotation_insert_own ON user_annotations;
CREATE POLICY annotation_insert_own ON user_annotations
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS annotation_update_own ON user_annotations;
CREATE POLICY annotation_update_own ON user_annotations
    FOR UPDATE
    USING (user_id = get_current_user_id_safe())
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS annotation_delete_own ON user_annotations;
CREATE POLICY annotation_delete_own ON user_annotations
    FOR DELETE
    USING (user_id = get_current_user_id_safe());

-- User Progress
DROP POLICY IF EXISTS progress_select_own ON user_progress;
CREATE POLICY progress_select_own ON user_progress
    FOR SELECT
    USING (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS progress_insert_own ON user_progress;
CREATE POLICY progress_insert_own ON user_progress
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS progress_update_own ON user_progress;
CREATE POLICY progress_update_own ON user_progress
    FOR UPDATE
    USING (user_id = get_current_user_id_safe())
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS progress_delete_own ON user_progress;
CREATE POLICY progress_delete_own ON user_progress
    FOR DELETE
    USING (user_id = get_current_user_id_safe());

-- Analogy Feedback
DROP POLICY IF EXISTS analogy_feedback_select_own ON analogy_feedback;
CREATE POLICY analogy_feedback_select_own ON analogy_feedback
    FOR SELECT
    USING (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS analogy_feedback_insert_own ON analogy_feedback;
CREATE POLICY analogy_feedback_insert_own ON analogy_feedback
    FOR INSERT
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS analogy_feedback_update_own ON analogy_feedback;
CREATE POLICY analogy_feedback_update_own ON analogy_feedback
    FOR UPDATE
    USING (user_id = get_current_user_id_safe())
    WITH CHECK (user_id = get_current_user_id_safe());

DROP POLICY IF EXISTS analogy_feedback_delete_own ON analogy_feedback;
CREATE POLICY analogy_feedback_delete_own ON analogy_feedback
    FOR DELETE
    USING (user_id = get_current_user_id_safe());

-- ============================================================================
-- FIX #3: Add RLS to Missing Tables
-- ============================================================================

-- Enable RLS on course_documents
ALTER TABLE course_documents ENABLE ROW LEVEL SECURITY;

-- Users can only see documents for their courses
CREATE POLICY course_documents_select_own ON course_documents
    FOR SELECT
    USING (course_id IN (SELECT course_id FROM courses WHERE user_id = get_current_user_id_safe()));

CREATE POLICY course_documents_insert_own ON course_documents
    FOR INSERT
    WITH CHECK (course_id IN (SELECT course_id FROM courses WHERE user_id = get_current_user_id_safe()));

CREATE POLICY course_documents_update_own ON course_documents
    FOR UPDATE
    USING (course_id IN (SELECT course_id FROM courses WHERE user_id = get_current_user_id_safe()));

CREATE POLICY course_documents_delete_own ON course_documents
    FOR DELETE
    USING (course_id IN (SELECT course_id FROM courses WHERE user_id = get_current_user_id_safe()));

-- Admin bypass
CREATE POLICY course_documents_admin_all ON course_documents
    FOR ALL TO admin_role USING (true) WITH CHECK (true);

-- Enable RLS on processed_documents
ALTER TABLE processed_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY processed_documents_select_own ON processed_documents
    FOR SELECT
    USING (course_id IN (SELECT course_id FROM courses WHERE user_id = get_current_user_id_safe()));

CREATE POLICY processed_documents_admin_all ON processed_documents
    FOR ALL TO admin_role USING (true) WITH CHECK (true);

-- Enable RLS on chapters
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY chapters_select_own ON chapters
    FOR SELECT
    USING (processed_id IN (
        SELECT processed_id FROM processed_documents 
        WHERE course_id IN (SELECT course_id FROM courses WHERE user_id = get_current_user_id_safe())
    ));

CREATE POLICY chapters_admin_all ON chapters
    FOR ALL TO admin_role USING (true) WITH CHECK (true);

-- Enable RLS on keywords
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY keywords_select_own ON keywords
    FOR SELECT
    USING (chapter_id IN (
        SELECT c.chapter_id FROM chapters c
        JOIN processed_documents pd ON c.processed_id = pd.processed_id
        WHERE pd.course_id IN (SELECT course_id FROM courses WHERE user_id = get_current_user_id_safe())
    ));

CREATE POLICY keywords_admin_all ON keywords
    FOR ALL TO admin_role USING (true) WITH CHECK (true);

-- Enable RLS on relationships
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY relationships_select_own ON relationships
    FOR SELECT
    USING (chapter_id IN (
        SELECT c.chapter_id FROM chapters c
        JOIN processed_documents pd ON c.processed_id = pd.processed_id
        WHERE pd.course_id IN (SELECT course_id FROM courses WHERE user_id = get_current_user_id_safe())
    ));

CREATE POLICY relationships_admin_all ON relationships
    FOR ALL TO admin_role USING (true) WITH CHECK (true);

-- ============================================================================
-- FIX #4: Improve Vector Index Configuration
-- ============================================================================

-- Drop and recreate with better parameters for 768-dimensional embeddings
DROP INDEX IF EXISTS idx_processed_docs_embedding;
CREATE INDEX idx_processed_docs_embedding ON processed_documents 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 32, ef_construction = 128);

DROP INDEX IF EXISTS idx_keywords_embedding;
CREATE INDEX idx_keywords_embedding ON keywords 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 32, ef_construction = 128);

-- ============================================================================
-- FIX #5: Fix Streak Calculation Edge Case
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if time_spent has increased (actual activity)
    IF NEW.time_spent_seconds <= OLD.time_spent_seconds THEN
        RETURN NEW;
    END IF;
    
    -- Only update streak if it's a new day (prevent multiple updates same day)
    IF OLD.last_activity_date IS NULL OR OLD.last_activity_date < CURRENT_DATE THEN
        -- Check if streak continues (activity yesterday)
        IF OLD.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
            -- Continue streak
            NEW.current_streak_days = OLD.current_streak_days + 1;
            NEW.longest_streak_days = GREATEST(OLD.longest_streak_days, NEW.current_streak_days);
        ELSIF OLD.last_activity_date < CURRENT_DATE - INTERVAL '1 day' OR OLD.last_activity_date IS NULL THEN
            -- Streak broken or first activity
            NEW.current_streak_days = 1;
            NEW.longest_streak_days = GREATEST(OLD.longest_streak_days, 1);
        END IF;
        
        -- Update last activity date
        NEW.last_activity_date = CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX #6: Remove Problematic Consensus Trigger (Use Batch Processing Instead)
-- ============================================================================

-- Drop the real-time consensus trigger to avoid race conditions
DROP TRIGGER IF EXISTS check_consensus_on_feedback ON user_annotations;

-- Create a function for batch consensus detection (to be called periodically)
CREATE OR REPLACE FUNCTION detect_feedback_consensus()
RETURNS TABLE(course_id UUID, feedback_type VARCHAR, rating INTEGER, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH consensus_feedback AS (
        SELECT 
            ua.course_id,
            ua.feedback_type,
            ua.rating,
            COUNT(*) as feedback_count
        FROM user_annotations ua
        WHERE ua.processed = FALSE
        GROUP BY ua.course_id, ua.feedback_type, ua.rating
        HAVING COUNT(*) >= 3
    )
    UPDATE user_annotations ua
    SET 
        processed = TRUE,
        consensus_count = cf.feedback_count
    FROM consensus_feedback cf
    WHERE ua.course_id = cf.course_id
        AND ua.feedback_type = cf.feedback_type
        AND ua.rating = cf.rating
        AND ua.processed = FALSE
    RETURNING ua.course_id, ua.feedback_type, ua.rating, cf.feedback_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_feedback_consensus() IS 'Batch process to detect and flag consensus feedback (run periodically)';

-- ============================================================================
-- FIX #7: Optimize Interests Validation
-- ============================================================================

-- Update trigger to only fire when interests actually changes
DROP TRIGGER IF EXISTS validate_interests_trigger ON user_profiles;
CREATE TRIGGER validate_interests_trigger
    BEFORE INSERT OR UPDATE OF interests ON user_profiles
    FOR EACH ROW
    WHEN (NEW.interests IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.interests IS DISTINCT FROM OLD.interests))
    EXECUTE FUNCTION validate_interests_length();

-- ============================================================================
-- FIX #8: Add Partial Indexes for Common Queries
-- ============================================================================

-- Documents needing processing
CREATE INDEX IF NOT EXISTS idx_documents_needs_processing 
ON course_documents(course_id, upload_date)
WHERE processing_status IN ('pending', 'processing');

-- Failed documents for retry
CREATE INDEX IF NOT EXISTS idx_documents_failed_retry
ON course_documents(upload_date, retry_count)
WHERE processing_status = 'failed' AND retry_count < 3;

-- Active user progress
CREATE INDEX IF NOT EXISTS idx_progress_active
ON user_progress(user_id, last_activity_date DESC)
WHERE completed = FALSE;

-- ============================================================================
-- Log Migration
-- ============================================================================

INSERT INTO migrations_log (filename, checksum, execution_time_ms)
VALUES (
    '20250122_0005_fix_critical_issues.sql',
    md5('20250122_0005_fix_critical_issues.sql'),
    extract(epoch from (clock_timestamp() - transaction_timestamp())) * 1000
)
ON CONFLICT (filename) DO NOTHING;

COMMIT;
