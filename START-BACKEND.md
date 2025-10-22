# 🚀 Start Your Local Backend

I've created a simple FastAPI backend for you! Here's how to get it running:

## Quick Start (3 Steps)

### 1. Open a New Terminal

Keep your frontend running in the current terminal, and open a **new terminal window**.

### 2. Navigate to Backend Directory

```bash
cd backend
```

### 3. Start the Backend

**Option A: Using PowerShell Script (Easiest)**
```powershell
.\start-backend.ps1
```

**Option B: Manual Start**
```bash
# Create virtual environment (first time only)
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
python main.py
```

## What You'll See

```
🚀 Starting PBL Backend API on http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Test It's Working

1. **Open your browser** to http://localhost:8000/docs
2. You should see the **Swagger API documentation**
3. Try the `/health` endpoint - it should return `{"status": "healthy"}`

## Update Your Frontend

Your `.env.local` is already configured to use the local backend:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_MOCK_API=false
```

**Restart your frontend dev server** (Ctrl+C and `npm run dev` again) to pick up the changes.

## What This Backend Does

✅ **Course Management**
- Create, read, update, delete courses
- Track document counts

✅ **Document Upload**
- Upload PDFs to courses
- Track processing status
- Delete documents

✅ **Concept Maps**
- Generate sample concept maps
- View course and document maps

✅ **CORS Enabled**
- Works with your frontend on localhost:5173

## No More Connection Errors! 🎉

Once the backend is running, those `ERR_CONNECTION_REFUSED` errors will disappear and your app will use real API calls instead of mock data.

## Troubleshooting

### "Python not found"
Install Python 3.11+ from https://www.python.org/downloads/

### "Port 8000 already in use"
Something else is using port 8000. Either:
1. Stop that service
2. Or change the port in `backend/main.py` (line at the bottom)

### "Module not found"
Make sure you ran:
```bash
pip install -r requirements.txt
```

### Still seeing connection errors?
1. Check backend is running (you should see the uvicorn logs)
2. Check http://localhost:8000/health in your browser
3. Restart your frontend dev server
4. Check `.env.local` has `VITE_ENABLE_MOCK_API=false`

## Next Steps

Once everything is working:
1. ✅ Create courses through the UI
2. ✅ Upload documents (they'll be stored in memory)
3. ✅ View concept maps
4. ✅ Test all the navigation with real data

The backend uses in-memory storage, so data resets when you restart it. This is perfect for development!

## Need Help?

- **API Documentation**: http://localhost:8000/docs
- **Backend README**: `backend/README.md`
- **Questions?** Just ask!

---

**Ready?** Open a new terminal and run:
```powershell
cd backend
.\start-backend.ps1
```

Let's get that backend running! 🚀
