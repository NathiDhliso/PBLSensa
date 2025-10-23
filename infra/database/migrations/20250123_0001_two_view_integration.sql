-- Migration: Two-View Learning System Integration
-- Date: 2025-01-23
-- Description: Rename keywords to concepts, add structure classification, create Sensa Learn tables

-- ============================================================================
-- PART 1: Rename keywords to concepts and add new columns
-- ============================================================================

-- Rename the table
ALTER TABLE keywords RENAME TO concepts;

-- Add new columns for concept extraction
ALTER TABLE concepts 
  ADD COLUMN IF NOT EXISTS source_sentences TEXT[],
  ADD COLUMN IF NOT EXISTS surrounding_concepts TEXT[],
  ADD COLUMN IF NOT EXISTS structure_type TEXT CHECK (structure_type IN ('hierarchical', 'sequential', 'unclassified'));

-- Update indexes
ALTER INDEX IF EXISTS idx_keywords_document RENAME TO idx_concepts_document;
ALTER INDEX IF EXISTS idx_keywords_embedding RENAME TO idx_concepts_embedding;

-- Create index on structure_type
CREATE INDEX IF NOT EXISTS idx_concepts_structure_type ON concepts(structure_type);

-- ============================================================================
-- PART 2: Enhance relationships table with structure classification
-- ============================================================================

ALTER TABLE relationships 
  ADD COLUMN IF NOT EXISTS structure_category TEXT CHECK (structure_category IN ('hierarchical', 'sequential', 'unclassified')),
  ADD COLUMN IF NOT EXISTS relationship_type TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_relationships_structure_category ON relationships(structure_category);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- ============================================================================
-- PART 3: Create Sensa Learn tables
-- ============================================================================

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    background_json JSONB DEFAULT '{}'::jsonb,
    interests_json JSONB DEFAULT '{}'::jsonb,
    experiences_json JSONB DEFAULT '{}'::jsonb,
    learning_style_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Analogies table
CREATE TABLE IF NOT EXISTS analogies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    user_experience_text TEXT NOT NULL,
    connection_explanation TEXT,
    strength FLOAT CHECK (strength BETWEEN 1 AND 5),
    type TEXT CHECK (type IN ('metaphor', 'experience', 'scenario', 'emotion')),
    reusable BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_analogies_user ON analogies(user_id);
CREATE INDEX IF NOT EXISTS idx_analogies_concept ON analogies(concept_id);
CREATE INDEX IF NOT EXISTS idx_analogies_reusable ON analogies(user_id, reusable) WHERE reusable = true;
CREATE INDEX IF NOT EXISTS idx_analogies_tags ON analogies USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_analogies_created_at ON analogies(created_at DESC);

-- Concept-Analogy connections table
CREATE TABLE IF NOT EXISTS concept_analogy_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    analogy_id UUID NOT NULL REFERENCES analogies(id) ON DELETE CASCADE,
    strength FLOAT CHECK (strength BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(concept_id, analogy_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_analogy_connections_concept ON concept_analogy_connections(concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_analogy_connections_analogy ON concept_analogy_connections(analogy_id);

-- Generated questions table
CREATE TABLE IF NOT EXISTS generated_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT,
    answered BOOLEAN DEFAULT false,
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_questions_concept ON generated_questions(concept_id);
CREATE INDEX IF NOT EXISTS idx_generated_questions_user ON generated_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_questions_answered ON generated_questions(user_id, answered);

-- ============================================================================
-- PART 4: Update triggers and functions
-- ============================================================================

-- Update timestamp trigger for user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Update timestamp trigger for concept_analogy_connections
CREATE OR REPLACE FUNCTION update_concept_analogy_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_concept_analogy_connections_updated_at
    BEFORE UPDATE ON concept_analogy_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_concept_analogy_connections_updated_at();

-- ============================================================================
-- PART 5: Create views for analytics
-- ============================================================================

-- View for user analogy statistics
CREATE OR REPLACE VIEW user_analogy_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT a.id) as total_analogies,
    COUNT(DISTINCT CASE WHEN a.reusable THEN a.id END) as reusable_analogies,
    AVG(a.strength) as avg_strength,
    COUNT(DISTINCT a.concept_id) as concepts_with_analogies,
    MAX(a.created_at) as last_analogy_created
FROM users u
LEFT JOIN analogies a ON u.id = a.user_id
GROUP BY u.id, u.email;

-- View for concept analogy coverage
CREATE OR REPLACE VIEW concept_analogy_coverage AS
SELECT 
    c.id as concept_id,
    c.term,
    c.document_id,
    COUNT(DISTINCT a.id) as analogy_count,
    COUNT(DISTINCT a.user_id) as unique_users,
    AVG(a.strength) as avg_strength,
    ARRAY_AGG(DISTINCT a.tags) as all_tags
FROM concepts c
LEFT JOIN analogies a ON c.id = a.concept_id
GROUP BY c.id, c.term, c.document_id;

-- ============================================================================
-- PART 6: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE concepts IS 'Renamed from keywords. Stores extracted concepts with hierarchical/sequential classification';
COMMENT ON COLUMN concepts.source_sentences IS 'Array of sentences where this concept was defined';
COMMENT ON COLUMN concepts.surrounding_concepts IS 'Array of related concept terms found nearby';
COMMENT ON COLUMN concepts.structure_type IS 'Classification: hierarchical, sequential, or unclassified';

COMMENT ON TABLE user_profiles IS 'Stores user background, interests, and experiences for personalized analogy generation';
COMMENT ON TABLE analogies IS 'User-created analogies connecting concepts to personal experiences';
COMMENT ON COLUMN analogies.strength IS 'User rating of analogy effectiveness (1-5)';
COMMENT ON COLUMN analogies.reusable IS 'Whether this analogy can be suggested for similar concepts in other documents';

COMMENT ON TABLE concept_analogy_connections IS 'Links concepts to analogies with connection strength';
COMMENT ON TABLE generated_questions IS 'AI-generated questions to help users create analogies';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 20250123_0001_two_view_integration completed successfully';
    RAISE NOTICE 'Tables created: user_profiles, analogies, concept_analogy_connections, generated_questions';
    RAISE NOTICE 'Table renamed: keywords -> concepts';
    RAISE NOTICE 'New columns added to concepts and relationships tables';
END $$;
