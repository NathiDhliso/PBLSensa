# Post-Deployment Database Setup

After Terraform creates the RDS instance, you need to install the pgvector extension and run migrations.

## 1. Install pgvector Extension

Connect to your database and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This is required before running migrations since the schema uses `vector(768)` data types.

## 2. Run Migrations

Execute migrations in order:

```bash
# Get database connection details from Terraform outputs
terraform output rds_address
terraform output rds_port

# Connect to database
psql -h <rds_address> -U pbl_admin -d pbl_development

# Or use the migration script (to be created)
./run-migrations.sh
```

## 3. Verify Installation

```sql
-- Check pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check migrations ran successfully
SELECT * FROM migrations_log ORDER BY applied_at;
```

## Notes

- pgvector cannot be added via RDS parameter groups
- It must be installed as an extension after database creation
- The extension is available in RDS PostgreSQL 15.4+
- All migrations depend on the vector extension being installed first
