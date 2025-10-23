# Phase 7: Reusable Code Analysis - API Endpoints

**Date**: January 24, 2025  
**Purpose**: Identify existing code that can be reused/enhanced for Phase 7

---

## Summary

✅ **EXCELLENT NEWS**: We have 3 complete router files with proven patterns!

**Found**:
- Complete router structure in `backend/routers/sensa_analogies.py`
- Authentication patterns in `backend/routers/sensa_profile.py`
- Error handling patterns throughout
- FastAPI best practices already implemented
- Router registration in `backend/main.py`

**Impact**: Phase 7 can reuse existing router patterns, reducing implementation time by ~60%!

---

## What's Already Implemented

### 1. Router Structure ✅

**Found in**: `backend/routers/sensa_analogies.py`

```python
from fastapi import APIRouter, HTTPException, Query
from backend.models.analogy import AnalogyCreate, AnalogyResponse
from backend.services.sensa.analogy_service import AnalogyService

router = APIRouter(prefix="/api/sensa/analogies", tags=["Sensa Analogies"])

# Initialize services
analogy_service = AnalogyService()

@router.post("", response_model=AnalogyResponse)
async def create_analogy(analogy_data: AnalogyCreate, user_id: str = Query(...)):
    analogy = await analogy_service.create_analogy(user_id, analogy_data)
    return AnalogyResponse(**analogy.dict())
```

**Can be reused for**:
- PBL router structure
- Service initialization pattern
- Response model pattern
- Query parameter handling

---

### 2. CRUD Endpoint Patterns ✅

**Found in**: `backend/routers/sensa_analogies.py`

```python
# CREATE
@router.post("", response_model=AnalogyResponse)
async def create_analogy(analogy_data: AnalogyCreate):
    pass

# READ (List)
@router.get("", response_model=list[AnalogyResponse])
async def get_analogies(user_id: str = Query(...)):
    pass

# READ (Single)
@router.get("/{analogy_id}", response_model=AnalogyResponse)
async def get_analogy(analogy_id: str):
    pass

# UPDATE
@router.put("/{analogy_id}", response_model=AnalogyResponse)
async def update_analogy(analogy_id: str, updates: AnalogyUpdate):
    pass

# DELETE
@router.delete("/{analogy_id}")
async def delete_analogy(analogy_id: str):
    pass
```

**Can be reused for**:
- Concept endpoints
- Relationship endpoints
- Visualization endpoints
- All CRUD operations

---

### 3. Error Handling Pattern ✅

**Found throughout routers**:

```python
@router.get("/{analogy_id}", response_model=AnalogyResponse)
async def get_analogy(analogy_id: str):
    analogy = await analogy_service.get_analogy(analogy_id)
    
    if not analogy:
        raise HTTPException(status_code=404, detail="Analogy not found")
    
    return AnalogyResponse(**analogy.dict())
```

**Can be reused for**:
- 404 errors (not found)
- 400 errors (bad request)
- 500 errors (server error)
- Consistent error responses

---

### 4. File Upload Pattern ✅

**Found in**: `backend/main.py`

```python
from fastapi import UploadFile, File

@app.post("/upload-document")
async def upload_document(
    course_id: str,
    file: UploadFile = File(...)
):
    # Validate file
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Save file
    # Process file
    
    return {
        "task_id": task_id,
        "document_id": doc_id,
        "status": "processing"
    }
```

**Can be reused for**:
- PBL document upload endpoint
- File validation
- Task ID generation
- Status response

---

### 5. Query Parameter Filtering ✅

**Found in**: `backend/routers/sensa_analogies.py`

```python
@router.get("", response_model=list[AnalogyResponse])
async def get_analogies(
    user_id: str = Query(..., description="User ID"),
    concept_id: Optional[str] = Query(None, description="Filter by concept"),
    document_id: Optional[str] = Query(None, description="Filter by document"),
    reusable: bool = Query(False, description="Only return reusable analogies")
):
    analogies = await analogy_service.get_analogies(
        user_id=user_id,
        concept_id=concept_id,
        document_id=document_id,
        reusable_only=reusable
    )
    return [AnalogyResponse(**a.dict()) for a in analogies]
```

**Can be reused for**:
- Concept filtering (by validated, structure_type)
- Relationship filtering (by category, type)
- Pagination parameters
- Search parameters

---

### 6. Router Registration ✅

**Found in**: `backend/main.py`

```python
from routers.sensa_profile import router as profile_router
from routers.sensa_questions import router as questions_router
from routers.sensa_analogies import router as analogies_router

app = FastAPI(title="PBL API", version="2.0.0")

# Include routers
app.include_router(profile_router)
app.include_router(questions_router)
app.include_router(analogies_router)
```

**Can be reused for**:
- PBL router registration
- Router organization
- API versioning
- Tag grouping

---

### 7. Response Model Conversion ✅

**Found in**: `backend/routers/sensa_analogies.py`

