"""
PBL Backend API - Flask Version (No Compilation Required!)
Simple REST API for Perspective-Based Learning platform
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)

# CORS configuration
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# In-memory storage with sample data
courses_db = {
    "course-1": {
        "id": "course-1",
        "name": "Introduction to Python",
        "description": "Learn Python programming basics",
        "created_at": "2025-10-22T10:00:00",
        "updated_at": "2025-10-22T10:00:00",
        "document_count": 0
    },
    "course-2": {
        "id": "course-2",
        "name": "Web Development",
        "description": "Build modern web applications",
        "created_at": "2025-10-22T10:00:00",
        "updated_at": "2025-10-22T10:00:00",
        "document_count": 0
    },
    "course-3": {
        "id": "course-3",
        "name": "Data Science",
        "description": "Analyze data with Python",
        "created_at": "2025-10-22T10:00:00",
        "updated_at": "2025-10-22T10:00:00",
        "document_count": 0
    }
}
documents_db = {}

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

# Courses endpoints
@app.route('/courses', methods=['GET'])
def get_courses():
    """Get all courses"""
    return jsonify(list(courses_db.values()))

@app.route('/courses', methods=['POST'])
def create_course():
    """Create a new course"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({"error": "Name is required"}), 400
    
    course_id = f"course-{len(courses_db) + 1}"
    now = datetime.now().isoformat()
    
    course = {
        "id": course_id,
        "name": data['name'],
        "description": data.get('description', ''),
        "created_at": now,
        "updated_at": now,
        "document_count": 0
    }
    
    courses_db[course_id] = course
    return jsonify(course), 201

