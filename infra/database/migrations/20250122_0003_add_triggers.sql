-- ============================================================================
-- Migration: Add Triggers and Functions
-- Created: 2025-01-22 00:03
-- Author: System
-- Description: Creates automated triggers and functions for timestamp updates,
--              streak calculations, and feedback consensus detection
-- ============================================================================

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM migrations_log 
        WHERE filename = '20250122_0003_add_triggers.sql'
    ) THEN
        RAISE NOTICE 'Migration already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- Timestamp Update Function and Triggers
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column to current timestamp';

-- Apply timestamp trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply timestamp trigger to user_profiles table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply timestamp trigger to courses table
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- User Streak Calculation Function and Trigger
-- ============================================================================

-- Function to update user learning streaks
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if time_spent has increased (actual activity)
    IF NEW.time_spent_seconds <= OLD.time_spent_seconds THEN
        RETURN NEW;
    END IF;
    
    -- If this is the first activity or activity is on a new day
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

COMMENT ON FUNCTION update_user_streak() IS 'Automatically calculates and updates user learning streaks based on daily activity';

-- Apply streak trigger to user_progress table
DROP TRIGGER IF EXISTS update_streak_on_progress ON user_progress;
CREATE TRIGGER update_streak_on_progress
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    WHEN (NEW.time_spent_seconds > OLD.time_spent_seconds)
    EXECUTE FUNCTION update_user_streak();

-- ============================================================================
-- Feedback Consensus Detection Function and Trigger
-- ============================================================================

-- Function to check for feedback consensus
CREATE OR REPLACE FUNCTION check_feedback_consensus()
RETURNS TRIGGER AS $$
DECLARE
    similar_feedback_count INTEGER;
BEGIN
    -- Count similar feedback for the same course/type/rating
    SELECT COUNT(*)
    INTO similar_feedback_count
    FROM user_annotations
    WHERE course_id = NEW.course_id
    AND feedback_type = NEW.feedback_type
    AND rating = NEW.rating
    AND processed = FALSE
    AND annotation_id != NEW.annotation_id;
    
    -- Update consensus count (including this new feedback)
    NEW.consensus_count = similar_feedback_count + 1;
    
    -- Flag for processing if consensus reached (3+ users)
    IF NEW.consensus_count >= 3 THEN
        -- Mark this feedback as processed
        NEW.processed = TRUE;
        
        -- Also mark other similar feedback as processed
        UPDATE user_annotations
        SET processed = TRUE,
            consensus_count = NEW.consensus_count
        WHERE course_id = NEW.course_id
        AND feedback_type = NEW.feedback_type
        AND rating = NEW.rating
        AND processed = FALSE
        AND annotation_id != NEW.annotation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_feedback_consensus() IS 'Detects when 3+ users provide similar feedback and flags it for processing';

-- Apply consensus trigger to user_annotations table
DROP TRIGGER IF EXISTS check_consensus_on_feedback ON user_annotations;
CREATE TRIGGER check_consensus_on_feedback
    BEFORE INSERT ON user_annotations
    FOR EACH ROW
    EXECUTE FUNCTION check_feedback_consensus();

-- ============================================================================
-- Chapter Completion Trigger
-- ============================================================================

-- Function to set completion timestamp
CREATE OR REPLACE FUNCTION set_completion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- If chapter is being marked as completed and wasn't before
    IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- If chapter is being marked as incomplete
    IF NEW.completed = FALSE AND OLD.completed = TRUE THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_completion_timestamp() IS 'Automatically sets completed_at timestamp when a chapter is marked complete';

-- Apply completion trigger to user_progress table
DROP TRIGGER IF EXISTS set_completion_timestamp_trigger ON user_progress;
CREATE TRIGGER set_completion_timestamp_trigger
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    WHEN (NEW.completed IS DISTINCT FROM OLD.completed)
    EXECUTE FUNCTION set_completion_timestamp();

-- ============================================================================
-- Document Processing Status Update Trigger
-- ============================================================================

-- Function to set processed_at timestamp
CREATE OR REPLACE FUNCTION set_processed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is being changed to completed or failed
    IF NEW.processing_status IN ('completed', 'failed') AND 
       OLD.processing_status NOT IN ('completed', 'failed') THEN
        NEW.processed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_processed_timestamp() IS 'Automatically sets processed_at timestamp when document processing completes or fails';

-- Apply processing trigger to course_documents table
DROP TRIGGER IF EXISTS set_processed_timestamp_trigger ON course_documents;
CREATE TRIGGER set_processed_timestamp_trigger
    BEFORE UPDATE ON course_documents
    FOR EACH ROW
    WHEN (NEW.processing_status IS DISTINCT FROM OLD.processing_status)
    EXECUTE FUNCTION set_processed_timestamp();

-- ============================================================================
-- User Last Login Update Trigger
-- ============================================================================

-- Function to update last login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_login_at on any update to the user record
    -- This assumes the application updates the user record on login
    IF NEW.last_login_at IS NULL OR NEW.last_login_at < NOW() - INTERVAL '1 minute' THEN
        NEW.last_login_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_last_login() IS 'Updates last_login_at timestamp when user record is updated';

-- Note: This trigger is commented out as last_login should be explicitly set by the application
-- Uncomment if you want automatic last_login tracking on any user update
-- DROP TRIGGER IF EXISTS update_last_login_trigger ON users;
-- CREATE TRIGGER update_last_login_trigger
--     BEFORE UPDATE ON users
--     FOR EACH ROW
--     EXECUTE FUNCTION update_last_login();

-- ============================================================================
-- Validation Triggers
-- ============================================================================

-- Function to validate interests array length
CREATE OR REPLACE FUNCTION validate_interests_length()
RETURNS TRIGGER AS $$
BEGIN
    IF jsonb_array_length(NEW.interests) > 10 THEN
        RAISE EXCEPTION 'Maximum 10 interests allowed, got %', jsonb_array_length(NEW.interests);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_interests_length() IS 'Validates that user interests array does not exceed 10 items';

-- Apply interests validation trigger
DROP TRIGGER IF EXISTS validate_interests_trigger ON user_profiles;
CREATE TRIGGER validate_interests_trigger
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    WHEN (NEW.interests IS NOT NULL)
    EXECUTE FUNCTION validate_interests_length();

-- ============================================================================
-- Audit Logging Trigger (Optional)
-- ============================================================================

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(100) DEFAULT CURRENT_USER,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Audit trail for important table changes';

-- Function to log important changes
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_audit_trail() IS 'Logs all changes to audited tables for compliance and debugging';

-- Apply audit logging to sensitive tables (commented out by default for performance)
-- Uncomment to enable audit logging on specific tables

-- DROP TRIGGER IF EXISTS audit_users_trigger ON users;
-- CREATE TRIGGER audit_users_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON users
--     FOR EACH ROW
--     EXECUTE FUNCTION log_audit_trail();

-- DROP TRIGGER IF EXISTS audit_courses_trigger ON courses;
-- CREATE TRIGGER audit_courses_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON courses
--     FOR EACH ROW
--     EXECUTE FUNCTION log_audit_trail();

-- ============================================================================
-- Log Migration
-- ============================================================================

INSERT INTO migrations_log (filename, checksum, execution_time_ms)
VALUES (
    '20250122_0003_add_triggers.sql',
    md5('20250122_0003_add_triggers.sql'),
    extract(epoch from (clock_timestamp() - transaction_timestamp())) * 1000
)
ON CONFLICT (filename) DO NOTHING;

COMMIT;

-- Rollback on error
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    ROLLBACK;
