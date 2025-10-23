"""
PBL Relationship Data Models

Pydantic models for relationships between concepts in the PBL View.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator
from uuid import UUID
from enum import Enum


class StructureCategory(str, Enum):
    """Categories of concept relationships"""
    HIERARCHICAL = "hierarchical"
    SEQUENTIAL = "sequential"
    UNCLASSIFIED = "unclassified"


class RelationshipType(str, Enum):
    """Specific types of relationships"""
    # Hierarchical types
    IS_A = "is_a"
    HAS_COMPONENT = "has_component"
    CONTAINS = "contains"
    CATEGORY_OF = "category_of"
    PART_OF = "part_of"
    
    # Sequential types
    PRECEDES = "precedes"
    ENABLES = "enables"
    RESULTS_IN = "results_in"
    FOLLOWS = "follows"
    LEADS_TO = "leads_to"
    CAUSES = "causes"
    TRIGGERS = "triggers"
    
    # Other types
    APPLIES_TO = "applies_to"
    CONTRASTS_WITH = "contrasts_with"
    SIMILAR_TO = "similar_to"
    RELATED_TO = "related_to"


class RelationshipBase(BaseModel):
    """Base relationship model with common fields"""
    source_concept_id: UUID = Field(..., description="ID of the source concept")
    target_concept_id: UUID = Field(..., description="ID of the target concept")
    relationship_type: RelationshipType = Field(..., description="Specific type of relationship")
    structure_category: StructureCategory = Field(..., description="Hierarchical, sequential, or unclassified")
    strength: float = Field(default=0.5, ge=0.0, le=1.0, description="Confidence score (0.0 to 1.0)")
    
    @validator('source_concept_id', 'target_concept_id')
    def validate_not_same(cls, v, values):
        if 'source_concept_id' in values and v == values['source_concept_id']:
            raise ValueError('source_concept_id and target_concept_id cannot be the same')
        return v
    
    @validator('structure_category', 'relationship_type')
    def validate_category_type_match(cls, v, values):
        """Ensure relationship_type matches structure_category"""
        if 'relationship_type' in values and 'structure_category' in values:
            rel_type = values['relationship_type']
            category = values.get('structure_category', v)
            
            hierarchical_types = {
                RelationshipType.IS_A,
                RelationshipType.HAS_COMPONENT,
                RelationshipType.CONTAINS,
                RelationshipType.CATEGORY_OF,
                RelationshipType.PART_OF
            }
            
            sequential_types = {
                RelationshipType.PRECEDES,
                RelationshipType.ENABLES,
                RelationshipType.RESULTS_IN,
                RelationshipType.FOLLOWS,
                RelationshipType.LEADS_TO,
                RelationshipType.CAUSES,
                RelationshipType.TRIGGERS
            }
            
            if category == StructureCategory.HIERARCHICAL and rel_type not in hierarchical_types:
                if rel_type not in {RelationshipType.APPLIES_TO, RelationshipType.CONTRASTS_WITH, 
                                   RelationshipType.SIMILAR_TO, RelationshipType.RELATED_TO}:
                    raise ValueError(f'{rel_type} is not a hierarchical relationship type')
            
            if category == StructureCategory.SEQUENTIAL and rel_type not in sequential_types:
                if rel_type not in {RelationshipType.APPLIES_TO, RelationshipType.CONTRASTS_WITH, 
                                   RelationshipType.SIMILAR_TO, RelationshipType.RELATED_TO}:
                    raise ValueError(f'{rel_type} is not a sequential relationship type')
        
        return v


class RelationshipCreate(RelationshipBase):
    """Model for creating a new relationship"""
    
    class Config:
        schema_extra = {
            "example": {
                "source_concept_id": "123e4567-e89b-12d3-a456-426614174000",
                "target_concept_id": "123e4567-e89b-12d3-a456-426614174001",
                "relationship_type": "is_a",
                "structure_category": "hierarchical",
                "strength": 0.85
            }
        }


class RelationshipUpdate(BaseModel):
    """Model for updating an existing relationship"""
    relationship_type: Optional[RelationshipType] = None
    structure_category: Optional[StructureCategory] = None
    strength: Optional[float] = Field(None, ge=0.0, le=1.0)
    validated_by_user: Optional[bool] = None
    
    class Config:
        schema_extra = {
            "example": {
                "relationship_type": "has_component",
                "strength": 0.9,
                "validated_by_user": True
            }
        }


class Relationship(RelationshipBase):
    """Complete relationship model with all fields"""
    id: UUID
    validated_by_user: bool = Field(default=False, description="Whether user has confirmed this relationship")
    created_at: datetime
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174002",
                "source_concept_id": "123e4567-e89b-12d3-a456-426614174000",
                "target_concept_id": "123e4567-e89b-12d3-a456-426614174001",
                "relationship_type": "is_a",
                "structure_category": "hierarchical",
                "strength": 0.85,
                "validated_by_user": True,
                "created_at": "2025-01-24T10:00:00Z"
            }
        }


class RelationshipWithConcepts(Relationship):
    """Relationship with full concept details"""
    source_concept: dict = Field(..., description="Full source concept object")
    target_concept: dict = Field(..., description="Full target concept object")
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174002",
                "source_concept": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "term": "Virtual Machine",
                    "definition": "A software emulation..."
                },
                "target_concept": {
                    "id": "123e4567-e89b-12d3-a456-426614174001",
                    "term": "Computer System",
                    "definition": "A complete computing environment..."
                },
                "relationship_type": "is_a",
                "structure_category": "hierarchical",
                "strength": 0.85
            }
        }


class RelationshipDetectionResult(BaseModel):
    """Result from structure detection/classification"""
    source_concept_id: UUID
    target_concept_id: UUID
    relationship_type: RelationshipType
    structure_category: StructureCategory
    strength: float
    reasoning: Optional[str] = Field(None, description="Explanation of why this relationship was detected")
    pattern_matched: Optional[str] = Field(None, description="Pattern that triggered detection")
    
    class Config:
        schema_extra = {
            "example": {
                "source_concept_id": "123e4567-e89b-12d3-a456-426614174000",
                "target_concept_id": "123e4567-e89b-12d3-a456-426614174001",
                "relationship_type": "is_a",
                "structure_category": "hierarchical",
                "strength": 0.85,
                "reasoning": "Source concept definition contains 'is a type of' pattern",
                "pattern_matched": "is a"
            }
        }


class StructureDetectionResponse(BaseModel):
    """Response from structure detection containing all relationships"""
    hierarchical: list[Relationship] = Field(default_factory=list, description="Hierarchical relationships")
    sequential: list[Relationship] = Field(default_factory=list, description="Sequential relationships")
    unclassified: list[Relationship] = Field(default_factory=list, description="Unclassified relationships")
    total_detected: int = Field(..., description="Total number of relationships detected")
    
    class Config:
        schema_extra = {
            "example": {
                "hierarchical": [],
                "sequential": [],
                "unclassified": [],
                "total_detected": 25
            }
        }


class RelationshipListResponse(BaseModel):
    """Response model for listing relationships"""
    relationships: list[Relationship]
    total: int
    page: int = 1
    page_size: int = 50
    has_more: bool = False
    
    class Config:
        schema_extra = {
            "example": {
                "relationships": [],
                "total": 75,
                "page": 1,
                "page_size": 50,
                "has_more": True
            }
        }


class PatternMatchResult(BaseModel):
    """Result from pattern matching during structure detection"""
    category: StructureCategory
    confidence: float = Field(..., ge=0.0, le=1.0)
    hierarchical_score: int = Field(default=0, ge=0)
    sequential_score: int = Field(default=0, ge=0)
    matched_patterns: list[str] = Field(default_factory=list)
    
    class Config:
        schema_extra = {
            "example": {
                "category": "hierarchical",
                "confidence": 0.75,
                "hierarchical_score": 3,
                "sequential_score": 1,
                "matched_patterns": ["is a", "type of", "consists of"]
            }
        }


def get_relationship_label(relationship_type: RelationshipType) -> str:
    """Get human-readable label for relationship type"""
    labels = {
        RelationshipType.IS_A: "is a",
        RelationshipType.HAS_COMPONENT: "has component",
        RelationshipType.CONTAINS: "contains",
        RelationshipType.CATEGORY_OF: "category of",
        RelationshipType.PART_OF: "part of",
        RelationshipType.PRECEDES: "precedes",
        RelationshipType.ENABLES: "enables",
        RelationshipType.RESULTS_IN: "results in",
        RelationshipType.FOLLOWS: "follows",
        RelationshipType.LEADS_TO: "leads to",
        RelationshipType.CAUSES: "causes",
        RelationshipType.TRIGGERS: "triggers",
        RelationshipType.APPLIES_TO: "applies to",
        RelationshipType.CONTRASTS_WITH: "contrasts with",
        RelationshipType.SIMILAR_TO: "similar to",
        RelationshipType.RELATED_TO: "related to",
    }
    return labels.get(relationship_type, relationship_type.value)


def get_hierarchical_types() -> list[RelationshipType]:
    """Get all hierarchical relationship types"""
    return [
        RelationshipType.IS_A,
        RelationshipType.HAS_COMPONENT,
        RelationshipType.CONTAINS,
        RelationshipType.CATEGORY_OF,
        RelationshipType.PART_OF,
    ]


def get_sequential_types() -> list[RelationshipType]:
    """Get all sequential relationship types"""
    return [
        RelationshipType.PRECEDES,
        RelationshipType.ENABLES,
        RelationshipType.RESULTS_IN,
        RelationshipType.FOLLOWS,
        RelationshipType.LEADS_TO,
        RelationshipType.CAUSES,
        RelationshipType.TRIGGERS,
    ]
