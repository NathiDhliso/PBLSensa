# Apply Migration via AWS Console

Since the RDS instance is in a private subnet, the easiest way to apply the migration is through the AWS RDS Query Editor.

## Step-by-Step Instructions

### 1. Open AWS RDS Query Editor

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **RDS** service
3. Click on **Query Editor** in the left sidebar
4. Or go directly to: https://console.aws.amazon.com/rds/home?region=eu-west-1#query-editor:

### 2. Connect to Database

Fill in the connection details:

- **Database instance**: Select `pbl-development-dev-db`
- **Database name**: `pbl_development`
- **Authentication**: Choose **Connect with a Secrets Manager ARN**
- **Secrets Manager ARN**: `arn:aws:secretsmanager:eu-west-1:202717921808:secret:pbl/development/dev/db-credentials-drOJfi`

Click **Connect to database**

### 3. Run the Migration

1. Open the migration file: `infra/database/migrations/20250122_0006_ai_analogy_generation.sql`

2. Copy the entire contents

3. Paste into the Query Editor

4. Click **Run** (or press Ctrl+Enter)

5. Wait for the query to complete (should take 10-30 seconds)

### 4. Verify Success

Run this verification query:

```sql
-- Check that all tables were created
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
```

You should see 5 tables listed.

### 5. Check Views

```sql
-- Check that views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('analogy_statistics', 'user_generation_stats');
```

You should see 2 views listed.

## Expected Results

After successful migration, you should see:

✅ **5 new tables created:**
- chapter_analogies
- memory_techniques
- learning_mantras
- analogy_feedback
- chapter_complexity

✅ **2 new views created:**
- analogy_statistics
- user_generation_stats

✅ **4 new columns added to users table:**
- learning_style
- background
- education_level
- interests

## Troubleshooting

### Error: "Permission denied"

Make sure you're using the correct Secrets Manager ARN that contains the `pbl_admin` credentials.

### Error: "Relation already exists"

The tables may already exist. You can either:
1. Skip the migration (tables are already there)
2. Run the rollback first, then re-run the migration

### Error: "Function does not exist"

Make sure the `uuid-ossp` extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Alternative: Use psql from EC2

If you prefer command line, you can:

1. Launch a temporary EC2 instance in the same VPC
2. Install PostgreSQL client: `sudo yum install postgresql15`
3. Copy the migration file to the instance
4. Run: `psql -h pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com -U pbl_admin -d pbl_development -f migration.sql`

## Next Steps

After successful migration:

1. ✅ Test the backend API endpoints
2. ✅ Generate test analogies
3. ✅ Check CloudWatch for any errors
4. ✅ Update your application to use the new features

---

**Need Help?**

If you encounter issues:
1. Check the error message in the Query Editor
2. Verify the Secrets Manager ARN is correct
3. Ensure your IAM user has RDS Data API permissions
4. Check CloudWatch Logs for RDS errors
