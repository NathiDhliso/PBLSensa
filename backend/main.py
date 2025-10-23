"""
PBL Backend API - Local Development Server
FastAPI application for Perspective-Based Learning platform
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import asyncio

# Import services
from services.analogy_generator import MockAnalogyGenerator
from services.content_analyzer import ChapterContentAnalyzer
from services.cache_manager import CacheManager
from services.rate_limiter import RateLimiter
from services.cost_tracker import CostTracker

app = FastAPI(title="PBL API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5175",  # Vite alternate port
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
courses_db = {}
documents_db = {}
concept_maps_db = {}
users_db = {}  # User profiles storage
analogies_db = {}  # Analogies storage
complexity_db = {}  # Chapter complexity storage
feedback_db = {}  # Analogy feedback storage

# Initialize services
analogy_generator = MockAnalogyGenerator()
content_analyzer = ChapterContentAnalyzer()
cache_manager = CacheManager(cache_duration_days=30)
rate_limiter = RateLimiter(daily_limit=10)
cost_tracker = CostTracker(daily_threshold_usd=50.0)

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

# Profile Models
class UserProfile(BaseModel):
    user_id: str = Field(..., alias='userId')
    email: str
    name: str
    age_range: Optional[str] = Field(None, alias='ageRange')
    location: Optional[str] = None
    interests: List[str] = []
    learning_style: Optional[str] = Field(None, alias='learningStyle')
    background: Optional[str] = None
    education_level: Optional[str] = Field(None, alias='educationLevel')
    created_at: str = Field(..., alias='createdAt')
    updated_at: str = Field(..., alias='updatedAt')
    
    class Config:
        populate_by_name = True  # Allow both snake_case and camelCase

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    age_range: Optional[str] = Field(None, alias='ageRange')
    location: Optional[str] = None
    interests: Optional[List[str]] = None
    learning_style: Optional[str] = Field(None, alias='learningStyle')
    background: Optional[str] = None
    education_level: Optional[str] = Field(None, alias='educationLevel')
    
    class Config:
        populate_by_name = True  # Allow both snake_case and camelCase

# Analogy Models
class AnalogyResponse(BaseModel):
    id: str
    concept: str
    analogy_text: str
    based_on_interest: str
    learning_style_adaptation: str
    average_rating: Optional[float] = None
    rating_count: int = 0

class MemoryTechniqueResponse(BaseModel):
    id: str
    technique_type: str
    technique_text: str
    application: str

class LearningMantraResponse(BaseModel):
    id: str
    mantra_text: str
    explanation: str

class ComplexityInfo(BaseModel):
    score: float
    level: str  # beginner, intermediate, advanced
    concept_count: int
    estimated_study_time: int  # minutes

class AnalogyGenerationResponse(BaseModel):
    analogies: List[AnalogyResponse]
    memory_techniques: List[MemoryTechniqueResponse]
    learning_mantras: List[LearningMantraResponse]
    complexity: ComplexityInfo
    cached: bool
    generated_at: str

class FeedbackRequest(BaseModel):
    user_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    feedback_id: str
    message: str

class FeedbackSummary(BaseModel):
    analogy_id: str
    average_rating: float
    rating_count: int
    rating_distribution: Dict[int, int]

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

# Profile endpoints
@app.get("/api/users/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """Get user profile"""
    if user_id not in users_db:
        # Create default profile if doesn't exist
        now = datetime.now().isoformat()
        default_profile = UserProfile(
            user_id=user_id,
            email=f"user{user_id}@example.com",
            name=f"User {user_id}",
            interests=[],
            created_at=now,
            updated_at=now
        )
        users_db[user_id] = default_profile
        return default_profile
    
    return users_db[user_id]

def _update_profile_logic(user_id: str, updates: UpdateProfileRequest) -> UserProfile:
    """Shared logic for updating user profile"""
    # Get or create profile
    if user_id not in users_db:
        now = datetime.now().isoformat()
        profile = UserProfile(
            user_id=user_id,
            email=f"user{user_id}@example.com",
            name=f"User {user_id}",
            interests=[],
            created_at=now,
            updated_at=now
        )
        users_db[user_id] = profile
    else:
        profile = users_db[user_id]
    
    # Validate learning_style if provided
    if updates.learning_style is not None:
        valid_styles = ['visual', 'auditory', 'kinesthetic', 'reading-writing']
        if updates.learning_style not in valid_styles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid learning_style. Must be one of: {', '.join(valid_styles)}"
            )
    
    # Validate education_level if provided
    if updates.education_level is not None:
        valid_levels = ['high_school', 'undergraduate', 'graduate', 'professional']
        if updates.education_level not in valid_levels:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid education_level. Must be one of: {', '.join(valid_levels)}"
            )
    
    # Validate interests array length
    if updates.interests is not None and len(updates.interests) > 20:
        raise HTTPException(
            status_code=400,
            detail="Maximum 20 interests allowed"
        )
    
    # Update fields
    update_data = updates.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    profile.updated_at = datetime.now().isoformat()
    users_db[user_id] = profile
    
    return profile

@app.patch("/api/users/{user_id}/profile", response_model=UserProfile)
async def update_user_profile(user_id: str, updates: UpdateProfileRequest):
    """Update user profile (path parameter version)"""
    return _update_profile_logic(user_id, updates)

@app.get("/profile", response_model=UserProfile)
async def get_profile(user_id: str = Query("user-123", description="User ID")):
    """Get user profile (query parameter version for /profile endpoint)"""
    if user_id not in users_db:
        # Create default profile if doesn't exist
        now = datetime.now().isoformat()
        default_profile = UserProfile(
            user_id=user_id,
            email=f"user{user_id}@example.com",
            name=f"User {user_id}",
            interests=[],
            created_at=now,
            updated_at=now
        )
        users_db[user_id] = default_profile
        return default_profile
    
    return users_db[user_id]

@app.put("/profile", response_model=UserProfile)
async def update_profile_alt(
    updates: UpdateProfileRequest,
    user_id: str = Query("user-123", description="User ID")
):
    """Update user profile (query parameter version for /profile endpoint)"""
    return _update_profile_logic(user_id, updates)

# Analogy Generation Endpoints
@app.post("/api/chapters/{chapter_id}/generate-analogies", response_model=AnalogyGenerationResponse)
@app.post("/sensa-learn/chapter/{chapter_id}/analogies", response_model=AnalogyGenerationResponse)
async def generate_chapter_analogies(
    chapter_id: str,
    user_id: str = Query(..., description="User ID requesting analogies"),
    force_regenerate: bool = Query(False, description="Force regeneration even if cached")
):
    """
    Generate or retrieve personalized analogies for a chapter
    
    This endpoint generates AI-powered analogies, memory techniques, and learning mantras
    tailored to the user's interests and learning style.
    
    Endpoints:
    - POST /api/chapters/{chapter_id}/generate-analogies
    - POST /sensa-learn/chapter/{chapter_id}/analogies (alias)
    """
    # Check rate limit
    rate_limit_info = rate_limiter.check_user_limit(user_id)
    if rate_limit_info.is_limited and not force_regenerate:
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Daily generation limit ({rate_limit_info.limit}) exceeded",
                "reset_at": rate_limit_info.reset_at.isoformat(),
                "remaining": rate_limit_info.remaining
            }
        )
    
    # Get user profile
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    user_profile = users_db[user_id]
    
    # Generate cache key
    cache_key = cache_manager.generate_cache_key(chapter_id, user_profile.dict())
    
    # Check cache unless force_regenerate
    if not force_regenerate:
        cached_data = cache_manager.get_cached_analogies(cache_key)
        if cached_data:
            return AnalogyGenerationResponse(**cached_data, cached=True)
    
    # Mock chapter content (in production, query from database)
    chapter_content = {
        'chapter_id': chapter_id,
        'chapter_title': f'Chapter {chapter_id}',
        'text_content': 'Sample chapter content about key concepts...',
        'key_concepts': ['concept1', 'concept2', 'concept3'],
        'complexity_score': 0.6,
        'word_count': 1500,
        'estimated_reading_time': 8
    }
    
    # Generate analogies
    try:
        result = await analogy_generator.generate_analogies(
            chapter_content=chapter_content,
            user_profile=user_profile.dict(),
            num_analogies=3
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate analogies: {str(e)}")
    
    # Increment rate limit counter
    rate_limiter.increment_user_count(user_id)
    
    # Track costs (mock generator returns 0 cost)
    if result.generation_cost_usd > 0:
        cost_tracker.log_bedrock_call(
            model_id="mock",
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            user_id=user_id,
            chapter_id=chapter_id
        )
    
    # Convert to response format
    analogies_response = []
    for i, analogy in enumerate(result.analogies):
        analogy_id = f"analogy-{chapter_id}-{i}"
        analogies_response.append(AnalogyResponse(
            id=analogy_id,
            concept=analogy.concept,
            analogy_text=analogy.analogy_text,
            based_on_interest=analogy.based_on_interest,
            learning_style_adaptation=analogy.learning_style_adaptation,
            average_rating=None,
            rating_count=0
        ))
        # Store in database
        analogies_db[analogy_id] = {
            'chapter_id': chapter_id,
            'user_id': user_id,
            **analogy.__dict__
        }
    
    memory_techniques_response = []
    for i, mt in enumerate(result.memory_techniques):
        mt_id = f"mt-{chapter_id}-{i}"
        memory_techniques_response.append(MemoryTechniqueResponse(
            id=mt_id,
            technique_type=mt.technique_type,
            technique_text=mt.technique_text,
            application=mt.application
        ))
    
    learning_mantras_response = []
    for i, lm in enumerate(result.learning_mantras):
        lm_id = f"lm-{chapter_id}-{i}"
        learning_mantras_response.append(LearningMantraResponse(
            id=lm_id,
            mantra_text=lm.mantra_text,
            explanation=lm.explanation
        ))
    
    complexity_info = ComplexityInfo(
        score=chapter_content['complexity_score'],
        level=content_analyzer.get_complexity_level(chapter_content['complexity_score']),
        concept_count=len(chapter_content['key_concepts']),
        estimated_study_time=chapter_content['estimated_reading_time']
    )
    
    response_data = {
        'analogies': [a.dict() for a in analogies_response],
        'memory_techniques': [mt.dict() for mt in memory_techniques_response],
        'learning_mantras': [lm.dict() for lm in learning_mantras_response],
        'complexity': complexity_info.dict(),
        'cached': False,
        'generated_at': datetime.now().isoformat()
    }
    
    # Cache the result
    cache_manager.store_analogies(
        cache_key=cache_key,
        data=response_data,
        metadata={
            'model_version': 'mock-v1',
            'prompt_tokens': result.prompt_tokens,
            'completion_tokens': result.completion_tokens,
            'cost_usd': result.generation_cost_usd
        }
    )
    
    return AnalogyGenerationResponse(**response_data)


@app.get("/api/chapters/{chapter_id}/analogies", response_model=AnalogyGenerationResponse)
@app.get("/sensa-learn/chapter/{chapter_id}/analogies", response_model=AnalogyGenerationResponse)
async def get_chapter_analogies(
    chapter_id: str,
    user_id: str = Query(..., description="User ID")
):
    """
    Get cached analogies for a chapter
    
    Endpoints:
    - GET /api/chapters/{chapter_id}/analogies
    - GET /sensa-learn/chapter/{chapter_id}/analogies (alias)
    """
    # Get user profile
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    user_profile = users_db[user_id]
    
    # Generate cache key
    cache_key = cache_manager.generate_cache_key(chapter_id, user_profile.dict())
    
    # Get from cache
    cached_data = cache_manager.get_cached_analogies(cache_key)
    if not cached_data:
        raise HTTPException(
            status_code=404,
            detail="No analogies found. Generate them first using POST /api/chapters/{chapter_id}/generate-analogies"
        )
    
    return AnalogyGenerationResponse(**cached_data, cached=True)


@app.get("/api/chapters/{chapter_id}/complexity", response_model=ComplexityInfo)
@app.get("/sensa-learn/chapter/{chapter_id}/summary", response_model=ComplexityInfo)
async def get_chapter_complexity(chapter_id: str):
    """
    Get complexity score and breakdown for a chapter
    
    Endpoints:
    - GET /api/chapters/{chapter_id}/complexity
    - GET /sensa-learn/chapter/{chapter_id}/summary (alias for concept summarization)
    """
    # Check if we have cached complexity
    if chapter_id in complexity_db:
        return ComplexityInfo(**complexity_db[chapter_id])
    
    # Mock complexity calculation (in production, query from database)
    complexity_score = 0.6
    concept_count = 5
    estimated_time = 8
    
    complexity_info = ComplexityInfo(
        score=complexity_score,
        level=content_analyzer.get_complexity_level(complexity_score),
        concept_count=concept_count,
        estimated_study_time=estimated_time
    )
    
    # Cache it
    complexity_db[chapter_id] = complexity_info.dict()
    
    return complexity_info


class FeedbackRequestWithAnalogyId(BaseModel):
    """Feedback request with analogy_id for /feedback/analogy endpoint"""
    analogy_id: str
    user_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

def _submit_feedback_logic(analogy_id: str, feedback: FeedbackRequest) -> FeedbackResponse:
    """Shared logic for submitting feedback"""
    # Validate analogy exists
    if analogy_id not in analogies_db:
        raise HTTPException(status_code=404, detail="Analogy not found")
    
    # Store feedback
    feedback_id = str(uuid.uuid4())
    feedback_key = f"{analogy_id}:{feedback.user_id}"
    
    feedback_db[feedback_key] = {
        'id': feedback_id,
        'analogy_id': analogy_id,
        'user_id': feedback.user_id,
        'rating': feedback.rating,
        'comment': feedback.comment,
        'created_at': datetime.now().isoformat()
    }
    
    return FeedbackResponse(
        feedback_id=feedback_id,
        message="Feedback submitted successfully"
    )

@app.post("/api/analogies/{analogy_id}/feedback", response_model=FeedbackResponse)
async def submit_analogy_feedback(analogy_id: str, feedback: FeedbackRequest):
    """Submit feedback on an analogy (path parameter version)"""
    return _submit_feedback_logic(analogy_id, feedback)

@app.post("/feedback/analogy", response_model=FeedbackResponse)
async def submit_feedback_alt(feedback: FeedbackRequestWithAnalogyId):
    """Submit feedback on an analogy (body parameter version for /feedback/analogy endpoint)"""
    feedback_request = FeedbackRequest(
        user_id=feedback.user_id,
        rating=feedback.rating,
        comment=feedback.comment
    )
    return _submit_feedback_logic(feedback.analogy_id, feedback_request)


@app.get("/api/analogies/{analogy_id}/feedback", response_model=FeedbackSummary)
async def get_analogy_feedback(analogy_id: str):
    """Get aggregated feedback for an analogy"""
    # Get all feedback for this analogy
    analogy_feedback = [
        fb for key, fb in feedback_db.items()
        if fb['analogy_id'] == analogy_id
    ]
    
    if not analogy_feedback:
        return FeedbackSummary(
            analogy_id=analogy_id,
            average_rating=0.0,
            rating_count=0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        )
    
    # Calculate statistics
    ratings = [fb['rating'] for fb in analogy_feedback]
    average_rating = sum(ratings) / len(ratings)
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating in ratings:
        rating_distribution[rating] += 1
    
    return FeedbackSummary(
        analogy_id=analogy_id,
        average_rating=average_rating,
        rating_count=len(ratings),
        rating_distribution=rating_distribution
    )


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
