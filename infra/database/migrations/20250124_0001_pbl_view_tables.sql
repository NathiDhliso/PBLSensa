-- Migration: PBL View Tables and Enhancements
-- Date: 2025-01-24
-- Description: Add PBL-specific columns to concepts/relationships and create pbl_visualizations table

-- ============================================================================
-- PART 1: Enhance concepts table for PBL View
-- ============================================================================

-- Add PBL-specific columns to concepts table
ALTER TABLE concepts 
  ADD COLUMN IF NOT EXISTS importance_score FLOAT DEFAULT 0.5 CHECK (importance_score BETWEEN 0 AND 1),
  ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES concepts(id) ON DELETE SET NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_concepts_importance ON concepts(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_concepts_validated ON concepts(validated);
CREATE INDEX IF NOT EXISTS idx_concepts_merged_into ON concepts(merged_into);

-- Add comments
COMMENT ON COLUMN concepts.importance_score IS 'Calculated importance based on frequency and context (0.0 to 1.0)';
COMMENT ON COLUMN concepts.validated IS 'Whether the concept has been reviewed and approved by the user';
COMMENT ON COLUMN concepts.merged_into IS 'If this concept is a duplicate, references the primary concept it was merged into';

-- ============================================================================
-- PART 2: Ensure relationships table has all required fields
-- ============================================================================

-- Verify and add any missing columns
DO $
BEGIN
    -- Check if validated_by_user column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'relationships' AND column_name = 'validated_by_user'
    ) THEN
        ALTER TABLE relationships ADD COLUMN validated_by_user BOOLEAN DEFAULT false;
    END IF;
END $;

-- Add index for validated_by_user if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_relationships_validated ON relationships(validated_by_user);

-- Add unique constraint to prevent duplicate relationships
CREATE UNIQUE INDEX IF NOT EXISTS idx_relationships_unique 
  ON relationships(source_concept_id, target_concept_id, relationship_type);

-- Add comments
COMMENT ON COLUMN relationships.validated_by_user IS 'Whether the relationship has been confirmed by the user';
COMMENT ON COLUMN relationships.strength IS 'Confidence score for this relationship (0.0 to 1.0)';

-- ============================================================================
-- PART 3: Create pbl_visualizations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS pbl_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES processed_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Visualization data stored as JSONB
    nodes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Layout configuration
    layout_type TEXT DEFAULT 'hybrid' CHECK (layout_type IN ('tree', 'mindmap', 'flowchart', 'hybrid')),
    
    -- Viewport state (zoom, pan position)
    viewport_json JSONB DEFAULT '{"zoom": 1, "x": 0, "y": 0}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one visualization per user per document
    UNIQUE(document_id, user_id)
);

-- Indexes for pbl_visualizations
CREATE INDEX IF NOT EXISTS idx_pbl_viz_document ON pbl_visualizations(document_id);
CREATE INDEX IF NOT EXISTS idx_pbl_viz_user ON pbl_visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_pbl_viz_layout ON pbl_visualizations(layout_type);
CREATE INDEX IF NOT EXISTS idx_pbl_viz_updated ON pbl_visualizations(updated_at DESC);

-- GIN indexes for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_pbl_viz_nodes_gin ON pbl_visualizations USING GIN (nodes_json);
CREATE INDEX IF NOT EXISTS idx_pbl_viz_edges_gin ON pbl_visualizations USING GIN (edges_json);

-- Add comments
COMMENT ON TABLE pbl_visualizations IS 'Stores user-customized PBL concept map visualizations';
COMMENT ON COLUMN pbl_visualizations.nodes_json IS 'Array of diagram nodes with positions, labels, and styling';
COMMENT ON COLUMN pbl_visualizations.edges_json IS 'Array of diagram edges connecting nodes';
COMMENT ON COLUMN pbl_visualizations.layout_type IS 'Layout algorithm: tree, mindmap, flowchart, or hybrid';
COMMENT ON COLUMN pbl_visualizations.viewport_json IS 'Current zoom level and pan position';

-- ============================================================================
-- PART 4: Create trigger for updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pbl_visualizations_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for pbl_visualizations
DROP TRIGGER IF EXISTS trigger_pbl_visualizations_updated_at ON pbl_visualizations;
CREATE TRIGGER trigger_pbl_visualizations_updated_at
    BEFORE UPDATE ON pbl_visualizations
    FOR EACH ROW
    EXECUTE FUNCTION update_pbl_visualizations_updated_at();

-- ============================================================================
-- PART 5: Create views for analytics and reporting
-- ============================================================================

