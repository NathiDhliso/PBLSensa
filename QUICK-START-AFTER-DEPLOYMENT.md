# Quick Start - After Deployment Completes

## One-Command Setup

Once your Terraform deployment finishes, run this single command to configure everything:

```powershell
cd infra/scripts
.\complete-setup.ps1
```

This interactive script will:
1. ✅ Check deployment status
2. ✅ Update all configuration files
3. ✅ Prompt for API keys (optional)
4. ✅ Run database migrations (optional)
5. ✅ Create test user (optional)

## Manual Steps (If Preferred)

### 1. Update Configuration
```powershell
cd infra/scripts
.\update-env-config.ps1
```

### 2. Check What Was Created
```powershell
.\check-deployment-status.ps1
```

### 3. Start Your App
```powershell
cd ..\..
npm run dev
```

Open http://localhost:5173

## What's Been Configured

Your codebase now connects to:
- ✅ **Cognito** for authentication
- ✅ **ALB** for API requests
- ✅ **RDS** for database
- ✅ **Redis** for caching
- ✅ **S3** for file storage
- ✅ **SQS** for async processing

## Files Updated

- `.env.local` - Frontend configuration
- `.env.development` - Backend configuration
- `infra/infrastructure-outputs.json` - All resource IDs

## Test Authentication

1. Start the app: `npm run dev`
2. Navigate to http://localhost:5173
3. Click "Sign Up" or "Log In"
4. Cognito will handle authentication

## Need Help?

- **Check deployment**: `.\infra\scripts\check-deployment-status.ps1`
- **View outputs**: `cd infra/Development && terraform output`
- **Read docs**: See `INFRASTRUCTURE-SETUP-COMPLETE.md`

## Common Issues

### "Cannot connect to API"
- Check ALB DNS in `.env.local`
- Verify ECS services are running
- Check security groups allow traffic

### "Cognito authentication fails"
- Verify User Pool ID and Client ID in `.env.local`
- Check AWS region matches
- Ensure test user was created

### "Database connection fails"
- Run database migrations
- Check RDS security group
- Verify credentials in Secrets Manager

## Quick Commands

```powershell
# Check status
cd infra/scripts
.\check-deployment-status.ps1

# Update config
.\update-env-config.ps1

# Complete setup
.\complete-setup.ps1

# View Terraform outputs
cd ..\Development
terraform output

# Start app
cd ..\..
npm run dev
```

## Success! 🎉

When everything is working:
- ✅ Frontend loads at http://localhost:5173
- ✅ You can sign up/log in with Cognito
- ✅ API requests go through ALB
- ✅ Data persists in RDS

---

**Need more details?** See `INFRASTRUCTURE-SETUP-COMPLETE.md`
