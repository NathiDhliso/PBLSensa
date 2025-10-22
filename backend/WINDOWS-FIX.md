# 🪟 Windows Installation Fix

## The Problem

Newer versions of Pydantic (2.5+) require Rust compiler to build `pydantic-core`, which needs Microsoft Visual C++ build tools on Windows.

## ✅ Solution

I've updated `requirements.txt` to use slightly older versions that have pre-compiled wheels for Windows (no compilation needed):

- `fastapi==0.104.1` (was 0.109.0)
- `pydantic==2.4.2` (was 2.5.3)
- `uvicorn==0.24.0` (was 0.27.0)

These versions work identically for our purposes and install without any build tools!

## 🚀 Try Again

In your backend terminal:

```powershell
# Clear pip cache to avoid issues
pip cache purge

# Install dependencies
pip install -r requirements.txt
```

This should complete successfully with:
```
Successfully installed fastapi-0.104.1 uvicorn-0.24.0 pydantic-2.4.2 ...
```

Then start the server:
```powershell
python main.py
```

## 🎯 Alternative: Use Pre-built Wheels

If you still have issues, try installing from pre-built wheels:

```powershell
pip install --only-binary :all: -r requirements.txt
```

## 🔧 Nuclear Option: Fresh Start

If nothing works, start completely fresh:

```powershell
# Exit venv
deactivate

# Delete venv
Remove-Item -Recurse -Force venv

# Create new venv
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Start server
python main.py
```

## ✅ Success Looks Like

```
🚀 Starting PBL Backend API on http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 💡 Why This Happens

Python packages with C/Rust extensions need to be compiled on Windows, which requires:
- Microsoft Visual C++ Build Tools
- Rust compiler (for newer packages)

By using slightly older versions with pre-compiled wheels, we avoid this entirely!

## 🎊 Once It Works

1. Keep backend terminal open
2. Go to frontend terminal
3. Restart frontend: `Ctrl+C` then `npm run dev`
4. Enjoy error-free development! 🚀
