# Database Quick Reference Guide

## Connection

```bash
# Set environment variables
export DB_HOST="your-rds-endpoint.amazonaws.com"
export DB_PORT="5432"
export DB_NAME="pbl_development"
export DB_USER="pbl_admin"
export DB_PASSWORD="your-password"

# Connect with psql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

## Common Commands

### Migrations

```bash
# Run all migrations
cd infra/database/scripts
chmod +x run_migrations.sh
./run_migrations.sh

# Run single migration
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/20250122_0001_initial_schema.sql

# Check applied migrations
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM migrations_log ORDER BY applied_at DESC;"
```

### Schema Inspection

```sql
-- List all tables
\dt

-- Describe table structure
\d users
\d+ courses  -- with additional details

-- List all indexes
\di

-- List all functions
\df

-- List all types
\dT

-- List all extensions
\dx
```

### Row-Level Security

```sql
-- Set current user for RLS
SELECT set_current_user_id('123e4567-e89b-12d3-a456-426614174000');

-- Get current user
SELECT get_current_user_id();

-- Clear current user
SELECT clear_current_user_id();

-- Switch to admin role
SET ROLE admin_role;

-- Return to normal role
RESET ROLE;
```

## Common Queries

### User Management

```sql
-- Create user
INSERT INTO users (cognito_sub, email, email_verified)
VALUES ('cognito-sub-123', 'user@example.com', true);

-- Get user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Update user profile
UPDATE user_profiles
SET interests = '["biology", "chemistry"]'::jsonb,
    learning_style = 'visual'
WHERE user_id = 'user-uuid';
```

### Course Operations

```sql
-- Create course
INSERT INTO courses (user_id, name, description, subject)
VALUES ('user-uuid', 'Biology 101', 'Introduction to Biology', 'Biology');

-- Get user's courses
SELECT * FROM courses WHERE user_id = 'user-uuid' AND is_archived = FALSE;

-- Get course statistics
SELECT * FROM get_course_stats('course-uuid');

-- Archive course
UPDATE courses SET is_archived = TRUE WHERE course_id = 'course-uuid';
```

### Document Operations

```sql
-- Upload document
INSERT INTO course_documents (
    course_id, filename, original_filename, s3_key, s3_bucket,
    sha256_hash, file_size, mime_type, page_count
) VALUES (
    'course-uuid', 'doc_123.pdf', 'Biology Chapter 1.pdf',
    'uploads/doc_123.pdf', 'pbl-uploads', 'sha256-hash',
    1024000, 'application/pdf', 25
);

-- Check if document hash exists
SELECT document_hash_exists('course-uuid', 'sha256-hash');

-- Get document processing status
SELECT document_id, filename, processing_status, error_message
FROM course_documents
WHERE course_id = 'course-uuid'
ORDER BY upload_date DESC;

-- Get document summary
SELECT * FROM get_document_summary('document-uuid');
```

### Concept Map Queries

```sql
-- Get chapters for a course
SELECT c.* 
FROM chapters c
JOIN processed_documents pd ON c.processed_id = pd.processed_id
WHERE pd.course_id = 'course-uuid'
ORDER BY c.chapter_number;

-- Get keywords for a chapter
SELECT * FROM keywords
WHERE chapter_id = 'chapter-uuid'
ORDER BY is_primary DESC, exam_relevant DESC;

-- Get relationships for a chapter
SELECT 
    r.*,
    k1.term AS source_term,
    k2.term AS target_term
FROM relationships r
JOIN keywords k1 ON r.source_keyword_id = k1.keyword_id
JOIN keywords k2 ON r.target_keyword_id = k2.keyword_id
WHERE r.chapter_id = 'chapter-uuid';

-- Get cross-chapter relationships
SELECT * FROM relationships
WHERE is_cross_chapter = TRUE;
```

### Vector Similarity Search

```sql
-- Find similar documents
SELECT * FROM find_similar_documents(
    '[0.1, 0.2, ...]'::vector,  -- 768-dimensional vector
    10,  -- limit
    0.7  -- similarity threshold
);

-- Find similar keywords
SELECT * FROM find_similar_keywords(
    '[0.1, 0.2, ...]'::vector,
    'chapter-uuid',  -- optional chapter filter
    20,  -- limit
    0.7  -- threshold
);

-- Calculate cosine similarity
SELECT cosine_similarity(
    embedding1::vector,
    embedding2::vector
);
```

### Search Operations

```sql
-- Search courses
SELECT * FROM search_courses(
    'user-uuid',
    'biology',
    20  -- limit
);

-- Search keywords
SELECT * FROM search_keywords(
    'course-uuid',
    'mitochondria',
    50  -- limit
);

