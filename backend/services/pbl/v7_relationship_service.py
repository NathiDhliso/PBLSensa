"""
V7 Relationship Service with RAG-Powered Detection
Uses pgvector semantic search for context-aware relationships.
"""

import logging
import json
from typing import List, Dict, Optional
from services.embedding_service import get_embedding_service
from models.pbl_concept import Concept
from models.pbl_relationship import Relationship

logger = logging.getLogger(__name__)


class RelationshipService:
    """
    Relationship service with RAG-powered detection.
    Uses pgvector to find related concepts before asking Claude.
    """
    
    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.db = None  # Will be injected
        self.bedrock_client = None  # Will be injected
    
    async def detect_relationships_v7(
        self,
        concept: Concept,
        all_concepts: List[Concept],
        document_id: str
    ) -> List[Relationship]:
        """
        Detect relationships using RAG workflow.
        
        Process:
            1. Generate embedding for concept
            2. Search pgvector for similar concepts
            3. Prioritize same chapter, expand if needed
            4. Build context with top 10 related concepts
            5. Ask Claude to analyze relationships
            6. Store with similarity scores
        """
        logger.info(f"Detecting relationships for concept: {concept.term}")
        
        # Step 1: Generate embedding
        concept_embedding = self.embedding_service.generate_embedding(
            concept.term + " " + concept.definition
        )
        
        # Step 2: Semantic search for related concepts
        # Note: Searching across all concepts since structure_id is not stored on Concept model
        related_concepts = await self._semantic_search(
            embedding=concept_embedding,
            document_id=document_id,
            chapter_id=None,  # Search all chapters
            exclude_concept_id=concept.id,
            top_k=10
        )
        
        logger.info(f"Found {len(related_concepts)} related concepts")
        
        # Step 4: Build context for Claude
        context = self._build_relationship_context(concept, related_concepts)
        
        # Step 5: Ask Claude to analyze
        relationships = await self._claude_analyze_relationships(context, concept)
        
        # Step 6: Enrich with similarity scores
        for rel in relationships:
            # Find the similarity score from semantic search
            related = next(
                (r for r in related_concepts if r['concept_id'] == rel.target_concept_id),
                None
            )
            if related:
                rel.similarity_score = related['similarity']
                rel.confidence = (rel.claude_confidence + related['similarity']) / 2
        
        logger.info(f"Detected {len(relationships)} relationships")
        return relationships
    
    async def _semantic_search(
        self,
        embedding: List[float],
        document_id: str,
        chapter_id: Optional[str],
        exclude_concept_id: str,
        top_k: int = 10
    ) -> List[Dict]:
        """
        Search for semantically similar concepts using pgvector.
        
        Returns:
            List of {concept_id, term, definition, similarity, structure_id}
        """
        # Convert embedding to string format for SQL
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        if chapter_id:
            query = """
                SELECT 
                    id,
                    term,
                    definition,
                    structure_id,
                    1 - (embedding <=> %s::vector) as similarity
                FROM concepts
                WHERE document_id = %s
                    AND id != %s
                    AND structure_id LIKE %s || '%%'
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """
            params = [embedding_str, document_id, exclude_concept_id, chapter_id, embedding_str, top_k]
        else:
            query = """
                SELECT 
                    id,
                    term,
                    definition,
                    structure_id,
                    1 - (embedding <=> %s::vector) as similarity
                FROM concepts
                WHERE document_id = %s
                    AND id != %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """
            params = [embedding_str, document_id, exclude_concept_id, embedding_str, top_k]
        
        try:
            results = await self.db.fetch_all(query, params)
            
            return [
                {
                    'concept_id': row['id'],
                    'term': row['term'],
                    'definition': row['definition'],
                    'structure_id': row['structure_id'],
                    'similarity': row['similarity']
                }
                for row in results
            ]
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []
    
    def _build_relationship_context(
        self,
        main_concept: Concept,
        related_concepts: List[Dict]
    ) -> str:
        """
        Build context string for Claude with main concept and related concepts.
        """
        context = f"""
Main Concept:
Term: {main_concept.term}
Definition: {main_concept.definition}
Type: {main_concept.structure_type}

Related Concepts Found (by semantic similarity):
"""
        
        for i, related in enumerate(related_concepts, 1):
            context += f"""
{i}. {related['term']} (similarity: {related['similarity']:.2f})
   Definition: {related['definition']}
"""
        
        return context
    
    async def _claude_analyze_relationships(
        self, 
        context: str,
        main_concept: Concept
    ) -> List[Relationship]:
        """
        Ask Claude to analyze relationships with full context.
        """
        prompt = f"""
Analyze the relationships between the main concept and the related concepts provided.

{context}

For each related concept, determine:
1. Is there a meaningful relationship? (yes/no)
2. What type of relationship? (is_a, has_component, precedes, enables, contains, etc.)
3. What is the direction? (main→related or related→main)
4. How strong is the relationship? (0.0-1.0)
5. Brief explanation of the relationship

Return as JSON array:
[
  {{
    "related_term": "...",
    "has_relationship": true/false,
    "type": "...",
    "direction": "forward/backward",
    "strength": 0.0-1.0,
    "explanation": "..."
  }}
]
"""
        
        try:
            response = await self.bedrock_client.invoke_claude(prompt)
            relationships_data = json.loads(response)
            
            # Convert to Relationship objects
            relationships = []
            for data in relationships_data:
                if not data.get('has_relationship', False):
                    continue
                
                rel = Relationship(
                    source_concept_id=main_concept.id if data['direction'] == 'forward' else data.get('related_concept_id'),
                    target_concept_id=data.get('related_concept_id') if data['direction'] == 'forward' else main_concept.id,
                    relationship_type=data['type'],
                    strength=data['strength'],
                    claude_confidence=data['strength'],
                    explanation=data.get('explanation', '')
                )
                relationships.append(rel)
            
            return relationships
        except Exception as e:
            logger.error(f"Claude relationship analysis failed: {e}")
            return []


def get_relationship_service() -> RelationshipService:
    """Factory function to get RelationshipService instance"""
    return RelationshipService()
