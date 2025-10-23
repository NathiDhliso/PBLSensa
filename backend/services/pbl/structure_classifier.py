"""
PBL Structure Classifier Service

Classifies relationships between concepts as hierarchical or sequential.
Uses pattern matching + Claude validation.

Integrated from backend/services/structure_classifier.py for PBL View.
"""

import re
import logging
from typing import List, Dict, Optional
from models.pbl_concept import Concept
from models.pbl_relationship import (
    Relationship,
    RelationshipType,
    StructureCategory,
    PatternMatchResult,
    RelationshipDetectionResult
)
from services.bedrock_client import BedrockAnalogyGenerator
import json

logger = logging.getLogger(__name__)


class StructureClassifier:
    """
    Classifies concept relationships as hierarchical or sequential.
    
    Uses a two-stage approach:
    1. Pattern matching on concept text
    2. Claude validation for refinement
    """
    
    def __init__(self, bedrock_client: Optional[BedrockAnalogyGenerator] = None):
        self.bedrock_client = bedrock_client or BedrockAnalogyGenerator()
        
        # Hierarchical patterns (expanded for better detection)
        self.hierarchical_patterns = [
            # Classification patterns
            r'\b(types? of|categories|kinds? of|forms? of|varieties of)\b',
            r'\b(classified as|categorized as|grouped as|organized as)\b',
            r'\b(taxonomy|classification|hierarchy|structure)\b',
            
            # Composition patterns
            r'\b(consists? of|includes?|contains?|comprises?|made up of)\b',
            r'\b(components?|parts?|elements?|constituents?|pieces?)\b',
            r'\b(divided into|broken down into|split into|separated into)\b',
            r'\b(composed of|formed by|built from|constructed from)\b',
            
            # Relationship patterns
            r'\b(is a|are|is an|are an)\b',
            r'\b(belongs? to|member of|instance of|example of)\b',
            r'\b(parent|child|subclass|superclass|subset|superset)\b',
            r'\b(inherits? from|derived from|extends?|based on)\b',
            
            # Structural patterns
            r'\b(layers?|levels?|tiers?|hierarchies)\b',
            r'\b(sub-|super-|parent-|child-)',
            r'\b(within|inside|under|above|below)\b'
        ]
        
        # Sequential patterns (expanded for better detection)
        self.sequential_patterns = [
            # Temporal order patterns
            r'\b(first|second|third|then|next|after|before|finally|lastly)\b',
            r'\b(initially|subsequently|eventually|ultimately)\b',
            r'\b(begins?|starts?|commences?|initiates?)\b',
            r'\b(ends?|concludes?|finishes?|terminates?|completes?)\b',
            
            # Process patterns
            r'\b(step \d+|phase \d+|stage \d+|part \d+)\b',
            r'\b(process|procedure|workflow|algorithm|sequence|method)\b',
            r'\b(operation|task|activity|action)\b',
            
            # Causal patterns
            r'\b(precedes?|follows?|succeeds?)\b',
            r'\b(leads? to|results? in|produces?|generates?)\b',
            r'\b(causes?|enables?|triggers?|initiates?|activates?)\b',
            r'\b(consequently|therefore|thus|hence|accordingly)\b',
            
            # Ordering patterns
            r'\b(temporal|chronological|sequential|ordered|serial)\b',
            r'\b(previous|prior|earlier|later|subsequent)\b',
            r'\b(during|while|when|as|upon)\b',
            r'\b(transition|progression|flow|cycle)\b'
        ]
    
    def classify_relationships(
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
        logger.info(f"Classifying {len(relationships)} relationships for {len(concepts)} concepts")
        
        # Create concept lookup
        concept_map = {str(c.id): c for c in concepts}
        
        classified_relationships = []
        
        for rel in relationships:
            # Get source and target concepts
            source = concept_map.get(str(rel.source_concept_id))
            target = concept_map.get(str(rel.target_concept_id))
            
            if not source or not target:
                logger.warning(f"Skipping relationship - concepts not found: {rel.source_concept_id} -> {rel.target_concept_id}")
                classified_relationships.append(rel)
                continue
            
            try:
                # Pattern matching
                pattern_result = self._match_patterns(source, target)
                
                # Claude validation
                validated = self._claude_validate_relationship(
                    source,
                    target,
                    pattern_result
                )
                
                # Update relationship
                rel.structure_category = validated['structure_category']
                rel.relationship_type = validated['relationship_type']
                rel.strength = validated.get('strength', rel.strength)
                
                logger.debug(f"Classified: {source.term} -> {target.term} as {rel.structure_category}/{rel.relationship_type}")
                
            except Exception as e:
                logger.error(f"Error classifying relationship {rel.source_concept_id} -> {rel.target_concept_id}: {e}")
                # Keep original relationship on error
            
            classified_relationships.append(rel)
        
        logger.info(f"Classification complete: {len(classified_relationships)} relationships processed")
        return classified_relationships
    
    def _match_patterns(
        self,
        source: Concept,
        target: Concept
    ) -> PatternMatchResult:
        """
        Match patterns in concept definitions and surrounding text.
        
        Returns:
            PatternMatchResult with category, confidence, and matched patterns
        """
        # Combine text for pattern matching
        source_text = f"{source.term} {source.definition} {' '.join(source.source_sentences)}"
        target_text = f"{target.term} {target.definition} {' '.join(target.source_sentences)}"
        combined_text = f"{source_text} {target_text}".lower()
        
        # Track matched patterns
        hierarchical_matches = []
        sequential_matches = []
        
        # Count hierarchical matches
        for pattern in self.hierarchical_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                hierarchical_matches.append(pattern)
        
        # Count sequential matches
        for pattern in self.sequential_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                sequential_matches.append(pattern)
        
        hierarchical_score = len(hierarchical_matches)
        sequential_score = len(sequential_matches)
        
        # Determine category with improved confidence scoring
        total_matches = hierarchical_score + sequential_score
        
        if hierarchical_score > sequential_score and hierarchical_score > 0:
            category = StructureCategory.HIERARCHICAL
            # Confidence based on dominance and absolute count
            dominance = hierarchical_score / (total_matches + 1)
            strength = min(hierarchical_score / 3.0, 1.0)  # Cap at 3 matches = 100%
            confidence = (dominance * 0.6) + (strength * 0.4)  # Weighted combination
            matched_patterns = hierarchical_matches
        elif sequential_score > hierarchical_score and sequential_score > 0:
            category = StructureCategory.SEQUENTIAL
            # Confidence based on dominance and absolute count
            dominance = sequential_score / (total_matches + 1)
            strength = min(sequential_score / 3.0, 1.0)  # Cap at 3 matches = 100%
            confidence = (dominance * 0.6) + (strength * 0.4)  # Weighted combination
            matched_patterns = sequential_matches
        else:
            category = StructureCategory.UNCLASSIFIED
            confidence = 0.0
            matched_patterns = []
        
        return PatternMatchResult(
            category=category,
            confidence=confidence,
            hierarchical_score=hierarchical_score,
            sequential_score=sequential_score,
            matched_patterns=matched_patterns
        )
    
    def _claude_validate_relationship(
        self,
        source: Concept,
        target: Concept,
        pattern_result: PatternMatchResult
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
            logger.error(f"Claude validation failed: {e}")
            # Fallback to pattern matching result
            return {
                'structure_category': pattern_result.category,
                'relationship_type': self._infer_relationship_type(pattern_result.category),
                'strength': pattern_result.confidence
            }
    
    def _build_validation_prompt(
        self,
        source: Concept,
        target: Concept,
        pattern_result: PatternMatchResult
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
Initial classification: {pattern_result.category}
Confidence: {pattern_result.confidence:.2f}
Matched patterns: {', '.join(pattern_result.matched_patterns[:3])}

**Your Task:**
Classify this relationship as:
1. **HIERARCHICAL** (classification, component, category, is-a, part-of)
2. **SEQUENTIAL** (process step, temporal order, cause-effect, precedes, enables)
3. **UNCLASSIFIED** (unrelated or weak connection)

If related, specify:
- **Relationship type**: Choose from:
  - Hierarchical: is_a, has_component, contains, category_of, part_of
  - Sequential: precedes, enables, results_in, follows, leads_to, causes, triggers
  - Other: applies_to, contrasts_with, similar_to, related_to
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
    
    def _call_claude(self, prompt: str) -> str:
        """Call Claude via Bedrock"""
        try:
            response = self.bedrock_client.invoke_claude(prompt, max_tokens=1000)
            return response
        except Exception as e:
            logger.error(f"Claude API call failed: {e}")
            raise
    
    def _parse_claude_response(self, response: str) -> Dict:
        """Parse Claude's JSON response"""
        try:
            data = json.loads(response)
            
            # Convert string to enum
            category_str = data.get('structure_category', 'unclassified')
            category = StructureCategory(category_str)
            
            rel_type_str = data.get('relationship_type', 'related_to')
            try:
                rel_type = RelationshipType(rel_type_str)
            except ValueError:
                rel_type = RelationshipType.RELATED_TO
            
            return {
                'structure_category': category,
                'relationship_type': rel_type,
                'strength': float(data.get('strength', 0.5)),
                'reasoning': data.get('reasoning', '')
            }
        except Exception as e:
            logger.error(f"Failed to parse Claude response: {e}")
            return {
                'structure_category': StructureCategory.UNCLASSIFIED,
                'relationship_type': RelationshipType.RELATED_TO,
                'strength': 0.5
            }
    
    def _infer_relationship_type(self, category: StructureCategory) -> RelationshipType:
        """Infer a default relationship type based on category"""
        if category == StructureCategory.HIERARCHICAL:
            return RelationshipType.IS_A
        elif category == StructureCategory.SEQUENTIAL:
            return RelationshipType.PRECEDES
        else:
            return RelationshipType.RELATED_TO
    
    def _shares_context(self, concept_a: Concept, concept_b: Concept) -> bool:
        """
        Check if two concepts share context (appear near each other).
        Enhanced with multiple context signals.
        """
        # Check if they have overlapping surrounding concepts
        surrounding_a = set(concept_a.surrounding_concepts)
        surrounding_b = set(concept_b.surrounding_concepts)
        overlap = surrounding_a.intersection(surrounding_b)
        has_shared_concepts = len(overlap) > 0
        
        # Check if they're on nearby pages
        nearby_pages = False
        if concept_a.page_number and concept_b.page_number:
            page_distance = abs(concept_a.page_number - concept_b.page_number)
            nearby_pages = page_distance <= 5
        
        # Check if they co-occur in same sentences
        same_sentence = False
        for sent_a in concept_a.source_sentences:
            for sent_b in concept_b.source_sentences:
                if sent_a == sent_b:
                    same_sentence = True
                    break
            if same_sentence:
                break
        
        # Check if one concept mentions the other in its definition or sentences
        mentions_each_other = False
        term_a_lower = concept_a.term.lower()
        term_b_lower = concept_b.term.lower()
        
        # Check if A mentions B
        a_text = f"{concept_a.definition} {' '.join(concept_a.source_sentences)}".lower()
        b_text = f"{concept_b.definition} {' '.join(concept_b.source_sentences)}".lower()
        
        if term_b_lower in a_text or term_a_lower in b_text:
            mentions_each_other = True
        
        # Return true if any context signal is present
        return has_shared_concepts or nearby_pages or same_sentence or mentions_each_other
    
    def _calculate_context_strength(self, concept_a: Concept, concept_b: Concept) -> float:
        """
        Calculate the strength of contextual relationship between two concepts.
        Returns a score from 0.0 to 1.0.
        """
        strength = 0.0
        
        # Shared surrounding concepts (up to 0.3)
        surrounding_a = set(concept_a.surrounding_concepts)
        surrounding_b = set(concept_b.surrounding_concepts)
        overlap = surrounding_a.intersection(surrounding_b)
        if overlap:
            overlap_ratio = len(overlap) / max(len(surrounding_a), len(surrounding_b), 1)
            strength += min(overlap_ratio * 0.3, 0.3)
        
        # Page proximity (up to 0.2)
        if concept_a.page_number and concept_b.page_number:
            page_distance = abs(concept_a.page_number - concept_b.page_number)
            if page_distance == 0:
                strength += 0.2
            elif page_distance <= 2:
                strength += 0.15
            elif page_distance <= 5:
                strength += 0.1
        
        # Same sentence co-occurrence (up to 0.3)
        for sent_a in concept_a.source_sentences:
            for sent_b in concept_b.source_sentences:
                if sent_a == sent_b:
                    strength += 0.3
                    break
        
        # Mutual mentions (up to 0.2)
        term_a_lower = concept_a.term.lower()
        term_b_lower = concept_b.term.lower()
        a_text = f"{concept_a.definition} {' '.join(concept_a.source_sentences)}".lower()
        b_text = f"{concept_b.definition} {' '.join(concept_b.source_sentences)}".lower()
        
        if term_b_lower in a_text or term_a_lower in b_text:
            strength += 0.2
        
        return min(strength, 1.0)
    
    def classify_concept_structure_type(self, concept: Concept) -> str:
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
            return StructureCategory.HIERARCHICAL.value
        elif sequential_score > hierarchical_score and sequential_score > 0:
            return StructureCategory.SEQUENTIAL.value
        else:
            return StructureCategory.UNCLASSIFIED.value
    
    def detect_relationships(
        self,
        concepts: List[Concept],
        min_strength: float = 0.3
    ) -> List[RelationshipDetectionResult]:
        """
        Detect potential relationships between concepts.
        Enhanced with context strength weighting.
        
        Args:
            concepts: List of concepts to analyze
            min_strength: Minimum confidence threshold
            
        Returns:
            List of detected relationships
        """
        logger.info(f"Detecting relationships for {len(concepts)} concepts")
        
        detected = []
        
        # Compare each pair of concepts
        for i, source in enumerate(concepts):
            for target in concepts[i+1:]:
                # Check if they share context
                if not self._shares_context(source, target):
                    continue
                
                # Calculate context strength
                context_strength = self._calculate_context_strength(source, target)
                
                # Pattern matching
                pattern_result = self._match_patterns(source, target)
                
                # Combine pattern confidence with context strength
                combined_confidence = (pattern_result.confidence * 0.7) + (context_strength * 0.3)
                
                if combined_confidence >= min_strength:
                    # Claude validation
                    validated = self._claude_validate_relationship(
                        source,
                        target,
                        pattern_result
                    )
                    
                    # Weight final strength with context
                    final_strength = (validated['strength'] * 0.8) + (context_strength * 0.2)
                    
                    if final_strength >= min_strength:
                        detected.append(RelationshipDetectionResult(
                            source_concept_id=source.id,
                            target_concept_id=target.id,
                            relationship_type=validated['relationship_type'],
                            structure_category=validated['structure_category'],
                            strength=final_strength,
                            reasoning=validated.get('reasoning'),
                            pattern_matched=', '.join(pattern_result.matched_patterns[:2])
                        ))
        
        logger.info(f"Detected {len(detected)} relationships (min_strength={min_strength})")
        return detected


# Singleton instance
_structure_classifier: Optional[StructureClassifier] = None


def get_structure_classifier() -> StructureClassifier:
    """Get or create the singleton StructureClassifier instance"""
    global _structure_classifier
    if _structure_classifier is None:
        _structure_classifier = StructureClassifier()
    return _structure_classifier
