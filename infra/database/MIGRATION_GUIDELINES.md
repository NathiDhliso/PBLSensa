# Database Migration Guidelines

## Purpose

This document serves as a system prompt and guideline for all developers (human and AI) working with database migrations for the Sensa Learn platform. Following these rules ensures database schema changes are applied safely, consistently, and can be rolled back if needed.

## Core Principles

1. **Idempotency**: All migrations must be safe to run multiple times
2. **Atomicity**: Each migration should be wrapped in a transaction
3. **Reversibility**: Every migration should have a corresponding rollback script
4. **Documentation**: All changes must be clearly documented
5. **Testing**: Migrations must be tested before committing

## File Naming Convention

### Migration Files

Format: `YYYYMMDD_HHMM_description.sql`

Examples:
- `20250122_1430_add_user_badges.sql`
- `20250122_1445_create_analytics_tables.sql`
- `20250123_0900_add_chapter_complexity_index.sql`

### Rollback Files

Format: `YYYYMMDD_HHMM_rollback.sql` (matching the migration timestamp)

Examples:
- `20250122_1430_rollback.sql`
- `20250122_1445_rollback.sql`

## Migration File Structure

Every migration file MUST follow this structure:

```sql
-- ============================================================================
-- Migration: [Brief Description]
-- Created: YYYY-MM-DD HH:MM
-- Author: [Your Name/ID]
-- Description: [Detailed description of what this migration does and why]
-- ============================================================================

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM migrations_log 
        WHERE filename = '20250122_1430_add_user_badges.sql'
    ) THEN
        RAISE NOTICE 'Migration already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- Migration Code
-- ============================================================================

-- Your migration SQL here
-- Use IF NOT EXISTS for CREATE statements
-- Use IF EXISTS for DROP statements

-- Example:
CREATE TABLE IF NOT EXISTS user_badges (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Log Migration
-- ============================================================================

INSERT INTO migrations_log (filename, checksum, execution_time_ms)
VALUES (
    '20250122_1430_add_user_badges.sql',
    md5('20250122_1430_add_user_badges.sql'),
    extract(epoch from (clock_timestamp() - transaction_timestamp())) * 1000
)
ON CONFLICT (filename) DO NOTHING;

COMMIT;

-- Rollback on error
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    ROLLBACK;
```

## Idempotency Rules

### Creating Objects

Always use conditional creation:

```sql
-- Tables
CREATE TABLE IF NOT EXISTS table_name (...);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);

-- Types
DO $$ BEGIN
    CREATE TYPE status_enum AS ENUM ('pending', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Functions
CREATE OR REPLACE FUNCTION function_name() ...

-- Triggers
DROP TRIGGER IF EXISTS trigger_name ON table_name;
CREATE TRIGGER trigger_name ...
```

### Modifying Objects

Check for existence before modification:

```sql
-- Adding columns
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'new_column'
    ) THEN
        ALTER TABLE users ADD COLUMN new_column VARCHAR(100);
    END IF;
END $$;

-- Dropping columns
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'old_column'
    ) THEN
        ALTER TABLE users DROP COLUMN old_column;
    END IF;
END $$;
```

## Fix Application Procedure

When a bug is found in an already-applied migration:

### Step 1: Update the Original Migration File

Fix the bug in the original migration file so future deployments use the correct version.

Example: If `20250122_1430_add_user_badges.sql` has a bug, edit that file directly.

### Step 2: Create apply_fix.sql

Create a temporary file named `apply_fix.sql` in the migrations directory with ONLY the corrective SQL:

```sql
-- ============================================================================
-- FIX: Correcting bug in 20250122_1430_add_user_badges.sql
-- Issue: Missing NOT NULL constraint on badge_name
-- Created: 2025-01-23
-- ============================================================================

BEGIN;

-- Apply the fix
ALTER TABLE user_badges 
ALTER COLUMN badge_name SET NOT NULL;

-- Log the fix
INSERT INTO migrations_log (filename, checksum, execution_time_ms)
VALUES (
    'apply_fix_20250123_badge_constraint.sql',
    md5('apply_fix_20250123_badge_constraint.sql'),
    extract(epoch from (clock_timestamp() - transaction_timestamp())) * 1000
);

COMMIT;
```

### Step 3: Apply the Fix

```bash
# Connect to the database
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f infra/database/migrations/apply_fix.sql
```

### Step 4: Delete apply_fix.sql

After successfully applying the fix to all affected environments, DELETE the `apply_fix.sql` file:

```bash
rm infra/database/migrations/apply_fix.sql
```

### Step 5: Document the Fix

Add a comment in the original migration file documenting the fix:

```sql
-- FIXED 2025-01-23: Added NOT NULL constraint to badge_name
-- Original version was missing this constraint
```

## Forbidden Operations

### NEVER Do These Without Explicit Approval

1. **DROP TABLE** without a backup
2. **DROP COLUMN** with data (migrate data first)
3. **ALTER TYPE** on enum with existing data
4. **TRUNCATE** in production
5. **Disable RLS** policies without security review
6. **Change PRIMARY KEY** on tables with data
7. **Remove NOT NULL** constraints without data validation

### Dangerous Operations Requiring Extra Care

1. **Adding NOT NULL columns** to tables with data (provide DEFAULT or backfill first)
2. **Creating UNIQUE constraints** on columns with duplicates (deduplicate first)
3. **Changing column types** (ensure data compatibility)
4. **Adding foreign keys** to tables with orphaned records (clean data first)

## Testing Requirements

Before committing a migration, you MUST:

