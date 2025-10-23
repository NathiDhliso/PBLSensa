"""
Concept Model - Renamed from Keyword

Represents a key concept extracted from educational documents.
Includes hierarchical/sequential structure classification.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class Concept(BaseModel):
    """
    A concept extracted from a document.
    Previously called 'Keyword' - renamed for Two-View Learning System.
    """
    id: str
    document_id: str
    term: str
    definition: str
    source_sentences: List[str] = Field(default_factory=list, description="Sentences where concept was defined")
    surrounding_concepts: List[str] = Field(default_factory=list, description="Related concepts found nearby")
    page_number: Optional[int] = None
    is_primary: bool = True
    structure_type: Optional[str] = Field(None, description="hierarchical, sequential, or unclassified")
    importance_score: Optional[float] = None
    exam_relevance_score: Optional[float] = None
    embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "concept-123",
                "document_id": "doc-456",
                "term": "Photosynthesis",
                "definition": "The process by which plants convert light energy into chemical energy",
                "source_sentences": [
                    "Photosynthesis is the process by which plants convert light energy into chemical energy.",
                    "This process occurs in the chloroplasts of plant cells."
                ],
                "surrounding_concepts": ["Chloroplast", "Light Energy", "Chemical Energy"],
                "page_number": 42,
                "is_primary": True,
                "structure_type": "hierarchical",
                "importance_score": 0.95,
                "exam_relevance_score": 0.88
            }
        }


class ConceptCreate(BaseModel):
    """Request model for creating a new concept"""
    document_id: str
    term: str
    definition: str
    source_sentences: List[str] = Field(default_factory=list)
    surrounding_concepts: List[str] = Field(default_factory=list)
    page_number: Optional[int] = None
    structure_type: Optional[str] = None
    importance_score: Optional[float] = None


class ConceptUpdate(BaseModel):
    """Request model for updating a concept"""
    term: Optional[str] = None
    definition: Optional[str] = None
    source_sentences: Optional[List[str]] = None
    surrounding_concepts: Optional[List[str]] = None
    structure_type: Optional[str] = None
    importance_score: Optional[float] = None
    exam_relevance_score: Optional[float] = None


class ConceptResponse(BaseModel):
    """Response model for concept API endpoints"""
    id: str
    document_id: str
    term: str
    definition: str
    source_sentences: List[str]
    surrounding_concepts: List[str]
    page_number: Optional[int]
    is_primary: bool
    structure_type: Optional[str]
    importance_score: Optional[float]
    exam_relevance_score: Optional[float]
    created_at: datetime
    
    # Relationship info (if included)
    relationships: Optional[List[dict]] = None


class ConceptWithRelationships(Concept):
    """Concept with its relationships included"""
    relationships: List['Relationship'] = Field(default_factory=list)


# For type hints
from backend.models.relationship import Relationship
ConceptWithRelationships.model_rebuild()
