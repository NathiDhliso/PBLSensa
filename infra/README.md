# Sensa Learn Infrastructure

This directory contains all infrastructure-as-code (IaC) and database migration files for the Sensa Learn platform.

## Directory Structure

```
infra/
├── Production/
│   └── main.tf                 # Production environment Terraform configuration
├── Development/
│   └── main.tf                 # Development environment Terraform configuration
├── database/
│   ├── MIGRATION_GUIDELINES.md # Migration rules and AI system prompt
│   ├── migrations/             # Database migration scripts
│   ├── seeds/                  # Test data seeding scripts
│   ├── rollback/               # Rollback scripts for migrations
│   └── scripts/                # Helper scripts for running migrations
└── README.md                   # This file
```

## Quick Start

### Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.5.0
- PostgreSQL client (psql) for database operations
- Access to AWS account with necessary permissions

### 1. Provision Development Infrastructure

```bash
# Navigate to Development directory
cd infra/Development

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var="developer_id=yourname" -var="db_password=YourSecurePassword123!"

# Apply the configuration
terraform apply -var="developer_id=yourname" -var="db_password=YourSecurePassword123!"

# Save the outputs
terraform output > outputs.txt
```

### 2. Run Database Migrations

```bash
# Get RDS endpoint from Terraform outputs
export DB_HOST=$(terraform output -raw rds_address)
export DB_PORT=$(terraform output -raw rds_port)
export DB_NAME=$(terraform output -raw rds_database_name)
export DB_USER="pbl_admin"
export DB_PASSWORD="YourSecurePassword123!"

# Run migrations in order
cd ../database/migrations

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0001_initial_schema.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0002_add_indexes.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0003_add_triggers.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0004_add_rls_policies.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 20250122_0005_add_utility_functions.sql
```

### 3. Verify Setup

```bash
# Connect to database
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Check migrations
SELECT * FROM migrations_log ORDER BY applied_at;

# Check tables
\dt

# Check extensions
\dx

# Exit
\q
```

## Environment Configurations

### Development Environment

**Purpose:** Cost-optimized environment for individual developers

**Key Features:**
- Single-AZ deployments
- Smaller instance sizes (t4g family)
- Single NAT Gateway
- 7-day log retention
- No deletion protection
- Minimal auto-scaling

**Estimated Monthly Cost:** $150-250 per developer

**Instance Sizes:**
- RDS: db.t4g.medium (2 vCPU, 4 GB RAM)
- Redis: cache.t4g.micro (2 vCPU, 0.5 GB RAM)
- Fargate: 1 API task, 1 worker task

### Production Environment

**Purpose:** High-availability, production-grade infrastructure

**Key Features:**
- Multi-AZ deployments
- Larger instance sizes (r6g family)
- Multiple NAT Gateways (3)
- 30-day log retention
- Deletion protection enabled
- Auto-scaling enabled
- Read replicas
- Enhanced monitoring

**Estimated Monthly Cost:** $1,000-1,500

**Instance Sizes:**
- RDS: db.r6g.large (2 vCPU, 16 GB RAM) + read replica
- Redis: cache.m6g.large (2 vCPU, 6.38 GB RAM) cluster
- Fargate: 3-10 API tasks, 5-20 worker tasks

## Database Migrations

### Migration System

All database changes must go through the migration system. See `database/MIGRATION_GUIDELINES.md` for complete rules.

### Key Principles

1. **Idempotency**: All migrations can be run multiple times safely
2. **Atomicity**: Each migration is wrapped in a transaction
3. **Reversibility**: Every migration has a rollback script
4. **Documentation**: All changes are logged in migrations_log table

### Migration Naming Convention

Format: `YYYYMMDD_HHMM_description.sql`

Example: `20250122_1430_add_user_badges.sql`

### Creating a New Migration

```bash
# 1. Create migration file
cd infra/database/migrations
touch 20250123_1000_add_new_feature.sql

# 2. Write migration following the template in MIGRATION_GUIDELINES.md

# 3. Create corresponding rollback script
cd ../rollback
touch 20250123_1000_rollback.sql

# 4. Test migration on development database
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f ../migrations/20250123_1000_add_new_feature.sql

# 5. Test idempotency (run again)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f ../migrations/20250123_1000_add_new_feature.sql

# 6. Test rollback
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 20250123_1000_rollback.sql

# 7. Commit both files
git add ../migrations/20250123_1000_add_new_feature.sql
git add 20250123_1000_rollback.sql
git commit -m "Add new feature migration"
```

### Fixing a Migration Bug

If you find a bug in an already-applied migration:

```bash
# 1. Update the original migration file with the fix
vim infra/database/migrations/20250122_1430_add_user_badges.sql

# 2. Create apply_fix.sql with ONLY the corrective SQL
cat > infra/database/migrations/apply_fix.sql << 'EOF'
-- Fix for 20250122_1430_add_user_badges.sql
BEGIN;
ALTER TABLE user_badges ALTER COLUMN badge_name SET NOT NULL;
COMMIT;
EOF

# 3. Apply the fix to affected environments
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f infra/database/migrations/apply_fix.sql

# 4. Delete apply_fix.sql after successful application
rm infra/database/migrations/apply_fix.sql

# 5. Commit the updated original migration
git add infra/database/migrations/20250122_1430_add_user_badges.sql
git commit -m "Fix: Add NOT NULL constraint to badge_name"
```

## Database Schema

### Core Tables

- **users**: User accounts (Cognito integration)
- **user_profiles**: Personalization data
- **courses**: User-created courses
- **course_documents**: Uploaded documents
- **processed_documents**: Concept maps and embeddings
- **chapters**: Extracted chapters
- **keywords**: Concepts and terms
- **relationships**: Keyword relationships
- **user_annotations**: User feedback
- **user_progress**: Learning progress tracking

