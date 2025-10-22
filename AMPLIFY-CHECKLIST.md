✅ AWS Amplify Environment Setup Checklist

## The Problem
Your Amplify deployment is failing with:
```
Missing required environment variables:
  - VITE_API_BASE_URL
  - VITE_AWS_REGION  
  - VITE_COGNITO_USER_POOL_ID
  - VITE_COGNITO_CLIENT_ID
```

## The Solution

### Option A: Manual Setup (5 minutes) ⭐ RECOMMENDED

- [ ] 1. Open AWS Amplify Console
      → Go to: https://console.aws.amazon.com/amplify
      
- [ ] 2. Select your app from the list
      
- [ ] 3. Click "Environment variables" in left sidebar
      
- [ ] 4. Click "Manage variables" button
      
- [ ] 5. Add these 8 variables (copy from AMPLIFY-QUICK-FIX.md):
      - [ ] VITE_API_BASE_URL = http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com
      - [ ] VITE_API_TIMEOUT = 30000
      - [ ] VITE_AWS_REGION = eu-west-1
      - [ ] VITE_COGNITO_USER_POOL_ID = eu-west-1_0kcNGnItf
      - [ ] VITE_COGNITO_CLIENT_ID = 45fjtlck1bpvuealdo1nepikr4
      - [ ] VITE_ENABLE_MOCK_API = false
      - [ ] VITE_ENABLE_API_LOGGING = false
      - [ ] VITE_ENABLE_MOCK_AUTH = false
      
- [ ] 6. Click "Save" button
      
- [ ] 7. Go to "Hosting environments" in left sidebar
      
- [ ] 8. Click "Redeploy this version" on your main branch
      
- [ ] 9. Wait for build to complete (watch the progress bar)
      
- [ ] 10. Open your Amplify app URL
      
- [ ] 11. Verify: No console errors
      
- [ ] 12. Verify: Login page loads correctly

### Option B: Automated Setup (2 minutes)

- [ ] 1. Open PowerShell in project root
      
- [ ] 2. Run: `.\configure-amplify.ps1`
      
- [ ] 3. Follow the prompts
      
- [ ] 4. Wait for build to complete
      
- [ ] 5. Verify app works

---

## Troubleshooting

### Build fails after adding variables
- [ ] Check build logs in Amplify Console
- [ ] Verify all variable names are exactly as shown (case-sensitive)
- [ ] Make sure no extra spaces in values

### App loads but still shows error
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Clear browser cache
- [ ] Try incognito/private window
- [ ] Check that new build actually completed

### Can't find Amplify Console
- [ ] Make sure you're logged into correct AWS account
- [ ] Check you're in correct region (eu-west-1)
- [ ] Verify app was actually deployed to Amplify

### Login doesn't work
- [ ] Verify Cognito User Pool ID is correct
- [ ] Verify Cognito Client ID is correct
- [ ] Check Cognito callback URLs include Amplify domain
- [ ] Test backend health: http://pbl-development-dev-alb-1605501788.eu-west-1.elb.amazonaws.com/health

---

## Success Criteria

You're done when:
✅ App loads without JavaScript errors
✅ No "Missing environment variables" error in console
✅ Login page displays correctly
✅ Can authenticate with Cognito

---

## Resources

- 📖 Full Guide: `AMPLIFY-SETUP.md`
- ⚡ Quick Values: `AMPLIFY-QUICK-FIX.md`
- 🤖 Auto Script: `configure-amplify.ps1`
- 🏗️ Infrastructure: `infra/infrastructure-outputs.json`

---

**Estimated Time: 5 minutes**
**Difficulty: Easy** ⭐
