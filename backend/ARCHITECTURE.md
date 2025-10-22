# Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Browser                             │
│                  http://localhost:5173                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  React Frontend                              │
│                  (Vite Dev Server)                           │
│                                                              │
│  • Portal Selection                                          │
│  • PBL Dashboard                                             │
│  • Sensa Learn                                               │
│  • Course Management                                         │
│  • Document Upload                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls
                         │ http://localhost:8000
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  FastAPI Backend                             │
│                  (This Server!)                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Endpoints                            │  │
│  │                                                       │  │
│  │  GET  /health                                        │  │
│  │  GET  /courses                                       │  │
│  │  POST /courses                                       │  │
│  │  GET  /courses/{id}                                  │  │
│  │  DELETE /courses/{id}                                │  │
│  │  GET  /courses/{id}/documents                        │  │
│  │  POST /upload-document                               │  │
│  │  DELETE /documents/{id}                              │  │
│  │  GET  /status/{task_id}                              │  │
│  │  GET  /concept-map/course/{id}                       │  │
│  │  GET  /concept-map/document/{id}                     │  │
│  │  POST /feedback                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           In-Memory Storage                           │  │
│  │                                                       │  │
│  │  courses_db = {}      # Course data                  │  │
│  │  documents_db = {}    # Document metadata            │  │
│  │  concept_maps_db = {} # Concept map data             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow Example

### Creating a Course

```
1. User clicks "Create Course" in UI
   │
   ▼
2. Frontend sends POST request
   POST http://localhost:8000/courses
   Body: {"name": "My Course", "description": "..."}
   │
   ▼
3. Backend receives request
   • Validates data with Pydantic
   • Generates unique course ID
   • Stores in courses_db
   │
   ▼
4. Backend returns response
   Status: 201 Created
   Body: {"id": "course-1", "name": "My Course", ...}
   │
   ▼
5. Frontend updates UI
   • Shows new course in list
   • Displays success toast
```

### Uploading a Document

```
1. User selects PDF file
   │
   ▼
2. Frontend sends multipart/form-data
   POST http://localhost:8000/upload-document
   Form: {course_id: "course-1", file: <PDF>}
   │
   ▼
3. Backend processes upload
   • Validates course exists
   • Creates document record
   • Generates task ID
   • Updates course document count
   │
   ▼
4. Backend returns task info
   Body: {"task_id": "...", "document_id": "doc-1", "status": "processing"}
   │
   ▼
5. Frontend polls status
   GET http://localhost:8000/status/{task_id}
   │
   ▼
6. Backend returns completion
   Body: {"status": "completed", "progress": 100}
```

## Data Models

### Course
```python
{
    "id": "course-1",
    "name": "Introduction to Python",
    "description": "Learn Python basics",
    "created_at": "2025-10-22T12:00:00",
    "updated_at": "2025-10-22T12:00:00",
    "document_count": 3
}
```

### Document
```python
{
    "id": "doc-1",
    "course_id": "course-1",
    "filename": "chapter1.pdf",
    "status": "completed",
    "uploaded_at": "2025-10-22T12:00:00",
    "processed_at": "2025-10-22T12:05:00"
}
```

### Concept Map
```python
{
    "id": "map-course-1",
    "course_id": "course-1",
    "concepts": [
        {
            "id": "concept-1",
            "name": "Variables",
            "description": "Store data in memory",
            "importance": 0.9,
            "x": 100,
            "y": 100
        }
    ],
    "relationships": [
        {
            "source": "concept-1",
            "target": "concept-2",
            "type": "leads_to",
            "strength": 0.8
        }
    ]
}
```

## CORS Configuration

The backend allows requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (Alternative)

All HTTP methods and headers are allowed for development.

## Storage Strategy

### Current (Development)
- **Type**: In-memory dictionaries
- **Persistence**: None (resets on restart)
- **Performance**: Very fast
- **Use Case**: Development, testing, demos

### Future (Production)
- **Database**: PostgreSQL for persistent storage
- **Cache**: Redis for session data
- **Files**: S3 for PDF storage
- **Queue**: SQS for background processing
- **AI**: AWS Bedrock for concept extraction

## Error Handling

```python
try:
    # Process request
    return success_response
except HTTPException:
    # Known errors (404, 400, etc.)
    raise
except Exception as e:
    # Unexpected errors
    return {"error": "Internal server error"}
```

## API Documentation

FastAPI automatically generates:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## Development vs Production

| Feature | Development (Current) | Production (Future) |
|---------|----------------------|---------------------|
| Storage | In-memory | PostgreSQL + S3 |
| Auth | None | JWT tokens |
| CORS | Localhost only | Specific domains |
| Logging | Console | CloudWatch |
| Monitoring | None | Prometheus/Grafana |
| Deployment | Local | AWS ECS Fargate |
| Scaling | Single instance | Auto-scaling |
| Cost | Free | ~$100-150/month |

## Next Steps

To evolve this backend:

1. **Add Database**
   ```python
   from sqlalchemy import create_engine
   engine = create_engine("postgresql://...")
   ```

2. **Add Authentication**
   ```python
   from fastapi.security import HTTPBearer
   security = HTTPBearer()
   ```

3. **Add File Storage**
   ```python
   import boto3
   s3 = boto3.client('s3')
   ```

4. **Add AI Processing**
   ```python
   import anthropic
   client = anthropic.Anthropic()
   ```

5. **Add Background Tasks**
   ```python
   from celery import Celery
   app = Celery('tasks')
   ```

See `BACKEND-DEPLOYMENT-GUIDE.md` for AWS deployment instructions.