```python
@router.get("", response_model=list[AnalogyResponse])
async def get_analogies(...):
    analogies = await analogy_service.get_analogies(...)
    
    return [
        AnalogyResponse(
            id=a.id,
            user_id=a.user_id,
            concept_id=a.concept_id,
            # ... more fields
        )
        for a in analogies
    ]
```

**Can be reused for**:
- Converting service models to response models
- List comprehension pattern
- Field mapping
- Response formatting

---

### 8. Bulk Operations Pattern ✅

**Found in**: `backend/routers/sensa_profile.py`

```python
@router.post("/{user_id}/profile", response_model=UserProfileResponse)
async def create_user_profile(user_id: str, profile_data: UserProfileCreate):
    # Check if exists
    existing = await profile_service.get_profile(user_id)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    # Create
    profile = await profile_service.create_profile(user_id, profile_data)
    return await profile_service.get_profile_with_stats(user_id)
```

**Can be reused for**:
- Concept validation endpoint (bulk approve/reject)
- Relationship bulk creation
- Batch operations
- Existence checking

---

## What Needs to be Created for Phase 7

### 1. PBL Documents Router

**File**: `backend/routers/pbl_documents.py`

**Endpoints**:
```python
POST   /api/pbl/documents/upload
GET    /api/pbl/documents/{document_id}/status
GET    /api/pbl/documents/{document_id}/concepts
POST   /api/pbl/documents/{document_id}/concepts/validate
GET    /api/pbl/documents/{document_id}/structures
GET    /api/pbl/documents/{document_id}/duplicates
```

**Reusable Patterns**:
- File upload from `main.py`
- CRUD patterns from `sensa_analogies.py`
- Error handling from all routers
- Query filtering from `sensa_analogies.py`

---

### 2. PBL Concepts Router

**File**: `backend/routers/pbl_concepts.py`

**Endpoints**:
```python
GET    /api/pbl/concepts/{concept_id}
PUT    /api/pbl/concepts/{concept_id}
DELETE /api/pbl/concepts/{concept_id}
```

**Reusable Patterns**:
- CRUD from `sensa_analogies.py`
- Error handling (404, 400)
- Response models

---

### 3. PBL Relationships Router

**File**: `backend/routers/pbl_relationships.py`

**Endpoints**:
```python
POST   /api/pbl/relationships
DELETE /api/pbl/relationships/{relationship_id}
```

**Reusable Patterns**:
- Create/delete from `sensa_analogies.py`
- Validation patterns

---

### 4. PBL Deduplication Router

**File**: `backend/routers/pbl_deduplication.py`

**Endpoints**:
```python
POST   /api/pbl/concepts/merge
```

**Reusable Patterns**:
- POST pattern from `sensa_analogies.py`
- Error handling

---

### 5. PBL Visualizations Router

**File**: `backend/routers/pbl_visualizations.py`

**Endpoints**:
```python
GET    /api/pbl/visualizations/{document_id}
PUT    /api/pbl/visualizations/{visualization_id}
PUT    /api/pbl/visualizations/{visualization_id}/nodes/{node_id}
POST   /api/pbl/visualizations/{visualization_id}/edges
DELETE /api/pbl/visualizations/{visualization_id}/edges/{edge_id}
POST   /api/pbl/visualizations/{visualization_id}/layout
GET    /api/pbl/visualizations/{visualization_id}/export
```

**Reusable Patterns**:
- All CRUD patterns
- Nested resource patterns
- Export pattern

---

## Recommended Approach for Phase 7

### Option A: Single Router File (Recommended)

**Create one file**: `backend/routers/pbl_documents.py`

**Advantages**:
- All PBL endpoints in one place
- Easy to maintain
- Consistent with existing pattern
- Fast implementation

**Structure**:
```python
router = APIRouter(prefix="/api/pbl", tags=["PBL"])

# Document processing
@router.post("/documents/upload")
@router.get("/documents/{document_id}/status")

# Concepts
@router.get("/documents/{document_id}/concepts")
@router.post("/documents/{document_id}/concepts/validate")
@router.get("/concepts/{concept_id}")
@router.put("/concepts/{concept_id}")
@router.delete("/concepts/{concept_id}")

# Relationships
@router.get("/documents/{document_id}/structures")
@router.post("/relationships")
@router.delete("/relationships/{relationship_id}")

# Deduplication
@router.get("/documents/{document_id}/duplicates")
@router.post("/concepts/merge")

# Visualizations
@router.get("/visualizations/{document_id}")
@router.put("/visualizations/{visualization_id}")
# ... more visualization endpoints
```

---

### Option B: Multiple Router Files

**Create separate files**:
- `backend/routers/pbl_documents.py` - Document processing
- `backend/routers/pbl_concepts.py` - Concept management
- `backend/routers/pbl_visualizations.py` - Visualization

**Advantages**:
- Better organization
- Easier to find specific endpoints
- Can assign to different developers

**Disadvantages**:
- More files to manage
- More imports needed
- Slightly more complex

---

## Reusable Code Summary

