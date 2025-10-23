"""
Relationship Model

Represents connections between concepts with structure classification.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class Relationship(BaseModel):
    """
    A relationship between two concepts.
    Enhanced with structure classification for Two-View Learning System.
    """
    id: str
    source_concept_id: str
    target_concept_id: str
    relationship_type: str = Field(
        description="Type: is_a, has_component, contains, precedes, enables, results_in, etc."
    )
    structure_category: Optional[str] = Field(
        None,
        description="Category: hierarchical, sequential, or unclassified"
    )
    strength: float = Field(ge=0.0, le=1.0, description="Relationship strength (0-1)")
    validated_by_user: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "rel-123",
                "source_concept_id": "concept-456",
                "target_concept_id": "concept-789",
                "relationship_type": "is_a",
                "structure_category": "hierarchical",
                "strength": 0.9,
                "validated_by_user": False
            }
        }


class RelationshipCreate(BaseModel):
    """Request model for creating a relationship"""
    source_concept_id: str
    target_concept_id: str
    relationship_type: str
    structure_category: Optional[str] = None
    strength: float = Field(default=0.5, ge=0.0, le=1.0)


class RelationshipUpdate(BaseModel):
    """Request model for updating a relationship"""
    relationship_type: Optional[str] = None
    structure_category: Optional[str] = None
    strength: Optional[float] = Field(None, ge=0.0, le=1.0)
    validated_by_user: Optional[bool] = None


class RelationshipResponse(BaseModel):
    """Response model for relationship API endpoints"""
    id: str
    source_concept_id: str
    target_concept_id: str
    relationship_type: str
    structure_category: Optional[str]
    strength: float
    validated_by_user: bool
    created_at: datetime
    
    # Optional: Include concept details
    source_concept: Optional[dict] = None
    target_concept: Optional[dict] = None


# Relationship type constants
class RelationshipType:
    """Constants for relationship types"""
    
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
    
    # Other types
    APPLIES_TO = "applies_to"
    CONTRASTS_WITH = "contrasts_with"
    SIMILAR_TO = "similar_to"
    
    @classmethod
    def hierarchical_types(cls) -> list:
        """Get all hierarchical relationship types"""
        return [cls.IS_A, cls.HAS_COMPONENT, cls.CONTAINS, cls.CATEGORY_OF, cls.PART_OF]
    
    @classmethod
    def sequential_types(cls) -> list:
        """Get all sequential relationship types"""
        return [cls.PRECEDES, cls.ENABLES, cls.RESULTS_IN, cls.FOLLOWS, cls.LEADS_TO]
    
    @classmethod
    def all_types(cls) -> list:
        """Get all relationship types"""
        return cls.hierarchical_types() + cls.sequential_types() + [
            cls.APPLIES_TO, cls.CONTRASTS_WITH, cls.SIMILAR_TO
        ]


class StructureCategory:
    """Constants for structure categories"""
    HIERARCHICAL = "hierarchical"
    SEQUENTIAL = "sequential"
    UNCLASSIFIED = "unclassified"
    
    @classmethod
    def all_categories(cls) -> list:
        return [cls.HIERARCHICAL, cls.SEQUENTIAL, cls.UNCLASSIFIED]
