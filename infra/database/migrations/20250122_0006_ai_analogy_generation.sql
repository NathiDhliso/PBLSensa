-- ============================================================================
-- AI-Powered Analogy Generation Feature - Database Migration
-- Version: 1.0
-- Date: 2025-01-22
-- ============================================================================

-- Add new columns to users table for personalization
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_style VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS background TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Create indexes for new user columns
CREATE INDEX IF NOT EXISTS idx_users_learning_style ON users(learning_style);

-- ============================================================================
-- Chapter Analogies Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS chapter_analogies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id VARCHAR(100) NOT NULL,
    document_id UUID REFERENCES processed_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analogy content
    concept VARCHAR(255) NOT NULL,
    analogy_text TEXT NOT NULL,
    based_on_interest VARCHAR(100),
    learning_style_adaptation TEXT,
    
    -- Generation metadata
    model_version VARCHAR(50) NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    generation_cost_usd DECIMAL(10, 6),
    
    -- Caching
    cache_key VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analogies_chapter_id ON chapter_analogies(chapter_id);
CREATE INDEX IF NOT EXISTS idx_analogies_user_id ON chapter_analogies(user_id);
CREATE INDEX IF NOT EXISTS idx_analogies_cache_key ON chapter_analogies(cache_key);
CREATE INDEX IF NOT EXISTS idx_analogies_expires_at ON chapter_analogies(expires_at);
CREATE INDEX IF NOT EXISTS idx_analogies_document_id ON chapter_analogies(document_id);

-- ============================================================================
-- Memory Techniques Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS memory_techniques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    technique_type VARCHAR(50) NOT NULL, -- acronym, mind_palace, chunking, spaced_repetition
    technique_text TEXT NOT NULL,
    application TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memory_techniques_chapter_id ON memory_techniques(chapter_id);
CREATE INDEX IF NOT EXISTS idx_memory_techniques_user_id ON memory_techniques(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_techniques_type ON memory_techniques(technique_type);

-- ============================================================================
-- Learning Mantras Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_mantras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    mantra_text VARCHAR(255) NOT NULL,
    explanation TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mantras_user_id ON learning_mantras(user_id);
CREATE INDEX IF NOT EXISTS idx_mantras_course_id ON learning_mantras(course_id);

-- ============================================================================
-- Analogy Feedback Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS analogy_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analogy_id UUID REFERENCES chapter_analogies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(analogy_id, user_id) -- One rating per user per analogy
);

CREATE INDEX IF NOT EXISTS idx_feedback_analogy_id ON analogy_feedback(analogy_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON analogy_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON analogy_feedback(rating);

-- ============================================================================
-- Chapter Complexity Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS chapter_complexity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id VARCHAR(100) UNIQUE NOT NULL,
    document_id UUID REFERENCES processed_documents(id) ON DELETE CASCADE,
    
    complexity_score FLOAT NOT NULL CHECK (complexity_score >= 0 AND complexity_score <= 1),
    concept_count INTEGER,
    vocabulary_difficulty FLOAT,
    relationship_complexity FLOAT,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complexity_chapter_id ON chapter_complexity(chapter_id);
CREATE INDEX IF NOT EXISTS idx_complexity_score ON chapter_complexity(complexity_score);
CREATE INDEX IF NOT EXISTS idx_complexity_document_id ON chapter_complexity(document_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_analogies_updated_at BEFORE UPDATE ON chapter_analogies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for analogy statistics
CREATE OR REPLACE VIEW analogy_statistics AS
SELECT
    ca.id,
    ca.chapter_id,
    ca.concept,
    ca.based_on_interest,
    COUNT(af.id) as rating_count,
    AVG(af.rating) as average_rating,
    ca.created_at,
    ca.expires_at
FROM chapter_analogies ca
LEFT JOIN analogy_feedback af ON ca.id = af.analogy_id
GROUP BY ca.id;

-- View for user analogy generation stats
CREATE OR REPLACE VIEW user_generation_stats AS
SELECT
    u.id as user_id,
    u.email,
    COUNT(DISTINCT ca.id) as total_analogies_generated,
    COUNT(DISTINCT CASE WHEN ca.created_at >= CURRENT_DATE THEN ca.id END) as today_generations,
    MAX(ca.created_at) as last_generation_at
FROM users u
LEFT JOIN chapter_analogies ca ON u.id = ca.user_id
GROUP BY u.id;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE chapter_analogies IS 'Stores AI-generated personalized analogies for chapter concepts';
COMMENT ON TABLE memory_techniques IS 'Stores personalized memory techniques for chapters';
COMMENT ON TABLE learning_mantras IS 'Stores motivational learning mantras for users';
COMMENT ON TABLE analogy_feedback IS 'Stores user ratings and feedback on analogies';
COMMENT ON TABLE chapter_complexity IS 'Stores calculated complexity scores for chapters';

COMMENT ON COLUMN users.learning_style IS 'User learning style: visual, auditory, kinesthetic, or reading-writing';
COMMENT ON COLUMN users.interests IS 'Array of user interests for personalized analogies';
COMMENT ON COLUMN chapter_analogies.cache_key IS 'Cache key for retrieving analogies based on user profile';
COMMENT ON COLUMN chapter_analogies.expires_at IS 'Expiration timestamp for cache invalidation (30 days)';
