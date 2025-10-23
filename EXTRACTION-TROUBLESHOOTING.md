# PDF Extraction Troubleshooting Guide

## Current Situation

You have uploaded "Patel H. Exam Ref AZ-104 Microsoft Azure Administrator 2022.pdf" but keywords aren't being extracted.

## Most Likely Causes

### 1. AWS Bedrock Rate Limiting (MOST LIKELY)
**Symptoms:**
- Backend logs show: `ThrottlingException: Too many requests`
- Extraction starts but fails after a few pages
- Shows "→ Extracted 0 concepts from this chunk"

**Why This Happens:**
- AWS Bedrock has rate limits on API calls
- You've been testing Claude multiple times
- The rate limit needs time to reset (usually 1-5 minutes)

**Solution:**
```
Wait 5 minutes, then try uploading again
```

### 2. Backend Not Running
**Symptoms:**
- No logs appear in backend terminal
- Frontend shows connection errors

**Solution:**
```powershell
.\restart-backend.ps1
```

### 3. Claude Model Not Configured
**Symptoms:**
- Backend logs show: `ValidationException: model ID not supported`

**Solution:**
Already fixed! Model ID updated to: `anthropic.claude-3-5-sonnet-20240620-v1:0`

### 4. AWS Credentials Not Set
**Symptoms:**
- Backend logs show: `Unable to locate credentials`

**Solution:**
Check your AWS credentials are configured:
```powershell
aws configure list
```

## How to Check What's Wrong

### Step 1: Check Backend Logs

Look at your backend terminal. You should see:

**✅ GOOD - Extraction Working:**
```
Processing chunk 1/678 (page 1)...
🤖 Calling Claude API...
✅ Claude response received
→ Extracted 8 concepts from this chunk
  • Azure Virtual Machines
  • Resource Groups
  • Azure Storage
  ...
```

**❌ BAD - Rate Limiting:**
```
🤖 Calling Claude API...
Claude API call failed: ThrottlingException: Too many requests
→ Extracted 0 concepts from this chunk
```

**❌ BAD - No Logs:**
```
(nothing appears - backend not running or not receiving upload)
```

### Step 2: Check Upload Status

In your browser console, look for:

**✅ GOOD:**
```
[API Request] POST /upload-document
[API Response] 200 OK
```

**❌ BAD:**
```
timeout of 300000ms exceeded
500 Internal Server Error
Network Error
```

## Quick Fixes

### Fix 1: Wait for Rate Limit Reset
```
⏳ Wait 5 minutes
🔄 Try uploading again
```

### Fix 2: Restart Backend
```powershell
.\restart-backend.ps1
```

### Fix 3: Test Claude Connection
```powershell
cd backend
python test_claude_simple.py
```

If you see "🎉 CLAUDE IS WORKING!" then Claude is ready.

### Fix 4: Check Backend is Running
Look for this in your backend terminal:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## What Should Happen (Normal Flow)

1. **Upload PDF** → Frontend sends file to backend
2. **Backend receives** → Logs show "📤 NEW DOCUMENT UPLOAD"
3. **PDF parsing** → Extracts text from all pages
4. **Concept extraction** → Claude processes each chunk
5. **Keywords extracted** → Shows list of concepts
6. **Upload completes** → Frontend shows success

## Current Status Check

Run this to see if everything is ready:

```powershell
# 1. Check backend is running
# Look for: "Uvicorn running on http://0.0.0.0:8000"

# 2. Test Claude (wait 5 min if rate limited)
cd backend
python test_claude_simple.py

# 3. Try upload again
# Go to browser and upload the PDF
```

## Expected Processing Time

For your AZ-104 PDF (~450 pages):
- **Upload**: 5-10 seconds
- **Processing**: 3-5 minutes
- **Total**: ~5 minutes

## If Still Not Working

1. **Check backend terminal** - What do you see?
2. **Check browser console** - Any errors?
3. **Wait 5 minutes** - Rate limit might still be active
4. **Try a smaller PDF** - Test with a 10-page PDF first

## Rate Limit Info

AWS Bedrock limits:
- **Requests per minute**: ~50-100 (varies by account)
- **Reset time**: 1-5 minutes
- **Solution**: Wait, then retry

The rate limit is temporary and will reset automatically!

---

**Next Step**: Wait 5 minutes, then try uploading the PDF again. Watch the backend terminal for extraction logs.
