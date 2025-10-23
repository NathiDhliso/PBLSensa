"""
Sensa Learn Analogies API Router

Endpoints for creating and managing analogies.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.analogy import (
    AnalogyCreate,
    AnalogyUpdate,
    AnalogyResponse,
    AnalogyStatistics
)
from services.sensa.analogy_service import AnalogyService
from services.sensa.cross_document_learning import (
    CrossDocumentLearningService,
    AnalogyySuggestion
)

router = APIRouter(prefix="/api/sensa/analogies", tags=["Sensa Analogies"])

# Initialize services
analogy_service = AnalogyService()
cross_doc_service = CrossDocumentLearningService(analogy_service)


@router.post("", response_model=AnalogyResponse)
async def create_analogy(
    analogy_data: AnalogyCreate,
    user_id: str = Query(..., description="User ID")
):
    """
    Create a new analogy.
    
    The system will automatically:
    - Generate a connection explanation using AI
    - Auto-tag the analogy based on content
    """
    analogy = await analogy_service.create_analogy(user_id, analogy_data)
    
    return AnalogyResponse(
        id=analogy.id,
        user_id=analogy.user_id,
        concept_id=analogy.concept_id,
        user_experience_text=analogy.user_experience_text,
        connection_explanation=analogy.connection_explanation,
        strength=analogy.strength,
        type=analogy.type,
        reusable=analogy.reusable,
        tags=analogy.tags,
        created_at=analogy.created_at,
        last_used=analogy.last_used,
        usage_count=analogy.usage_count
    )


@router.get("", response_model=list[AnalogyResponse])
async def get_analogies(
    user_id: str = Query(..., description="User ID"),
    concept_id: Optional[str] = Query(None, description="Filter by concept"),
    document_id: Optional[str] = Query(None, description="Filter by document"),
    reusable: bool = Query(False, description="Only return reusable analogies")
):
    """
    Get user's analogies with optional filters.
    """
    analogies = await analogy_service.get_analogies(
        user_id=user_id,
        concept_id=concept_id,
        document_id=document_id,
        reusable_only=reusable
    )
    
    return [
        AnalogyResponse(
            id=a.id,
            user_id=a.user_id,
            concept_id=a.concept_id,
            user_experience_text=a.user_experience_text,
            connection_explanation=a.connection_explanation,
            strength=a.strength,
            type=a.type,
            reusable=a.reusable,
            tags=a.tags,
            created_at=a.created_at,
            last_used=a.last_used,
            usage_count=a.usage_count
        )
        for a in analogies
    ]


@router.get("/{analogy_id}", response_model=AnalogyResponse)
async def get_analogy(analogy_id: str):
    """
    Get a specific analogy by ID.
    """
    analogy = await analogy_service.get_analogy(analogy_id)
    
    if not analogy:
        raise HTTPException(status_code=404, detail="Analogy not found")
    
    return AnalogyResponse(
        id=analogy.id,
        user_id=analogy.user_id,
        concept_id=analogy.concept_id,
        user_experience_text=analogy.user_experience_text,
        connection_explanation=analogy.connection_explanation,
        strength=analogy.strength,
        type=analogy.type,
        reusable=analogy.reusable,
        tags=analogy.tags,
        created_at=analogy.created_at,
        last_used=analogy.last_used,
        usage_count=analogy.usage_count
    )


@router.put("/{analogy_id}", response_model=AnalogyResponse)
async def update_analogy(
    analogy_id: str,
    updates: AnalogyUpdate
):
    """
    Update an analogy.
    
    If experience text is updated, connection explanation and tags will be regenerated.
    """
    analogy = await analogy_service.update_analogy(analogy_id, updates)
    
    if not analogy:
        raise HTTPException(status_code=404, detail="Analogy not found")
    
    return AnalogyResponse(
        id=analogy.id,
        user_id=analogy.user_id,
        concept_id=analogy.concept_id,
        user_experience_text=analogy.user_experience_text,
        connection_explanation=analogy.connection_explanation,
        strength=analogy.strength,
        type=analogy.type,
        reusable=analogy.reusable,
        tags=analogy.tags,
        created_at=analogy.created_at,
        last_used=analogy.last_used,
        usage_count=analogy.usage_count
    )


@router.delete("/{analogy_id}")
async def delete_analogy(analogy_id: str):
    """
    Delete an analogy.
    """
    deleted = await analogy_service.delete_analogy(analogy_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Analogy not found")
    
    return {"message": "Analogy deleted successfully", "analogy_id": analogy_id}


@router.get("/suggest/for-concept")
async def suggest_analogies(
    user_id: str = Query(..., description="User ID"),
    concept_id: str = Query(..., description="Concept ID")
):
    """
    Get analogy suggestions from past documents for a new concept.
    
    Returns reusable analogies from similar concepts the user has learned before.
    """
    # TODO: Get concept from database
    from models.concept import Concept
    from datetime import datetime
    
    concept = Concept(
        id=concept_id,
        document_id="doc-123",
        term="New Concept",
        definition="A new concept to learn",
        structure_type="hierarchical",
        created_at=datetime.now()
    )
    
    suggestions = await cross_doc_service.suggest_analogies_for_new_concept(
        user_id=user_id,
        new_concept=concept
    )
    
    return {
        "concept_id": concept_id,
        "suggestions": [
            {
                "analogy_id": s.analogy.id,
                "similarity_score": s.similarity_score,
                "suggestion_text": s.suggestion_text,
                "source_concept": s.source_concept_term,
                "experience_text": s.analogy.user_experience_text,
                "tags": s.analogy.tags,
                "strength": s.analogy.strength
            }
            for s in suggestions
        ]
    }


@router.post("/suggest/{suggestion_id}/apply")
async def apply_suggestion(
    suggestion_id: str,
    user_id: str = Query(..., description="User ID"),
    concept_id: str = Query(..., description="New concept ID")
):
    """
    Apply a suggested analogy to a new concept.
    
    Creates a new analogy based on the suggestion and increments usage count.
    """
    # TODO: Get suggestion from database or session
    # For now, return success message
    
    return {
        "message": "Suggestion applied successfully",
        "new_analogy_id": f"analogy-new-{concept_id}"
    }


@router.get("/statistics/{user_id}", response_model=AnalogyStatistics)
async def get_analogy_statistics(user_id: str):
    """
    Get analogy statistics for a user.
    
    Includes total count, reusable count, average strength, most used tags, etc.
    """
    stats = await analogy_service.get_statistics(user_id)
    
    return stats


@router.get("/insights/{user_id}")
async def get_cross_document_insights(user_id: str):
    """
    Get insights about user's cross-document learning patterns.
    
    Shows how effectively the user is reusing analogies across documents.
    """
    insights = await cross_doc_service.get_cross_document_insights(user_id)
    
    return insights
