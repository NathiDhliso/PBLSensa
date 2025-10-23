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

# Profile storage
profile_db = {
    "user-123": {
        "userId": "user-123",
        "email": "user@example.com",
        "name": "User user-123",
        "ageRange": None,
        "location": None,
        "interests": [],
        "learningStyle": None,
        "background": None,
        "educationLevel": None,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
}

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
    try:
        # Try to get course_id from both form data and JSON
        course_id = request.form.get('course_id') or request.form.get('courseId')
        
        # If not in form, try JSON body
        if not course_id and request.is_json:
            data = request.get_json()
            course_id = data.get('course_id') or data.get('courseId')
        
        print(f"[DEBUG] Received course_id: {course_id}")
        print(f"[DEBUG] Form data: {dict(request.form)}")
        print(f"[DEBUG] Files: {list(request.files.keys())}")
        print(f"[DEBUG] Content-Type: {request.content_type}")
        
        if not course_id:
            return jsonify({
                "detail": "course_id is required",
                "message": "course_id is required"
            }), 422
            
        if course_id not in courses_db:
            return jsonify({
                "detail": f"Course {course_id} not found",
                "message": f"Course {course_id} not found"
            }), 404
        
        if 'file' not in request.files:
            return jsonify({
                "detail": "No file provided",
                "message": "No file provided"
            }), 422
        
        file = request.files['file']
        
        if not file.filename:
            return jsonify({
                "detail": "No file selected",
                "message": "No file selected"
            }), 422
        
        if not file.filename.endswith('.pdf'):
            return jsonify({
                "detail": "Only PDF files are supported",
                "message": "Only PDF files are supported"
            }), 422
        
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
    except Exception as e:
        print(f"[ERROR] Upload failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "detail": f"Upload failed: {str(e)}",
            "message": f"Upload failed: {str(e)}"
        }), 500

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
    user_id = request.args.get('user_id', 'user-123')
    
    # Get profile from storage or create default
    if user_id not in profile_db:
        profile_db[user_id] = {
            "userId": user_id,
            "email": f"user{user_id}@example.com",
            "name": f"User {user_id}",
            "ageRange": None,
            "location": None,
            "interests": [],
            "learningStyle": None,
            "background": None,
            "educationLevel": None,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
    
    return jsonify(profile_db[user_id])

@app.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    user_id = request.args.get('user_id', 'user-123')
    data = request.get_json()
    
    # Debug logging
    print(f"[PROFILE UPDATE] User ID: {user_id}")
    print(f"[PROFILE UPDATE] Received data: {data}")
    
    # Get existing profile or create new one
    if user_id not in profile_db:
        profile_db[user_id] = {
            "userId": user_id,
            "email": f"user{user_id}@example.com",
            "name": f"User {user_id}",
            "createdAt": datetime.now().isoformat()
        }
    
    # Update profile fields - handle both present and empty values
    profile = profile_db[user_id]
    if 'name' in data:
        profile['name'] = data['name']
    if 'ageRange' in data:
        profile['ageRange'] = data['ageRange'] if data['ageRange'] else None
    if 'location' in data:
        profile['location'] = data['location'] if data['location'] else None
    if 'interests' in data:
        profile['interests'] = data['interests']
    if 'learningStyle' in data:
        profile['learningStyle'] = data['learningStyle'] if data['learningStyle'] else None
    if 'background' in data:
        profile['background'] = data['background'] if data['background'] else None
    if 'educationLevel' in data:
        profile['educationLevel'] = data['educationLevel'] if data['educationLevel'] else None
    
    profile['updatedAt'] = datetime.now().isoformat()
    
    print(f"[PROFILE UPDATE] Updated profile: {profile}")
    
    return jsonify(profile)

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
