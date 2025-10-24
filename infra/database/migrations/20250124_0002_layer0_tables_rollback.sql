-- Rollback Migration: Layer 0 PDF Optimization Tables
-- Description: Removes Layer 0 tables and related objects
-- Date: 2025-01-24
-- Version: 0002

-- Drop function
DROP FUNCTION IF EXISTS refresh_layer0_stats();

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS layer0_stats;

-- Drop indexes (will be dropped automatically with tables, but explicit for clarity)
DROP INDEX IF EXISTS idx_cost_tracking_cache_hit;
DROP INDEX IF EXISTS idx_cost_tracking_user;
DROP INDEX IF EXISTS idx_cost_tracking_document;
DROP INDEX IF EXISTS idx_cost_tracking_hash;
DROP INDEX IF EXISTS idx_cost_tracking_date;

DROP INDEX IF EXISTS idx_pdf_cache_document_type;
DROP INDEX IF EXISTS idx_pdf_cache_created;
DROP INDEX IF EXISTS idx_pdf_cache_last_accessed;

-- Drop tables
DROP TABLE IF EXISTS layer0_cost_tracking;
DROP TABLE IF EXISTS pdf_cache;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Layer 0 tables rolled back successfully';
    RAISE NOTICE 'Removed: pdf_cache, layer0_cost_tracking, layer0_stats';
END $$;
