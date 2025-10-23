# 🎯 Backend Quick Start Guide

## What We Just Created

I've built you a **simple FastAPI backend** that runs locally on your machine. This will:
- ✅ Stop all those `ERR_CONNECTION_REFUSED` errors
- ✅ Let you test real API calls instead of mock data
- ✅ Enable document uploads and course management
- ✅ Work perfectly with your frontend

## 📁 Files Created

```
backend/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── README.md              # Detailed backend docs
├── start-backend.ps1      # PowerShell startup script
├── start-backend.bat      # Windows batch startup script
└── .gitignore            # Git ignore rules
```

## 🚀 How to Start (Choose One Method)

### Method 1: PowerShell Script (Recommended)

1. **Open a NEW terminal** (keep your frontend running)
2. Navigate to backend:
   ```powershell
   cd backend
   ```
3. Run the script:
   ```powershell
   .\start-backend.ps1
   ```

### Method 2: Batch File (Windows)

1. **Open a NEW terminal**
2. Navigate to backend:
   ```cmd
   cd backend
   ```
3. Run the batch file:
   ```cmd
   start-backend.bat
   ```

### Method 3: Manual (All Platforms)

```bash
# Navigate to backend
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat
# Mac/Linux:
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start server
python main.py
```

## ✅ Verify It's Working

### 1. Check the Terminal Output
You should see:
```
🚀 Starting PBL Backend API on http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Test the Health Endpoint
Open your browser to: http://localhost:8000/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T..."
}
```

### 3. View API Documentation
Open: http://localhost:8000/docs

You'll see interactive Swagger documentation where you can test all endpoints!

## 🔄 Restart Your Frontend

After starting the backend, **restart your frontend dev server**:

1. In your frontend terminal, press `Ctrl+C`
2. Run `npm run dev` again

This ensures the frontend picks up the new configuration.

## 🎉 What Changes

### Before (Mock Data)
- ❌ Connection refused errors in console
- ⚠️ Using fake data that resets on refresh
- ⚠️ Limited functionality

### After (Real Backend)
- ✅ No connection errors
- ✅ Real API calls with proper responses
- ✅ Data persists during session (in-memory)
- ✅ Full CRUD operations work
- ✅ Document uploads work
- ✅ Concept maps generate

## 📊 Backend Features

### Courses API
- `GET /courses` - List all courses
- `POST /courses` - Create new course
- `GET /courses/{id}` - Get course details
- `DELETE /courses/{id}` - Delete course

### Documents API
- `GET /courses/{id}/documents` - List documents
- `POST /upload-document` - Upload PDF
- `DELETE /documents/{id}` - Delete document

### Concept Maps API
- `GET /concept-map/course/{id}` - Course concept map
- `GET /concept-map/document/{id}` - Document concept map

### Other
- `GET /health` - Health check
- `GET /status/{task_id}` - Processing status
- `POST /feedback` - Submit feedback

## 💾 Data Storage

The backend uses **in-memory storage**:
- ✅ Fast and simple
- ✅ Perfect for development
- ⚠️ Data resets when server restarts
- ⚠️ Not for production use

For production, you'd add:
- PostgreSQL database
- Redis caching
- S3 file storage
- AWS Bedrock AI integration

## 🐛 Troubleshooting

### "Python not found"
**Solution**: Install Python 3.11+ from https://www.python.org/downloads/

Make sure to check "Add Python to PATH" during installation.

### "Port 8000 already in use"
**Solution**: Either:
1. Stop whatever is using port 8000
2. Or change the port in `backend/main.py` (last line):
   ```python
   uvicorn.run(app, host="0.0.0.0", port=8001)  # Change to 8001
   ```
   Then update `.env.local`:
   ```bash
   VITE_API_BASE_URL=http://localhost:8001
   ```

### "Module not found" errors
**Solution**: Make sure you installed dependencies:
```bash
pip install -r requirements.txt
```

### Still seeing connection errors in frontend?
**Checklist**:
1. ✅ Backend is running (check terminal)
2. ✅ http://localhost:8000/health works in browser
3. ✅ `.env.local` has `VITE_ENABLE_MOCK_API=false`
4. ✅ Frontend dev server was restarted after backend started

### CORS errors
The backend is configured for `http://localhost:5173`. If your frontend runs on a different port, update `main.py`:
```python
allow_origins=["http://localhost:5173", "http://localhost:YOUR_PORT"],
```

## 🎯 Next Steps

1. **Start the backend** using one of the methods above
2. **Restart your frontend** dev server
3. **Test the app**:
   - Create a course
   - Upload a document
   - View concept maps
   - Test all the new back buttons!

## 📚 Additional Resources

- **Backend README**: `backend/README.md` - Detailed backend documentation
- **API Docs**: http://localhost:8000/docs - Interactive API testing
- **Deployment Guide**: `BACKEND-DEPLOYMENT-GUIDE.md` - For AWS deployment later

## 💡 Pro Tips

1. **Keep both terminals open**: One for frontend, one for backend
2. **Check backend logs**: Useful for debugging API calls
3. **Use API docs**: http://localhost:8000/docs lets you test endpoints directly
4. **Data resets**: Remember, data is lost when backend restarts (by design)

## 🎊 You're Ready!

Open a new terminal and run:
```powershell
cd backend
.\start-backend.ps1
```

Watch those connection errors disappear! 🚀

---

**Questions?** Check `backend/README.md` or just ask!
