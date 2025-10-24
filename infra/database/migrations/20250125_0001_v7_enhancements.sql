-- V7.0 PDF Processing Enhancements Migration
-- Date: 2025-01-25
-- Description: Add v7-specific columns and tables for accuracy enhancements

-- Add v7-specific columns to concepts table
ALTER TABLE concepts
ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS methods_found INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS extraction_methods TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add v7-specific columns to relationships table
ALTER TABLE relationships
ADD COLUMN IF NOT EXISTS similarity_score FLOAT,
ADD COLUMN IF NOT EXISTS claude_confidence FLOAT,
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Add v7-specific columns to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS parse_method TEXT,
ADD COLUMN IF NOT EXISTS parse_confidence FLOAT,
ADD COLUMN IF NOT EXISTS hierarchy_json JSONB;

-- Create indexes for confidence-based queries
CREATE INDEX IF NOT EXISTS idx_concepts_confidence 
ON concepts(confidence) WHERE confidence > 0.7;

-- Create index for similarity-based queries
CREATE INDEX IF NOT EXISTS idx_relationships_similarity 
ON relationships(similarity_score) WHERE similarity_score > 0.6;

-- Create v7 processing metrics table
CREATE TABLE IF NOT EXISTS v7_processing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    parse_method TEXT NOT NULL,
    parse_duration_ms INTEGER,
    concepts_extracted INTEGER,
    high_confidence_concepts INTEGER,
    relationships_detected INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    total_cost DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_v7_metrics_document ON v7_processing_metrics(document_id);
CREATE INDEX idx_v7_metrics_created ON v7_processing_metrics(created_at);

-- Add comments for documentation
COMMENT ON COLUMN concepts.confidence IS 'V7: Confidence score from ensemble extraction (0.0-1.0)';
COMMENT ON COLUMN concepts.methods_found IS 'V7: Number of extraction methods that found this concept (1-3)';
COMMENT ON COLUMN concepts.extraction_methods IS 'V7: Array of methods that found this concept (keybert, yake, spacy)';
COMMENT ON COLUMN relationships.similarity_score IS 'V7: Semantic similarity from pgvector search (0.0-1.0)';
COMMENT ON COLUMN relationships.claude_confidence IS 'V7: Confidence from Claude analysis (0.0-1.0)';
COMMENT ON COLUMN relationships.explanation IS 'V7: Claude explanation of the relationship';
COMMENT ON TABLE v7_processing_metrics IS 'V7: Tracks processing metrics for accuracy validation';
