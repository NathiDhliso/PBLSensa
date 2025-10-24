-- V7.0 PDF Processing Enhancements Rollback Migration
-- Date: 2025-01-25
-- Description: Rollback v7-specific columns and tables

-- Drop v7 processing metrics table
DROP TABLE IF EXISTS v7_processing_metrics;

-- Drop indexes
DROP INDEX IF EXISTS idx_concepts_confidence;
DROP INDEX IF EXISTS idx_relationships_similarity;

-- Remove v7-specific columns from documents table
ALTER TABLE documents
DROP COLUMN IF EXISTS parse_method,
DROP COLUMN IF EXISTS parse_confidence,
DROP COLUMN IF EXISTS hierarchy_json;

-- Remove v7-specific columns from relationships table
ALTER TABLE relationships
DROP COLUMN IF EXISTS similarity_score,
DROP COLUMN IF EXISTS claude_confidence,
DROP COLUMN IF EXISTS explanation;

-- Remove v7-specific columns from concepts table
ALTER TABLE concepts
DROP COLUMN IF EXISTS confidence,
DROP COLUMN IF EXISTS methods_found,
DROP COLUMN IF EXISTS extraction_methods;
