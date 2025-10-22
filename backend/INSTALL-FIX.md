# 🔧 Installation Fix

## What Happened

The installation failed because `uvicorn[standard]` requires Rust compiler, which needs Microsoft Visual C++ build tools on Windows.

## ✅ Fixed!

I've updated `requirements.txt` to use `uvicorn` without the `[standard]` extras. This removes the Rust dependency.

## 🚀 Try Again

In your backend terminal, run:

```powershell
# Make sure you're in the backend directory and venv is activated
pip install -r requirements.txt
```

You should see:
```
Successfully installed fastapi-0.109.0 uvicorn-0.27.0 python-multipart-0.0.6 pydantic-2.5.3
```

Then start the server:
```powershell
python main.py
```

## 🎯 What Changed

**Before**:
```
uvicorn[standard]==0.27.0  ← Requires Rust compiler
```

**After**:
```
uvicorn==0.27.0  ← Pure Python, no compiler needed
```

The `[standard]` extras include:
- `watchfiles` (requires Rust)
- `websockets` (requires C compiler)
- `httptools` (requires C compiler)

We don't need these for basic development!

## ✅ Should Work Now

The installation should complete without errors. The server will work exactly the same, just without some optional performance optimizations (which you won't notice for local development).

## 🐛 Still Having Issues?

If you still get errors, try:

```powershell
# Delete the venv and start fresh
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

## 🎊 Once It Works

You'll see:
```
🚀 Starting PBL Backend API on http://localhost:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Then restart your frontend and enjoy! 🚀
