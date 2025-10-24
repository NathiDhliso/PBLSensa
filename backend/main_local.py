"""
FastAPI Backend - Local Development (No Database Required)
Includes PDF processing with in-memory storage
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import uuid
from simple_pdf_processor import process_pdf_document

app = FastAPI(title="PBL API - Local", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
courses_db = {}
documents_db = {}
concepts_db = {}  # document_id -> [concepts]
visualizations_db = {}
duplicates_db = {}


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ============================================================================
# Course Management
# ============================================================================

@app.get("/courses")
def get_courses():
    return list(courses_db.values())


class CourseCreate(BaseModel):
    name: str
    description: str = ""

@app.post("/courses")
def create_course(course: CourseCreate):
    course_id = f"course-{len(courses_db) + 1}"
    now = datetime.now().isoformat()
    
    new_course = {
        "id": course_id,
        "name": course.name,
        "description": course.description,
        "created_at": now,
        "updated_at": now,
        "document_count": 0
    }
    
    courses_db[course_id] = new_course
    return new_course


@app.get("/courses/{course_id}")
def get_course(course_id: str):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    return courses_db[course_id]


@app.delete("/courses/{course_id}")
def delete_course(course_id: str):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Delete associated documents
    docs_to_delete = [doc_id for doc_id, doc in documents_db.items() 
                      if doc['course_id'] == course_id]
    for doc_id in docs_to_delete:
        del documents_db[doc_id]
        if doc_id in concepts_db:
            del concepts_db[doc_id]
    
    del courses_db[course_id]
    return {"message": "Course deleted successfully"}


# ============================================================================
# Document Management
# ============================================================================

@app.get("/courses/{course_id}/documents")
def get_course_documents(course_id: str):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    docs = [doc for doc in documents_db.values() if doc['course_id'] == course_id]
    return docs


@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    course_id: str = Form(None),
    courseId: str = Form(None)
):
    # Handle both course_id and courseId
    cid = course_id or courseId
    
    if not cid:
        raise HTTPException(status_code=422, detail="course_id is required")
    
    if cid not in courses_db:
        raise HTTPException(status_code=404, detail=f"Course {cid} not found")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=422, detail="Only PDF files are supported")
    
    # Create document record
    doc_id = f"doc-{len(documents_db) + 1}"
    task_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    # Read file content
    file_content = await file.read()
    
    # Process PDF in background (for now, do it synchronously)
    print(f"📄 Processing PDF: {file.filename}")
    result = process_pdf_document(file_content, doc_id)
    
    if result['success']:
        # Store concepts
        concepts_db[doc_id] = result['concepts']
        print(f"✅ Extracted {len(result['concepts'])} concepts")
        
        document = {
            "id": doc_id,
            "course_id": cid,
            "filename": file.filename,
            "status": "completed",
            "uploaded_at": now,
            "processed_at": now,
            "concept_count": len(result['concepts'])
        }
    else:
        print(f"⚠️  PDF processing failed: {result.get('error')}")
        document = {
            "id": doc_id,
            "course_id": cid,
            "filename": file.filename,
            "status": "failed",
            "uploaded_at": now,
            "error": result.get('error', 'Unknown error')
        }
        concepts_db[doc_id] = []
    
    documents_db[doc_id] = document
    courses_db[cid]['document_count'] += 1
    
    return {
        "task_id": task_id,
        "document_id": doc_id,
        "status": document['status']
    }


@app.delete("/documents/{document_id}")
def delete_document(document_id: str):
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    course_id = doc['course_id']
    
    del documents_db[document_id]
    if document_id in concepts_db:
        del concepts_db[document_id]
    
    if course_id in courses_db:
        courses_db[course_id]['document_count'] = max(0, courses_db[course_id]['document_count'] - 1)
    
    return {"message": "Document deleted successfully"}


@app.get("/status/{task_id}")
def get_processing_status(task_id: str):
    return {
        "task_id": task_id,
        "status": "completed",
        "progress": 100,
        "message": "Document processed successfully",
        "estimated_time_remaining": 0
    }


# ============================================================================
# PBL Endpoints
# ============================================================================

@app.get("/api/pbl/documents/{document_id}/concepts")
def get_document_concepts(document_id: str, validated: Optional[bool] = None):
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    concepts = concepts_db.get(document_id, [])
    
    # Filter by validated status if specified
    if validated is not None:
        concepts = [c for c in concepts if c.get('validated') == validated]
    
    return concepts


@app.put("/api/pbl/documents/{document_id}/concepts/{concept_id}")
def update_concept(document_id: str, concept_id: str, updates: Dict):
    if document_id not in concepts_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    concepts = concepts_db[document_id]
    for concept in concepts:
        if concept['id'] == concept_id:
            concept.update(updates)
            concept['updated_at'] = datetime.now().isoformat()
            return concept
    
    raise HTTPException(status_code=404, detail="Concept not found")


@app.delete("/api/pbl/documents/{document_id}/concepts/{concept_id}")
def delete_concept(document_id: str, concept_id: str):
    if document_id not in concepts_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    concepts = concepts_db[document_id]
    concepts_db[document_id] = [c for c in concepts if c['id'] != concept_id]
    
    return {"message": "Concept deleted successfully"}


@app.get("/api/pbl/documents/{document_id}/duplicates")
def get_document_duplicates(document_id: str):
    # Return empty for now - duplicate detection can be added later
    return []


@app.post("/api/pbl/documents/{document_id}/duplicates/{group_id}/resolve")
def resolve_duplicate(document_id: str, group_id: str, resolution: Dict):
    return {"message": "Duplicate resolved successfully"}


@app.get("/api/pbl/visualizations/{document_id}")
def get_visualization(document_id: str):
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    concepts = concepts_db.get(document_id, [])
    
    # Create simple visualization from concepts
    nodes = []
    edges = []
    
    for i, concept in enumerate(concepts[:20]):  # Limit to 20 nodes
        nodes.append({
            "id": concept['id'],
            "label": concept['term'][:50],
            "type": "concept",
            "x": (i % 5) * 150,
            "y": (i // 5) * 100,
            "size": 20
        })
        
        # Create edges between sequential concepts
        if i > 0:
            edges.append({
                "id": f"edge-{i}",
                "source": concepts[i-1]['id'],
                "target": concept['id'],
                "type": "relates_to",
                "strength": 0.7
            })
    
    return {
        "id": f"viz-{document_id}",
        "document_id": document_id,
        "nodes": nodes,
        "edges": edges,
        "created_at": datetime.now().isoformat()
    }


@app.get("/api/pbl/documents")
def get_pbl_documents():
    return list(documents_db.values())


@app.get("/api/pbl/documents/{document_id}")
def get_pbl_document(document_id: str):
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    return documents_db[document_id]


# ============================================================================
# Concept Map Endpoints
# ============================================================================

@app.get("/concept-map/course/{course_id}")
def get_course_concept_map(course_id: str):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Aggregate concepts from all documents in the course
    all_concepts = []
    for doc_id, doc in documents_db.items():
        if doc['course_id'] == course_id:
            all_concepts.extend(concepts_db.get(doc_id, []))
    
    # Group by page number as chapters
    chapters = {}
    for concept in all_concepts:
        page = concept.get('page_number', 1)
        if page not in chapters:
            chapters[page] = {
                "chapter_number": page,
                "title": f"Section {page}",
                "keywords": [],
                "relationships": []
            }
        
        chapters[page]["keywords"].append({
            "term": concept['term'],
            "definition": concept['definition'],
            "is_primary": True,
            "exam_relevant": True
        })
    
    return {
        "id": f"map-{course_id}",
        "course_id": course_id,
        "chapters": list(chapters.values()),
        "global_relationships": []
    }


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting FastAPI Backend (Local Mode) on http://localhost:8000")
    print("📚 PDF Processing enabled with in-memory storage")
    print("💡 Press Ctrl+C to stop")
    print()
    uvicorn.run(app, host="0.0.0.0", port=8000)
