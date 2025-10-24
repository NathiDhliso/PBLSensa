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
    
    def extract_concepts(self, pdf_path: str, document_id: str) -> List[Concept]:
        """
        Extract concepts from a PDF document.
        
        Args:
            pdf_path: Path to the PDF file
            document_id: ID of the document in database
            
        Returns:
            List of extracted Concept objects
        """
        try:
            print(f"\n{'='*80}")
            print(f"🚀 STARTING CONCEPT EXTRACTION")
            print(f"{'='*80}")
            print(f"Document ID: {document_id}")
            print(f"PDF Path: {pdf_path}")
            logger.info(f"Starting concept extraction for document {document_id}")
            
            # Step 1: Parse PDF with positions
            print(f"\n📄 STEP 1: Parsing PDF...")
            text_chunks = self.pdf_parser.parse_pdf_with_positions(pdf_path)
            print(f"✅ Parsed {len(text_chunks)} chunks from PDF")
            logger.info(f"Parsed PDF into {len(text_chunks)} chunks")
            
            # Step 2: Extract concepts from each chunk using Claude
            print(f"\n🤖 STEP 2: Extracting concepts with Claude...")
            all_concepts = []
            import time
            
            for i, chunk in enumerate(text_chunks):
                print(f"  Processing chunk {i+1}/{len(text_chunks)} (page {chunk.page_number})...")
                logger.debug(f"Processing chunk {i+1}/{len(text_chunks)}")
                
                extracted_data = self._claude_extract_concepts(chunk)
                print(f"    → Extracted {len(extracted_data)} concepts from this chunk")
                
                # Convert to Concept objects with enrichment
                for concept_data in extracted_data:
                    concept = self._enrich_with_context(
                        concept_data,
                        chunk,
                        text_chunks,
                        document_id
                    )
                    all_concepts.append(concept)
                    print(f"      • {concept.term}")
                
                # Add delay between chunks to avoid rate limiting
                if i < len(text_chunks) - 1:  # Don't delay after last chunk
                    time.sleep(2.0)  # 2 second delay between chunks to avoid throttling
            
            print(f"\n✅ Total concepts extracted: {len(all_concepts)}")
            logger.info(f"Extracted {len(all_concepts)} concepts before deduplication")
            
            # Step 3: Basic deduplication (exact matches)
            print(f"\n🔄 STEP 3: Deduplicating concepts...")
            unique_concepts = self._deduplicate_exact_matches(all_concepts)
            print(f"✅ After deduplication: {len(unique_concepts)} unique concepts")
            logger.info(f"After deduplication: {len(unique_concepts)} unique concepts")
            
            # Print sample of concepts
            print(f"\n📋 SAMPLE OF EXTRACTED CONCEPTS:")
            for i, concept in enumerate(unique_concepts[:10]):
                print(f"  {i+1}. {concept.term}")
                print(f"     Definition: {concept.definition[:100]}...")
                print(f"     Page: {concept.page_number}, Importance: {concept.importance_score}")
            
            if len(unique_concepts) > 10:
                print(f"  ... and {len(unique_concepts) - 10} more concepts")
            
            # Step 4: Generate embeddings
            print(f"\n🔢 STEP 4: Generating embeddings...")
            concepts_with_embeddings = self._generate_embeddings(unique_concepts)
            
            success_count = sum(1 for c in concepts_with_embeddings if c.embedding is not None)
            print(f"✅ Generated embeddings for {success_count}/{len(concepts_with_embeddings)} concepts")
            
            print(f"\n{'='*80}")
            print(f"✅ CONCEPT EXTRACTION COMPLETE")
            print(f"{'='*80}")
            print(f"Total concepts: {len(concepts_with_embeddings)}")
            print(f"With embeddings: {success_count}")
            print(f"{'='*80}\n")
            
            return concepts_with_embeddings
            
        except Exception as e:
            print(f"\n❌ ERROR in concept extraction: {str(e)}")
            logger.error(f"Error extracting concepts: {str(e)}")
            raise
    
    def _claude_extract_concepts(self, chunk: TextChunk) -> List[ConceptExtractionData]:
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
            print(f"    🤖 Calling Claude API...")
            response = self._call_claude(prompt)
            print(f"    ✅ Claude response received ({len(response)} chars)")
            
            # Parse JSON response
            concepts = self._parse_claude_response(response)
            
            logger.debug(f"Extracted {len(concepts)} concepts from chunk")
            return concepts
            
        except Exception as e:
            print(f"    ❌ Claude extraction failed: {str(e)}")
            logger.error(f"Claude extraction failed: {str(e)}")
            # Return empty list on failure (graceful degradation)
            return []
    
    def _build_extraction_prompt(self, text: str) -> str:
        """
        Build prompt for Claude concept extraction using XML format.
        
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

<text_to_analyze>
{text}
</text_to_analyze>

Return your response using XML tags in this exact format:

<concepts>
  <concept>
    <term>Virtual Machine</term>
    <definition>A software emulation of a physical computer system that runs an operating system and applications</definition>
    <source_sentences>
      <sentence>A virtual machine (VM) is a software emulation of a physical computer.</sentence>
    </source_sentences>
  </concept>
</concepts>

Important:
- Use proper XML formatting with opening and closing tags
- Include 5-15 concepts per chunk
- Definitions should be 1-2 sentences
- Source sentences should be exact quotes from the text
- Wrap all concepts in a <concepts> root element

Begin your XML response:"""
        
        return prompt
    
    def _call_claude(self, prompt: str, max_retries: int = 8) -> str:
        """
        Call Claude via Bedrock with retry logic and exponential backoff.
        
        Args:
            prompt: Prompt to send to Claude
            max_retries: Maximum number of retry attempts (increased to 8 for better throttle handling)
            
        Returns:
            Claude's response text
        """
        import time
        from botocore.exceptions import ClientError
        
        for attempt in range(max_retries):
            try:
                response = self.bedrock_client.invoke_claude(prompt, max_tokens=4000)
                return response
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')
                
                # Handle throttling with exponential backoff
                if error_code == 'ThrottlingException' and attempt < max_retries - 1:
                    # More aggressive backoff: 2, 4, 8, 16, 32, 64, 120, 120 seconds
                    wait_time = min(2 ** (attempt + 1), 120)  # Max 2 minutes
                    print(f"    ⚠️  Throttled by AWS. Retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    logger.warning(f"Throttled by AWS. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"Claude API call failed: {e}")
                    raise
            except Exception as e:
                logger.error(f"Claude API call failed: {e}")
                raise
        
        raise Exception(f"Max retries ({max_retries}) exceeded for Claude API call")
    
    def _parse_claude_response(self, response: str) -> List[ConceptExtractionData]:
        """
        Parse Claude's XML response into ConceptExtractionData objects with fallback strategies.
        
        Args:
            response: XML string from Claude
            
        Returns:
            List of ConceptExtractionData objects
        """
        import xml.etree.ElementTree as ET
        import re
        
        # Strategy 1: Try strict XML parsing
        try:
            # Try to extract XML from response (Claude sometimes adds text before/after)
            xml_start = response.find('<concepts>')
            xml_end = response.rfind('</concepts>') + len('</concepts>')
            
            if xml_start != -1 and xml_end >= len('</concepts>'):
                xml_str = response[xml_start:xml_end]
                
                # Parse XML
                root = ET.fromstring(xml_str)
                
                concepts = []
                for concept_elem in root.findall('concept'):
                    try:
                        term_elem = concept_elem.find('term')
                        definition_elem = concept_elem.find('definition')
                        source_sentences_elem = concept_elem.find('source_sentences')
                        
                        term = term_elem.text.strip() if term_elem is not None and term_elem.text else ''
                        definition = definition_elem.text.strip() if definition_elem is not None and definition_elem.text else ''
                        
                        source_sentences = []
                        if source_sentences_elem is not None:
                            for sentence_elem in source_sentences_elem.findall('sentence'):
                                if sentence_elem.text:
                                    source_sentences.append(sentence_elem.text.strip())
                        
                        # Validate concept has required fields
                        if term and definition:
                            concept = ConceptExtractionData(
                                term=term,
                                definition=definition,
                                source_sentences=source_sentences
                            )
                            concepts.append(concept)
                        else:
                            logger.warning(f"Skipping invalid concept: term={term}, definition={definition}")
                            
                    except Exception as e:
                        logger.warning(f"Error parsing concept element: {str(e)}")
                        continue
                
                if concepts:
                    return concepts
                    
        except ET.ParseError as e:
            print(f"    ⚠️  XML parse error, trying fallback: {str(e)}")
            logger.warning(f"XML parse failed, trying regex fallback: {str(e)}")
        except Exception as e:
            print(f"    ⚠️  Parse error, trying fallback: {str(e)}")
            logger.warning(f"Parse error, trying fallback: {str(e)}")
        
        # Strategy 2: Regex extraction as fallback
        print(f"    🔄 Using regex fallback parser...")
        try:
            concepts = []
            
            # Pattern to match concept blocks
            concept_pattern = r'<concept>\s*<term>(.*?)</term>\s*<definition>(.*?)</definition>(?:\s*<source_sentences>(.*?)</source_sentences>)?'
            matches = re.findall(concept_pattern, response, re.DOTALL)
            
            for match in matches:
                term = match[0].strip()
                definition = match[1].strip()
                source_sentences_xml = match[2] if len(match) > 2 else ''
                
                # Extract sentences
                source_sentences = []
                if source_sentences_xml:
                    sentence_pattern = r'<sentence>(.*?)</sentence>'
                    sentences = re.findall(sentence_pattern, source_sentences_xml, re.DOTALL)
                    source_sentences = [s.strip() for s in sentences if s.strip()]
                
                if term and definition:
                    concept = ConceptExtractionData(
                        term=term,
                        definition=definition,
                        source_sentences=source_sentences
                    )
                    concepts.append(concept)
            
            if concepts:
                print(f"    ✅ Regex fallback extracted {len(concepts)} concepts")
                return concepts
                
        except Exception as e:
            print(f"    ❌ Regex fallback failed: {str(e)}")
            logger.error(f"Regex fallback failed: {str(e)}")
        
        # Strategy 3: Last resort - return empty and log for manual review
        print(f"    ❌ All parsing strategies failed")
        print(f"    Response preview: {response[:500]}...")
        logger.error(f"All parsing strategies failed. Response: {response[:1000]}")
        return []
    
    def _enrich_with_context(
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
        from datetime import datetime
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
            created_at=datetime.utcnow(),  # Set current timestamp
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
    
    def _generate_embeddings(self, concepts: List[Concept]) -> List[Concept]:
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
            # Prepare texts for embedding
            embedding_texts = [
                f"{concept.term}: {concept.definition}"
                for concept in concepts
            ]
            
            # Generate embeddings using embedding service
            from services.embedding_service import get_embedding_service
            embedding_service = get_embedding_service()
            
            embeddings = embedding_service.generate_embeddings_with_retry(
                embedding_texts,
                max_retries=3
            )
            
            # Assign embeddings to concepts
            for concept, embedding in zip(concepts, embeddings):
                concept.embedding = embedding
            
            success_count = sum(1 for e in embeddings if e is not None)
            logger.info(f"Generated embeddings for {success_count}/{len(concepts)} concepts")
            
            return concepts
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            # Return concepts without embeddings rather than failing
            for concept in concepts:
                concept.embedding = None
            return concepts
    
    def _call_titan_embeddings(self, text: str) -> Optional[List[float]]:
        """
        Call Bedrock Titan Embeddings API.
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            768-dimension embedding vector or None if failed
        """
        try:
            from services.embedding_service import get_embedding_service
            embedding_service = get_embedding_service()
            embedding = embedding_service.generate_embedding(text)
            return embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None


# Singleton instance
_concept_extractor_instance = None


def get_concept_extractor() -> ConceptExtractor:
    """Get singleton ConceptExtractor instance"""
    global _concept_extractor_instance
    if _concept_extractor_instance is None:
        _concept_extractor_instance = ConceptExtractor()
    return _concept_extractor_instance
