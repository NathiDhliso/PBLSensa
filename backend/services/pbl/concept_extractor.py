"""
Concept Extractor Service

Extracts domain-specific concepts from PDF documents using Claude AI.
"""

import json
import logging
from typing import List, Dict, Optional
from uuid import uuid4
from models.pbl_concept import Concept, ConceptExtractionData, TextChunk
from services.bedrock_client import BedrockAnalogyGenerator
from services.pbl.pdf_parser import get_pdf_parser

logger = logging.getLogger(__name__)


class ConceptExtractor:
    """
    Service for extracting concepts from PDF documents.
    """
    
    def __init__(self, bedrock_client: Optional[BedrockAnalogyGenerator] = None):
        self.bedrock_client = bedrock_client or BedrockAnalogyGenerator()
        self.pdf_parser = get_pdf_parser()
    
    async def extract_concepts(self, pdf_path: str, document_id: str) -> List[Concept]:
        """
        Extract concepts from a PDF document.
        
        Args:
            pdf_path: Path to the PDF file
            document_id: ID of the document in database
            
        Returns:
            List of extracted Concept objects
        """
        try:
            logger.info(f"Starting concept extraction for document {document_id}")
            
            # Step 1: Parse PDF with positions
            text_chunks = await self.pdf_parser.parse_pdf_with_positions(pdf_path)
            logger.info(f"Parsed PDF into {len(text_chunks)} chunks")
            
            # Step 2: Extract concepts from each chunk using Claude
            all_concepts = []
            for i, chunk in enumerate(text_chunks):
                logger.debug(f"Processing chunk {i+1}/{len(text_chunks)}")
                
                extracted_data = await self._claude_extract_concepts(chunk)
                
                # Convert to Concept objects with enrichment
                for concept_data in extracted_data:
                    concept = await self._enrich_with_context(
                        concept_data,
                        chunk,
                        text_chunks,
                        document_id
                    )
                    all_concepts.append(concept)
            
            logger.info(f"Extracted {len(all_concepts)} concepts before deduplication")
            
            # Step 3: Basic deduplication (exact matches)
            unique_concepts = self._deduplicate_exact_matches(all_concepts)
            logger.info(f"After deduplication: {len(unique_concepts)} unique concepts")
            
            # Step 4: Generate embeddings (will be done in separate task)
            # concepts_with_embeddings = await self._generate_embeddings(unique_concepts)
            
            return unique_concepts
            
        except Exception as e:
            logger.error(f"Error extracting concepts: {str(e)}")
            raise
    
    async def _claude_extract_concepts(self, chunk: TextChunk) -> List[ConceptExtractionData]:
        """
        Use Claude to extract concepts from a text chunk.
        
        Args:
            chunk: Text chunk to process
            
        Returns:
            List of ConceptExtractionData objects
        """
        prompt = self._build_extraction_prompt(chunk.text)
        
        try:
            # Call Claude via Bedrock
            response = await self._call_claude(prompt)
            
            # Parse JSON response
            concepts = self._parse_claude_response(response)
            
            logger.debug(f"Extracted {len(concepts)} concepts from chunk")
            return concepts
            
        except Exception as e:
            logger.error(f"Claude extraction failed: {str(e)}")
            # Return empty list on failure (graceful degradation)
            return []
    
    def _build_extraction_prompt(self, text: str) -> str:
        """
        Build prompt for Claude concept extraction.
        
        Args:
            text: Text to extract concepts from
            
        Returns:
            Formatted prompt string
        """
        prompt = f"""Analyze this textbook excerpt and extract key domain concepts.

For each concept, provide:
1. The exact term (as it appears in the text)
2. A clear, concise definition based on the text
3. The source sentence(s) that define or explain it

Focus on:
- Key terms that are defined or explained
- Technical concepts specific to this domain
- Important processes, methodologies, or frameworks
- Skip common words, general terms, and pronouns

Text to analyze:
{text}

Return ONLY a JSON array in this exact format:
[
  {{
    "term": "Virtual Machine",
    "definition": "A software emulation of a physical computer system that runs an operating system and applications",
    "source_sentences": ["A virtual machine (VM) is a software emulation of a physical computer."]
  }}
]

Important:
- Return valid JSON only, no additional text
- Include 5-15 concepts per chunk
- Definitions should be 1-2 sentences
- Source sentences should be exact quotes from the text

JSON array:"""
        
        return prompt
    
    async def _call_claude(self, prompt: str) -> str:
        """
        Call Claude via Bedrock.
        
        Args:
            prompt: Prompt to send to Claude
            
        Returns:
            Claude's response text
        """
        # TODO: Implement actual Bedrock call
        # For now, return mock response for development
        
        # In production, this would be:
        # response = await self.bedrock_client.generate_text(prompt)
        # return response
        
        # Mock response for development
        logger.warning("Using mock Claude response - implement Bedrock integration")
        return json.dumps([
            {
                "term": "Example Concept",
                "definition": "A placeholder concept for development",
                "source_sentences": ["This is an example sentence."]
            }
        ])
    
    def _parse_claude_response(self, response: str) -> List[ConceptExtractionData]:
        """
        Parse Claude's JSON response into ConceptExtractionData objects.
        
        Args:
            response: JSON string from Claude
            
        Returns:
            List of ConceptExtractionData objects
        """
        try:
            # Parse JSON
            data = json.loads(response)
            
            if not isinstance(data, list):
                logger.error("Claude response is not a JSON array")
                return []
            
            concepts = []
            for item in data:
                try:
                    concept = ConceptExtractionData(
                        term=item.get('term', '').strip(),
                        definition=item.get('definition', '').strip(),
                        source_sentences=item.get('source_sentences', [])
                    )
                    
                    # Validate concept has required fields
                    if concept.term and concept.definition:
                        concepts.append(concept)
                    else:
                        logger.warning(f"Skipping invalid concept: {item}")
                        
                except Exception as e:
                    logger.warning(f"Error parsing concept item: {str(e)}")
                    continue
            
            return concepts
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Error parsing Claude response: {str(e)}")
            return []
    
    async def _enrich_with_context(
        self,
        concept_data: ConceptExtractionData,
        current_chunk: TextChunk,
        all_chunks: List[TextChunk],
        document_id: str
    ) -> Concept:
        """
        Enrich concept with context and metadata.
        
        Args:
            concept_data: Raw concept data from Claude
            current_chunk: The chunk this concept was extracted from
            all_chunks: All chunks for finding surrounding concepts
            document_id: Document ID
            
        Returns:
            Enriched Concept object
        """
        # Find surrounding concepts in the same chunk
        surrounding_concepts = self._find_nearby_concepts(
            concept_data.term,
            current_chunk,
            all_chunks
        )
        
        # Calculate importance score based on frequency and position
        importance_score = self._calculate_importance(
            concept_data.term,
            current_chunk,
            all_chunks
        )
        
        # Create Concept object
        concept = Concept(
            id=str(uuid4()),
            document_id=document_id,
            term=concept_data.term,
            definition=concept_data.definition,
            source_sentences=concept_data.source_sentences,
            page_number=current_chunk.page_number,
            surrounding_concepts=surrounding_concepts,
            structure_type=None,  # Will be set by StructureClassifier
            embedding=None,  # Will be set by embedding generator
            importance_score=importance_score,
            validated=False,
            merged_into=None,
            created_at=None,  # Will be set by database
            updated_at=None
        )
        
        return concept
    
    def _find_nearby_concepts(
        self,
        term: str,
        current_chunk: TextChunk,
        all_chunks: List[TextChunk]
    ) -> List[str]:
        """
        Find concepts that appear near this term.
        
        Args:
            term: The concept term
            current_chunk: Current text chunk
            all_chunks: All chunks
            
        Returns:
            List of nearby concept terms
        """
        # Simple implementation: find capitalized terms near the concept
        # In production, this would be more sophisticated
        
        nearby = []
        text = current_chunk.text
        
        # Find position of term in text
        term_pos = text.lower().find(term.lower())
        if term_pos == -1:
            return []
        
        # Get context window (500 chars before and after)
        start = max(0, term_pos - 500)
        end = min(len(text), term_pos + len(term) + 500)
        context = text[start:end]
        
        # Find capitalized words (potential concepts)
        words = context.split()
        for word in words:
            # Skip the term itself
            if word.lower() == term.lower():
                continue
            
            # Check if word is capitalized and not common
            if word and word[0].isupper() and len(word) > 3:
                cleaned = word.strip('.,;:!?()"\'')
                if cleaned and cleaned not in nearby:
                    nearby.append(cleaned)
        
        return nearby[:10]  # Limit to 10 surrounding concepts
    
    def _calculate_importance(
        self,
        term: str,
        current_chunk: TextChunk,
        all_chunks: List[TextChunk]
    ) -> float:
        """
        Calculate importance score for a concept.
        
        Args:
            term: Concept term
            current_chunk: Current chunk
            all_chunks: All chunks
            
        Returns:
            Importance score (0.0 to 1.0)
        """
        # Count occurrences across all chunks
        total_occurrences = 0
        for chunk in all_chunks:
            total_occurrences += chunk.text.lower().count(term.lower())
        
        # Normalize to 0-1 scale (cap at 10 occurrences = 1.0)
        frequency_score = min(total_occurrences / 10.0, 1.0)
        
        # Boost score if appears early in document
        position_score = 1.0 - (current_chunk.page_number / max(len(all_chunks), 1))
        position_score = max(position_score, 0.3)  # Minimum 0.3
        
        # Combine scores (70% frequency, 30% position)
        importance = (frequency_score * 0.7) + (position_score * 0.3)
        
        return round(importance, 2)
    
    def _deduplicate_exact_matches(self, concepts: List[Concept]) -> List[Concept]:
        """
        Remove exact duplicate concepts (same term).
        
        Args:
            concepts: List of concepts
            
        Returns:
            List of unique concepts
        """
        seen_terms = {}
        unique_concepts = []
        
        for concept in concepts:
            term_lower = concept.term.lower()
            
            if term_lower not in seen_terms:
                seen_terms[term_lower] = concept
                unique_concepts.append(concept)
            else:
                # Merge source sentences and surrounding concepts
                existing = seen_terms[term_lower]
                existing.source_sentences.extend(concept.source_sentences)
                existing.surrounding_concepts.extend(concept.surrounding_concepts)
                
                # Remove duplicates
                existing.source_sentences = list(set(existing.source_sentences))
                existing.surrounding_concepts = list(set(existing.surrounding_concepts))
                
                # Update importance score (take max)
                existing.importance_score = max(
                    existing.importance_score,
                    concept.importance_score
                )
        
        return unique_concepts
    
    async def _generate_embeddings(self, concepts: List[Concept]) -> List[Concept]:
        """
        Generate vector embeddings for concepts using Bedrock Titan.
        
        Uses Amazon Titan Embeddings model to generate 768-dimension vectors
        for semantic similarity search.
        
        Args:
            concepts: List of concepts
            
        Returns:
            Concepts with embeddings populated
        """
        if not concepts:
            return concepts
        
        logger.info(f"Generating embeddings for {len(concepts)} concepts")
        
        try:
            # Batch process concepts for efficiency
            batch_size = 25  # Titan supports batch processing
            concepts_with_embeddings = []
            
            for i in range(0, len(concepts), batch_size):
                batch = concepts[i:i + batch_size]
                
                # Generate embeddings for batch
                for concept in batch:
                    try:
                        # Create text for embedding (term + definition)
                        embedding_text = f"{concept.term}: {concept.definition}"
                        
                        # Generate embedding
                        embedding = await self._call_titan_embeddings(embedding_text)
                        
                        # Update concept with embedding
                        concept.embedding = embedding
                        concepts_with_embeddings.append(concept)
                        
                    except Exception as e:
                        logger.error(f"Failed to generate embedding for concept '{concept.term}': {e}")
                        # Keep concept without embedding
                        concept.embedding = None
                        concepts_with_embeddings.append(concept)
                
                logger.debug(f"Processed batch {i//batch_size + 1}/{(len(concepts) + batch_size - 1)//batch_size}")
            
            logger.info(f"Generated embeddings for {sum(1 for c in concepts_with_embeddings if c.embedding)} concepts")
            return concepts_with_embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            # Return concepts without embeddings rather than failing
            return concepts
    
    async def _call_titan_embeddings(self, text: str) -> List[float]:
        """
        Call Bedrock Titan Embeddings API.
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            768-dimension embedding vector
        """
        # TODO: Implement actual Bedrock Titan Embeddings API call
        # Model: amazon.titan-embed-text-v1
        # Request format:
        # {
        #     "inputText": text
        # }
        # Response format:
        # {
        #     "embedding": [float array of 768 dimensions]
        # }
        
        # For now, return None to indicate not implemented
        # This will be implemented when Bedrock client is fully integrated
        logger.debug(f"Titan embeddings call (mocked) for text: {text[:50]}...")
        return None


# Singleton instance
_concept_extractor_instance = None


def get_concept_extractor() -> ConceptExtractor:
    """Get singleton ConceptExtractor instance"""
    global _concept_extractor_instance
    if _concept_extractor_instance is None:
        _concept_extractor_instance = ConceptExtractor()
    return _concept_extractor_instance