### Custom Types

- `user_role`: user, admin, moderator
- `processing_status_enum`: pending, processing, completed, failed
- `feedback_type_enum`: concept_map, processing, general, analogy
- `learning_style_enum`: visual, auditory, kinesthetic, reading
- `complexity_level_enum`: high, medium, low

### Extensions

- **uuid-ossp**: UUID generation
- **pgvector**: Vector embeddings (768 dimensions)
- **pg_trgm**: Text similarity search

## Row-Level Security (RLS)

RLS is enabled on sensitive tables to ensure data isolation.

### Using RLS in Your Application

```python
# Python example with psycopg2
import psycopg2

# Connect to database
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD
)

cursor = conn.cursor()

# Set current user ID for RLS
user_id = "123e4567-e89b-12d3-a456-426614174000"
cursor.execute("SELECT set_current_user_id(%s)", (user_id,))

# Now all queries are automatically filtered by user_id
cursor.execute("SELECT * FROM courses")
courses = cursor.fetchall()  # Only returns this user's courses

# For admin operations, switch to admin role
cursor.execute("SET ROLE admin_role")
cursor.execute("SELECT * FROM courses")
all_courses = cursor.fetchall()  # Returns all courses

# Return to normal role
cursor.execute("RESET ROLE")

cursor.close()
conn.close()
```

## Utility Functions

The database includes many utility functions for common operations:

### Vector Similarity

```sql
-- Find similar documents
SELECT * FROM find_similar_documents(
    embedding_vector,
    limit => 10,
    threshold => 0.7
);

-- Find similar keywords
SELECT * FROM find_similar_keywords(
    embedding_vector,
    chapter_id => 'uuid-here',
    limit => 20
);
```

### Statistics

```sql
-- Get course statistics
SELECT * FROM get_course_stats('course-uuid-here');

-- Get user progress summary
SELECT * FROM get_user_progress_summary('user-uuid', 'course-uuid');

-- Get user's overall learning stats
SELECT * FROM get_user_learning_stats('user-uuid');
```

### Search

```sql
-- Search courses
SELECT * FROM search_courses(
    'user-uuid',
    'biology',
    limit => 20
);

-- Search keywords
SELECT * FROM search_keywords(
    'course-uuid',
    'mitochondria',
    limit => 50
);
```

## Monitoring and Maintenance

### CloudWatch Alarms

The infrastructure includes CloudWatch alarms for:

- RDS CPU > 80%
- RDS connections > 80% of max
- RDS storage > 80%
- SQS queue depth > 100 messages
- ECS task failures > 5%
- API latency > 1.5 seconds

### Database Maintenance

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

## Backup and Recovery

### Automated Backups

- **Development**: 7-day retention, daily backups
- **Production**: 30-day retention, automated backups every 15 minutes

### Manual Backup

```bash
# Create manual snapshot
aws rds create-db-snapshot \
    --db-instance-identifier pbl-production-db \
    --db-snapshot-identifier pbl-manual-backup-$(date +%Y%m%d-%H%M%S)

# List snapshots
aws rds describe-db-snapshots \
    --db-instance-identifier pbl-production-db
```

### Point-in-Time Recovery

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier pbl-production-db \
    --target-db-instance-identifier pbl-production-db-restored \
    --restore-time 2025-01-22T14:30:00Z
```

### Manual Database Backup

```bash
# Dump entire database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f backup_$(date +%Y%m%d).dump

# Dump schema only
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --schema-only -f schema_$(date +%Y%m%d).sql

# Restore from dump
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -c backup_20250122.dump
```

## Troubleshooting

### Cannot Connect to RDS

```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check RDS status
aws rds describe-db-instances --db-instance-identifier pbl-development-dev-db

# Test connection from EC2 instance in same VPC
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"
```

### Migration Failed

```bash
# Check migrations log
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM migrations_log ORDER BY applied_at DESC LIMIT 10;"

# Check for locks
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Run rollback
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f infra/database/rollback/20250122_0003_rollback.sql
```

### High RDS CPU

```sql
-- Find expensive queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Kill long-running query
SELECT pg_terminate_backend(pid);
```

### Disk Space Issues

```sql
-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Vacuum to reclaim space
VACUUM FULL;
```

## Cost Optimization

### Development Environment

- Use t4g instances (ARM-based, 20% cheaper)
- Single-AZ deployment
- Stop/start RDS during off-hours (use AWS Instance Scheduler)
- Use smaller storage allocations
- Shorter log retention

### Production Environment

- Purchase Reserved Instances after 3 months
- Use S3 Intelligent-Tiering
- Enable RDS storage auto-scaling
- Monitor and right-size instances
- Use CloudWatch Logs retention policies

## Security Best Practices

1. **Never commit secrets**: Use AWS Secrets Manager
2. **Enable encryption**: All data encrypted at rest and in transit
3. **Use RLS**: Enable row-level security for multi-tenant data
4. **Rotate credentials**: Rotate database passwords quarterly
5. **Audit logging**: Enable CloudTrail and RDS audit logs
6. **Network isolation**: RDS in private subnets only
7. **Least privilege**: Use IAM roles with minimal permissions

## Support and Documentation

- **Migration Guidelines**: `database/MIGRATION_GUIDELINES.md`
- **Architecture**: `../src/documentation/architecture.md`
- **Deployment Guide**: `../DEPLOYMENT_GUIDE.md`
- **Project Summary**: `../PROJECT_SUMMARY.md`

## Contributing

When making infrastructure changes:

1. Create a feature branch
2. Test changes in development environment
3. Document changes in this README
4. Create pull request with detailed description
5. Get approval from DevOps team
6. Apply to staging, then production

## License

Proprietary - Sensa Learn Platform
