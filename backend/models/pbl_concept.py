"""
PBL Concept Data Models

Pydantic models for concepts in the PBL (Problem-Based Learning) View.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from uuid import UUID


class ConceptBase(BaseModel):
    """Base concept model with common fields"""
    term: str = Field(..., min_length=1, max_length=500, description="The concept term or phrase")
    definition: str = Field(..., min_length=1, max_length=5000, description="Definition or explanation of the concept")
    source_sentences: List[str] = Field(default_factory=list, description="Sentences where this concept was found")
    page_number: Optional[int] = Field(None, ge=1, description="Page number where concept appears")
    surrounding_concepts: List[str] = Field(default_factory=list, description="Related concepts found nearby")
    structure_type: Optional[str] = Field(None, description="hierarchical, sequential, or unclassified")
    importance_score: float = Field(default=0.5, ge=0.0, le=1.0, description="Calculated importance (0.0 to 1.0)")
    
    @validator('structure_type')
    def validate_structure_type(cls, v):
        if v is not None and v not in ['hierarchical', 'sequential', 'unclassified']:
            raise ValueError('structure_type must be hierarchical, sequential, or unclassified')
        return v
    
    @validator('term')
    def validate_term(cls, v):
        if not v or not v.strip():
            raise ValueError('term cannot be empty or whitespace')
        return v.strip()
    
    @validator('definition')
    def validate_definition(cls, v):
        if not v or not v.strip():
            raise ValueError('definition cannot be empty or whitespace')
        return v.strip()


class ConceptCreate(ConceptBase):
    """Model for creating a new concept"""
    document_id: UUID = Field(..., description="ID of the document this concept belongs to")
    
    class Config:
        schema_extra = {
            "example": {
                "document_id": "123e4567-e89b-12d3-a456-426614174000",
                "term": "Virtual Machine",
                "definition": "A software emulation of a physical computer system that runs an operating system and applications",
                "source_sentences": [
                    "A virtual machine (VM) is a software emulation of a physical computer.",
                    "VMs allow multiple operating systems to run on a single physical machine."
                ],
                "page_number": 5,
                "surrounding_concepts": ["Hypervisor", "Operating System", "Cloud Computing"],
                "structure_type": "hierarchical",
                "importance_score": 0.85
            }
        }


class ConceptUpdate(BaseModel):
    """Model for updating an existing concept"""
    term: Optional[str] = Field(None, min_length=1, max_length=500)
    definition: Optional[str] = Field(None, min_length=1, max_length=5000)
    source_sentences: Optional[List[str]] = None
    page_number: Optional[int] = Field(None, ge=1)
    surrounding_concepts: Optional[List[str]] = None
    structure_type: Optional[str] = None
    importance_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    validated: Optional[bool] = None
    
    @validator('structure_type')
    def validate_structure_type(cls, v):
        if v is not None and v not in ['hierarchical', 'sequential', 'unclassified']:
            raise ValueError('structure_type must be hierarchical, sequential, or unclassified')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "term": "Virtual Machine (VM)",
                "definition": "Updated definition with more detail...",
                "validated": True
            }
        }


class Concept(ConceptBase):
    """Complete concept model with all fields"""
    id: UUID
    document_id: UUID
    embedding: Optional[List[float]] = Field(None, description="Vector embedding for similarity search")
    validated: bool = Field(default=False, description="Whether user has validated this concept")
    merged_into: Optional[UUID] = Field(None, description="If duplicate, ID of primary concept")
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "document_id": "123e4567-e89b-12d3-a456-426614174001",
                "term": "Virtual Machine",
                "definition": "A software emulation of a physical computer system",
                "source_sentences": ["A virtual machine (VM) is a software emulation..."],
                "page_number": 5,
                "surrounding_concepts": ["Hypervisor", "Operating System"],
                "structure_type": "hierarchical",
                "importance_score": 0.85,
                "embedding": None,  # Would be a 768-dimension array
                "validated": True,
                "merged_into": None,
                "created_at": "2025-01-24T10:00:00Z",
                "updated_at": "2025-01-24T10:30:00Z"
            }
        }


class ConceptWithRelationships(Concept):
    """Concept with its relationships included"""
    relationships_as_source: List[dict] = Field(default_factory=list, description="Relationships where this is the source")
    relationships_as_target: List[dict] = Field(default_factory=list, description="Relationships where this is the target")
    
    class Config:
        orm_mode = True


class ConceptValidationRequest(BaseModel):
    """Request model for bulk concept validation"""
    approved: List[UUID] = Field(default_factory=list, description="Concept IDs to approve")
    rejected: List[UUID] = Field(default_factory=list, description="Concept IDs to reject/delete")
    edited: List[ConceptUpdate] = Field(default_factory=list, description="Concepts with edits to apply")
    
    class Config:
        schema_extra = {
            "example": {
                "approved": [
                    "123e4567-e89b-12d3-a456-426614174000",
                    "123e4567-e89b-12d3-a456-426614174001"
                ],
                "rejected": [
                    "123e4567-e89b-12d3-a456-426614174002"
                ],
                "edited": [
                    {
                        "term": "Virtual Machine (VM)",
                        "definition": "Corrected definition..."
                    }
                ]
            }
        }


class ConceptValidationResponse(BaseModel):
    """Response model for bulk concept validation"""
    validated_count: int = Field(..., description="Number of concepts approved")
    rejected_count: int = Field(..., description="Number of concepts rejected")
    edited_count: int = Field(..., description="Number of concepts edited")
    total_processed: int = Field(..., description="Total concepts processed")
    
    class Config:
        schema_extra = {
            "example": {
                "validated_count": 15,
                "rejected_count": 2,
                "edited_count": 3,
                "total_processed": 20
            }
        }


class DuplicatePair(BaseModel):
    """Model for potential duplicate concept pairs"""
    concept_a: Concept
    concept_b: Concept
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity score")
    reasoning: Optional[str] = Field(None, description="Why these might be duplicates")
    
    class Config:
        schema_extra = {
            "example": {
                "concept_a": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "term": "Virtual Machine",
                    "definition": "A software emulation..."
                },
                "concept_b": {
                    "id": "123e4567-e89b-12d3-a456-426614174001",
                    "term": "VM",
                    "definition": "Abbreviation for Virtual Machine..."
                },
                "similarity_score": 0.97,
                "reasoning": "VM is a common abbreviation for Virtual Machine"
            }
        }


class ConceptMergeRequest(BaseModel):
    """Request model for merging duplicate concepts"""
    primary_id: UUID = Field(..., description="ID of the concept to keep")
    duplicate_id: UUID = Field(..., description="ID of the concept to merge and mark as duplicate")
    
    class Config:
        schema_extra = {
            "example": {
                "primary_id": "123e4567-e89b-12d3-a456-426614174000",
                "duplicate_id": "123e4567-e89b-12d3-a456-426614174001"
            }
        }


class ConceptListResponse(BaseModel):
    """Response model for listing concepts"""
    concepts: List[Concept]
    total: int
    page: int = 1
    page_size: int = 50
    has_more: bool = False
    
    class Config:
        schema_extra = {
            "example": {
                "concepts": [],
                "total": 150,
                "page": 1,
                "page_size": 50,
                "has_more": True
            }
        }


class ConceptExtractionData(BaseModel):
    """Raw data from Claude concept extraction (before enrichment)"""
    term: str
    definition: str
    source_sentences: List[str]
    
    class Config:
        schema_extra = {
            "example": {
                "term": "Virtual Machine",
                "definition": "A software emulation of a physical computer system",
                "source_sentences": [
                    "A virtual machine (VM) is a software emulation of a physical computer."
                ]
            }
        }


class TextChunk(BaseModel):
    """Model for PDF text chunks during processing"""
    text: str
    page_number: int
    chunk_index: int
    start_position: Optional[int] = None
    end_position: Optional[int] = None
    
    class Config:
        schema_extra = {
            "example": {
                "text": "Chapter 1: Introduction to Virtual Machines...",
                "page_number": 5,
                "chunk_index": 0,
                "start_position": 0,
                "end_position": 1000
            }
        }
