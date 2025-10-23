# 🎯 START HERE - Backend Setup

## 📍 You Are Here

Your frontend is running and showing connection errors. Let's fix that!

## 🎬 The Plan

```
Step 1: Open new terminal
   ↓
Step 2: Start backend
   ↓
Step 3: Restart frontend
   ↓
Step 4: Enjoy! ✨
```

## 🚀 Let's Do This!

### 1️⃣ Open a New Terminal Window

**Keep your current terminal running!** Open a brand new one.

### 2️⃣ Navigate and Start Backend

Copy and paste these commands:

```powershell
cd backend
.\start-backend.ps1
```

**Wait for this message:**
```
🚀 Starting PBL Backend API on http://localhost:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3️⃣ Restart Your Frontend

In your **original terminal** (where frontend is running):

```bash
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

### 4️⃣ Test It!

Open your browser:
- **Frontend**: http://localhost:5173
- **Backend Health**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

## ✅ Success Looks Like

### In Backend Terminal:
```
🚀 Starting PBL Backend API on http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### In Frontend Console:
```
✅ No more ERR_CONNECTION_REFUSED errors!
✅ API calls working
✅ Data loading properly
```

### In Your Browser:
```
✅ Courses load
✅ Can create new courses
✅ Can upload documents
✅ Concept maps work
✅ All navigation works smoothly
```

## 🎯 Quick Reference

| What | Where | Port |
|------|-------|------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:8000 | 8000 |
| API Docs | http://localhost:8000/docs | 8000 |
| Health Check | http://localhost:8000/health | 8000 |

## 📚 Need More Help?

- **Quick Start**: `READY-TO-RUN.md`
- **Full Guide**: `BACKEND-QUICK-START.md`
- **Backend Details**: `backend/README.md`
- **What Changed**: `BACKEND-CREATED.md`

## 🐛 Something Wrong?

### Backend won't start?
```powershell
# Make sure Python is installed:
python --version

# Should show Python 3.11 or higher
```

### Still seeing errors?
1. Check both terminals are running
2. Visit http://localhost:8000/health
3. Make sure you restarted frontend
4. Check `BACKEND-QUICK-START.md` for troubleshooting

## 🎊 Ready?

```powershell
cd backend
.\start-backend.ps1
```

Let's make those errors disappear! 🚀✨

---

**You got this!** 💪
