# ✅ Flask Version - No Compilation Needed!

## The Problem

Python 3.13 is too new - there are no pre-compiled wheels for FastAPI's dependencies (`pydantic-core` requires Rust compiler).

## ✅ The Solution

I've created a **Flask version** of the backend that has **ZERO compilation dependencies**!

## 🚀 Install and Run

In your backend terminal:

```powershell
# Install dependencies (pure Python, no compilation!)
pip install -r requirements.txt

# Start the server
python app.py
```

That's it! Should work instantly! 🎉

## 📦 What Changed

### New Files
- `app.py` - Flask-based backend (replaces `main.py`)

### Updated Files
- `requirements.txt` - Now just Flask and Flask-CORS (pure Python!)
- `start-backend.ps1` - Updated to use `app.py`
- `start-backend.bat` - Updated to use `app.py`

### Same Features
- ✅ All 12 API endpoints
- ✅ CORS enabled
- ✅ In-memory storage
- ✅ Same functionality
- ✅ Works identically with your frontend

## 🎯 Differences from FastAPI

| Feature | FastAPI | Flask |
|---------|---------|-------|
| Auto Docs | ✅ Swagger UI | ❌ No auto docs |
| Type Validation | ✅ Pydantic | ❌ Manual |
| Performance | Faster | Fast enough |
| Installation | Needs Rust | Pure Python ✅ |
| Complexity | More features | Simpler |

For local development, Flask is perfect!

## ✅ Success Looks Like

```
🚀 Starting PBL Backend API (Flask) on http://localhost:8000
📚 Backend is ready!
💡 Press Ctrl+C to stop

 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:8000
```

## 🧪 Test It

```bash
# Health check
curl http://localhost:8000/health

# Create a course
curl -X POST http://localhost:8000/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Course"}'

# List courses
curl http://localhost:8000/courses
```

## 🎊 Once It Works

1. Keep backend terminal open
2. Go to frontend terminal
3. Restart: `Ctrl+C` then `npm run dev`
4. Enjoy! No more connection errors! 🚀

## 💡 Why Flask?

- **Pure Python** - No C/Rust compilation
- **Works on Python 3.13** - No version issues
- **Simple** - Easy to understand and modify
- **Proven** - Battle-tested framework
- **Fast enough** - Perfect for development

## 🔄 Want FastAPI Back?

Once you have Python 3.11 or 3.12 (not 3.13), you can switch back to FastAPI. But for now, Flask gets you running immediately!
