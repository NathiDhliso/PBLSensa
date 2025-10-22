# Phase 1 Implementation Guide: PDF Processing

## What We're Building

A working PDF upload → keyword extraction → concept map pipeline that runs locally.

## Prerequisites

```bash
# Python packages needed
pip install PyPDF2 keybert sentence-transformers spacy yake
python -m spacy download en_core_web_sm
```

## Architecture (Simplified)

```
Frontend Upload → Flask API → PDF Validator → Text Extractor → Keyword Extractor → Return JSON
```

## Step 1: Update Flask Backend

### File: `backend/requirements.txt`
Add these dependencies:
```
PyPDF2==3.0.1
keybert==0.8.4
sentence-transformers==2.2.2
spacy==3.7.2
yake==0.4.8
python-multipart==0.0.6
```

### File: `backend/services/pdf_processor.py` (NEW)
```python
import hashlib
import PyPDF2
from pathlib import Path
from typing import Dict, Optional

class PDFProcessor:
    def validate_pdf(self, file_path: str) -> Dict[str, any]:
        """Layer 0: Validate PDF and generate hash"""
        try:
            with open(file_path, 'rb') as f:
                # Generate SHA256 hash
                file_hash = hashlib.sha256(f.read()).hexdigest()
                f.seek(0)
                
                # Check if PDF is valid
                reader = PyPDF2.PdfReader(f)
                
                # Check for password protection
                if reader.is_encrypted:
                    return {
                        'valid': False,
                        'error': 'PDF is password protected'
                    }
                
                # Get basic metadata
                num_pages = len(reader.pages)
                
                return {
                    'valid': True,
                    'hash': file_hash,
                    'num_pages': num_pages,
                    'metadata': reader.metadata
                }
        except Exception as e:
            return {
                'valid': False,
                'error': str(e)
            }
    
    def extract_text(self, file_path: str) -> Dict[str, any]:
        """Layer 2: Extract text from PDF"""
        try:
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                
                # Extract text from all pages
                text_by_page = []
                full_text = []
                
                for i, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    text_by_page.append({
                        'page': i + 1,
                        'text': page_text
                    })
                    full_text.append(page_text)
                
                return {
                    'success': True,
                    'full_text': '\n\n'.join(full_text),
                    'pages': text_by_page,
                    'total_pages': len(reader.pages)
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
```

### File: `backend/services/keyword_extractor.py` (NEW)
```python
from keybert import KeyBERT
import yake
import spacy
from typing import List, Dict

class KeywordExtractor:
    def __init__(self):
        self.keybert_model = KeyBERT()
        self.nlp = spacy.load('en_core_web_sm')
        
    def extract_keywords(self, text: str, top_n: int = 20) -> List[Dict]:
        """Layer 4: Multi-method keyword extraction"""
        
        # Method 1: KeyBERT
        keybert_keywords = self.keybert_model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words='english',
            top_n=top_n
        )
        
        # Method 2: YAKE
        yake_extractor = yake.KeywordExtractor(
            lan="en",
            n=2,
            dedupLim=0.9,
            top=top_n
        )
        yake_keywords = yake_extractor.extract_keywords(text)
        
        # Method 3: spaCy TextRank (simple noun extraction)
        doc = self.nlp(text[:100000])  # Limit for performance
        spacy_keywords = [
            (chunk.text, 0.5) 
            for chunk in doc.noun_chunks 
            if len(chunk.text.split()) <= 2
        ][:top_n]
        
        # Combine and deduplicate
        all_keywords = {}
        
        for keyword, score in keybert_keywords:
            all_keywords[keyword.lower()] = {
                'keyword': keyword,
                'score': score,
                'methods': ['keybert']
            }
        
        for keyword, score in yake_keywords:
            key = keyword.lower()
            if key in all_keywords:
                all_keywords[key]['methods'].append('yake')
                all_keywords[key]['score'] = (all_keywords[key]['score'] + (1 - score)) / 2
            else:
                all_keywords[key] = {
                    'keyword': keyword,
                    'score': 1 - score,  # YAKE uses lower=better
                    'methods': ['yake']
                }
        
        # Sort by score and return top N
        sorted_keywords = sorted(
            all_keywords.values(),
            key=lambda x: x['score'],
            reverse=True
        )[:top_n]
        
        return sorted_keywords
```

### File: `backend/app.py` - Add new endpoint
```python
from flask import Flask, request, jsonify
from services.pdf_processor import PDFProcessor
from services.keyword_extractor import KeywordExtractor
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# Initialize services
pdf_processor = PDFProcessor()
keyword_extractor = KeywordExtractor()

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    """Upload and process a PDF document"""
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported'}), 400
    
    # Save file
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    try:
        # Step 1: Validate PDF
        validation = pdf_processor.validate_pdf(file_path)
        if not validation['valid']:
            return jsonify({'error': validation['error']}), 400
        
        # Step 2: Extract text
        extraction = pdf_processor.extract_text(file_path)
        if not extraction['success']:
            return jsonify({'error': extraction['error']}), 500
        
        # Step 3: Extract keywords
        keywords = keyword_extractor.extract_keywords(
            extraction['full_text'],
            top_n=20
        )
        
        # Return results
        return jsonify({
            'success': True,
            'document_id': validation['hash'],
            'filename': filename,
            'num_pages': validation['num_pages'],
            'keywords': keywords,
            'text_preview': extraction['full_text'][:500]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up file (or keep for caching)
        # os.remove(file_path)
        pass

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## Step 2: Update Frontend

### File: `src/services/api.ts` - Add upload function
```typescript
export const uploadDocument = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  return response.json();
};
```

## Step 3: Test It

```bash
# Terminal 1: Start backend
cd backend
python app.py

# Terminal 2: Start frontend
npm run dev

# Upload a PDF through the UI
```

## Expected Output

```json
{
  "success": true,
  "document_id": "a3f5b2c...",
  "filename": "textbook.pdf",
  "num_pages": 250,
  "keywords": [
    {
      "keyword": "machine learning",
      "score": 0.89,
      "methods": ["keybert", "yake"]
    },
    {
      "keyword": "neural network",
      "score": 0.85,
      "methods": ["keybert"]
    }
  ]
}
```

## Next: Generate Concept Map

Once keywords are working, we'll add:
1. Relationship detection between keywords
2. Graph structure generation
3. Chapter-based organization

Ready to implement this? I can create the actual files or help you test each component.
