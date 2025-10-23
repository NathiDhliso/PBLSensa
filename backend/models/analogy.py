"""
Analogy Model

Represents user-created analogies connecting concepts to personal experiences.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class Analogy(BaseModel):
    """
    A user-created analogy connecting a concept to a personal experience.
    """
    id: str
    user_id: str
    concept_id: str
    user_experience_text: str = Field(description="User's personal experience or memory")
    connection_explanation: Optional[str] = Field(
        None,
        description="AI-generated explanation of how the experience relates to the concept"
    )
    strength: float = Field(ge=1.0, le=5.0, description="User rating of analogy effectiveness (1-5)")
    type: str = Field(description="metaphor, experience, scenario, or emotion")
    reusable: bool = Field(default=False, description="Can be suggested for similar concepts")
    tags: List[str] = Field(default_factory=list, description="Auto-generated tags (sports, cooking, etc.)")
    created_at: datetime = Field(default_factory=datetime.now)
    last_used: Optional[datetime] = None
    usage_count: int = Field(default=0, description="Number of times this analogy was reused")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "analogy-123",
                "user_id": "user-456",
                "concept_id": "concept-789",
                "user_experience_text": "When I played soccer, the team had different positions - defenders, midfielders, strikers - each with specific roles that worked together to win.",
                "connection_explanation": "Just like a soccer team has specialized positions, a computer system has specialized components (CPU, memory, storage) that work together to process information.",
                "strength": 4.5,
                "type": "experience",
                "reusable": True,
                "tags": ["sports", "soccer", "teamwork"],
                "usage_count": 3
            }
        }


class AnalogyCreate(BaseModel):
    """Request model for creating an analogy"""
    concept_id: str
    user_experience_text: str
    strength: float = Field(ge=1.0, le=5.0)
    type: Optional[str] = "experience"
    reusable: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "concept_id": "concept-789",
                "user_experience_text": "When I played soccer...",
                "strength": 4.5,
                "type": "experience",
                "reusable": True
            }
        }


class AnalogyUpdate(BaseModel):
    """Request model for updating an analogy"""
    user_experience_text: Optional[str] = None
    strength: Optional[float] = Field(None, ge=1.0, le=5.0)
    reusable: Optional[bool] = None
    tags: Optional[List[str]] = None


class AnalogyResponse(BaseModel):
    """Response model for analogy API endpoints"""
    id: str
    user_id: str
    concept_id: str
    user_experience_text: str
    connection_explanation: Optional[str]
    strength: float
    type: str
    reusable: bool
    tags: List[str]
    created_at: datetime
    last_used: Optional[datetime]
    usage_count: int
    
    # Optional: Include concept details
    concept: Optional[dict] = None


class AnalogyWithConcept(Analogy):
    """Analogy with full concept details"""
    concept_term: str
    concept_definition: str
    document_id: str


class ConceptAnalogyConnection(BaseModel):
    """Connection between a concept and an analogy"""
    id: str
    concept_id: str
    analogy_id: str
    strength: float = Field(ge=0.0, le=1.0, description="Connection strength (0-1)")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "conn-123",
                "concept_id": "concept-789",
                "analogy_id": "analogy-456",
                "strength": 0.9
            }
        }


class ConceptAnalogyConnectionCreate(BaseModel):
    """Request model for creating a concept-analogy connection"""
    concept_id: str
    analogy_id: str
    strength: float = Field(default=0.5, ge=0.0, le=1.0)


class ConceptAnalogyConnectionUpdate(BaseModel):
    """Request model for updating a connection"""
    strength: Optional[float] = Field(None, ge=0.0, le=1.0)


class AnalogyType:
    """Constants for analogy types"""
    METAPHOR = "metaphor"
    EXPERIENCE = "experience"
    SCENARIO = "scenario"
    EMOTION = "emotion"
    
    @classmethod
    def all_types(cls) -> list:
        return [cls.METAPHOR, cls.EXPERIENCE, cls.SCENARIO, cls.EMOTION]


class AnalogyTag:
    """Common analogy tags"""
    # Activity domains
    SPORTS = "sports"
    COOKING = "cooking"
    MUSIC = "music"
    ART = "art"
    GAMING = "gaming"
    TECHNOLOGY = "technology"
    NATURE = "nature"
    
    # Work domains
    WORK = "work"
    BUSINESS = "business"
    TEACHING = "teaching"
    HEALTHCARE = "healthcare"
    
    # Life domains
    FAMILY = "family"
    TRAVEL = "travel"
    EDUCATION = "education"
    RELATIONSHIPS = "relationships"
    
    @classmethod
    def all_tags(cls) -> list:
        return [
            cls.SPORTS, cls.COOKING, cls.MUSIC, cls.ART, cls.GAMING,
            cls.TECHNOLOGY, cls.NATURE, cls.WORK, cls.BUSINESS,
            cls.TEACHING, cls.HEALTHCARE, cls.FAMILY, cls.TRAVEL,
            cls.EDUCATION, cls.RELATIONSHIPS
        ]


class AnalogyStatistics(BaseModel):
    """Statistics about a user's analogies"""
    total_analogies: int
    reusable_analogies: int
    avg_strength: float
    most_used_tags: List[str]
    most_reused_analogy_id: Optional[str]
    concepts_with_analogies: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_analogies": 25,
                "reusable_analogies": 10,
                "avg_strength": 4.2,
                "most_used_tags": ["sports", "cooking", "technology"],
                "most_reused_analogy_id": "analogy-123",
                "concepts_with_analogies": 20
            }
        }
