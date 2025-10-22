# PBL Backend - Local Development Server

A simple FastAPI backend for local development of the PBL (Perspective-Based Learning) platform.

## Features

- ✅ Course management (CRUD operations)
- ✅ Document upload and management
- ✅ Concept map generation (mock data)
- ✅ Processing status tracking
- ✅ CORS enabled for frontend
- ✅ In-memory storage (no database required)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or using a virtual environment (recommended):

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Start the Server

```bash
python main.py
```

The server will start on `http://localhost:8000`

### 3. Test the API

Open your browser and visit:
- **API Docs**: http://localhost:8000/docs (Interactive Swagger UI)
- **Health Check**: http://localhost:8000/health

### 4. Update Frontend Configuration

Make sure your frontend `.env.local` has:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_MOCK_API=false
```

Then restart your frontend dev server.

## API Endpoints

### Health
- `GET /health` - Health check

### Courses
- `GET /courses` - List all courses
- `POST /courses` - Create a new course
- `GET /courses/{id}` - Get course details
- `DELETE /courses/{id}` - Delete a course

### Documents
- `GET /courses/{id}/documents` - List course documents
- `POST /upload-document` - Upload a document
- `DELETE /documents/{id}` - Delete a document

### Processing
- `GET /status/{task_id}` - Get processing status

### Concept Maps
- `GET /concept-map/course/{id}` - Get course concept map
- `GET /concept-map/document/{id}` - Get document concept map

### Feedback
- `POST /feedback` - Submit feedback

## Development Notes

### In-Memory Storage
This backend uses in-memory dictionaries for storage. Data will be lost when the server restarts. This is perfect for:
- Frontend development
- Testing
- Demos

For production, you'd want to:
- Add PostgreSQL database
- Add Redis for caching
- Add S3 for file storage
- Add proper authentication

### CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (Alternative port)

Add more origins in `main.py` if needed.

### Sample Data
The backend starts with empty data. Create courses and upload documents through the frontend UI.

## Troubleshooting

### Port Already in Use
If port 8000 is already in use, you can change it in `main.py`:

```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Change to 8001
```

Then update your frontend `.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:8001
```

### Module Not Found
Make sure you've installed the requirements:
```bash
pip install -r requirements.txt
```

### CORS Errors
If you're still seeing CORS errors, check that:
1. The backend is running
2. Your frontend URL is in the `allow_origins` list
3. You've restarted both servers after config changes

## Next Steps

Once this is working, you can:
1. Add database integration (PostgreSQL)
2. Add real document processing (PDF parsing)
3. Add AI integration (AWS Bedrock)
4. Add authentication (JWT tokens)
5. Deploy to AWS ECS

See `BACKEND-DEPLOYMENT-GUIDE.md` in the root directory for AWS deployment instructions.
