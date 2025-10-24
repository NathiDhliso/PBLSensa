-- ============================================================================
-- PBL Platform Database Schema with pgvector
-- Version: 7.0
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgvector";  -- Disabled: not available in RDS
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Users table (synced with Cognito)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    reputation_score INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),  -- For homograph detection (e.g., "Biology", "Law")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_subject ON courses(subject);

-- Processed documents table
CREATE TABLE IF NOT EXISTS processed_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA256 hash
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    
    -- Processing metadata
    pipeline_version VARCHAR(20) NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Document metadata
    num_pages INTEGER,
    subject VARCHAR(100),
    document_type VARCHAR(50) DEFAULT 'textbook',  -- textbook, exam, notes
    
    -- Extracted content
    full_text TEXT,
    structured_content JSONB,  -- Normalized hierarchy
    concept_map JSONB,  -- Full concept map
    chapter_maps JSONB,  -- Individual chapter views
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user_id ON processed_documents(user_id);
CREATE INDEX idx_documents_file_hash ON processed_documents(file_hash);
CREATE INDEX idx_documents_status ON processed_documents(processing_status);
CREATE INDEX idx_documents_pipeline_version ON processed_documents(pipeline_version);
CREATE INDEX idx_documents_subject ON processed_documents(subject);

-- Course-Document relationship (many-to-many)
CREATE TABLE IF NOT EXISTS course_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES processed_documents(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, document_id)
);

CREATE INDEX idx_course_documents_course_id ON course_documents(course_id);
CREATE INDEX idx_course_documents_document_id ON course_documents(document_id);

-- ============================================================================
-- Vector Storage for RAG
-- ============================================================================

-- Document chunks with embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES processed_documents(id) ON DELETE CASCADE,
    
    -- Chunk metadata
    chunk_index INTEGER NOT NULL,
    chapter_id VARCHAR(100),  -- e.g., "chapter_1_section_2"
    page_number INTEGER,
    
    -- Content
    text_content TEXT NOT NULL,
    token_count INTEGER,
    
    -- Vector embedding (disabled - pgvector not available)
    -- embedding vector(768),  -- HDT-E uses 768 dimensions
    embedding_placeholder TEXT  -- Placeholder for future vector support
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_chapter_id ON document_chunks(chapter_id);
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Keywords with embeddings
CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES processed_documents(id) ON DELETE CASCADE,
    
    -- Keyword data
    keyword TEXT NOT NULL,
    normalized_keyword TEXT NOT NULL,  -- Lowercase, trimmed
    score FLOAT NOT NULL,
    extraction_methods TEXT[],  -- ['keybert', 'yake', 'spacy']
    
    -- Exam relevance
    exam_relevance_score FLOAT,
    exam_priority VARCHAR(20),  -- 'high', 'medium', 'low'
    
    -- Context
    chapter_id VARCHAR(100),
    context_snippet TEXT,
    
    -- Vector embedding (disabled - pgvector not available)
    -- embedding vector(768),
    embedding_placeholder TEXT,  -- Placeholder for future vector support
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(document_id, normalized_keyword, chapter_id)
);

CREATE INDEX idx_keywords_document_id ON keywords(document_id);
CREATE INDEX idx_keywords_normalized ON keywords(normalized_keyword);
CREATE INDEX idx_keywords_chapter_id ON keywords(chapter_id);
CREATE INDEX idx_keywords_exam_priority ON keywords(exam_priority);
CREATE INDEX idx_keywords_embedding ON keywords USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- User Feedback and Annotations
-- ============================================================================

