"""
Simple PDF Processor - V7 Integration Wrapper
Maintains backward compatibility while using advanced V7 pipeline.

DEPRECATED: This module is maintained for backward compatibility only.
New code should use backend.services.pbl.v7_pipeline directly.
"""

import warnings
import tempfile
import os
import asyncio
from typing import List, Dict
from datetime import datetime
from io import BytesIO

# REUSE: Import existing V7 pipeline
try:
    from services.pbl.v7_pipeline import get_v7_pipeline
    V7_AVAILABLE = True
except ImportError:
    V7_AVAILABLE = False
    warnings.warn("V7 pipeline not available, falling back to basic extraction", ImportWarning)


def process_pdf_document(file_content: bytes, document_id: str) -> Dict:
    """
    Process PDF using V7 pipeline (backward compatible wrapper).
    
    REUSE: Calls existing v7_pipeline.process_document_v7()
    TRANSFORM: Converts V7 result to simple processor format
    
    Args:
        file_content: PDF file content as bytes
        document_id: Document identifier
        
    Returns:
        Dict with success, concepts, and metadata (backward compatible format)
    """
    if not V7_AVAILABLE:
        # Fallback to basic extraction if V7 not available
        return _fallback_process_pdf(file_content, document_id)
    
    try:
        # Save bytes to temporary file (V7 pipeline expects file path)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_path = temp_file.name
            temp_file.write(file_content)
        
        try:
            # REUSE: Use existing V7 pipeline
            v7_pipeline = get_v7_pipeline()
            
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    v7_pipeline.process_document_v7(
                        document_id=document_id,
                        pdf_path=temp_path,
                        user_id="system"  # Default user for simple processor
                    )
                )
            finally:
                loop.close()
            
            # TRANSFORM: Convert V7 concepts to simple format
            concepts = [
                {
                    "id": concept.id,
                    "document_id": document_id,
                    "term": concept.term,
                    "definition": concept.definition,
                    # V7 fields (enhanced)
                    "confidence": concept.confidence,
                    "methods_found": concept.methods_found,
                    "extraction_methods": concept.extraction_methods,
                    "structure_type": concept.structure_type,
                    "structure_id": concept.structure_id,
                    # Old fields (backward compat)
                    "importance_score": concept.confidence,  # Map to old field
                    "validated": False,
                    "source_sentences": [],
                    "page_number": 1,
                    "surrounding_concepts": [],
                    "created_at": datetime.now().isoformat()
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
                "metrics": result.metrics,
                "hierarchy": [_hierarchy_node_to_dict(node) for node in result.hierarchy]
            }
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        print(f"❌ V7 processing failed: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback to basic extraction
        return _fallback_process_pdf(file_content, document_id)


def _hierarchy_node_to_dict(node) -> Dict:
    """Convert HierarchyNode to dict for JSON serialization"""
    return {
        'id': node.id,
        'level': node.level,
        'title': node.title,
        'type': node.type,
        'parent_id': node.parent_id,
        'children': [_hierarchy_node_to_dict(c) for c in node.children],
        'page_range': node.page_range
    }


def _fallback_process_pdf(file_content: bytes, document_id: str) -> Dict:
    """
    Fallback to basic PDF extraction if V7 is not available.
    Uses simple PyPDF2 extraction.
    """
    try:
        from PyPDF2 import PdfReader
        
        pdf_file = BytesIO(file_content)
        reader = PdfReader(pdf_file)
        
        # Extract text
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        if not text:
            return {
                "success": False,
                "error": "Could not extract text from PDF",
                "concepts": []
            }
        
        # Basic concept extraction (very simple)
        import re
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        concepts = []
        for i, sentence in enumerate(sentences[:20]):  # Limit to 20
            if len(sentence) > 30:  # Only meaningful sentences
                words = sentence.split()[:5]
                term = ' '.join(words)
                
                concepts.append({
                    "id": f"concept-{i+1}",
                    "document_id": document_id,
                    "term": term,
                    "definition": sentence,
                    "confidence": 0.5,  # Low confidence for fallback
                    "methods_found": 1,
                    "extraction_methods": ["fallback_basic"],
                    "structure_type": "unclassified",
                    "importance_score": 0.5,
                    "validated": False,
                    "created_at": datetime.now().isoformat()
                })
        
        return {
            "success": True,
            "concepts": concepts,
            "concept_count": len(concepts),
            "parse_method": "fallback_pdfplumber",
            "parse_confidence": 0.5
        }
    
    except Exception as e:
        print(f"❌ Fallback processing failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "concepts": []
        }


# DEPRECATED: Keep old functions for backward compat but mark as deprecated
def extract_text_from_pdf(file_content: bytes) -> str:
    """
    DEPRECATED: Use V7 pipeline instead.
    
    This function is maintained for backward compatibility only.
    """
    warnings.warn(
        "extract_text_from_pdf is deprecated, use V7 pipeline",
        DeprecationWarning,
        stacklevel=2
    )
    
    try:
        from PyPDF2 import PdfReader
        pdf_file = BytesIO(file_content)
        reader = PdfReader(pdf_file)
        return "\n".join(page.extract_text() for page in reader.pages)
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""


def extract_concepts_from_text(text: str, document_id: str) -> List[Dict]:
    """
    DEPRECATED: Use V7 pipeline instead.
    
    This function is maintained for backward compatibility only.
    """
    warnings.warn(
        "extract_concepts_from_text is deprecated, use V7 pipeline",
        DeprecationWarning,
        stacklevel=2
    )
    return []
