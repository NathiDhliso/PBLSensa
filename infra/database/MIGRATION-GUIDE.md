# Database Migration Guide

## AI-Powered Analogy Generation Migration

This guide explains how to apply the database migration for the AI-powered analogy generation feature.

## Prerequisites

### Required Tools

1. **AWS CLI** - For retrieving database credentials
   - Windows: `winget install Amazon.AWSCLI`
   - macOS: `brew install awscli`
   - Linux: `sudo apt-get install awscli`

2. **PostgreSQL Client (psql)** - For running SQL migrations
   - Windows: `winget install PostgreSQL.PostgreSQL`
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql-client`

3. **AWS Credentials** - Configured with appropriate permissions
   ```bash
   aws configure
   ```

### Required IAM Permissions

Your AWS user/role needs:
- `secretsmanager:GetSecretValue` on the database credentials secret
- Network access to the RDS instance (if running from outside AWS)

## Migration Files

- **Forward Migration**: `migrations/20250122_0006_ai_analogy_generation.sql`
  - Creates all new tables, indexes, views, and triggers
  
- **Rollback Migration**: `migrations/20250122_0006_ai_analogy_generation_rollback.sql`
  - Drops all tables and views created by the forward migration

## What This Migration Does

### Tables Created

1. **chapter_analogies** - Stores AI-generated personalized analogies
   - Concept and analogy text
   - Interest-based personalization
   - Learning style adaptations
   - Generation metadata (tokens, cost)
   - Cache management

2. **memory_techniques** - Personalized memory aids
   - Technique types (acronym, mind_palace, chunking, spaced_repetition)
   - Application instructions

3. **learning_mantras** - Motivational learning mantras
   - Personalized mantra text
   - Explanations

4. **analogy_feedback** - User ratings and feedback
   - 1-5 star ratings
   - Optional comments
   - One rating per user per analogy

5. **chapter_complexity** - Complexity analysis
   - Complexity scores (0-1 scale)
   - Concept counts
   - Vocabulary difficulty
   - Relationship complexity

### Views Created

1. **analogy_statistics** - Aggregated analogy ratings
2. **user_generation_stats** - User generation statistics

### User Table Extensions

Adds columns to existing `users` table:
- `learning_style` - User's preferred learning style
- `background` - User's background information
- `education_level` - User's education level
- `interests` - Array of user interests

## Running the Migration

### Option 1: PowerShell (Windows)

```powershell
# Navigate to the database directory
cd infra/database

# Apply the migration
.\apply-migration.ps1

# Or with parameters
.\apply-migration.ps1 -Environment development -DeveloperId dev -Region eu-west-1

# To rollback
.\apply-migration.ps1 -Rollback
```

### Option 2: Bash (Linux/macOS)

```bash
# Navigate to the database directory
cd infra/database

# Make script executable (first time only)
chmod +x apply-migration.sh

# Apply the migration
./apply-migration.sh

# Or with parameters
./apply-migration.sh development dev eu-west-1

# To rollback
./apply-migration.sh development dev eu-west-1 true
```

### Option 3: Manual psql

If you prefer to run psql manually:

```bash
# Get database credentials from AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id pbl/development/dev/db-credentials \
  --region eu-west-1 \
  --query SecretString \
  --output text | jq -r '.username, .password'

# Set password environment variable
export PGPASSWORD='your-password-here'

# Run migration
psql -h pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com \
     -p 5432 \
     -U pbl_admin \
     -d pbl_development \
     -f migrations/20250122_0006_ai_analogy_generation.sql

# Clear password
unset PGPASSWORD
```

## Migration Script Features

The migration scripts include:

✅ **Pre-flight Checks**
- Verifies AWS CLI is installed
- Verifies PostgreSQL client is installed
- Checks migration file exists

✅ **Secure Credential Handling**
- Retrieves credentials from AWS Secrets Manager
- Uses environment variables for password
- Clears credentials after use

✅ **Interactive Confirmation**
- Shows what will be created/dropped
- Requires explicit "yes" confirmation

✅ **Post-Migration Verification**
- Verifies tables were created
- Lists all new tables

✅ **Detailed Output**
- Color-coded status messages
- Clear error messages
- Next steps guidance

## Verification

After running the migration, verify the tables exist:

```sql
-- List all new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'chapter_analogies',
    'memory_techniques',
    'learning_mantras',
    'analogy_feedback',
    'chapter_complexity'
)
ORDER BY table_name;

-- Check table row counts
SELECT 
    'chapter_analogies' as table_name, 
    COUNT(*) as row_count 
FROM chapter_analogies
UNION ALL
SELECT 'memory_techniques', COUNT(*) FROM memory_techniques
UNION ALL
SELECT 'learning_mantras', COUNT(*) FROM learning_mantras
UNION ALL
SELECT 'analogy_feedback', COUNT(*) FROM analogy_feedback
UNION ALL
SELECT 'chapter_complexity', COUNT(*) FROM chapter_complexity;

-- Verify views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('analogy_statistics', 'user_generation_stats');
```

## Rollback

If you need to rollback the migration:

```powershell
# PowerShell
.\apply-migration.ps1 -Rollback

# Bash
./apply-migration.sh development dev eu-west-1 true
```

**⚠️ WARNING**: Rollback will permanently delete all data in the analogy tables!

## Troubleshooting

### Error: "AWS CLI not found"
Install AWS CLI from https://aws.amazon.com/cli/

### Error: "psql not found"
Install PostgreSQL client:
- Windows: `winget install PostgreSQL.PostgreSQL`
- macOS: `brew install postgresql`
- Linux: `sudo apt-get install postgresql-client`

### Error: "Failed to retrieve secret"
Check:
1. AWS credentials are configured: `aws configure`
2. You have `secretsmanager:GetSecretValue` permission
3. The secret exists in the correct region

### Error: "Connection refused"
Check:
1. RDS security group allows your IP address
2. You're connected to the correct network (VPN if required)
3. RDS endpoint is correct

### Error: "Permission denied"
Your database user needs:
- `CREATE TABLE` permission
- `CREATE INDEX` permission
- `CREATE VIEW` permission
- `CREATE TRIGGER` permission

## Next Steps

After successful migration:

1. **Test the Backend**
   ```bash
   cd backend
   python main.py
   ```

2. **Test API Endpoints**
   - `POST /api/chapters/{chapter_id}/generate-analogies`
   - `GET /api/chapters/{chapter_id}/analogies`
   - `POST /api/analogies/{analogy_id}/feedback`

3. **Monitor CloudWatch**
   - Check for any database errors
   - Monitor query performance

4. **Update Application**
   - Deploy updated backend to Fargate
   - Update frontend to use new features

## Support

For issues or questions:
1. Check the error messages in the script output
2. Review the migration SQL file for syntax errors
3. Check AWS CloudWatch Logs for RDS errors
4. Verify IAM permissions in AWS Console

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 20250122_0006 | 2025-01-22 | AI-powered analogy generation feature |

---

**Status**: Ready to apply ✅

**Estimated Time**: 2-3 minutes

**Downtime Required**: No (tables are new, no existing data affected)
