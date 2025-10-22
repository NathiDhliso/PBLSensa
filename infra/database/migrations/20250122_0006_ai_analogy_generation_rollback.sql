-- ============================================================================
-- AI-Powered Analogy Generation Feature - Rollback Migration
-- Version: 1.0
-- Date: 2025-01-22
-- ============================================================================

-- Drop views
DROP VIEW IF EXISTS user_generation_stats;
DROP VIEW IF EXISTS analogy_statistics;

-- Drop triggers
DROP TRIGGER IF EXISTS update_analogies_updated_at ON chapter_analogies;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS analogy_feedback CASCADE;
DROP TABLE IF EXISTS chapter_complexity CASCADE;
DROP TABLE IF EXISTS learning_mantras CASCADE;
DROP TABLE IF EXISTS memory_techniques CASCADE;
DROP TABLE IF EXISTS chapter_analogies CASCADE;

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS interests;
ALTER TABLE users DROP COLUMN IF EXISTS education_level;
ALTER TABLE users DROP COLUMN IF EXISTS background;
ALTER TABLE users DROP COLUMN IF EXISTS learning_style;

-- Drop indexes (if they weren't dropped with tables)
DROP INDEX IF EXISTS idx_users_learning_style;

-- Note: This rollback will permanently delete all analogy data
-- Make sure to backup data before running this script
