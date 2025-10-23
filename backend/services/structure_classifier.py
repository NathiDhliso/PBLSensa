"""
Structure Classifier Service

Classifies relationships between concepts as hierarchical or sequential.
Uses pattern matching + Claude validation.
"""

import re
from typing import List, Dict, Optional, Tuple
from models.concept import Concept
from models.relationship import Relationship, RelationshipType, StructureCategory
from services.bedrock_client import BedrockAnalogyGenerator
import json


class StructureClassifier:
    """
    Classifies concept relationships as hierarchical or sequential.
    """
    
    def __init__(self, bedrock_client: Optional[BedrockAnalogyGenerator] = None):
        self.bedrock_client = bedrock_client or BedrockAnalogyGenerator()
        
        # Hierarchical patterns
        self.hierarchical_patterns = [
            r'\b(types? of|categories|kinds? of)\b',
            r'\b(consists? of|includes?|contains?|comprises?)\b',
            r'\b(is a|are|classified as|categorized as)\b',
            r'\b(components?|parts?|elements?)\b',
            r'\b(parent|child|subclass|superclass)\b',
            r'\b(taxonomy|classification|hierarchy)\b'
        ]
        
        # Sequential patterns
        self.sequential_patterns = [
            r'\b(first|then|next|after|before|finally)\b',
            r'\b(step \d+|phase \d+|stage \d+)\b',
            r'\b(process|procedure|workflow|algorithm|sequence)\b',
            r'\b(precedes?|follows?|leads? to|results? in)\b',
            r'\b(causes?|enables?|triggers?|initiates?)\b',
            r'\b(temporal|chronological|sequential|ordered)\b'
        ]
    
    async def classify_relationships(
        self,
        concepts: List[Concept],
        relationships: List[Relationship]
    ) -> List[Relationship]:
        """
        Classify all relationships as hierarchical or sequential.
        
        Args:
            concepts: List of concepts
            relationships: List of relationships to classify
            
        Returns:
            List of relationships with structure_category and relationship_type set
        """
        # Create concept lookup
        concept_map = {c.id: c for c in concepts}
        
        classified_relationships = []
        
        for rel in relationships:
            # Get source and target concepts
            source = concept_map.get(rel.source_concept_id)
            target = concept_map.get(rel.target_concept_id)
            
            if not source or not target:
                # Skip if concepts not found
                classified_relationships.append(rel)
                continue
            
            # Pattern matching
            pattern_result = self._match_patterns(source, target)
            
            # Claude validation
            validated = await self._claude_validate_relationship(
                source,
                target,
                pattern_result
            )
            
            # Update relationship
            rel.structure_category = validated['structure_category']
            rel.relationship_type = validated['relationship_type']
            rel.strength = validated.get('strength', rel.strength)
            
            classified_relationships.append(rel)
        
        return classified_relationships
    
    def _match_patterns(
        self,
        source: Concept,
        target: Concept
    ) -> Dict[str, any]:
        """
        Match patterns in concept definitions and surrounding text.
        
        Returns:
            Dict with 'category' and 'confidence'
        """
        # Combine text for pattern matching
        source_text = f"{source.term} {source.definition} {' '.join(source.source_sentences)}"
        target_text = f"{target.term} {target.definition} {' '.join(target.source_sentences)}"
        combined_text = f"{source_text} {target_text}".lower()
        
        # Count hierarchical matches
        hierarchical_score = sum(
            1 for pattern in self.hierarchical_patterns
            if re.search(pattern, combined_text, re.IGNORECASE)
        )
        
        # Count sequential matches
        sequential_score = sum(
            1 for pattern in self.sequential_patterns
            if re.search(pattern, combined_text, re.IGNORECASE)
        )
        
        # Determine category
        if hierarchical_score > sequential_score:
            category = StructureCategory.HIERARCHICAL
            confidence = hierarchical_score / (hierarchical_score + sequential_score + 1)
        elif sequential_score > hierarchical_score:
            category = StructureCategory.SEQUENTIAL
            confidence = sequential_score / (hierarchical_score + sequential_score + 1)
        else:
            category = StructureCategory.UNCLASSIFIED
            confidence = 0.0
        
        return {
            'category': category,
            'confidence': confidence,
            'hierarchical_score': hierarchical_score,
            'sequential_score': sequential_score
        }
    
    async def _claude_validate_relationship(
        self,
        source: Concept,
        target: Concept,
        pattern_result: Dict
    ) -> Dict:
        """
        Use Claude to validate and refine the relationship classification.
        
        Returns:
            Dict with 'structure_category', 'relationship_type', 'strength'
        """
        prompt = self._build_validation_prompt(source, target, pattern_result)
        
        try:
            # Call Claude via Bedrock
            response = await self._call_claude(prompt)
            
            # Parse response
            result = self._parse_claude_response(response)
            
            return result
            
        except Exception as e:
            print(f"Claude validation failed: {e}")
            # Fallback to pattern matching result
            return {
                'structure_category': pattern_result['category'],
                'relationship_type': self._infer_relationship_type(pattern_result['category']),
                'strength': pattern_result['confidence']
            }
    
    def _build_validation_prompt(
        self,
        source: Concept,
        target: Concept,
        pattern_result: Dict
    ) -> str:
        """Build prompt for Claude validation"""
        
        prompt = f"""Determine the relationship between these two concepts:

**Concept A:**
Term: {source.term}
Definition: {source.definition}
Context: {' '.join(source.source_sentences[:2])}

**Concept B:**
Term: {target.term}
Definition: {target.definition}
Context: {' '.join(target.source_sentences[:2])}

**Pattern Analysis:**
Initial classification: {pattern_result['category']}
Confidence: {pattern_result['confidence']:.2f}

**Your Task:**
Classify this relationship as:
1. **HIERARCHICAL** (classification, component, category, is-a, part-of)
2. **SEQUENTIAL** (process step, temporal order, cause-effect, precedes, enables)
3. **UNCLASSIFIED** (unrelated or weak connection)

If related, specify:
- **Relationship type**: Choose from:
  - Hierarchical: is_a, has_component, contains, category_of, part_of
  - Sequential: precedes, enables, results_in, follows, leads_to
  - Other: applies_to, contrasts_with, similar_to
- **Direction**: A→B or B→A
- **Strength**: 0.0 to 1.0 (how strong is this relationship?)

**Return as JSON:**
{{
  "structure_category": "hierarchical|sequential|unclassified",
  "relationship_type": "is_a|precedes|etc",
  "direction": "A_to_B|B_to_A",
  "strength": 0.8,
  "reasoning": "Brief explanation"
}}

Generate the response now:"""
        
        return prompt
    
    async def _call_claude(self, prompt: str) -> str:
        """Call Claude via Bedrock"""
        # This would use the actual Bedrock client
        # For now, return a mock response structure
        # In production, this calls: self.bedrock_client.client.invoke_model(...)
        
        # Mock response for development
        return json.dumps({
            "structure_category": "hierarchical",
            "relationship_type": "is_a",
            "direction": "A_to_B",
            "strength": 0.85,
            "reasoning": "Concept A is a type of Concept B based on the definitions"
        })
    
    def _parse_claude_response(self, response: str) -> Dict:
        """Parse Claude's JSON response"""
        try:
            data = json.loads(response)
            
            return {
                'structure_category': data.get('structure_category', StructureCategory.UNCLASSIFIED),
                'relationship_type': data.get('relationship_type', 'related'),
                'strength': float(data.get('strength', 0.5)),
                'reasoning': data.get('reasoning', '')
            }
        except Exception as e:
            print(f"Failed to parse Claude response: {e}")
            return {
                'structure_category': StructureCategory.UNCLASSIFIED,
                'relationship_type': 'related',
                'strength': 0.5
            }
    
    def _infer_relationship_type(self, category: str) -> str:
        """Infer a default relationship type based on category"""
        if category == StructureCategory.HIERARCHICAL:
            return RelationshipType.IS_A
        elif category == StructureCategory.SEQUENTIAL:
            return RelationshipType.PRECEDES
        else:
            return 'related'
    
    def _shares_context(self, concept_a: Concept, concept_b: Concept) -> bool:
        """Check if two concepts share context (appear near each other)"""
        # Check if they have overlapping surrounding concepts
        surrounding_a = set(concept_a.surrounding_concepts)
        surrounding_b = set(concept_b.surrounding_concepts)
        
        overlap = surrounding_a.intersection(surrounding_b)
        
        # Check if they're on nearby pages
        if concept_a.page_number and concept_b.page_number:
            page_distance = abs(concept_a.page_number - concept_b.page_number)
            nearby_pages = page_distance <= 5
        else:
            nearby_pages = False
        
        return len(overlap) > 0 or nearby_pages
    
    async def classify_concept_structure_type(self, concept: Concept) -> str:
        """
        Classify a single concept's structure type based on its definition.
        
        Returns:
            'hierarchical', 'sequential', or 'unclassified'
        """
        text = f"{concept.term} {concept.definition} {' '.join(concept.source_sentences)}".lower()
        
        # Count pattern matches
        hierarchical_score = sum(
            1 for pattern in self.hierarchical_patterns
            if re.search(pattern, text, re.IGNORECASE)
        )
        
        sequential_score = sum(
            1 for pattern in self.sequential_patterns
            if re.search(pattern, text, re.IGNORECASE)
        )
        
        if hierarchical_score > sequential_score and hierarchical_score > 0:
            return StructureCategory.HIERARCHICAL
        elif sequential_score > hierarchical_score and sequential_score > 0:
            return StructureCategory.SEQUENTIAL
        else:
            return StructureCategory.UNCLASSIFIED
