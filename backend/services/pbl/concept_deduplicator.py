"""
PBL Concept Deduplicator Service

Identifies and merges duplicate concepts using semantic similarity.
Leverages pgvector for efficient similarity search.
"""

import logging
from typing import List, Optional, Tuple
from uuid import UUID
from backend.models.pbl_concept import Concept, DuplicatePair, ConceptMergeRequest
import re

logger = logging.getLogger(__name__)


class ConceptDeduplicator:
    """
    Service for detecting and merging duplicate concepts.
    Uses semantic similarity via pgvector and pattern matching.
    """
    
    def __init__(self, db_connection=None):
        """
        Initialize the deduplicator service.
        
        Args:
            db_connection: Database connection (will be implemented with actual DB)
        """
        self.db = db_connection
        self.similarity_threshold = 0.95  # High threshold for duplicates
        logger.info("ConceptDeduplicator initialized")
    
    async def find_duplicates(
        self,
        document_id: UUID,
        similarity_threshold: float = 0.95
    ) -> List[DuplicatePair]:
        """
        Find potential duplicate concept pairs in a document.
        
        Uses both semantic similarity (embeddings) and pattern matching
        (abbreviations, synonyms).
        
        Args:
            document_id: ID of the document to check
            similarity_threshold: Minimum similarity score (0.0 to 1.0)
            
        Returns:
            List of potential duplicate pairs
        """
        logger.info(f"Finding duplicates for document: {document_id} (threshold: {similarity_threshold})")
        
        # TODO: Implement actual database query with pgvector
        # Query would be:
        # SELECT 
        #     c1.id as concept_a_id,
        #     c2.id as concept_b_id,
        #     1 - (c1.embedding <=> c2.embedding) as similarity
        # FROM concepts c1
        # JOIN concepts c2 ON c1.document_id = c2.document_id
        # WHERE c1.document_id = %s
        #   AND c1.id < c2.id  -- Avoid duplicates and self-comparison
        #   AND c1.merged_into IS NULL
        #   AND c2.merged_into IS NULL
        #   AND 1 - (c1.embedding <=> c2.embedding) >= %s
        # ORDER BY similarity DESC
        
        # For now, return empty list
        logger.debug("Duplicate detection not yet implemented (requires database)")
        return []
    
    def _calculate_similarity(
        self,
        concept_a: Concept,
        concept_b: Concept
    ) -> Tuple[float, str]:
        """
        Calculate similarity between two concepts.
        
        Combines:
        1. Cosine similarity of embeddings (if available)
        2. Pattern matching for abbreviations
        3. Term similarity (edit distance)
        
        Args:
            concept_a: First concept
            concept_b: Second concept
            
        Returns:
            Tuple of (similarity_score, reasoning)
        """
        # Check for abbreviation patterns
        if self._is_abbreviation(concept_a.term, concept_b.term):
            return (0.98, f"'{concept_a.term}' appears to be an abbreviation of '{concept_b.term}'")
        
        # Check for exact match (case-insensitive)
        if concept_a.term.lower() == concept_b.term.lower():
            return (1.0, "Exact term match (case-insensitive)")
        
        # If embeddings available, use cosine similarity
        if concept_a.embedding and concept_b.embedding:
            cosine_sim = self._cosine_similarity(concept_a.embedding, concept_b.embedding)
            
            # Also check term similarity for context
            term_sim = self._term_similarity(concept_a.term, concept_b.term)
            
            # Weighted combination
            combined_sim = (cosine_sim * 0.8) + (term_sim * 0.2)
            
            reasoning = f"Semantic similarity: {cosine_sim:.2f}, Term similarity: {term_sim:.2f}"
            return (combined_sim, reasoning)
        
        # Fallback to term similarity only
        term_sim = self._term_similarity(concept_a.term, concept_b.term)
        return (term_sim, f"Term similarity only (no embeddings): {term_sim:.2f}")
    
    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        
        Args:
            vec_a: First vector
            vec_b: Second vector
            
        Returns:
            Cosine similarity (0.0 to 1.0)
        """
        if len(vec_a) != len(vec_b):
            logger.warning(f"Vector length mismatch: {len(vec_a)} vs {len(vec_b)}")
            return 0.0
        
        # Dot product
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        
        # Magnitudes
        mag_a = sum(a * a for a in vec_a) ** 0.5
        mag_b = sum(b * b for b in vec_b) ** 0.5
        
        if mag_a == 0 or mag_b == 0:
            return 0.0
        
        # Cosine similarity
        similarity = dot_product / (mag_a * mag_b)
        
        # Normalize to 0-1 range (cosine can be -1 to 1)
        return (similarity + 1) / 2
    
    def _term_similarity(self, term_a: str, term_b: str) -> float:
        """
        Calculate term similarity using Levenshtein distance.
        
        Args:
            term_a: First term
            term_b: Second term
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        term_a = term_a.lower().strip()
        term_b = term_b.lower().strip()
        
        if term_a == term_b:
            return 1.0
        
        # Calculate Levenshtein distance
        distance = self._levenshtein_distance(term_a, term_b)
        
        # Normalize by max length
        max_len = max(len(term_a), len(term_b))
        if max_len == 0:
            return 0.0
        
        similarity = 1.0 - (distance / max_len)
        return max(0.0, similarity)
    
    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        """
        Calculate Levenshtein (edit) distance between two strings.
        
        Args:
            s1: First string
            s2: Second string
            
        Returns:
            Edit distance
        """
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                # Cost of insertions, deletions, or substitutions
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    def _is_abbreviation(self, term_a: str, term_b: str) -> bool:
        """
        Check if one term is an abbreviation of the other.
        
        Patterns checked:
        - Acronyms: VM vs Virtual Machine
        - Shortened forms: DB vs Database
        - With/without parentheses: Virtual Machine (VM) vs VM
        
        Args:
            term_a: First term
            term_b: Second term
            
        Returns:
            True if one is an abbreviation of the other
        """
        # Normalize
        a = term_a.strip()
        b = term_b.strip()
        
        # Check if one contains the other in parentheses
        # e.g., "Virtual Machine (VM)" contains "VM"
        paren_pattern = r'\(([^)]+)\)'
        
        a_match = re.search(paren_pattern, a)
        b_match = re.search(paren_pattern, b)
        
        if a_match:
            abbrev = a_match.group(1).strip()
            full_term = re.sub(paren_pattern, '', a).strip()
            if abbrev.lower() == b.lower() or full_term.lower() == b.lower():
                return True
        
        if b_match:
            abbrev = b_match.group(1).strip()
            full_term = re.sub(paren_pattern, '', b).strip()
            if abbrev.lower() == a.lower() or full_term.lower() == a.lower():
                return True
        
        # Check if shorter term is acronym of longer term
        shorter, longer = (a, b) if len(a) < len(b) else (b, a)
        
        # Must be significantly shorter to be an acronym
        if len(shorter) < 3 or len(longer) < len(shorter) * 2:
            return False
        
        # Check if shorter is acronym of longer
        words = longer.split()
        if len(words) >= len(shorter):
            acronym = ''.join(word[0] for word in words if word)
            if acronym.lower() == shorter.lower():
                return True
        
        return False
    
    async def merge_concepts(
        self,
        primary_id: UUID,
        duplicate_id: UUID
    ) -> Concept:
        """
        Merge two duplicate concepts.
        
        Process:
        1. Consolidate source_sentences and surrounding_concepts
        2. Update all relationships to point to primary concept
        3. Soft delete duplicate (set merged_into field)
        4. Return updated primary concept
        
        Args:
            primary_id: ID of the concept to keep
            duplicate_id: ID of the concept to merge and mark as duplicate
            
        Returns:
            Updated primary concept
        """
        logger.info(f"Merging concepts: {duplicate_id} -> {primary_id}")
        
        # TODO: Implement actual database operations
        # Steps:
        # 1. Get both concepts
        # 2. Merge source_sentences (unique)
        # 3. Merge surrounding_concepts (unique)
        # 4. Update relationships:
        #    UPDATE relationships 
        #    SET source_concept_id = primary_id 
        #    WHERE source_concept_id = duplicate_id
        #    
        #    UPDATE relationships 
        #    SET target_concept_id = primary_id 
        #    WHERE target_concept_id = duplicate_id
        # 5. Mark duplicate as merged:
        #    UPDATE concepts 
        #    SET merged_into = primary_id 
        #    WHERE id = duplicate_id
        # 6. Update primary concept with merged data
        # 7. Return updated primary concept
        
        logger.debug("Concept merging not yet implemented (requires database)")
        return None
    
    async def get_merge_preview(
        self,
        primary_id: UUID,
        duplicate_id: UUID
    ) -> dict:
        """
        Preview what would happen if concepts were merged.
        
        Args:
            primary_id: ID of the concept to keep
            duplicate_id: ID of the concept to merge
            
        Returns:
            Dict with merge preview data
        """
        logger.debug(f"Generating merge preview: {duplicate_id} -> {primary_id}")
        
        # TODO: Implement actual preview generation
        # Would show:
        # - Combined source_sentences
        # - Combined surrounding_concepts
        # - Affected relationships count
        # - Importance score (keep higher)
        
        return {
            'primary_concept': None,
            'duplicate_concept': None,
            'merged_source_sentences_count': 0,
            'merged_surrounding_concepts_count': 0,
            'affected_relationships_count': 0,
            'will_keep_importance_score': 0.0
        }
    
    async def undo_merge(
        self,
        merged_concept_id: UUID
    ) -> bool:
        """
        Undo a concept merge.
        
        Args:
            merged_concept_id: ID of the concept that was merged
            
        Returns:
            True if undo successful, False otherwise
        """
        logger.info(f"Undoing merge for concept: {merged_concept_id}")
        
        # TODO: Implement undo logic
        # Steps:
        # 1. Get the merged concept
        # 2. Check if it has merged_into set
        # 3. Restore the concept (set merged_into = NULL)
        # 4. Note: Relationships won't be restored automatically
        #    (would need to track original relationships)
        
        logger.debug("Undo merge not yet implemented (requires database)")
        return False
    
    async def get_duplicate_statistics(
        self,
        document_id: UUID
    ) -> dict:
        """
        Get statistics about duplicates in a document.
        
        Args:
            document_id: ID of the document
            
        Returns:
            Dict with duplicate statistics
        """
        logger.debug(f"Getting duplicate statistics for document: {document_id}")
        
        # TODO: Implement actual statistics calculation
        # Would include:
        # - Total concepts
        # - Potential duplicates found
        # - Merged concepts count
        # - Average similarity score
        
        return {
            'total_concepts': 0,
            'potential_duplicates': 0,
            'merged_concepts': 0,
            'avg_similarity_score': 0.0
        }


# Singleton instance
_concept_deduplicator: Optional[ConceptDeduplicator] = None


def get_concept_deduplicator() -> ConceptDeduplicator:
    """Get or create the singleton ConceptDeduplicator instance"""
    global _concept_deduplicator
    if _concept_deduplicator is None:
        _concept_deduplicator = ConceptDeduplicator()
    return _concept_deduplicator
