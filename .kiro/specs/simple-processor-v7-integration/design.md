# Design Document: Replace Simple PDF Processor with V7 Pipeline

## Overview

This document outlines the technical design for replacing `simple_pdf_processor.py` with the existing V7 pipeline. The design focuses on:

1. **Code Reuse**: Leverage existing V7 implementation (NO new code where possible)
2. **Backward Compatibility**: Maintain existing API contracts
3. **Simplification**: Remove duplicate processing logic
4. **Sensa Theme**: Maintain consistent visual design

### Design Principles

- **CRITICAL: Check for Reusable Code FIRST** - Always look for existing implementations before writing new code
- **Extend, Don't Duplicate**: Use existing V7 services
- **Maintain Contracts**: Keep existing API response formats
- **Update tasks.md ONLY**: No side documentation files during implementation
- **Sensa Color Theme**: Consistent purple/pink gradients throughout

---

## Architecture Overview

```
BEFORE:
┌─────────────────────────────────────────┐
│  Flask Backend (main.py/app.py)         │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  simple_pdf_processor.py           │ │
│  │  - Regex pattern matching          │ │
│  │  - 65-75% confidence               │ │
│  │  - Basic concept extraction        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────┐
│  Flask Backend (main.py/app.py)         │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  V7 Pipeline (EXISTING)            │ │
│  │  - Multi-method parsing            │ │
│  │  - Ensemble extraction             │ │
│  │  - RAG relationships               │ │
│  │  - 70%+ confidence                 │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Component Design

### 1. Integration Wrapper (MINIMAL NEW CODE)

**File**: `backend/simple_pdf_processor.py` (MODIFY, don't delete for backward compat)

**Purpose**: Thin wrapper that calls V7 pipeline and formats results for backward compatibility

**Implementation Strategy**:
```python
"""
Simple PDF Processor - V7 Integration Wrapper
Maintains backward compatibility while using advanced V7 pipeline.
"""

from backend.services.pbl.v7_pipeline import get_v7_pipeline
from typing import List, Dict

# REUSE: Import existing V7 pipeline
v7_pipeline = get_v7_pipeline()


def process_pdf_document(file_content: bytes, document_id: str) -> Dict:
    """
    Process PDF using V7 pipeline (backward compatible wrapper).
    
    REUSE: Calls existing v7_pipeline.process_document_v7()
    TRANSFORM: Converts V7 result to simple processor format
    """
    try:
        # REUSE: Use existing V7 pipeline
        result = await v7_pipeline.process_document_v7(
            document_id=document_id,
            pdf_path=file_content,  # V7 can handle bytes or path
            user_id=None
        )
        
        # TRANSFORM: Convert V7 concepts to simple format
        concepts = [
            {
                "id": concept.id,
                "document_id": document_id,
                "term": concept.term,
                "definition": concept.definition,
                "confidence": concept.confidence,  # V7 field
                "methods_found": concept.methods_found,  # V7 field
                "extraction_methods": concept.extraction_methods,  # V7 field
                "structure_type": concept.structure_type,
                "importance_score": concept.confidence,  # Map to old field
                "validated": False,
                "created_at": concept.created_at
            }
            for concept in result.concepts
        ]
        
        return {
            "success": True,
            "concepts": concepts,
            "concept_count": len(concepts),
            # V7 enhancements (optional for clients)
            "parse_method": result.parse_method,
            "parse_confidence": result.confidence,
            "metrics": result.metrics
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "concepts": []
        }


# DEPRECATED: Keep old functions for backward compat but mark as deprecated
def extract_text_from_pdf(file_content: bytes) -> str:
    """DEPRECATED: Use V7 pipeline instead"""
    import warnings
    warnings.warn("extract_text_from_pdf is deprecated, use V7 pipeline", DeprecationWarning)
    # Minimal implementation for backward compat
    from PyPDF2 import PdfReader
    from io import BytesIO
    pdf_file = BytesIO(file_content)
    reader = PdfReader(pdf_file)
    return "\n".join(page.extract_text() for page in reader.pages)


def extract_concepts_from_text(text: str, document_id: str) -> List[Dict]:
    """DEPRECATED: Use V7 pipeline instead"""
    import warnings
    warnings.warn("extract_concepts_from_text is deprecated, use V7 pipeline", DeprecationWarning)
    return []
```

---

### 2. Flask Backend Integration (MODIFY EXISTING)

**Files to Check**: 
- `backend/main.py` (FastAPI)
- `backend/app.py` (Flask)
- `backend/main_local.py` (Local dev)

**Strategy**: Find where `simple_pdf_processor` is imported and replace with V7 calls

**Implementation**:
```python
# BEFORE:
from backend.simple_pdf_processor import process_pdf_document

# AFTER:
from backend.services.pbl.v7_pipeline import get_v7_pipeline

v7_pipeline = get_v7_pipeline()

