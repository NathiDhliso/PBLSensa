"""
Sensa Learn Questions API Router

Endpoints for generating and managing questions.
"""

from fastapi import APIRouter, HTTPException
from models.question import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    QuestionResponse
)
from services.sensa.question_generator import AnalogyQuestionGenerator
from services.sensa.user_profile_service import UserProfileService

router = APIRouter(prefix="/api/sensa/questions", tags=["Sensa Questions"])

# Initialize services
question_generator = AnalogyQuestionGenerator()
profile_service = UserProfileService()


@router.post("/generate", response_model=GenerateQuestionsResponse)
async def generate_questions(request: GenerateQuestionsRequest):
    """
    Generate personalized questions for a concept.
    
    Questions are tailored based on:
    - Concept's structure type (hierarchical/sequential)
    - User's interests and experiences
    - User's learning style
    """
    # Get user profile
    profile = await profile_service.get_profile(request.user_id)
    
    if not profile:
        # Create default profile
        profile = await profile_service.get_or_create_default_profile(request.user_id)
    
    # TODO: Get concept from database
    # For now, create a mock concept
    from models.concept import Concept
    from datetime import datetime
    
    concept = Concept(
        id=request.concept_id,
        document_id="doc-123",
        term="Sample Concept",
        definition="A concept to generate questions for",
        structure_type="hierarchical",
        created_at=datetime.now()
    )
    
    # Generate questions
    questions = await question_generator.generate_questions(
        concept=concept,
        user_profile=profile,
        max_questions=request.max_questions
    )
    
    # Convert to response format
    question_responses = [
        QuestionResponse(
            id=q.id,
            concept_id=q.concept_id,
            user_id=q.user_id,
            question_text=q.question_text,
            question_type=q.question_type,
            answered=q.answered,
            answer_text=q.answer_text,
            created_at=q.created_at
        )
        for q in questions
    ]
    
    return GenerateQuestionsResponse(
        questions=question_responses,
        concept_term=concept.term,
        concept_definition=concept.definition,
        structure_type=concept.structure_type
    )


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(question_id: str):
    """
    Get a specific question by ID.
    """
    # TODO: Implement database query
    # SELECT * FROM generated_questions WHERE id = %s
    
    raise HTTPException(status_code=404, detail="Question not found")


@router.put("/{question_id}/answer")
async def answer_question(
    question_id: str,
    answer_text: str
):
    """
    Submit an answer to a question.
    
    This marks the question as answered and stores the response.
    """
    # TODO: Implement database update
    # UPDATE generated_questions SET answered = true, answer_text = %s WHERE id = %s
    
    return {
        "question_id": question_id,
        "answered": True,
        "message": "Answer recorded successfully"
    }


@router.get("/concept/{concept_id}")
async def get_questions_for_concept(
    concept_id: str,
    user_id: str
):
    """
    Get all questions generated for a specific concept.
    """
    # TODO: Implement database query
    # SELECT * FROM generated_questions WHERE concept_id = %s AND user_id = %s
    
    return {
        "concept_id": concept_id,
        "user_id": user_id,
        "questions": []
    }
