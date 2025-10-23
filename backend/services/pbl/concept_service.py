"""
PBL Concept Service

CRUD operations for concepts in the PBL View.
"""

import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from models.pbl_concept import (
    Concept,
    ConceptCreate,
    ConceptUpdate,
    ConceptValidationRequest,
    ConceptValidationResponse
)

logger = logging.getLogger(__name__)


class ConceptService:
    """
    Service for managing concepts.
    Handles CRUD operations and validation.
    """
    
    def __init__(self, db_connection=None):
        """
        Initialize the concept service.
        
        Args:
            db_connection: Database connection (will be implemented with actual DB)
        """
        self.db = db_connection
        logger.info("ConceptService initialized")
    
    async def create(self, concept: ConceptCreate) -> Concept:
        """
        Create a new concept.
        
        Args:
            concept: Concept data to create
            
        Returns:
            Created concept with ID
        """
        logger.info(f"Creating concept: {concept.term}")
        
        # TODO: Implement actual database insert
        # For now, return a mock concept
        from uuid import uuid4
        
        created = Concept(
            id=uuid4(),
            document_id=concept.document_id,
            term=concept.term,
            definition=concept.definition,
            source_sentences=concept.source_sentences,
            page_number=concept.page_number,
            surrounding_concepts=concept.surrounding_concepts,
            structure_type=concept.structure_type,
            importance_score=concept.importance_score,
            embedding=None,
            validated=False,
            merged_into=None,
            created_at=datetime.now(),
            updated_at=None
        )
        
        logger.debug(f"Created concept: {created.id}")
        return created
    
    async def get(self, concept_id: UUID) -> Optional[Concept]:
        """
        Get a concept by ID.
        
        Args:
            concept_id: ID of the concept
            
        Returns:
            Concept if found, None otherwise
        """
        logger.debug(f"Getting concept: {concept_id}")
        
        # TODO: Implement actual database query
        # For now, return None
        return None
    
    async def update(self, concept_id: UUID, update_data: ConceptUpdate) -> Optional[Concept]:
        """
        Update a concept.
        
        Args:
            concept_id: ID of the concept to update
            update_data: Fields to update
            
        Returns:
            Updated concept if found, None otherwise
        """
        logger.info(f"Updating concept: {concept_id}")
        
        # TODO: Implement actual database update
        # For now, return None
        return None
    
    async def delete(self, concept_id: UUID) -> bool:
        """
        Delete a concept.
        
        Args:
            concept_id: ID of the concept to delete
            
        Returns:
            True if deleted, False if not found
        """
        logger.info(f"Deleting concept: {concept_id}")
        
        # TODO: Implement actual database delete
        # Should also delete related relationships
        # For now, return False
        return False
    
    async def bulk_create(self, concepts: List[ConceptCreate]) -> List[Concept]:
        """
        Create multiple concepts in a batch.
        
        Args:
            concepts: List of concepts to create
            
        Returns:
            List of created concepts
        """
        logger.info(f"Bulk creating {len(concepts)} concepts")
        
        created = []
        for concept in concepts:
            created_concept = await self.create(concept)
            created.append(created_concept)
        
        logger.info(f"Bulk created {len(created)} concepts")
        return created
    
    async def get_by_document(
        self,
        document_id: UUID,
        validated_only: bool = False,
        structure_type: Optional[str] = None
    ) -> List[Concept]:
        """
        Get all concepts for a document.
        
        Args:
            document_id: ID of the document
            validated_only: If True, only return validated concepts
            structure_type: Filter by structure type (hierarchical/sequential/unclassified)
            
        Returns:
            List of concepts
        """
        logger.debug(f"Getting concepts for document: {document_id}")
        
        # TODO: Implement actual database query with filters
        # For now, return empty list
        return []
    
    async def validate_concepts(
        self,
        validation_request: ConceptValidationRequest
    ) -> ConceptValidationResponse:
        """
        Bulk validate concepts (approve, reject, edit).
        
        Args:
            validation_request: Validation request with approved, rejected, edited lists
            
        Returns:
            Validation response with counts
        """
        logger.info(f"Validating concepts: {len(validation_request.approved)} approved, "
                   f"{len(validation_request.rejected)} rejected, {len(validation_request.edited)} edited")
        
        validated_count = 0
        rejected_count = 0
        edited_count = 0
        
        # Approve concepts
        for concept_id in validation_request.approved:
            # TODO: Update concept.validated = True
            validated_count += 1
        
        # Reject (delete) concepts
        for concept_id in validation_request.rejected:
            # TODO: Delete concept
            rejected_count += 1
        
        # Edit concepts
        for edit in validation_request.edited:
            # TODO: Apply edits and mark as validated
            edited_count += 1
        
        total_processed = validated_count + rejected_count + edited_count
        
        logger.info(f"Validation complete: {validated_count} validated, {rejected_count} rejected, {edited_count} edited")
        
        return ConceptValidationResponse(
            validated_count=validated_count,
            rejected_count=rejected_count,
            edited_count=edited_count,
            total_processed=total_processed
        )
    
    async def get_unvalidated(self, document_id: UUID) -> List[Concept]:
        """
        Get all unvalidated concepts for a document.
        
        Args:
            document_id: ID of the document
            
        Returns:
            List of unvalidated concepts
        """
        logger.debug(f"Getting unvalidated concepts for document: {document_id}")
        
        # TODO: Implement actual database query
        # WHERE document_id = %s AND validated = false AND merged_into IS NULL
        # For now, return empty list
        return []
    
    async def get_by_importance(
        self,
        document_id: UUID,
        min_importance: float = 0.0,
        limit: int = 50
    ) -> List[Concept]:
        """
        Get concepts sorted by importance score.
        
        Args:
            document_id: ID of the document
            min_importance: Minimum importance score
            limit: Maximum number of concepts to return
            
        Returns:
            List of concepts sorted by importance (descending)
        """
        logger.debug(f"Getting top {limit} concepts by importance for document: {document_id}")
        
        # TODO: Implement actual database query
        # ORDER BY importance_score DESC LIMIT %s
        # For now, return empty list
        return []
    
    async def search_concepts(
        self,
        document_id: UUID,
        search_term: str
    ) -> List[Concept]:
        """
        Search concepts by term or definition.
        
        Args:
            document_id: ID of the document
            search_term: Term to search for
            
        Returns:
            List of matching concepts
        """
        logger.debug(f"Searching concepts for '{search_term}' in document: {document_id}")
        
        # TODO: Implement actual database query with full-text search
        # WHERE document_id = %s AND (term ILIKE %s OR definition ILIKE %s)
        # For now, return empty list
        return []
    
    async def get_statistics(self, document_id: UUID) -> dict:
        """
        Get concept statistics for a document.
        
        Args:
            document_id: ID of the document
            
        Returns:
            Dictionary with statistics
        """
        logger.debug(f"Getting concept statistics for document: {document_id}")
        
        # TODO: Implement actual statistics calculation
        # For now, return mock data
        return {
            'total': 0,
            'validated': 0,
            'unvalidated': 0,
            'hierarchical': 0,
            'sequential': 0,
            'unclassified': 0,
            'avg_importance': 0.0,
            'with_embeddings': 0
        }


# Singleton instance
_concept_service: Optional[ConceptService] = None


def get_concept_service() -> ConceptService:
    """Get or create the singleton ConceptService instance"""
    global _concept_service
    if _concept_service is None:
        _concept_service = ConceptService()
    return _concept_service
