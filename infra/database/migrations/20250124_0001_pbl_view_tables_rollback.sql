-- Rollback Migration: PBL View Tables and Enhancements
-- Date: 2025-01-24
-- Description: Rollback PBL-specific changes to concepts/relationships and drop pbl_visualizations table

-- ============================================================================
-- PART 1: Drop views
-- ============================================================================

DROP VIEW IF EXISTS pbl_visualization_usage;
DROP VIEW IF EXISTS pbl_relationship_stats;
DROP VIEW IF EXISTS pbl_concept_validation_stats;

-- ============================================================================
-- PART 2: Drop functions
-- ============================================================================

DROP FUNCTION IF EXISTS find_potential_duplicate_concepts(UUID, FLOAT);

-- ============================================================================
-- PART 3: Drop pbl_visualizations table
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_pbl_visualizations_updated_at ON pbl_visualizations;
DROP FUNCTION IF EXISTS update_pbl_visualizations_updated_at();
DROP TABLE IF EXISTS pbl_visualizations CASCADE;

-- ============================================================================
-- PART 4: Remove columns from relationships table
-- ============================================================================

DROP INDEX IF EXISTS idx_relationships_validated;
DROP INDEX IF EXISTS idx_relationships_unique;

ALTER TABLE relationships 
  DROP COLUMN IF EXISTS validated_by_user;

-- ============================================================================
-- PART 5: Remove columns from concepts table
-- ============================================================================

DROP INDEX IF EXISTS idx_concepts_merged_into;
DROP INDEX IF EXISTS idx_concepts_validated;
DROP INDEX IF EXISTS idx_concepts_importance;

ALTER TABLE concepts 
  DROP COLUMN IF EXISTS merged_into,
  DROP COLUMN IF EXISTS validated,
  DROP COLUMN IF EXISTS importance_score;

-- ============================================================================
-- Rollback complete
-- ============================================================================

DO $
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Rollback 20250124_0001_pbl_view_tables completed successfully';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Changes rolled back:';
    RAISE NOTICE '  1. Removed importance_score, validated, merged_into from concepts';
    RAISE NOTICE '  2. Removed validated_by_user from relationships';
    RAISE NOTICE '  3. Dropped pbl_visualizations table';
    RAISE NOTICE '  4. Dropped all indexes, views, and functions';
    RAISE NOTICE '=================================================================';
END $;