-- View for concept validation statistics
CREATE OR REPLACE VIEW pbl_concept_validation_stats AS
SELECT 
    d.id as document_id,
    d.filename,
    d.user_id,
    COUNT(c.id) as total_concepts,
    COUNT(CASE WHEN c.validated THEN 1 END) as validated_concepts,
    COUNT(CASE WHEN c.merged_into IS NOT NULL THEN 1 END) as merged_concepts,
    ROUND(
        COUNT(CASE WHEN c.validated THEN 1 END)::numeric / 
        NULLIF(COUNT(c.id), 0) * 100, 
        2
    ) as validation_percentage,
    AVG(c.importance_score) as avg_importance_score
FROM processed_documents d
LEFT JOIN concepts c ON d.id = c.document_id
WHERE c.merged_into IS NULL  -- Exclude merged duplicates
GROUP BY d.id, d.filename, d.user_id;

COMMENT ON VIEW pbl_concept_validation_stats IS 'Statistics on concept extraction and validation per document';

-- View for relationship classification statistics
CREATE OR REPLACE VIEW pbl_relationship_stats AS
SELECT 
    d.id as document_id,
    d.filename,
    COUNT(r.id) as total_relationships,
    COUNT(CASE WHEN r.structure_category = 'hierarchical' THEN 1 END) as hierarchical_count,
    COUNT(CASE WHEN r.structure_category = 'sequential' THEN 1 END) as sequential_count,
    COUNT(CASE WHEN r.structure_category = 'unclassified' THEN 1 END) as unclassified_count,
    COUNT(CASE WHEN r.validated_by_user THEN 1 END) as validated_relationships,
    AVG(r.strength) as avg_relationship_strength
FROM processed_documents d
LEFT JOIN concepts c ON d.id = c.document_id
LEFT JOIN relationships r ON (c.id = r.source_concept_id OR c.id = r.target_concept_id)
WHERE c.merged_into IS NULL
GROUP BY d.id, d.filename;

COMMENT ON VIEW pbl_relationship_stats IS 'Statistics on relationship detection and classification per document';

-- View for visualization usage
CREATE OR REPLACE VIEW pbl_visualization_usage AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT v.id) as total_visualizations,
    COUNT(DISTINCT v.document_id) as documents_visualized,
    COUNT(CASE WHEN v.layout_type = 'tree' THEN 1 END) as tree_layouts,
    COUNT(CASE WHEN v.layout_type = 'mindmap' THEN 1 END) as mindmap_layouts,
    COUNT(CASE WHEN v.layout_type = 'flowchart' THEN 1 END) as flowchart_layouts,
    COUNT(CASE WHEN v.layout_type = 'hybrid' THEN 1 END) as hybrid_layouts,
    MAX(v.updated_at) as last_visualization_update
FROM users u
LEFT JOIN pbl_visualizations v ON u.id = v.user_id
GROUP BY u.id, u.email;

COMMENT ON VIEW pbl_visualization_usage IS 'User engagement with PBL visualizations';

-- ============================================================================
-- PART 6: Sample data validation queries
-- ============================================================================

-- Query to find concepts that might be duplicates (high similarity)
-- This is a helper for the ConceptDeduplicator service
CREATE OR REPLACE FUNCTION find_potential_duplicate_concepts(
    p_document_id UUID,
    p_similarity_threshold FLOAT DEFAULT 0.95
)
RETURNS TABLE (
    concept_a_id UUID,
    concept_a_term TEXT,
    concept_b_id UUID,
    concept_b_term TEXT,
    similarity_score FLOAT
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        c1.id as concept_a_id,
        c1.term as concept_a_term,
        c2.id as concept_b_id,
        c2.term as concept_b_term,
        1 - (c1.embedding <=> c2.embedding) as similarity_score
    FROM concepts c1
    CROSS JOIN concepts c2
    WHERE c1.document_id = p_document_id
      AND c2.document_id = p_document_id
      AND c1.id < c2.id  -- Avoid duplicates and self-comparison
      AND c1.merged_into IS NULL
      AND c2.merged_into IS NULL
      AND c1.embedding IS NOT NULL
      AND c2.embedding IS NOT NULL
      AND 1 - (c1.embedding <=> c2.embedding) > p_similarity_threshold
    ORDER BY similarity_score DESC;
END;
$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_potential_duplicate_concepts IS 'Finds concept pairs with high semantic similarity for deduplication';

-- ============================================================================
-- Migration complete
-- ============================================================================

DO $
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Migration 20250124_0001_pbl_view_tables completed successfully';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  1. Added importance_score, validated, merged_into to concepts table';
    RAISE NOTICE '  2. Added validated_by_user to relationships table';
    RAISE NOTICE '  3. Created pbl_visualizations table';
    RAISE NOTICE '  4. Created indexes for performance';
    RAISE NOTICE '  5. Created analytics views';
    RAISE NOTICE '  6. Created find_potential_duplicate_concepts() function';
    RAISE NOTICE '=================================================================';
END $;
