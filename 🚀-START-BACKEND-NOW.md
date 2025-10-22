# 🚀 START YOUR BACKEND NOW!

## ⚡ Quick Start (Copy & Paste)

Open a **NEW terminal** and run:

```powershell
cd backend
.\start-backend.ps1
```

That's it! 🎉

## ✅ You'll See This

```
🚀 Starting PBL Backend Server...
✅ Python found: Python 3.11.x
📦 Creating virtual environment...
✅ Virtual environment created
🔧 Activating virtual environment...
📥 Installing dependencies...
✅ Setup complete!

🌐 Starting server on http://localhost:8000
📚 API Documentation: http://localhost:8000/docs

Press Ctrl+C to stop the server

INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 🎯 Then Do This

1. **Keep that terminal open** (backend is running)
2. **Go back to your frontend terminal**
3. **Restart it**:
   ```bash
   Ctrl+C
   npm run dev
   ```

## ✨ Magic Happens

- ✅ No more `ERR_CONNECTION_REFUSED` errors
- ✅ Real API calls working
- ✅ Courses load properly
- ✅ Document uploads work
- ✅ Concept maps generate
- ✅ Everything just works!

## 🧪 Test It

### 1. Health Check
Open: http://localhost:8000/health

Should see:
```json
{"status": "healthy", "timestamp": "..."}
```

### 2. API Docs
Open: http://localhost:8000/docs

You'll see interactive Swagger documentation!

### 3. Your App
Open: http://localhost:5173

No errors in console! 🎊

## 📋 Checklist

- [ ] Opened new terminal
- [ ] Ran `cd backend`
- [ ] Ran `.\start-backend.ps1`
- [ ] Saw "Uvicorn running" message
- [ ] Tested http://localhost:8000/health
- [ ] Restarted frontend
- [ ] Checked console - no errors!
- [ ] Created a test course
- [ ] Everything works! 🎉

## 🐛 Problems?

### "Python not found"
Install from: https://www.python.org/downloads/

### "Cannot run scripts"
Run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Port 8000 in use"
Something else is using port 8000. Either stop it or change the port in `backend/main.py`

### Still stuck?
See `BACKEND-QUICK-START.md` for detailed help!

## 🎊 Ready?

```powershell
cd backend
.\start-backend.ps1
```

**GO!** 🚀✨

---

**Two terminals running = Happy developer!** 😊

Terminal 1: `npm run dev` (Frontend)  
Terminal 2: `python main.py` (Backend)
