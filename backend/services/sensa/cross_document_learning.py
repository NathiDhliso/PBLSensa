"""
Cross-Document Learning Service

Suggests relevant analogies from user's past documents for new concepts.
"""

from typing import List, Optional
from dataclasses import dataclass
from backend.models.concept import Concept
from backend.models.analogy import Analogy
from backend.services.sensa.analogy_service import AnalogyService


@dataclass
class AnalogyySuggestion:
    """A suggested analogy from past learning"""
    analogy: Analogy
    similarity_score: float
    suggestion_text: str
    source_concept_term: str


class CrossDocumentLearningService:
    """
    Service for suggesting analogies across documents.
    """
    
    def __init__(self, analogy_service: AnalogyService, db_connection=None):
        """
        Initialize the service.
        
        Args:
            analogy_service: AnalogyService instance
            db_connection: Database connection
        """
        self.analogy_service = analogy_service
        self.db = db_connection
    
    async def suggest_analogies_for_new_concept(
        self,
        user_id: str,
        new_concept: Concept
    ) -> List[AnalogyySuggestion]:
        """
        Find reusable analogies from past documents that might apply to a new concept.
        
        Args:
            user_id: User ID
            new_concept: The new concept to find analogies for
            
        Returns:
            List of analogy suggestions ranked by relevance
        """
        # 1. Find similar past concepts using semantic search
        similar_concepts = await self._find_similar_concepts(
            user_id,
            new_concept
        )
        
        # 2. Get analogies for those concepts
        past_analogies = []
        for concept in similar_concepts:
            analogies = await self.analogy_service.get_by_concept(concept['id'])
            # Only include reusable analogies
            reusable = [a for a in analogies if a.reusable]
            past_analogies.extend([
                {
                    'analogy': a,
                    'concept_term': concept['term'],
                    'similarity': concept['similarity']
                }
                for a in reusable
            ])
        
        # 3. Rank analogies by relevance
        ranked = self._rank_analogies(new_concept, past_analogies)
        
        # 4. Format as suggestions
        suggestions = []
        for item in ranked[:3]:  # Top 3 suggestions
            suggestion = AnalogyySuggestion(
                analogy=item['analogy'],
                similarity_score=item['score'],
                suggestion_text=self._generate_suggestion_text(
                    item['analogy'],
                    item['concept_term'],
                    new_concept.term
                ),
                source_concept_term=item['concept_term']
            )
            suggestions.append(suggestion)
        
        return suggestions
    
    async def _find_similar_concepts(
        self,
        user_id: str,
        new_concept: Concept,
        limit: int = 5
    ) -> List[dict]:
        """
        Find similar concepts from user's past documents using semantic search.
        
        Args:
            user_id: User ID
            new_concept: Concept to find similar concepts for
            limit: Maximum number of similar concepts to return
            
        Returns:
            List of similar concepts with similarity scores
        """
        # TODO: Replace with actual pgvector semantic search
        # SELECT c.id, c.term, c.definition, 
        #        1 - (c.embedding <=> %s) as similarity
        # FROM concepts c
        # JOIN analogies a ON c.id = a.concept_id
        # WHERE a.user_id = %s AND a.reusable = true
        # ORDER BY similarity DESC
        # LIMIT %s
        
        # Mock similar concepts for development
        return [
            {
                'id': 'concept-past-1',
                'term': 'Similar Concept 1',
                'definition': 'A concept similar to the new one',
                'similarity': 0.85
            },
            {
                'id': 'concept-past-2',
                'term': 'Similar Concept 2',
                'definition': 'Another related concept',
                'similarity': 0.78
            }
        ]
    
    def _rank_analogies(
        self,
        new_concept: Concept,
        past_analogies: List[dict]
    ) -> List[dict]:
        """
        Rank analogies by relevance to the new concept.
        
        Args:
            new_concept: The new concept
            past_analogies: List of past analogies with metadata
            
        Returns:
            Ranked list of analogies
        """
        ranked = []
        
        for item in past_analogies:
            analogy = item['analogy']
            concept_similarity = item['similarity']
            
            # Calculate relevance score
            score = self._calculate_relevance_score(
                analogy,
                concept_similarity,
                new_concept
            )
            
            ranked.append({
                'analogy': analogy,
                'concept_term': item['concept_term'],
                'score': score
            })
        
        # Sort by score descending
        ranked.sort(key=lambda x: x['score'], reverse=True)
        
        return ranked
    
    def _calculate_relevance_score(
        self,
        analogy: Analogy,
        concept_similarity: float,
        new_concept: Concept
    ) -> float:
        """
        Calculate how relevant an analogy is to a new concept.
        
        Factors:
        - Concept similarity (semantic)
        - Analogy strength (user rating)
        - Usage count (popularity)
        - Structure type match
        
        Returns:
            Relevance score (0.0 to 1.0)
        """
        # Weight factors
        similarity_weight = 0.5
        strength_weight = 0.3
        usage_weight = 0.1
        structure_weight = 0.1
        
        # Normalize strength (1-5 to 0-1)
        normalized_strength = (analogy.strength - 1) / 4
        
        # Normalize usage count (cap at 10)
        normalized_usage = min(analogy.usage_count, 10) / 10
        
        # Structure type match (1.0 if match, 0.5 if not)
        # TODO: Get source concept's structure type
        structure_match = 0.7  # Default
        
        # Calculate weighted score
        score = (
            concept_similarity * similarity_weight +
            normalized_strength * strength_weight +
            normalized_usage * usage_weight +
            structure_match * structure_weight
        )
        
        return score
    
    def _generate_suggestion_text(
        self,
        analogy: Analogy,
        source_concept_term: str,
        new_concept_term: str
    ) -> str:
        """
        Generate suggestion text explaining why this analogy might help.
        
        Args:
            analogy: The analogy
            source_concept_term: Term of the concept this analogy was created for
            new_concept_term: Term of the new concept
            
        Returns:
            Suggestion text
        """
        # Get the main tag
        main_tag = analogy.tags[0] if analogy.tags else 'an experience'
        
        return (
            f"You previously compared '{source_concept_term}' to {main_tag}. "
            f"This analogy might also help you understand '{new_concept_term}'."
        )
    
    async def apply_suggestion(
        self,
        user_id: str,
        suggestion: AnalogyySuggestion,
        new_concept_id: str
    ) -> Analogy:
        """
        Apply a suggested analogy to a new concept.
        
        Creates a new analogy based on the suggested one.
        
        Args:
            user_id: User ID
            suggestion: The suggestion to apply
            new_concept_id: ID of the new concept
            
        Returns:
            Newly created Analogy
        """
        from backend.models.analogy import AnalogyCreate
        
        # Create new analogy based on the suggestion
        new_analogy_data = AnalogyCreate(
            concept_id=new_concept_id,
            user_experience_text=suggestion.analogy.user_experience_text,
            strength=suggestion.analogy.strength,
            type=suggestion.analogy.type,
            reusable=True  # Keep it reusable
        )
        
        new_analogy = await self.analogy_service.create_analogy(
            user_id,
            new_analogy_data
        )
        
        # Increment usage count on original analogy
        await self.analogy_service.increment_usage(suggestion.analogy.id)
        
        return new_analogy
    
    async def get_cross_document_insights(
        self,
        user_id: str
    ) -> dict:
        """
        Get insights about user's cross-document learning patterns.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with insights
        """
        # Get all user's analogies
        all_analogies = await self.analogy_service.get_analogies(user_id)
        
        # Count reused analogies
        reused = [a for a in all_analogies if a.usage_count > 0]
        
        # Find most versatile analogy (used across most concepts)
        most_versatile = max(all_analogies, key=lambda a: a.usage_count, default=None)
        
        # Find most common tags in reusable analogies
        reusable = [a for a in all_analogies if a.reusable]
        tag_counts = {}
        for analogy in reusable:
            for tag in analogy.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        most_common_tags = sorted(
            tag_counts.keys(),
            key=lambda t: tag_counts[t],
            reverse=True
        )[:3]
        
        return {
            'total_analogies': len(all_analogies),
            'reusable_analogies': len(reusable),
            'reused_count': len(reused),
            'most_versatile_analogy_id': most_versatile.id if most_versatile else None,
            'most_versatile_usage_count': most_versatile.usage_count if most_versatile else 0,
            'most_common_domains': most_common_tags,
            'reuse_rate': len(reused) / len(all_analogies) if all_analogies else 0.0
        }
