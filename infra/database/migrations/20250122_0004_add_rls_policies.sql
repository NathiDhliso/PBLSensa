-- ============================================================================
-- Migration: Add Row-Level Security Policies
-- Created: 2025-01-22 00:04
-- Author: System
-- Description: Implements row-level security policies to ensure users can only
--              access their own data and authorized course content
-- ============================================================================

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM migrations_log 
        WHERE filename = '20250122_0004_add_rls_policies.sql'
    ) THEN
        RAISE NOTICE 'Migration already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- Create Admin Role (if not exists)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
        CREATE ROLE admin_role;
    END IF;
END $$;

COMMENT ON ROLE admin_role IS 'Administrative role with full database access';

-- ============================================================================
-- Enable RLS on Tables
-- ============================================================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_annotations
ALTER TABLE user_annotations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Enable RLS on analogy_feedback
ALTER TABLE analogy_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- User Profile Policies
-- ============================================================================

-- Users can only see their own profile
DROP POLICY IF EXISTS user_profile_select_own ON user_profiles;
CREATE POLICY user_profile_select_own ON user_profiles
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only insert their own profile
DROP POLICY IF EXISTS user_profile_insert_own ON user_profiles;
CREATE POLICY user_profile_insert_own ON user_profiles
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only update their own profile
DROP POLICY IF EXISTS user_profile_update_own ON user_profiles;
CREATE POLICY user_profile_update_own ON user_profiles
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true)::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only delete their own profile
DROP POLICY IF EXISTS user_profile_delete_own ON user_profiles;
CREATE POLICY user_profile_delete_own ON user_profiles
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Admin bypass for user_profiles
DROP POLICY IF EXISTS user_profile_admin_all ON user_profiles;
CREATE POLICY user_profile_admin_all ON user_profiles
    FOR ALL
    TO admin_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Course Policies
-- ============================================================================

-- Users can only see their own courses
DROP POLICY IF EXISTS course_select_own ON courses;
CREATE POLICY course_select_own ON courses
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only create courses for themselves
DROP POLICY IF EXISTS course_insert_own ON courses;
CREATE POLICY course_insert_own ON courses
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only update their own courses
DROP POLICY IF EXISTS course_update_own ON courses;
CREATE POLICY course_update_own ON courses
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true)::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only delete their own courses
DROP POLICY IF EXISTS course_delete_own ON courses;
CREATE POLICY course_delete_own ON courses
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Admin bypass for courses
DROP POLICY IF EXISTS course_admin_all ON courses;
CREATE POLICY course_admin_all ON courses
    FOR ALL
    TO admin_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- User Annotations Policies
-- ============================================================================

-- Users can only see their own feedback
DROP POLICY IF EXISTS annotation_select_own ON user_annotations;
CREATE POLICY annotation_select_own ON user_annotations
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only create feedback for themselves
DROP POLICY IF EXISTS annotation_insert_own ON user_annotations;
CREATE POLICY annotation_insert_own ON user_annotations
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only update their own feedback
DROP POLICY IF EXISTS annotation_update_own ON user_annotations;
CREATE POLICY annotation_update_own ON user_annotations
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true)::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only delete their own feedback
DROP POLICY IF EXISTS annotation_delete_own ON user_annotations;
CREATE POLICY annotation_delete_own ON user_annotations
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Admin bypass for annotations
DROP POLICY IF EXISTS annotation_admin_all ON user_annotations;
CREATE POLICY annotation_admin_all ON user_annotations
    FOR ALL
    TO admin_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- User Progress Policies
-- ============================================================================

-- Users can only see their own progress
DROP POLICY IF EXISTS progress_select_own ON user_progress;
CREATE POLICY progress_select_own ON user_progress
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only create progress for themselves
DROP POLICY IF EXISTS progress_insert_own ON user_progress;
CREATE POLICY progress_insert_own ON user_progress
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only update their own progress
DROP POLICY IF EXISTS progress_update_own ON user_progress;
CREATE POLICY progress_update_own ON user_progress
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true)::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only delete their own progress
DROP POLICY IF EXISTS progress_delete_own ON user_progress;
CREATE POLICY progress_delete_own ON user_progress
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Admin bypass for progress
DROP POLICY IF EXISTS progress_admin_all ON user_progress;
CREATE POLICY progress_admin_all ON user_progress
    FOR ALL
    TO admin_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Analogy Feedback Policies
-- ============================================================================

-- Users can only see their own analogy feedback
DROP POLICY IF EXISTS analogy_feedback_select_own ON analogy_feedback;
CREATE POLICY analogy_feedback_select_own ON analogy_feedback
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only create analogy feedback for themselves
DROP POLICY IF EXISTS analogy_feedback_insert_own ON analogy_feedback;
CREATE POLICY analogy_feedback_insert_own ON analogy_feedback
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only update their own analogy feedback
DROP POLICY IF EXISTS analogy_feedback_update_own ON analogy_feedback;
CREATE POLICY analogy_feedback_update_own ON analogy_feedback
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true)::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Users can only delete their own analogy feedback
DROP POLICY IF EXISTS analogy_feedback_delete_own ON analogy_feedback;
CREATE POLICY analogy_feedback_delete_own ON analogy_feedback
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Admin bypass for analogy feedback
DROP POLICY IF EXISTS analogy_feedback_admin_all ON analogy_feedback;
CREATE POLICY analogy_feedback_admin_all ON analogy_feedback
    FOR ALL
    TO admin_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Helper Function for Setting User Context
-- ============================================================================

-- Function to set the current user ID for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_current_user_id(UUID) IS 'Sets the current user ID for row-level security policies. Call this at the start of each database session.';

-- Function to get the current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_current_user_id() IS 'Gets the current user ID set for row-level security';

-- Function to clear the current user ID
CREATE OR REPLACE FUNCTION clear_current_user_id()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clear_current_user_id() IS 'Clears the current user ID (useful for cleanup)';

-- ============================================================================
-- Usage Instructions
-- ============================================================================

-- To use RLS in your application:
-- 
-- 1. At the start of each database session, set the current user ID:
--    SELECT set_current_user_id('user-uuid-here');
--
-- 2. All subsequent queries will automatically filter based on the user ID
--
-- 3. To bypass RLS (for admin operations), use the admin_role:
--    SET ROLE admin_role;
--
-- 4. To return to normal user role:
--    RESET ROLE;
--
-- Example in Python (using psycopg2):
--    cursor.execute("SELECT set_current_user_id(%s)", (user_id,))
--    cursor.execute("SELECT * FROM courses")  # Only returns user's courses

-- ============================================================================
-- Log Migration
-- ============================================================================

INSERT INTO migrations_log (filename, checksum, execution_time_ms)
VALUES (
    '20250122_0004_add_rls_policies.sql',
    md5('20250122_0004_add_rls_policies.sql'),
    extract(epoch from (clock_timestamp() - transaction_timestamp())) * 1000
)
ON CONFLICT (filename) DO NOTHING;

COMMIT;

-- Rollback on error
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    ROLLBACK;
