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

    # ==================== V7.0 ENHANCEMENTS ====================
    
    def __init_v7_models(self):
        """Lazy initialize v7 ensemble models"""
        if not hasattr(self, '_keybert_model'):
            self._keybert_model = None
            self._yake_extractor = None
            self._spacy_nlp = None
    
    async def extract_concepts_v7(
        self, 
        text: str,
        document_id: UUID,
        structure_id: Optional[str] = None,
        structure_type: str = 'unclassified',
        top_n: int = 20
    ) -> List[Concept]:
        """
        V7.0 ensemble concept extraction using KeyBERT + YAKE + spaCy.
        
        Process:
            1. Run all three methods in parallel
            2. Combine with voting (require 2+ method agreement)
            3. Calculate confidence scores
            4. Generate definitions with Claude for high-confidence only
        
        Args:
            text: Text to extract concepts from
            document_id: Document ID
            structure_id: Location in hierarchy (e.g., "chapter_1_section_2")
            structure_type: Type of structure ('hierarchical', 'sequential', 'unclassified')
            top_n: Number of concepts to extract
        
        Returns:
            List of Concept objects with confidence scores
        """
        import asyncio
        
        self.__init_v7_models()
        
        logger.info(f"Extracting concepts with v7 ensemble (top_n={top_n})")
        
        # Run all three methods in parallel
        keybert_results, yake_results, spacy_results = await asyncio.gather(
            self._extract_with_keybert(text, top_n),
            self._extract_with_yake(text, top_n),
            self._extract_with_spacy(text, top_n)
        )
        
        # Combine with voting
        combined = self._combine_with_voting(
            keybert_results,
            yake_results,
            spacy_results
        )
        
        # Filter to high-confidence (2+ methods)
        high_confidence = [c for c in combined if c['methods_found'] >= 2]
        high_confidence.sort(key=lambda x: x['confidence'], reverse=True)
        top_concepts = high_confidence[:top_n]
        
        logger.info(f"Found {len(top_concepts)} high-confidence concepts")
        
        # Create Concept objects (definitions would be generated by Claude in production)
        concepts = []
        for item in top_concepts:
            concept_create = ConceptCreate(
                document_id=document_id,
                term=item['term'],
                definition=f"Definition for {item['term']}",  # TODO: Generate with Claude
                source_sentences=[],
                page_number=1,  # Default to page 1 (validation requires >= 1)
                surrounding_concepts=[],
                structure_type=structure_type,
                importance_score=item['confidence']
            )
            
            # Note: V7 fields (confidence, methods_found, extraction_methods, structure_id) 
            # would be stored in a separate v7_metadata table in production
            
            created_concept = await self.create(concept_create)
            concepts.append(created_concept)
        
        return concepts
    
    async def _extract_with_keybert(self, text: str, top_n: int):
        """KeyBERT: Semantic extraction"""
        if not self._keybert_model:
            try:
                from keybert import KeyBERT
                self._keybert_model = KeyBERT()
                logger.info("KeyBERT model loaded")
            except ImportError:
                logger.error("KeyBERT not installed")
                return []
        
        try:
            keywords = self._keybert_model.extract_keywords(
                text,
                keyphrase_ngram_range=(1, 3),
                stop_words='english',
                top_n=top_n,
                use_mmr=True,
                diversity=0.5
            )
            return keywords
        except Exception as e:
            logger.error(f"KeyBERT extraction failed: {e}")
            return []
    
    async def _extract_with_yake(self, text: str, top_n: int):
        """YAKE: Statistical extraction"""
        if not self._yake_extractor:
            try:
                import yake
                self._yake_extractor = yake.KeywordExtractor(
                    lan="en",
                    n=3,
                    dedupLim=0.9,
                    top=top_n
                )
                logger.info("YAKE extractor loaded")
            except ImportError:
                logger.error("YAKE not installed")
                return []
        
        try:
            keywords = self._yake_extractor.extract_keywords(text)
            # Invert scores (YAKE lower = better)
            inverted = [(term, 1 - min(score, 1.0)) for term, score in keywords]
            return inverted
        except Exception as e:
            logger.error(f"YAKE extraction failed: {e}")
            return []
    
    async def _extract_with_spacy(self, text: str, top_n: int):
        """spaCy TextRank: Graph-based extraction"""
        if not self._spacy_nlp:
            try:
                import spacy
                import pytextrank
                
                self._spacy_nlp = spacy.load("en_core_web_sm")
                self._spacy_nlp.add_pipe("textrank")
                logger.info("spaCy with TextRank loaded")
            except (ImportError, OSError) as e:
                logger.error(f"spaCy setup failed: {e}")
                return []
        
        try:
            doc = self._spacy_nlp(text)
            keywords = [
                (phrase.text, phrase.rank) 
                for phrase in doc._.phrases[:top_n]
            ]
            return keywords
        except Exception as e:
            logger.error(f"spaCy extraction failed: {e}")
            return []
    
    def _combine_with_voting(self, keybert_results, yake_results, spacy_results):
        """Combine results with voting algorithm"""
        keyword_scores = {}
        
        # Add results from all methods
        for term, score in keybert_results:
            term_lower = term.lower()
            if term_lower not in keyword_scores:
                keyword_scores[term_lower] = {
                    'term': term,
                    'scores': [],
                    'methods': []
                }
            keyword_scores[term_lower]['scores'].append(score)
            keyword_scores[term_lower]['methods'].append('keybert')
        
        for term, score in yake_results:
            term_lower = term.lower()
            if term_lower not in keyword_scores:
                keyword_scores[term_lower] = {
                    'term': term,
                    'scores': [],
                    'methods': []
                }
            keyword_scores[term_lower]['scores'].append(score)
            keyword_scores[term_lower]['methods'].append('yake')
        
        for term, score in spacy_results:
            term_lower = term.lower()
            if term_lower not in keyword_scores:
                keyword_scores[term_lower] = {
                    'term': term,
                    'scores': [],
                    'methods': []
                }
            keyword_scores[term_lower]['scores'].append(score)
            keyword_scores[term_lower]['methods'].append('spacy')
        
        # Calculate final scores
        combined = []
        for term_lower, data in keyword_scores.items():
            avg_score = sum(data['scores']) / len(data['scores'])
            methods_found = len(data['methods'])
            
            # Boost confidence if multiple methods agree
            confidence = avg_score * (methods_found / 3.0)
            
            combined.append({
                'term': data['term'],
                'confidence': confidence,
                'methods_found': methods_found,
                'methods': data['methods']
            })
        
        logger.info(f"Combined {len(combined)} unique terms from ensemble")
        return combined


# Singleton instance
_concept_service: Optional[ConceptService] = None


def get_concept_service() -> ConceptService:
    """Get or create the singleton ConceptService instance"""
    global _concept_service
    if _concept_service is None:
        _concept_service = ConceptService()
    return _concept_service