-- Full-text search on course names
SELECT * FROM courses
WHERE name ILIKE '%biology%'
ORDER BY similarity(name, 'biology') DESC;
```

### Progress Tracking

```sql
-- Get user progress for a course
SELECT * FROM get_user_progress_summary('user-uuid', 'course-uuid');

-- Get overall learning stats
SELECT * FROM get_user_learning_stats('user-uuid');

-- Mark chapter as complete
UPDATE user_progress
SET completed = TRUE,
    time_spent_seconds = time_spent_seconds + 1800
WHERE user_id = 'user-uuid' AND chapter_id = 'chapter-uuid';

-- Get user's current streak
SELECT current_streak_days, longest_streak_days
FROM user_progress
WHERE user_id = 'user-uuid'
ORDER BY current_streak_days DESC
LIMIT 1;
```

### Feedback Operations

```sql
-- Submit feedback
INSERT INTO user_annotations (
    user_id, course_id, feedback_type, rating, comment
) VALUES (
    'user-uuid', 'course-uuid', 'concept_map', 5,
    'Great concept map, very helpful!'
);

-- Get feedback summary
SELECT * FROM get_course_feedback_summary('course-uuid');

-- Get unprocessed feedback
SELECT * FROM user_annotations
WHERE processed = FALSE
ORDER BY submitted_at DESC;

-- Get consensus feedback
SELECT * FROM user_annotations
WHERE consensus_count >= 3 AND processed = TRUE;
```

## Performance Queries

### Table Sizes

```sql
-- Get table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

### Index Usage

```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';
```

### Slow Queries

```sql
-- Enable pg_stat_statements (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

### Active Connections

```sql
-- Show active connections
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Count connections by state
SELECT state, COUNT(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Kill a connection
SELECT pg_terminate_backend(pid);
```

## Maintenance

### Vacuum and Analyze

```sql
-- Vacuum all tables
VACUUM;

-- Vacuum with analyze
VACUUM ANALYZE;

-- Vacuum specific table
VACUUM ANALYZE users;

-- Full vacuum (requires exclusive lock)
VACUUM FULL;

-- Check last vacuum time
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;
```

### Reindex

```sql
-- Reindex table
REINDEX TABLE users;

-- Reindex specific index
REINDEX INDEX idx_users_email;

-- Reindex database (requires exclusive lock)
REINDEX DATABASE pbl_development;
```

### Statistics

```sql
-- Update statistics
ANALYZE;

-- Update statistics for specific table
ANALYZE users;

-- Check statistics freshness
SELECT 
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

## Backup and Restore

### Backup

```bash
# Full database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f backup.dump

# Schema only
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --schema-only -f schema.sql

# Data only
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --data-only -f data.sql

# Specific table
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -t users -f users.dump
```

### Restore

```bash
# Restore from dump
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -c backup.dump

# Restore from SQL file
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f schema.sql
```

## Troubleshooting

### Check Locks

```sql
-- Show locks
SELECT 
    l.pid,
    l.mode,
    l.granted,
    a.query,
    a.state
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted
ORDER BY l.pid;

-- Show blocking queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

### Check Disk Usage

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes with indexes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Configuration

```sql
-- Show all settings
SHOW ALL;

-- Show specific setting
SHOW max_connections;
SHOW shared_buffers;
SHOW work_mem;

-- Show runtime parameters
SELECT name, setting, unit, context
FROM pg_settings
WHERE context != 'internal'
ORDER BY name;
```

## Useful Aliases

Add these to your `.bashrc` or `.zshrc`:

```bash
# Database connection
alias dbdev='psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME'

# Run migrations
alias dbmigrate='cd ~/project/infra/database/scripts && ./run_migrations.sh'

# Check migrations
alias dbmigrations='psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM migrations_log ORDER BY applied_at DESC LIMIT 10;"'

# Database size
alias dbsize='psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size(current_database()));"'
```

## Quick Tips

1. **Always use transactions** for data modifications
2. **Test queries with EXPLAIN ANALYZE** before running on large datasets
3. **Use prepared statements** in application code
4. **Monitor slow query log** regularly
5. **Run VACUUM ANALYZE** after bulk operations
6. **Use connection pooling** (PgBouncer) in production
7. **Set statement_timeout** to prevent runaway queries
8. **Use indexes wisely** - too many can slow down writes
9. **Keep statistics up to date** with regular ANALYZE
10. **Monitor disk space** - PostgreSQL needs space for temp files

## Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/15/
- pgvector Documentation: https://github.com/pgvector/pgvector
- Migration Guidelines: `MIGRATION_GUIDELINES.md`
- Full Documentation: `../README.md`