-- User annotations on keywords
CREATE TABLE IF NOT EXISTS user_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES processed_documents(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    
    -- Feedback type
    feedback_type VARCHAR(50) NOT NULL,  -- 'incorrect', 'missing', 'helpful', 'not_helpful'
    feedback_text TEXT,
    
    -- Consensus tracking
    is_consensus BOOLEAN DEFAULT FALSE,
    consensus_count INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_annotations_user_id ON user_annotations(user_id);
CREATE INDEX idx_annotations_document_id ON user_annotations(document_id);
CREATE INDEX idx_annotations_keyword_id ON user_annotations(keyword_id);
CREATE INDEX idx_annotations_feedback_type ON user_annotations(feedback_type);
CREATE INDEX idx_annotations_consensus ON user_annotations(is_consensus);

-- ============================================================================
-- Processing Queue and Cache Metadata
-- ============================================================================

-- Cache metadata (for tracking Redis cache entries)
CREATE TABLE IF NOT EXISTS cache_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    document_id UUID REFERENCES processed_documents(id) ON DELETE CASCADE,
    pipeline_version VARCHAR(20) NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_metadata_key ON cache_metadata(cache_key);
CREATE INDEX idx_cache_metadata_document_id ON cache_metadata(document_id);
CREATE INDEX idx_cache_metadata_expires_at ON cache_metadata(expires_at);

-- Processing jobs (for tracking SQS tasks)
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES processed_documents(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,  -- 'parse', 'embed', 'extract_keywords', 'generate_map'
    status VARCHAR(50) DEFAULT 'queued',  -- queued, processing, completed, failed
    sqs_message_id VARCHAR(255),
    
    -- Retry tracking
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    
    -- Timing
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error_message TEXT,
    error_stack_trace TEXT,
    
    -- Metadata
    metadata JSONB
);

CREATE INDEX idx_jobs_document_id ON processing_jobs(document_id);
CREATE INDEX idx_jobs_status ON processing_jobs(status);
CREATE INDEX idx_jobs_job_type ON processing_jobs(job_type);
CREATE INDEX idx_jobs_queued_at ON processing_jobs(queued_at);

-- ============================================================================
-- Analytics and Metrics
-- ============================================================================

-- Usage metrics
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Metric data
    metric_type VARCHAR(100) NOT NULL,  -- 'document_upload', 'concept_map_view', 'api_call'
    metric_value FLOAT,
    
    -- Context
    document_id UUID REFERENCES processed_documents(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX idx_metrics_type ON usage_metrics(metric_type);
CREATE INDEX idx_metrics_created_at ON usage_metrics(created_at);

-- Cost tracking
CREATE TABLE IF NOT EXISTS cost_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Service costs
    service_name VARCHAR(100) NOT NULL,  -- 'bedrock', 'textract', 'sagemaker', 'llamaparse'
    operation VARCHAR(100),
    
    -- Cost data
    estimated_cost_usd DECIMAL(10, 4),
    units_consumed INTEGER,
    
    -- Context
    document_id UUID REFERENCES processed_documents(id) ON DELETE SET NULL,
    job_id UUID REFERENCES processing_jobs(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_service ON cost_tracking(service_name);
CREATE INDEX idx_cost_created_at ON cost_tracking(created_at);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON processed_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON user_annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for semantic search
-- DISABLED: CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_document_id uuid DEFAULT NULL,
    filter_chapter_id varchar DEFAULT NULL
)
RETURNS TABLE (
    chunk_id uuid,
    document_id uuid,
    text_content text,
    chapter_id varchar,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.text_content,
        dc.chapter_id,
        1 - (dc.embedding <=> query_embedding) as similarity
    FROM document_chunks dc
    WHERE 
        (filter_document_id IS NULL OR dc.document_id = filter_document_id)
        AND (filter_chapter_id IS NULL OR dc.chapter_id = filter_chapter_id)
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function for finding similar keywords (for homograph detection)
-- DISABLED: CREATE OR REPLACE FUNCTION find_similar_keywords(
    query_embedding vector(768),
    similarity_threshold float DEFAULT 0.95,
    exclude_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
    keyword_id uuid,
    keyword text,
    document_id uuid,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.keyword,
        k.document_id,
        1 - (k.embedding <=> query_embedding) as similarity
    FROM keywords k
    WHERE 
        (exclude_document_id IS NULL OR k.document_id != exclude_document_id)
        AND 1 - (k.embedding <=> query_embedding) > similarity_threshold
    ORDER BY k.embedding <=> query_embedding;
END;
$$;

-- ============================================================================
-- Initial Data / Seed
-- ============================================================================

-- Create a system user for automated processes
INSERT INTO users (id, cognito_sub, email, full_name, reputation_score)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system',
    'system@pbl-platform.internal',
    'System User',
    1000
) ON CONFLICT (cognito_sub) DO NOTHING;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for document processing status
CREATE OR REPLACE VIEW document_processing_status AS
SELECT
    pd.id,
    pd.filename,
    pd.processing_status,
    pd.pipeline_version,
    COUNT(DISTINCT dc.id) as chunk_count,
    COUNT(DISTINCT k.id) as keyword_count,
    pd.processing_started_at,
    pd.processing_completed_at,
    EXTRACT(EPOCH FROM (pd.processing_completed_at - pd.processing_started_at)) as processing_duration_seconds
FROM processed_documents pd
LEFT JOIN document_chunks dc ON pd.id = dc.document_id
LEFT JOIN keywords k ON pd.id = k.document_id
GROUP BY pd.id;

-- View for user feedback summary
CREATE OR REPLACE VIEW user_feedback_summary AS
SELECT
    u.id as user_id,
    u.email,
    u.reputation_score,
    COUNT(ua.id) as total_feedback_count,
    COUNT(CASE WHEN ua.is_consensus THEN 1 END) as consensus_feedback_count,
    COUNT(CASE WHEN ua.feedback_type = 'helpful' THEN 1 END) as helpful_count,
    COUNT(CASE WHEN ua.feedback_type = 'not_helpful' THEN 1 END) as not_helpful_count
FROM users u
LEFT JOIN user_annotations ua ON u.id = ua.user_id
GROUP BY u.id;

-- ============================================================================
-- Grants (adjust based on your application user)
-- ============================================================================

-- Grant permissions to application user (replace 'pbl_app' with your actual user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pbl_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pbl_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pbl_app;
