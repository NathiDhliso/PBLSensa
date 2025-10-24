# Quick Start Commands

## When You Reopen the IDE/Terminal

### Option 1: Start Backend WITHOUT Database (Fastest)
```powershell
# Just start the backend - works in limited mode
.\restart-backend.ps1
```

### Option 2: Start Backend WITH Database Access

**Terminal 1 - Start Database Tunnel:**
```powershell
# Start bastion if not running
.\infra\scripts\create-bastion-host.ps1

# Start the database tunnel (keep this window open)
.\infra\scripts\start-db-tunnel.ps1
```

**Terminal 2 - Start Backend:**
```powershell
# In a NEW terminal window
.\restart-backend.ps1
```

### Cleanup When Done
```powershell
# Stop backend (Ctrl+C in backend terminal)

# Stop tunnel (Ctrl+C in tunnel terminal)

# Terminate bastion to save costs
.\infra\scripts\terminate-bastion-host.ps1
```

---

## Common Commands

### Backend Management
```powershell
# Start backend
.\restart-backend.ps1

# Kill backend
.\kill-backend.ps1
```

### Database Operations
```powershell
# Apply a migration
.\infra\database\apply-migration-ssm.ps1 -MigrationFile 'infra/database/migrations/MIGRATION_FILE.sql'

# Check bastion status
aws ec2 describe-instances --filters "Name=tag:Purpose,Values=database-migration" "Name=instance-state-name,Values=running" --region eu-west-1 --query 'Reservations[0].Instances[0].[InstanceId,State.Name]' --output table
```

### Frontend
```powershell
# Start frontend (in separate terminal)
npm run dev
```

---

## Current Setup Status

✅ **Infrastructure Deployed**
- VPC, Subnets, Security Groups
- RDS PostgreSQL Database
- Cognito User Pool
- S3 Buckets

✅ **Database Migrations Applied**
- Base schema
- Layer 0 tables (pdf_cache, layer0_cost_tracking)
- V7 enhancements
- All feature tables

✅ **Backend Configuration**
- Environment variables in `.env.local` and `backend/.env`
- AWS credentials configured
- Database connection configured

⚠️ **Session Manager Plugin**
- Required for database tunnel from local machine
- Already installed (Installation Successfully Completed)
- Restart PowerShell if tunnel doesn't work

---

## Troubleshooting

### Backend won't connect to database
```powershell
# Check if tunnel is running
Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue

# If not, start tunnel in separate window
.\infra\scripts\start-db-tunnel.ps1
```

### Bastion not found
```powershell
# Create new bastion
.\infra\scripts\create-bastion-host.ps1
```

### Port 5432 already in use
```powershell
# Find and kill process
Get-NetTCPConnection -LocalPort 5432 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

---

## Cost Reminder

💰 **Bastion Host**: ~$0.01/hour when running
- Always terminate when done: `.\infra\scripts\terminate-bastion-host.ps1`

💰 **RDS Database**: ~$0.02/hour (always running)
- Part of infrastructure, needed for production

💰 **Other Services**: Minimal cost when not in use
