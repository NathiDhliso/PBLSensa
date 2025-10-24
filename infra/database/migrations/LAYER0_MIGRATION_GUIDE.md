# Layer 0 Database Migration Guide

## Overview

This guide explains how to apply the Layer 0 database migrations that add PDF caching and cost tracking capabilities.

## What Gets Created

### Tables

1. **pdf_cache** - Stores cached PDF processing results
   - Primary key: `pdf_hash` (SHA-256)
   - Stores compressed processing results
   - Tracks access patterns for LRU eviction
   - ~1KB-10KB per entry (with compression)

2. **layer0_cost_tracking** - Tracks processing costs
   - Logs every processing event
   - Tracks cache hits vs. misses
   - Calculates cost savings
   - ~100 bytes per entry

3. **layer0_stats** (Materialized View) - Aggregate statistics
   - Fast access to performance metrics
   - Refresh periodically or on-demand
   - Single row with aggregate data

### Indexes

- 8 indexes for fast lookups
- Optimized for common query patterns
- Support for date-range queries

## Prerequisites

- PostgreSQL 12+ (for materialized views)
- `uuid-ossp` extension (auto-enabled in migration)
- Database user with CREATE TABLE permissions
- Approximately 100MB free space (for initial cache)

## Migration Steps

### Option 1: Using psql (Recommended)

```bash
# Connect to your database
psql -h your-db-host -U your-db-user -d your-db-name

# Apply migration
\i infra/database/migrations/20250124_0002_layer0_tables.sql

# Verify tables were created
\dt pdf_cache
\dt layer0_cost_tracking
\d+ layer0_stats
```

### Option 2: Using PowerShell Script

```powershell
# Windows
.\infra\database\apply-migration.ps1 -MigrationFile "20250124_0002_layer0_tables.sql"
```

### Option 3: Using Bash Script

```bash
# Linux/Mac
./infra/database/apply-migration.sh 20250124_0002_layer0_tables.sql
```

### Option 4: AWS RDS (via Console)

1. Go to RDS Console → Your Database → Query Editor
2. Copy contents of `20250124_0002_layer0_tables.sql`
3. Paste and execute
4. Verify success messages

## Verification

After applying the migration, verify it worked:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('pdf_cache', 'layer0_cost_tracking');

-- Check materialized view
SELECT * FROM layer0_stats;

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('pdf_cache', 'layer0_cost_tracking');

-- Expected result: 8 indexes
```

## Rollback

If you need to rollback the migration:

```bash
# Using psql
psql -h your-db-host -U your-db-user -d your-db-name \
  -f infra/database/migrations/20250124_0002_layer0_tables_rollback.sql

# Or using PowerShell
.\infra\database\apply-migration.ps1 -MigrationFile "20250124_0002_layer0_tables_rollback.sql"
```

**Warning:** Rollback will delete all cached data and cost tracking history!

## Post-Migration Tasks

### 1. Set up periodic stats refresh

Create a cron job or scheduled task to refresh statistics:

```sql
-- Refresh stats every hour
SELECT refresh_layer0_stats();
```

### 2. Configure cache cleanup

Set up a scheduled job to clean expired cache entries:

```sql
-- Delete cache entries not accessed in 90 days
DELETE FROM pdf_cache 
WHERE last_accessed < NOW() - INTERVAL '90 days';

-- Refresh stats after cleanup
SELECT refresh_layer0_stats();
```

### 3. Monitor storage growth

```sql
-- Check cache size
SELECT 
    total_cache_entries,
    total_size_mb,
    avg_compression_ratio
FROM layer0_stats;

-- Set up alert if size exceeds threshold
-- (Implement in your monitoring system)
```

## Troubleshooting

### Error: "extension uuid-ossp does not exist"

```sql
-- Run as superuser
CREATE EXTENSION "uuid-ossp";
```

### Error: "permission denied"

Ensure your database user has CREATE TABLE permissions:

```sql
-- Run as superuser
GRANT CREATE ON SCHEMA public TO your_app_user;
```

### Materialized view not updating

```sql
-- Manually refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY layer0_stats;

-- Check last update time
SELECT last_updated FROM layer0_stats;
```

### High storage usage

```sql
-- Check largest cache entries
SELECT 
    pdf_hash,
    storage_size_bytes / 1024 / 1024 as size_mb,
    last_accessed,
    access_count
FROM pdf_cache
ORDER BY storage_size_bytes DESC
LIMIT 10;

-- Clean up old entries
DELETE FROM pdf_cache 
WHERE last_accessed < NOW() - INTERVAL '30 days'
AND access_count < 2;
```

## Performance Tuning

### Adjust autovacuum settings

```sql
-- For pdf_cache (high update frequency)
ALTER TABLE pdf_cache SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

-- For layer0_cost_tracking (insert-only)
ALTER TABLE layer0_cost_tracking SET (
    autovacuum_vacuum_scale_factor = 0.1
);
```

### Monitor index usage

```sql
-- Check if indexes are being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('pdf_cache', 'layer0_cost_tracking')
ORDER BY idx_scan DESC;
```

## Maintenance Schedule

Recommended maintenance tasks:

- **Hourly**: Refresh layer0_stats materialized view
- **Daily**: Check storage size and growth rate
- **Weekly**: Analyze cache hit rate and cost savings
- **Monthly**: Clean up old cache entries (>90 days)
- **Quarterly**: Review and optimize indexes

## Support

If you encounter issues:

1. Check PostgreSQL logs for detailed error messages
2. Verify database version compatibility (PostgreSQL 12+)
3. Ensure sufficient disk space
4. Check user permissions
5. Review the migration SQL for any syntax errors

## Next Steps

After successful migration:

1. Update application configuration to enable Layer 0
2. Deploy updated backend code
3. Monitor cache hit rate in admin dashboard
4. Set up CloudWatch alerts for cost thresholds
5. Document any custom configuration for your team

---

**Migration Version:** 20250124_0002  
**Created:** 2025-01-24  
**Status:** Ready for production