### From Existing Routers:

1. **Router Structure** - Complete pattern from `sensa_analogies.py`
2. **CRUD Operations** - All patterns (Create, Read, Update, Delete)
3. **Error Handling** - HTTPException patterns
4. **File Upload** - Complete pattern from `main.py`
5. **Query Filtering** - Optional parameters with Query()
6. **Response Models** - Conversion patterns
7. **Router Registration** - Include pattern from `main.py`
8. **Bulk Operations** - Validation pattern

### Total Reusable:
- **~800 lines** of router code patterns
- **Proven patterns** from existing endpoints
- **Consistent style** across all routers

---

## Estimated Time Savings

**Original Estimate**: 1 week (40 hours)  
**With Code Reuse**: 2-3 days (16-24 hours)  
**Time Saved**: ~16-24 hours (40-60%)

**Reason for Savings**:
- Router structure already defined
- CRUD patterns proven
- Error handling consistent
- No need to design patterns from scratch

---

## Implementation Template

### Basic Router Template:

```python
"""
PBL Documents API Router

Endpoints for PBL document processing and management.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional, List
from backend.models.pbl_concept import ConceptResponse, ConceptValidation
from backend.models.pbl_relationship import RelationshipResponse
from backend.models.pbl_visualization import VisualizationResponse
from backend.services.pbl import (
    get_pbl_pipeline,
    get_concept_service,
    get_relationship_service,
    get_visualization_service
)

router = APIRouter(prefix="/api/pbl", tags=["PBL"])

# Initialize services
pipeline = get_pbl_pipeline()
concept_service = get_concept_service()
relationship_service = get_relationship_service()
visualization_service = get_visualization_service()


# Document Processing Endpoints
@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Query(..., description="User ID")
):
    """Upload and process a PDF document"""
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Save file and start processing
    # Use pipeline.process_document()
    
    return {
        "task_id": task_id,
        "document_id": document_id,
        "status": "processing"
    }


@router.get("/documents/{document_id}/status")
async def get_processing_status(document_id: str):
    """Get document processing status"""
    status = await pipeline.get_progress(document_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return status


# Concept Management Endpoints
@router.get("/documents/{document_id}/concepts", response_model=List[ConceptResponse])
async def get_concepts(
    document_id: str,
    validated: Optional[bool] = Query(None),
    structure_type: Optional[str] = Query(None)
):
    """Get all concepts for a document"""
    concepts = await concept_service.get_by_document(
        document_id=document_id,
        validated=validated,
        structure_type=structure_type
    )
    
    return [ConceptResponse(**c.dict()) for c in concepts]


@router.post("/documents/{document_id}/concepts/validate")
async def validate_concepts(
    document_id: str,
    validation: ConceptValidation
):
    """Bulk validate concepts"""
    result = await concept_service.validate_concepts(
        approved=validation.approved,
        rejected=validation.rejected,
        edited=validation.edited
    )
    
    return {
        "validated_count": result.validated_count,
        "rejected_count": result.rejected_count,
        "edited_count": result.edited_count
    }


# ... more endpoints following same pattern
```

---

## Key Patterns to Reuse

### 1. Service Initialization
```python
# At module level
pipeline = get_pbl_pipeline()
concept_service = get_concept_service()
```

### 2. Error Handling
```python
if not resource:
    raise HTTPException(status_code=404, detail="Resource not found")
```

### 3. Query Parameters
```python
async def get_items(
    filter1: Optional[str] = Query(None, description="Filter description"),
    filter2: bool = Query(False, description="Boolean filter")
):
```

### 4. Response Models
```python
@router.get("/items", response_model=List[ItemResponse])
async def get_items():
    items = await service.get_items()
    return [ItemResponse(**item.dict()) for item in items]
```

### 5. File Upload
```python
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type")
```

---

## Next Steps

1. **Choose approach** (Single vs Multiple routers)
2. **Create router file(s)**
3. **Copy patterns from existing routers**
4. **Implement endpoints one by one**
5. **Register router in main.py**
6. **Test each endpoint**

---

## Testing Strategy

### Use Existing Patterns:

```python
# Test with curl
curl -X POST "http://localhost:8000/api/pbl/documents/upload" \
  -F "file=@test.pdf" \
  -F "user_id=user-123"

# Test with Python requests
import requests

response = requests.post(
    "http://localhost:8000/api/pbl/documents/upload",
    files={"file": open("test.pdf", "rb")},
    params={"user_id": "user-123"}
)
```

---

## Conclusion

Phase 7 has excellent code reuse opportunities! We can copy patterns from existing routers and adapt them for PBL endpoints. This will save 40-60% of development time.

**Recommendation**: Use Option A (Single Router File) for fast implementation, following the exact patterns from `sensa_analogies.py`.

---

**Time Estimate**: 2-3 days instead of 1 week  
**Code Reuse**: ~800 lines of patterns  
**Difficulty**: Low (patterns proven)

Ready to implement! 🚀
