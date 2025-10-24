# Import Fix Applied ✅

## Issue
Backend failed to start with:
```
ModuleNotFoundError: No module named 'models.concept'
```

## Root Cause
`backend/services/sensa/question_generator.py` was still importing the old `models.concept` that was deleted.

## Fix Applied
Updated import in `question_generator.py`:

```python
# BEFORE:
from models.concept import Concept

# AFTER:
from models.pbl_concept import Concept
```

## Why This Works
- Sensa View generates questions based on PBL concepts
- PBL concepts are the source of truth
- `pbl_concept.py` is the active model
- Old `concept.py` was deprecated and removed

## Status
✅ Backend should now start successfully

## Test Again
```bash
cd backend
python main.py
```

Expected output:
```
✅ Database connected - PBL features enabled
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8000
```