1. **Test on empty database**: Verify migration creates schema correctly
2. **Test idempotency**: Run migration twice, verify no errors
3. **Test with data**: Create sample data, run migration, verify data integrity
4. **Test rollback**: Run rollback script, verify clean state
5. **Test performance**: For large tables, estimate migration time

### Testing Checklist

```bash
# 1. Test on empty database
dropdb test_db && createdb test_db
psql -d test_db -f migrations/20250122_1430_add_user_badges.sql

# 2. Test idempotency
psql -d test_db -f migrations/20250122_1430_add_user_badges.sql

# 3. Test with data
psql -d test_db -c "INSERT INTO users ..."
psql -d test_db -f migrations/20250122_1430_add_user_badges.sql

# 4. Test rollback
psql -d test_db -f rollback/20250122_1430_rollback.sql

# 5. Verify clean state
psql -d test_db -c "\dt user_badges"  # Should not exist
```

## Rollback Script Requirements

Every migration MUST have a corresponding rollback script:

```sql
-- ============================================================================
-- Rollback: 20250122_1430_add_user_badges.sql
-- Created: 2025-01-22 14:30
-- Description: Removes user_badges table and related objects
-- ============================================================================

BEGIN;

-- Drop dependent objects first
DROP TRIGGER IF EXISTS update_user_badges_updated_at ON user_badges;
DROP INDEX IF EXISTS idx_user_badges_user_id;

-- Drop main objects
DROP TABLE IF EXISTS user_badges CASCADE;

-- Remove from migrations log
DELETE FROM migrations_log 
WHERE filename = '20250122_1430_add_user_badges.sql';

COMMIT;
```

## Common Patterns

### Adding a New Table

```sql
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_new_table_updated_at ON new_table;
CREATE TRIGGER update_new_table_updated_at
    BEFORE UPDATE ON new_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Adding a Column

```sql
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
    END IF;
END $$;
```

### Creating an Enum Type

```sql
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'email',
        'sms',
        'push'
    );
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type notification_type already exists, skipping...';
END $$;
```

### Adding a Foreign Key

```sql
-- First, ensure referential integrity
DO $$ BEGIN
    -- Check for orphaned records
    IF EXISTS (
        SELECT 1 FROM child_table c
        LEFT JOIN parent_table p ON c.parent_id = p.id
        WHERE p.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Orphaned records found in child_table. Clean data before adding foreign key.';
    END IF;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_child_parent'
    ) THEN
        ALTER TABLE child_table 
        ADD CONSTRAINT fk_child_parent 
        FOREIGN KEY (parent_id) REFERENCES parent_table(id) ON DELETE CASCADE;
    END IF;
END $$;
```

## AI Assistant Instructions

If you are an AI coding assistant reading this file:

1. **ALWAYS** follow the naming convention for migration files
2. **ALWAYS** wrap migrations in BEGIN/COMMIT with exception handling
3. **ALWAYS** use IF NOT EXISTS / IF EXISTS for idempotency
4. **ALWAYS** create a corresponding rollback script
5. **NEVER** create migrations that drop tables or columns without explicit user confirmation
6. **WHEN** fixing a bug in an existing migration:
   - Update the original migration file with the fix
   - Create `apply_fix.sql` with ONLY the corrective SQL
   - Remind the user to delete `apply_fix.sql` after applying it
7. **ALWAYS** add comments explaining what the migration does and why
8. **ALWAYS** log the migration in the migrations_log table
9. **SUGGEST** testing steps before the user applies the migration
10. **WARN** the user about dangerous operations

## Environment-Specific Considerations

### Development

- Migrations can be more aggressive (drop/recreate)
- Seed data can be reset
- Performance is less critical

### Staging

- Should mirror production migrations exactly
- Test migrations here before production
- Can use production data snapshots

### Production

- **ALWAYS** create a backup before migration
- **ALWAYS** run during maintenance window
- **ALWAYS** have rollback plan ready
- **MONITOR** migration progress
- **NEVER** run untested migrations

## Migration Execution Order

Migrations are executed in filename order (lexicographic sort):

```
20250122_0001_initial_schema.sql
20250122_0002_add_indexes.sql
20250122_0003_add_triggers.sql
20250122_1430_add_user_badges.sql
20250123_0900_add_analytics.sql
```

## Troubleshooting

### Migration Fails Midway

1. Check the error message in the output
2. Verify the migration is wrapped in a transaction (should auto-rollback)
3. Check migrations_log to see if it was partially applied
4. Run the rollback script if needed
5. Fix the migration and try again

### Migration Already Applied

If you see "Migration already applied, skipping..." this is normal and expected. The migration system is idempotent.

### Orphaned Data

If adding a foreign key fails due to orphaned records:

1. Identify orphaned records: `SELECT * FROM child WHERE parent_id NOT IN (SELECT id FROM parent)`
2. Decide: Delete orphans or create missing parents
3. Clean the data
4. Re-run the migration

## Version Control

- **NEVER** modify a migration file after it has been merged to main
- **NEVER** delete a migration file that has been applied
- **ALWAYS** create a new migration to fix issues
- **ALWAYS** commit rollback scripts with migrations

## Documentation

Each migration should be documented in the project's changelog or migration log with:

- Date applied
- Environments applied to
- Any issues encountered
- Rollback status (if applicable)

## Questions?

If you're unsure about a migration:

1. Ask for a code review
2. Test thoroughly in development
3. Document your concerns
4. Consider breaking into smaller migrations
5. Consult the database administrator

---

**Remember**: Database migrations are permanent and affect all users. Take your time, test thoroughly, and when in doubt, ask for help.
