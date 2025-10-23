-- Rollback Migration: Two-View Learning System Integration
-- Date: 2025-01-23
-- Description: Rollback changes from 20250123_0001_two_view_integration.sql

-- ============================================================================
-- PART 1: Drop Sensa Learn tables
-- ============================================================================

DROP VIEW IF EXISTS concept_analogy_coverage;
DROP VIEW IF EXISTS user_analogy_stats;

DROP TRIGGER IF EXISTS trigger_concept_analogy_connections_updated_at ON concept_analogy_connections;
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;

DROP FUNCTION IF EXISTS update_concept_analogy_connections_updated_at();
DROP FUNCTION IF EXISTS update_user_profiles_updated_at();

DROP TABLE IF EXISTS generated_questions CASCADE;
DROP TABLE IF EXISTS concept_analogy_connections CASCADE;
DROP TABLE IF EXISTS analogies CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================================================
-- PART 2: Remove columns from relationships table
-- ============================================================================

DROP INDEX IF EXISTS idx_relationships_type;
DROP INDEX IF EXISTS idx_relationships_structure_category;

ALTER TABLE relationships 
  DROP COLUMN IF EXISTS relationship_type,
  DROP COLUMN IF EXISTS structure_category;

-- ============================================================================
-- PART 3: Rename concepts back to keywords and remove new columns
-- ============================================================================

DROP INDEX IF EXISTS idx_concepts_structure_type;

ALTER TABLE concepts 
  DROP COLUMN IF EXISTS structure_type,
  DROP COLUMN IF EXISTS surrounding_concepts,
  DROP COLUMN IF EXISTS source_sentences;

-- Rename indexes back
ALTER INDEX IF EXISTS idx_concepts_embedding RENAME TO idx_keywords_embedding;
ALTER INDEX IF EXISTS idx_concepts_document RENAME TO idx_keywords_document;

-- Rename table back
ALTER TABLE concepts RENAME TO keywords;

-- ============================================================================
-- Rollback complete
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Rollback of migration 20250123_0001_two_view_integration completed';
    RAISE NOTICE 'All Sensa Learn tables dropped';
    RAISE NOTICE 'Table renamed: concepts -> keywords';
    RAISE NOTICE 'New columns removed from keywords and relationships tables';
END $$;
