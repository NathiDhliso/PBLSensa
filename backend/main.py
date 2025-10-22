"""
PBL Backend API - Local Development Server
FastAPI application for Perspective-Based Learning platform
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI(title="PBL API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
courses_db = {}
documents_db = {}
concept_maps_db = {}

# Models
class Course(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    created_at: str
    updated_at: str
    document_count: int = 0

class CourseCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class Document(BaseModel):
    id: str
    course_id: str
    filename: str
    status: str
    uploaded_at: str
    processed_at: Optional[str] = None

class ConceptMap(BaseModel):
    id: str
    course_id: Optional[str] = None
    document_id: Optional[str] = None
    concepts: List[dict]
    relationships: List[dict]

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Courses endpoints
@app.get("/courses", response_model=List[Course])
async def get_courses():
    """Get all courses"""
    return list(courses_db.values())

@app.post("/courses", response_model=Course)
async def create_course(course: CourseCreate):
    """Create a new course"""
    course_id = f"course-{len(courses_db) + 1}"
    now = datetime.now().isoformat()
    
    new_course = Course(
        id=course_id,
        name=course.name,
        description=course.description or "",
        created_at=now,
        updated_at=now,
        document_count=0
    )
    
    courses_db[course_id] = new_course
    return new_course

@app.get("/courses/{course_id}", response_model=Course)
async def get_course(course_id: str):
    """Get a specific course"""
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    return courses_db[course_id]

@app.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    """Delete a course"""
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Delete associated documents
    docs_to_delete = [doc_id for doc_id, doc in documents_db.items() 
                      if doc.course_id == course_id]
    for doc_id in docs_to_delete:
        del documents_db[doc_id]
    
    del courses_db[course_id]
    return {"message": "Course deleted successfully"}

# Documents endpoints
@app.get("/courses/{course_id}/documents", response_model=List[Document])
async def get_course_documents(course_id: str):
    """Get all documents for a course"""
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    docs = [doc for doc in documents_db.values() if doc.course_id == course_id]
    return docs

@app.post("/upload-document")
async def upload_document(
    course_id: str,
    file: UploadFile = File(...)
):
    """Upload a document to a course"""
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Create document record
    doc_id = f"doc-{len(documents_db) + 1}"
    task_id = str(uuid.uuid4())
    
    document = Document(
        id=doc_id,
        course_id=course_id,
        filename=file.filename,
        status="processing",
        uploaded_at=datetime.now().isoformat()
    )
    
    documents_db[doc_id] = document
    
    # Update course document count
    courses_db[course_id].document_count += 1
    
    return {
        "task_id": task_id,
        "document_id": doc_id,
        "status": "processing"
    }

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    course_id = doc.course_id
    
    del documents_db[document_id]
    
    # Update course document count
    if course_id in courses_db:
        courses_db[course_id].document_count = max(0, courses_db[course_id].document_count - 1)
    
    return {"message": "Document deleted successfully"}

# Processing status endpoint
@app.get("/status/{task_id}")
async def get_processing_status(task_id: str):
    """Get document processing status"""
    # Simulate processing completion
    return {
        "task_id": task_id,
        "status": "completed",
        "progress": 100,
        "message": "Document processed successfully",
        "estimated_time_remaining": 0
    }

# Concept map endpoints
@app.get("/concept-map/course/{course_id}")
async def get_course_concept_map(course_id: str):
    """Get concept map for a course"""
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Return a sample concept map
    return {
        "id": f"map-{course_id}",
        "course_id": course_id,
        "concepts": [
            {
                "id": "concept-1",
                "name": "Introduction",
                "description": "Overview of the course material",
                "importance": 0.9,
                "x": 100,
                "y": 100
            },
            {
                "id": "concept-2",
                "name": "Core Concepts",
                "description": "Main ideas and principles",
                "importance": 1.0,
                "x": 300,
                "y": 100
            },
            {
                "id": "concept-3",
                "name": "Applications",
                "description": "Practical uses and examples",
                "importance": 0.8,
                "x": 200,
                "y": 250
            }
        ],
        "relationships": [
            {
                "source": "concept-1",
                "target": "concept-2",
                "type": "leads_to",
                "strength": 0.9
            },
            {
                "source": "concept-2",
                "target": "concept-3",
                "type": "applies_to",
                "strength": 0.8
            }
        ]
    }

@app.get("/concept-map/document/{document_id}")
async def get_document_concept_map(document_id: str):
    """Get concept map for a document"""
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Return a sample concept map
    return {
        "id": f"map-{document_id}",
        "document_id": document_id,
        "concepts": [
            {
                "id": "concept-1",
                "name": "Main Topic",
                "description": "Primary subject of the document",
                "importance": 1.0,
                "x": 200,
                "y": 150
            }
        ],
        "relationships": []
    }

# Feedback endpoint
@app.post("/feedback")
async def submit_feedback(feedback: dict):
    """Submit user feedback"""
    return {"message": "Feedback received", "id": str(uuid.uuid4())}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting PBL Backend API on http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