# In route handler:
@app.route('/api/documents/upload', methods=['POST'])
async def upload_document():
    file = request.files['file']
    document_id = str(uuid.uuid4())
    
    # REUSE: Call V7 pipeline directly
    result = await v7_pipeline.process_document_v7(
        document_id=document_id,
        pdf_path=file,
        user_id=current_user.id
    )
    
    # Return in existing format
    return jsonify({
        "success": True,
        "document_id": document_id,
        "concepts": [concept.to_dict() for concept in result.concepts],
        "parse_method": result.parse_method,
        "confidence": result.confidence
    })
```

---

### 3. Database Integration (REUSE EXISTING)

**No Changes Needed**: V7 migrations already exist

**Existing Tables**:
- `concepts` - Already has V7 fields (confidence, methods_found, extraction_methods)
- `relationships` - Already has V7 fields (similarity_score, claude_confidence)
- `documents` - Already has V7 fields (parse_method, parse_confidence, hierarchy_json)
- `v7_processing_metrics` - Already exists

**Action**: Ensure migrations are applied (user action)

---

### 4. API Response Format (BACKWARD COMPATIBLE)

**Strategy**: Add new fields, don't remove old ones

**Response Structure**:
```json
{
  "success": true,
  "document_id": "uuid",
  "concepts": [
    {
      "id": "concept-1",
      "term": "Azure Virtual Machine",
      "definition": "...",
      
      // OLD FIELDS (maintained for backward compat)
      "importance_score": 0.85,
      "validated": false,
      "structure_type": "hierarchical",
      
      // NEW V7 FIELDS (optional for clients)
      "confidence": 0.85,
      "methods_found": 3,
      "extraction_methods": ["keybert", "yake", "spacy"],
      "structure_id": "chapter_1_section_2"
    }
  ],
  
  // NEW V7 FIELDS (optional for clients)
  "parse_method": "llamaparse",
  "parse_confidence": 0.95,
  "metrics": {
    "concepts_extracted": 45,
    "high_confidence_concepts": 38,
    "relationships_detected": 120,
    "total_cost": 0.75
  }
}
```

---

## Implementation Plan

### Phase 1: Preparation (Check Reusable Code)
1. ✅ Verify V7 pipeline exists and is complete
2. ✅ Verify V7 migrations exist
3. ✅ Verify V7 frontend components exist
4. Find all references to `simple_pdf_processor` in codebase
5. Document current API contracts

### Phase 2: Integration (Reuse V7)
1. Modify `simple_pdf_processor.py` to call V7 pipeline
2. Update Flask/FastAPI routes to use V7
3. Ensure backward compatible response format
4. Add deprecation warnings to old functions

### Phase 3: Testing
1. Test existing API endpoints still work
2. Test new V7 fields are included
3. Test confidence scores are improved
4. Test no breaking changes

### Phase 4: Cleanup
1. Mark old functions as deprecated
2. Update documentation in tasks.md ONLY
3. Remove unused imports
4. Verify Sensa theme consistency

---

## Code Reuse Checklist

Before writing ANY new code, check:

- ✅ V7 Pipeline exists? YES - `backend/services/pbl/v7_pipeline.py`
- ✅ V7 Parser exists? YES - `backend/services/pbl/pdf_parser.py` (has parse_with_v7)
- ✅ V7 Concept Extractor exists? YES - `backend/services/pbl/concept_service.py` (has extract_concepts_v7)
- ✅ V7 Relationship Service exists? YES - `backend/services/pbl/v7_relationship_service.py`
- ✅ V7 Hierarchy Extractor exists? YES - `backend/services/pbl/hierarchy_extractor.py`
- ✅ V7 API endpoints exist? YES - `backend/routers/v7_documents.py`
- ✅ V7 Frontend components exist? YES - `src/components/pbl/V7*.tsx`
- ✅ V7 Database schema exists? YES - migrations in `infra/database/migrations/`

**Conclusion**: ALL V7 code exists. Integration requires MINIMAL new code.

---

## Sensa Color Theme

Maintain consistency with existing V7 components:

- **Purple** (#a855f7) - Primary color, LlamaParse badge
- **Pink** (#ec4899) - Accent color, gradients
- **Blue** (#3b82f6) - Textract badge, hierarchical structure
- **Green** (#10b981) - High confidence, sequential structure, success
- **Yellow** (#f59e0b) - Medium confidence, warnings
- **Red** (#ef4444) - Low confidence, errors
- **Gray** (#6b7280) - pdfplumber badge, disabled states

---

## Success Metrics

- ✅ Zero new services created (reuse V7)
- ✅ Backward compatibility maintained
- ✅ Confidence scores improved to 70%+
- ✅ Codebase simplified (duplicate code removed)
- ✅ All progress tracked in tasks.md ONLY
- ✅ Sensa theme consistency maintained

---

**Status**: Ready for Implementation  
**Estimated Effort**: 1-2 days  
**Code Reuse**: 95%+ (only wrapper code needed)
