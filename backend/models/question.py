"""
Question Model

Represents AI-generated questions to help users create analogies.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class Question(BaseModel):
    """
    An AI-generated question to help users create analogies.
    """
    id: str
    concept_id: str
    user_id: str
    question_text: str
    question_type: str = Field(
        description="experience_mapping, process_parallel, routine_mapping, etc."
    )
    answered: bool = False
    answer_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "question-123",
                "concept_id": "concept-456",
                "user_id": "user-789",
                "question_text": "Think of a time you organized items into groups. How did you decide what belonged where?",
                "question_type": "experience_mapping",
                "answered": False
            }
        }


class QuestionCreate(BaseModel):
    """Request model for creating a question"""
    concept_id: str
    user_id: str
    question_text: str
    question_type: str


class QuestionUpdate(BaseModel):
    """Request model for updating a question"""
    answered: Optional[bool] = None
    answer_text: Optional[str] = None


class QuestionResponse(BaseModel):
    """Response model for question API endpoints"""
    id: str
    concept_id: str
    user_id: str
    question_text: str
    question_type: str
    answered: bool
    answer_text: Optional[str]
    created_at: datetime
    
    # Optional: Include concept details
    concept: Optional[dict] = None


class GenerateQuestionsRequest(BaseModel):
    """Request model for generating questions"""
    concept_id: str
    user_id: str
    max_questions: int = Field(default=3, ge=1, le=5)
    
    class Config:
        json_schema_extra = {
            "example": {
                "concept_id": "concept-456",
                "user_id": "user-789",
                "max_questions": 3
            }
        }


class GenerateQuestionsResponse(BaseModel):
    """Response model for question generation"""
    questions: list[QuestionResponse]
    concept_term: str
    concept_definition: str
    structure_type: Optional[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "questions": [
                    {
                        "id": "q1",
                        "concept_id": "concept-456",
                        "user_id": "user-789",
                        "question_text": "Think of a time you organized items...",
                        "question_type": "experience_mapping",
                        "answered": False,
                        "created_at": "2025-01-23T10:00:00"
                    }
                ],
                "concept_term": "Classification",
                "concept_definition": "The process of organizing items into categories",
                "structure_type": "hierarchical"
            }
        }


class QuestionType:
    """Constants for question types"""
    
    # For hierarchical concepts
    EXPERIENCE_MAPPING = "experience_mapping"
    METAPHORICAL_BRIDGE = "metaphorical_bridge"
    CLASSIFICATION_MEMORY = "classification_memory"
    
    # For sequential concepts
    PROCESS_PARALLEL = "process_parallel"
    ROUTINE_MAPPING = "routine_mapping"
    CAUSE_EFFECT_MEMORY = "cause_effect_memory"
    
    # Universal
    GENERAL_ANALOGY = "general_analogy"
    
    @classmethod
    def hierarchical_types(cls) -> list:
        """Question types for hierarchical concepts"""
        return [
            cls.EXPERIENCE_MAPPING,
            cls.METAPHORICAL_BRIDGE,
            cls.CLASSIFICATION_MEMORY
        ]
    
    @classmethod
    def sequential_types(cls) -> list:
        """Question types for sequential concepts"""
        return [
            cls.PROCESS_PARALLEL,
            cls.ROUTINE_MAPPING,
            cls.CAUSE_EFFECT_MEMORY
        ]
    
    @classmethod
    def all_types(cls) -> list:
        return cls.hierarchical_types() + cls.sequential_types() + [cls.GENERAL_ANALOGY]


class QuestionTemplate(BaseModel):
    """Template for generating questions"""
    template_id: str
    question_type: str
    template_text: str
    placeholders: list[str] = Field(
        default_factory=list,
        description="Placeholders to fill: {user_interest}, {user_activity}, etc."
    )
    structure_type: Optional[str] = Field(
        None,
        description="hierarchical, sequential, or None for universal"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "template_id": "tmpl-1",
                "question_type": "experience_mapping",
                "template_text": "Think of a time you organized {items} into groups. How did you decide what belonged where?",
                "placeholders": ["{items}"],
                "structure_type": "hierarchical"
            }
        }
