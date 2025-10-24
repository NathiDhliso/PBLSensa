-- Check which tables exist in the database
-- This helps determine which migrations have been applied

SELECT 
    'Core Tables' as category,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'courses', 'chapters', 'documents') THEN '✅ Initial Schema'
        ELSE '❓ Unknown'
    END as migration
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('users', 'courses', 'chapters', 'documents', 'user_progress', 'bookmarks')
ORDER BY table_name

UNION ALL

SELECT 
    'AI Analogy Tables' as category,
    table_name,
    '✅ 20250122_0006' as migration
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('chapter_analogies', 'memory_techniques', 'learning_mantras', 'analogy_feedback', 'chapter_complexity')
ORDER BY table_name

UNION ALL

SELECT 
    'Two-View Integration' as category,
    table_name,
    '✅ 20250123_0001' as migration
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('sensa_user_profiles', 'sensa_analogies', 'sensa_questions', 'sensa_learning_sessions')
ORDER BY table_name

UNION ALL

SELECT 
    'PBL View Tables' as category,
    table_name,
    '✅ 20250124_0001' as migration
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('pbl_concepts', 'pbl_relationships', 'pbl_visualizations', 'pbl_concept_feedback')
ORDER BY table_name

UNION ALL

SELECT 
    'Layer 0 Tables' as category,
    table_name,
    '✅ 20250124_0002' as migration
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('pdf_cache', 'layer0_cost_tracking')
ORDER BY table_name;

-- Summary
SELECT 
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
