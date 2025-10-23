# How to See Extraction Logs and Keywords

## ✅ What's Been Implemented

All AWS integrations are complete with **NO MOCK DATA**:
- ✅ Real Claude API calls for concept extraction
- ✅ Real Titan Embeddings for vector generation
- ✅ Comprehensive console logging
- ✅ All 800 pages will be processed

## 🚀 Steps to See the Logs

### Step 1: Restart the Backend Server

**In your PowerShell terminal, run:**

```powershell
# Option A: Use the restart script
.\restart-backend.ps1

# Option B: Manual restart
# 1. Press Ctrl+C to stop current server
# 2. Run: python backend/main.py
```

### Step 2: Wait for Server to Start

You should see:
```
🚀 Starting PBL Backend API on http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Upload a Document

Go to your browser and upload a PDF document through the UI.

### Step 4: Watch the Backend Terminal

**The logs will appear in the BACKEND TERMINAL** (not browser console).

You'll see output like this:

```
================================================================================
🚨 UPLOAD ENDPOINT HIT!
================================================================================

================================================================================
📤 NEW DOCUMENT UPLOAD
================================================================================
Filename: document.pdf
Course ID: course-1
Document ID: doc-4
Task ID: 374a0887-c57f-444e-91f8-80bf61bcf86a
================================================================================

💾 Saving to temp file: /tmp/tmpxyz123.pdf
✅ File saved (15234567 bytes)

🚀 Starting PBL pipeline processing...

================================================================================
🚀 PBL PIPELINE STARTED
================================================================================
Document ID: 00000000-0000-0000-0000-000000000004
PDF Path: /tmp/tmpxyz123.pdf
================================================================================

📄 STAGE 1: PDF PARSING
--------------------------------------------------------------------------------
  📖 Opening PDF: /tmp/tmpxyz123.pdf
  📄 Extracting text from all pages...
  ✅ Extracted text from 800 pages
  ✂️  Chunking text...
  ✅ Created 1200 chunks
✅ Stage 1 complete: 1200 chunks created

🤖 STAGE 2: CONCEPT EXTRACTION
--------------------------------------------------------------------------------
================================================================================
🚀 STARTING CONCEPT EXTRACTION
================================================================================

📄 STEP 1: Parsing PDF...
✅ Parsed 1200 chunks from PDF

🤖 STEP 2: Extracting concepts with Claude...
  Processing chunk 1/1200 (page 1)...
    🤖 Calling Claude API...
    ✅ Claude response received (2345 chars)
    → Extracted 8 concepts from this chunk
      • Machine Learning
      • Neural Networks
      • Deep Learning
      • Supervised Learning
      • Unsupervised Learning
      • Reinforcement Learning
      • Training Data
      • Model Accuracy
  Processing chunk 2/1200 (page 1)...
    🤖 Calling Claude API...
    ✅ Claude response received (2156 chars)
    → Extracted 7 concepts from this chunk
      • Gradient Descent
      • Backpropagation
      • Loss Function
      ...

✅ Total concepts extracted: 5234

🔄 STEP 3: Deduplicating concepts...
✅ After deduplication: 4891 unique concepts

📋 SAMPLE OF EXTRACTED CONCEPTS:
  1. Machine Learning
     Definition: A subset of artificial intelligence that enables systems to learn...
     Page: 1, Importance: 0.95
  2. Neural Networks
     Definition: Computing systems inspired by biological neural networks...
     Page: 1, Importance: 0.87
  3. Deep Learning
     Definition: A subset of machine learning using multiple layers...
     Page: 2, Importance: 0.92
  ... and 4888 more concepts

🔢 STEP 4: Generating embeddings...
✅ Generated embeddings for 4891/4891 concepts

================================================================================
✅ CONCEPT EXTRACTION COMPLETE
================================================================================
Total concepts: 4891
With embeddings: 4891
================================================================================

✅ Stage 2 complete: 4891 concepts extracted

================================================================================
✅ PBL PIPELINE COMPLETE
================================================================================
Document ID: 00000000-0000-0000-0000-000000000004
Chunks: 1200
Concepts: 4891
Relationships: 234
================================================================================

✅ Document processing complete!
Status: completed
Results: {'chunks': 1200, 'concepts_extracted': 4891, 'relationships_detected': 234}
```

## 📊 What You'll See

### For Each Chunk Processed:
- ✅ Page number being processed
- ✅ Claude API call status
- ✅ Number of concepts extracted
- ✅ **List of all concept names/keywords**

### Final Summary:
- ✅ Total concepts extracted
- ✅ Concepts after deduplication
- ✅ Sample of top concepts with definitions
- ✅ Embedding generation status
- ✅ Final counts

## ⚠️ Important Notes

1. **Logs appear in BACKEND terminal**, not browser console
2. **Browser console** only shows API requests/responses
3. **All 800 pages** will be processed (no limits)
4. **Processing time**: 30-60 minutes for 800 pages
5. **Cost**: ~$0.35 per 800-page document

## 🐛 Troubleshooting

### Problem: Port 8000 already in use

**Solution:**
```powershell
.\kill-backend.ps1
python backend/main.py
```

### Problem: No logs appearing

**Check:**
1. Is the backend server running?
2. Are you looking at the backend terminal (not browser)?
3. Did you restart the server after code changes?

### Problem: Server won't start

**Solution:**
```powershell
# Kill all Python processes
Get-Process python | Stop-Process -Force

# Start fresh
python backend/main.py
```

## 📝 What Gets Extracted

For each concept/keyword, you'll see:
- **Term**: The concept name (e.g., "Machine Learning")
- **Definition**: What it means
- **Page Number**: Where it was found
- **Importance Score**: 0.0 to 1.0
- **Embedding**: 768-dimension vector (for similarity search)

## ✅ Verification

To verify everything is working:

1. **Server starts** → You see "🚀 Starting PBL Backend API"
2. **Upload works** → You see "🚨 UPLOAD ENDPOINT HIT!"
3. **Processing starts** → You see "🚀 PBL PIPELINE STARTED"
4. **Concepts extracted** → You see list of concept names
5. **Processing completes** → You see "✅ PBL PIPELINE COMPLETE"

## 🎯 Next Steps

Once you see the logs:
1. Verify concepts are being extracted correctly
2. Check that all pages are processed
3. Review the extracted keywords/concepts
4. Confirm embeddings are generated
5. Test with your 800-page document

---

**All code is ready - just restart the server and upload a document!**
