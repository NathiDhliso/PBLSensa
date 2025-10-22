# 🗄️ Database Migration Ready!

## Quick Start - Apply Migration Now

Your database migration is ready to apply! Since your RDS instance is in a private subnet, use the **AWS RDS Query Editor** (easiest method).

### ⚡ Quick Steps (5 minutes)

1. **Open RDS Query Editor**
   - Go to: https://console.aws.amazon.com/rds/home?region=eu-west-1#query-editor:
   
2. **Connect to Database**
   - Database instance: `pbl-development-dev-db`
   - Database name: `pbl_development`
   - Authentication: **Secrets Manager ARN**
   - ARN: `arn:aws:secretsmanager:eu-west-1:202717921808:secret:pbl/development/dev/db-credentials-drOJfi`
   
3. **Run Migration**
   - Open file: `infra/database/migrations/20250122_0006_ai_analogy_generation.sql`
   - Copy all contents
   - Paste into Query Editor
   - Click **Run**
   
4. **Verify Success**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('chapter_analogies', 'memory_techniques', 'learning_mantras', 'analogy_feedback', 'chapter_complexity')
   ORDER BY table_name;
   ```
   Should return 5 tables ✅

---

## 📚 Detailed Guides Available

### Option 1: AWS Console (Recommended)
📄 **Guide**: `infra/database/APPLY-VIA-CONSOLE.md`
- Step-by-step screenshots
- No local setup required
- Works from anywhere

### Option 2: PowerShell Script
📄 **Script**: `infra/database/apply-migration.ps1`
📄 **Guide**: `infra/database/MIGRATION-GUIDE.md`
- Automated with pre-flight checks
- Requires: AWS CLI, psql, network access to RDS
- Note: Won't work if RDS is in private subnet (use Console instead)

### Option 3: Bash Script
📄 **Script**: `infra/database/apply-migration.sh`
- For Linux/macOS users
- Same requirements as PowerShell version

### Option 4: AWS Systems Manager
📄 **Script**: `infra/database/apply-migration-ssm.ps1`
- Runs migration from within AWS
- Requires: Running EC2 instance with SSM agent

---

## 🎯 What This Migration Does

### Creates 5 New Tables

1. **chapter_analogies** (Main analogy storage)
   - Stores AI-generated personalized analogies
   - Includes caching (30-day expiration)
   - Tracks generation costs and tokens
   - Links to user interests and learning styles

2. **memory_techniques** (Memory aids)
   - Acronyms, mind palaces, chunking, spaced repetition
   - Personalized application instructions

3. **learning_mantras** (Motivational content)
   - Personalized learning mantras
   - Explanations and context

4. **analogy_feedback** (User ratings)
   - 1-5 star ratings
   - Optional comments
   - One rating per user per analogy

5. **chapter_complexity** (Complexity analysis)
   - Complexity scores (0-1 scale)
   - Concept counts
   - Vocabulary difficulty metrics

### Creates 2 Views

1. **analogy_statistics** - Aggregated ratings per analogy
2. **user_generation_stats** - User generation statistics

### Extends Users Table

Adds 4 new columns:
- `learning_style` - visual, auditory, kinesthetic, reading-writing
- `background` - User background text
- `education_level` - high_school, undergraduate, graduate, professional
- `interests` - Array of interest strings

### Creates Indexes & Triggers

- 15+ indexes for query performance
- Automatic `updated_at` triggers
- Foreign key constraints
- Check constraints for data validation

---

## ✅ Verification Checklist

After running the migration, verify:

- [ ] 5 tables created (chapter_analogies, memory_techniques, learning_mantras, analogy_feedback, chapter_complexity)
- [ ] 2 views created (analogy_statistics, user_generation_stats)
- [ ] Users table has 4 new columns
- [ ] No error messages in Query Editor
- [ ] Backend API endpoints work

---

## 🚀 After Migration

### 1. Test Backend Endpoints

```bash
# Start backend
cd backend
python main.py
```

Test these endpoints:
- ✅ `POST /api/chapters/{chapter_id}/generate-analogies`
- ✅ `GET /api/chapters/{chapter_id}/analogies`
- ✅ `GET /api/chapters/{chapter_id}/complexity`
- ✅ `POST /api/analogies/{analogy_id}/feedback`
- ✅ `PATCH /api/users/{user_id}/profile`

### 2. Test Frontend

```bash
# Start frontend
npm run dev
```

Navigate to a course and chapter to see:
- Complexity indicators
- Generated analogies
- Memory techniques
- Learning mantras
- Feedback forms

### 3. Monitor CloudWatch

Check for any database errors:
- RDS Performance Insights
- CloudWatch Logs
- Query performance metrics

---

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback:

**Via Console:**
1. Open RDS Query Editor
2. Run: `infra/database/migrations/20250122_0006_ai_analogy_generation_rollback.sql`

**Via Script:**
```powershell
.\apply-migration.ps1 -Rollback
```

⚠️ **Warning**: Rollback will permanently delete all data in the analogy tables!

---

## 📊 Migration Stats

- **Tables Created**: 5
- **Views Created**: 2
- **Indexes Created**: 15+
- **Triggers Created**: 1
- **Columns Added**: 4 (to users table)
- **Estimated Time**: 2-3 minutes
- **Downtime Required**: None (new tables only)
- **Data Loss Risk**: None (no existing data affected)

---

## 🆘 Troubleshooting

### "Connection timed out"
→ Use AWS Console method (RDS is in private subnet)

### "Permission denied"
→ Check Secrets Manager ARN is correct

### "Table already exists"
→ Migration may have already been applied

### "Function does not exist"
→ Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

---

## 📞 Support

For issues:
1. Check error message in Query Editor
2. Review `infra/database/MIGRATION-GUIDE.md`
3. Check CloudWatch Logs for RDS
4. Verify IAM permissions

---

## ✨ Summary

**Status**: ✅ Ready to apply

**Recommended Method**: AWS RDS Query Editor

**Time Required**: 5 minutes

**Risk Level**: Low (new tables, no data loss)

**Next Step**: Open the AWS Console and follow the steps above!

---

**Good luck! 🚀**
