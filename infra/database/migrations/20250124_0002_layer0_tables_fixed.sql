-- Migration: Layer 0 PDF Optimization Tables (Fixed)
-- Description: Creates tables for PDF caching, cost tracking, and monitoring
-- Date: 2025-01-24
-- Version: 0002 (Fixed)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PDF Cache Table
-- Stores cached processing results with compression
CREATE TABLE IF NOT EXISTS pdf_cache (
    pdf_hash VARCHAR(64) PRIMARY KEY,
    file_metadata JSONB NOT NULL,
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('digital', 'scanned', 'hybrid')),
    processing_results BYTEA NOT NULL,  -- Compressed JSON with gzip
    embeddings BYTEA,  -- Compressed embeddings
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    storage_size_bytes INTEGER,
    compression_ratio FLOAT,
    CONSTRAINT valid_compression_ratio CHECK (compression_ratio >= 0 AND compression_ratio <= 1)
);

-- Indexes for pdf_cache (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_pdf_cache_last_accessed ON pdf_cache(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_cache_created ON pdf_cache(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_cache_document_type ON pdf_cache(document_type);

-- Cost Tracking Table
-- Tracks processing costs and savings from caching
CREATE TABLE IF NOT EXISTS layer0_cost_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pdf_hash VARCHAR(64),
    document_id UUID,
    user_id UUID,
    cache_hit BOOLEAN NOT NULL,
    estimated_cost DECIMAL(10,4),
    actual_cost DECIMAL(10,4),
    cost_saved DECIMAL(10,4),
    processing_time_ms INTEGER,
    page_count INTEGER,
    document_type VARCHAR(20) CHECK (document_type IN ('digital', 'scanned', 'hybrid')),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_costs CHECK (
        estimated_cost >= 0 AND 
        actual_cost >= 0 AND 
        cost_saved >= 0
    )
);

-- Indexes for layer0_cost_tracking (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON layer0_cost_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_hash ON layer0_cost_tracking(pdf_hash);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_document ON layer0_cost_tracking(document_id);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_user ON layer0_cost_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_cache_hit ON layer0_cost_tracking(cache_hit);

-- Materialized View for Statistics
-- Drop and recreate to ensure it's up to date
DROP MATERIALIZED VIEW IF EXISTS layer0_stats CASCADE;

CREATE MATERIALIZED VIEW layer0_stats AS
SELECT
    -- Cache statistics
    COUNT(*) as total_cache_entries,
    SUM(CASE WHEN last_accessed > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as active_entries_7d,
    SUM(CASE WHEN last_accessed > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as active_entries_30d,
    AVG(compression_ratio) as avg_compression_ratio,
    SUM(storage_size_bytes) / 1024.0 / 1024.0 as total_size_mb,
    
    -- Cost statistics
    (SELECT COUNT(*) FROM layer0_cost_tracking WHERE cache_hit = true) as total_cache_hits,
    (SELECT COUNT(*) FROM layer0_cost_tracking WHERE cache_hit = false) as total_cache_misses,
    (SELECT SUM(cost_saved) FROM layer0_cost_tracking) as total_cost_saved,
    (SELECT SUM(actual_cost) FROM layer0_cost_tracking) as total_cost_spent,
    (SELECT AVG(processing_time_ms) FROM layer0_cost_tracking WHERE cache_hit = true) as avg_cache_hit_time_ms,
    (SELECT AVG(processing_time_ms) FROM layer0_cost_tracking WHERE cache_hit = false) as avg_cache_miss_time_ms,
    
    -- Current timestamp
    NOW() as last_updated
FROM pdf_cache;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_layer0_stats_singleton ON layer0_stats((1));

-- Function to refresh stats
CREATE OR REPLACE FUNCTION refresh_layer0_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY layer0_stats;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE pdf_cache IS 'Stores cached PDF processing results with compression to avoid redundant processing';
COMMENT ON TABLE layer0_cost_tracking IS 'Tracks processing costs and savings from Layer 0 caching';
COMMENT ON MATERIALIZED VIEW layer0_stats IS 'Aggregate statistics for Layer 0 performance monitoring';
COMMENT ON COLUMN pdf_cache.pdf_hash IS 'SHA-256 hash of PDF file for duplicate detection';
COMMENT ON COLUMN pdf_cache.processing_results IS 'Gzip-compressed JSON containing concepts, relationships, and structures';
COMMENT ON COLUMN pdf_cache.compression_ratio IS 'Ratio of compressed size to original size (0.0 to 1.0)';
COMMENT ON COLUMN layer0_cost_tracking.cache_hit IS 'Whether this request was served from cache';
COMMENT ON COLUMN layer0_cost_tracking.cost_saved IS 'Cost saved by using cache instead of reprocessing';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Layer 0 tables created successfully';
    RAISE NOTICE 'Tables: pdf_cache, layer0_cost_tracking';
    RAISE NOTICE 'Materialized View: layer0_stats';
    RAISE NOTICE 'Run refresh_layer0_stats() to update statistics';
END $$;