@app.route('/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    """Get a specific course"""
    if course_id not in courses_db:
        return jsonify({"error": "Course not found"}), 404
    return jsonify(courses_db[course_id])

@app.route('/courses/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Delete a course"""
    if course_id not in courses_db:
        return jsonify({"error": "Course not found"}), 404
    
    # Delete associated documents
    docs_to_delete = [doc_id for doc_id, doc in documents_db.items() 
                      if doc['course_id'] == course_id]
    for doc_id in docs_to_delete:
        del documents_db[doc_id]
    
    del courses_db[course_id]
    return jsonify({"message": "Course deleted successfully"})

# Documents endpoints
@app.route('/courses/<course_id>/documents', methods=['GET'])
def get_course_documents(course_id):
    """Get all documents for a course"""
    if course_id not in courses_db:
        return jsonify({"error": "Course not found"}), 404
    
    docs = [doc for doc in documents_db.values() if doc['course_id'] == course_id]
    return jsonify(docs)

@app.route('/upload-document', methods=['POST'])
def upload_document():
    """Upload a document to a course"""
    # Try to get course_id from both form data and JSON
    course_id = request.form.get('course_id') or request.form.get('courseId')
    
    # If not in form, try JSON body
    if not course_id and request.is_json:
        data = request.get_json()
        course_id = data.get('course_id') or data.get('courseId')
    
    print(f"[DEBUG] Received course_id: {course_id}")
    print(f"[DEBUG] Form data: {dict(request.form)}")
    print(f"[DEBUG] Files: {list(request.files.keys())}")
    
    if not course_id:
        return jsonify({"error": "course_id is required"}), 400
        
    if course_id not in courses_db:
        return jsonify({"error": f"Course {course_id} not found"}), 404
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400
    
    # Create document record
    doc_id = f"doc-{len(documents_db) + 1}"
    task_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    document = {
        "id": doc_id,
        "course_id": course_id,
        "filename": file.filename,
        "status": "completed",  # Changed from "processing" to "completed"
        "uploaded_at": now,
        "processed_at": now  # Set processed time immediately
    }
    
    documents_db[doc_id] = document
    
    # Update course document count
    courses_db[course_id]['document_count'] += 1
    
    return jsonify({
        "task_id": task_id,
        "document_id": doc_id,
        "status": "completed"  # Return completed status immediately
    })

@app.route('/documents/<document_id>', methods=['DELETE'])
def delete_document(document_id):
    """Delete a document"""
    if document_id not in documents_db:
        return jsonify({"error": "Document not found"}), 404
    
    doc = documents_db[document_id]
    course_id = doc['course_id']
    
    del documents_db[document_id]
    
    # Update course document count
    if course_id in courses_db:
        courses_db[course_id]['document_count'] = max(0, courses_db[course_id]['document_count'] - 1)
    
    return jsonify({"message": "Document deleted successfully"})

# Processing status endpoint
@app.route('/status/<task_id>', methods=['GET'])
def get_processing_status(task_id):
    """Get document processing status"""
    return jsonify({
        "task_id": task_id,
        "status": "completed",
        "progress": 100,
        "message": "Document processed successfully",
        "estimated_time_remaining": 0
    })

# Concept map endpoints
@app.route('/concept-map/course/<course_id>', methods=['GET'])
def get_course_concept_map(course_id):
    """Get concept map for a course"""
    if course_id not in courses_db:
        return jsonify({"error": "Course not found"}), 404
    
    # Return data in the format the frontend expects
    return jsonify({
        "id": f"map-{course_id}",
        "course_id": course_id,
        "chapters": [
            {
                "chapter_number": 1,
                "title": "Introduction",
                "keywords": [
                    {
                        "term": "Basics",
                        "definition": "Fundamental concepts and principles",
                        "is_primary": True,
                        "exam_relevant": True
                    },
                    {
                        "term": "Overview",
                        "definition": "General introduction to the topic",
                        "is_primary": False,
                        "exam_relevant": True
                    }
                ],
                "relationships": [
                    {
                        "source": "Basics",
                        "target": "Overview",
                        "type": "prerequisite",
                        "strength": 0.9
                    }
                ]
            },
            {
                "chapter_number": 2,
                "title": "Core Concepts",
                "keywords": [
                    {
                        "term": "Theory",
                        "definition": "Theoretical foundations",
                        "is_primary": True,
                        "exam_relevant": True
                    },
                    {
                        "term": "Practice",
                        "definition": "Practical applications",
                        "is_primary": True,
                        "exam_relevant": True
                    }
                ],
                "relationships": [
                    {
                        "source": "Theory",
                        "target": "Practice",
                        "type": "applies_to",
                        "strength": 0.8
                    }
                ]
            },
            {
                "chapter_number": 3,
                "title": "Advanced Topics",
                "keywords": [
                    {
                        "term": "Applications",
                        "definition": "Real-world use cases",
                        "is_primary": True,
                        "exam_relevant": False
                    }
                ],
                "relationships": []
            }
        ],
        "global_relationships": [
            {
                "source": "Overview",
                "target": "Theory",
                "type": "leads_to",
                "strength": 0.9
            },
            {
                "source": "Practice",
                "target": "Applications",
                "type": "enables",
                "strength": 0.7
            }
        ]
    })

@app.route('/concept-map/document/<document_id>', methods=['GET'])
def get_document_concept_map(document_id):
    """Get concept map for a document"""
    if document_id not in documents_db:
        return jsonify({"error": "Document not found"}), 404
    
    doc = documents_db[document_id]
    
    return jsonify({
        "id": f"map-{document_id}",
        "document_id": document_id,
        "chapters": [
            {
                "chapter_number": 1,
                "title": f"Content from {doc['filename']}",
                "keywords": [
                    {
                        "term": "Main Topic",
                        "definition": "Primary subject of the document",
                        "is_primary": True,
                        "exam_relevant": True
                    },
                    {
                        "term": "Key Concept",
                        "definition": "Important idea from the document",
                        "is_primary": True,
                        "exam_relevant": True
                    }
                ],
                "relationships": [
                    {
                        "source": "Main Topic",
                        "target": "Key Concept",
                        "type": "contains",
                        "strength": 0.9
                    }
                ]
            }
        ],
        "global_relationships": []
    })

# Profile endpoints
@app.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    # Return a default profile
    return jsonify({
        "id": "user-1",
        "email": "user@example.com",
        "name": "User",
        "ageRange": "25-34",
        "location": "United States",
        "interests": ["Technology", "Science", "Learning"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    })

@app.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    data = request.get_json()
    
    # Return the updated profile
    return jsonify({
        "id": "user-1",
        "email": data.get('email', 'user@example.com'),
        "name": data.get('name', 'User'),
        "ageRange": data.get('ageRange'),
        "location": data.get('location'),
        "interests": data.get('interests', []),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    })

# Feedback endpoint
@app.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit user feedback"""
    return jsonify({
        "message": "Feedback received",
        "id": str(uuid.uuid4())
    })

if __name__ == '__main__':
    print("🚀 Starting PBL Backend API (Flask) on http://localhost:8000")
    print("📚 Backend is ready!")
    print("💡 Press Ctrl+C to stop")
    print()
    
    # Increase max upload size to 100MB
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB
    
    app.run(host='0.0.0.0', port=8000, debug=True)
