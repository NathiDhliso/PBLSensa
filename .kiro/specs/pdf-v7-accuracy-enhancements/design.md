# PDF v7.0 Accuracy Enhancements - Design Document

## Overview

This document outlines the technical design for v7.0 accuracy enhancements to the PDF processing pipeline. The design focuses on:

1. **Multi-method parsing** with intelligent fallback chains
2. **Ensemble extraction** using 3 complementary algorithms
3. **RAG-powered relationships** with semantic context
4. **Structure preservation** from source documents
5. **Code reuse** extending existing services
6. **Cost optimization** with smart method selection

### Design Principles

- **Extend, Don't Replace**: Build on existing PDFParser, ConceptExtractor, Layer0Cache
- **Graceful Degradation**: Each fallback maintains functionality
- **Performance First**: Parallel processing, caching, efficient algorithms
- **Cost Conscious**: Intelligent method selection based on document type
- **Sensa Theme**: Consistent visual design with existing UI

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PDF Upload (Layer 0)                     │
│  Hash Check → Cache Lookup → Document Type Detection        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  V7 Parsing Layer (NEW)                      │
│  LlamaParse → Textract → pdfplumber (Fallback Chain)        │
│  Output: Structured Markdown + Hierarchy                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Hierarchy Normalization (NEW)                   │
│  Extract H1-H6 → Assign IDs → Build Tree Structure          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            Ensemble Concept Extraction (NEW)                 │
│  KeyBERT + YAKE + spaCy → Vote → Confidence Scores          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│         RAG-Powered Relationship Detection (NEW)             │
│  pgvector Search → Context Building → Claude Analysis        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Existing Pipeline (Unchanged)                   │
│  Structure Classification → Visualization → Sensa Learn      │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design


### 1. V7 PDF Parser (Extends Existing PDFParser)

**File**: `backend/services/pbl/v7_pdf_parser.py`

**Purpose**: Multi-method parsing with intelligent fallback chain

**Class Structure**:
```python
class V7PDFParser(PDFParser):
    """
    Extends existing PDFParser with v7.0 multi-method parsing.
    Maintains backward compatibility while adding new capabilities.
    """
    
    def __init__(self):
        super().__init__()
        self.llama_parse_client = None  # Lazy init
        self.textract_client = boto3.client('textract')
        self.document_detector = get_document_type_detector()
    
    async def parse_with_v7(
        self, 
        pdf_path: str,
        force_method: Optional[str] = None
    ) -> V7ParseResult:
        """
        Main v7 parsing method with fallback chain.
        
        Returns:
            V7ParseResult with:
                - text: Extracted text
                - markdown: Structured markdown (if available)
                - hierarchy: Extracted structure
                - method_used: 'llamaparse', 'textract', or 'pdfplumber'
                - confidence: 0.0-1.0
        """
        # Step 1: Detect document type
        doc_type = self.document_detector.detect_type(pdf_path)
        
        # Step 2: Try methods in order
        if force_method:
            return await self._parse_with_method(pdf_path, force_method)
        
        # Try LlamaParse first (best for structure)
        try:
            result = await self._parse_with_llamaparse(pdf_path)
            if result.confidence > 0.8:
                return result
        except Exception as e:
            logger.warning(f"LlamaParse failed: {e}")
        
        # Fallback to Textract (good for OCR)
        if doc_type.classification in ['scanned', 'hybrid']:
            try:
                result = await self._parse_with_textract(pdf_path)
                if result.confidence > 0.6:
                    return result
            except Exception as e:
                logger.warning(f"Textract failed: {e}")
        
        # Last resort: pdfplumber
        return await self._parse_with_pdfplumber(pdf_path)
```

**Key Methods**:

```python
async def _parse_with_llamaparse(self, pdf_path: str) -> V7ParseResult:
    """
    Parse with LlamaParse - best for structure preservation.
    Returns markdown with H1-H6 headings intact.
    """
    if not self.llama_parse_client:
        from llama_parse import LlamaParse
        self.llama_parse_client = LlamaParse(
            api_key=os.getenv('LLAMA_CLOUD_API_KEY'),
            result_type="markdown"
        )
    
    # Parse to markdown
    documents = self.llama_parse_client.load_data(pdf_path)
    markdown_text = documents[0].text
    
    # Extract hierarchy from markdown
    hierarchy = self._extract_hierarchy_from_markdown(markdown_text)
    
    return V7ParseResult(
        text=markdown_text,
        markdown=markdown_text,
        hierarchy=hierarchy,
        method_used='llamaparse',
        confidence=0.95
    )

async def _parse_with_textract(self, pdf_path: str) -> V7ParseResult:
    """
    Parse with AWS Textract - best for scanned documents.
    Includes OCR and layout detection.
    """
    # Upload to S3 temporarily
    s3_key = await self._upload_to_s3_temp(pdf_path)
    
    # Start Textract job
    response = self.textract_client.start_document_analysis(
        DocumentLocation={'S3Object': {'Bucket': S3_BUCKET, 'Name': s3_key}},
        FeatureTypes=['TABLES', 'LAYOUT']
    )
    
    # Wait for completion
    job_id = response['JobId']
    result = await self._wait_for_textract(job_id)
    
    # Extract text and structure
    text = self._extract_text_from_textract(result)
    hierarchy = self._extract_hierarchy_from_textract(result)
    
    # Cleanup S3
    await self._delete_from_s3(s3_key)
    
    return V7ParseResult(
        text=text,
        markdown=None,
        hierarchy=hierarchy,
        method_used='textract',
        confidence=0.85
    )

async def _parse_with_pdfplumber(self, pdf_path: str) -> V7ParseResult:
    """
    Parse with pdfplumber - fallback for simple PDFs.
    Uses existing implementation from parent class.
    """
    # Call parent class method
    text = await super().parse_pdf(pdf_path)
    
    # Create basic hierarchy from pages
    hierarchy = self._create_page_based_hierarchy(text)
    
    return V7ParseResult(
        text=text,
        markdown=None,
        hierarchy=hierarchy,
        method_used='pdfplumber',
        confidence=0.6
    )
```

**Data Models**:

```python
@dataclass
class V7ParseResult:
    text: str
    markdown: Optional[str]
    hierarchy: List[HierarchyNode]
    method_used: str  # 'llamaparse', 'textract', 'pdfplumber'
    confidence: float
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class HierarchyNode:
    id: str  # e.g., "chapter_1", "chapter_1_section_2"
    level: int  # 1-6
    title: str
    type: str  # 'hierarchical' or 'sequential'
    parent_id: Optional[str]
    children: List['HierarchyNode'] = field(default_factory=list)
    page_range: Tuple[int, int] = (0, 0)
```

---


### 2. Hierarchy Extractor

**File**: `backend/services/pbl/hierarchy_extractor.py`

**Purpose**: Extract and normalize document hierarchy from various sources

**Class Structure**:
```python
class HierarchyExtractor:
    """
    Extracts hierarchical structure from markdown, Textract, or plain text.
    Normalizes to consistent HierarchyNode format.
    """
    
    def extract_from_markdown(self, markdown_text: str) -> List[HierarchyNode]:
        """
        Extract hierarchy from markdown headings (H1-H6).
        
        Example:
            # Chapter 1: Introduction    → level 1
            ## Section 1.1: Overview     → level 2
            ### Subsection 1.1.1         → level 3
        """
        hierarchy = []
        lines = markdown_text.split('\n')
        
        # Stack to track parent nodes
        parent_stack = []
        chapter_counter = 0
        section_counters = {}
        
        for line_num, line in enumerate(lines):
            # Match markdown headers
            match = re.match(r'^(#{1,6})\s+(.+)', line)
            if not match:
                continue
            
            level = len(match.group(1))
            title = match.group(2).strip()
            
            # Assign ID based on level
            if level == 1:
                chapter_counter += 1
                node_id = f"chapter_{chapter_counter}"
                section_counters[node_id] = 0
            elif level == 2:
                parent_id = parent_stack[-1].id if parent_stack else f"chapter_{chapter_counter}"
                section_counters[parent_id] = section_counters.get(parent_id, 0) + 1
                node_id = f"{parent_id}_section_{section_counters[parent_id]}"
            else:
                parent_id = parent_stack[-1].id if parent_stack else f"chapter_{chapter_counter}"
                node_id = f"{parent_id}_subsection_{line_num}"
            
            # Detect if sequential (numbered list, steps, etc.)
            node_type = self._detect_node_type(title, line_num, lines)
            
            # Create node
            node = HierarchyNode(
                id=node_id,
                level=level,
                title=title,
                type=node_type,
                parent_id=parent_stack[-1].id if parent_stack else None
            )
            
            # Manage parent stack
            while parent_stack and parent_stack[-1].level >= level:
                parent_stack.pop()
            
            if parent_stack:
                parent_stack[-1].children.append(node)
            else:
                hierarchy.append(node)
            
            parent_stack.append(node)
        
        return hierarchy
    
    def extract_from_textract(self, textract_result: Dict) -> List[HierarchyNode]:
        """
        Extract hierarchy from Textract layout blocks.
        Textract provides LAYOUT_TITLE, LAYOUT_SECTION_HEADER, etc.
        """
        hierarchy = []
        blocks = textract_result.get('Blocks', [])
        
        # Filter for layout blocks
        layout_blocks = [b for b in blocks if b.get('BlockType') == 'LAYOUT']
        
        chapter_counter = 0
        for block in layout_blocks:
            layout_type = block.get('LayoutType')
            
            if layout_type == 'LAYOUT_TITLE':
                chapter_counter += 1
                node = HierarchyNode(
                    id=f"chapter_{chapter_counter}",
                    level=1,
                    title=self._extract_text_from_block(block, blocks),
                    type='hierarchical',
                    parent_id=None
                )
                hierarchy.append(node)
            
            elif layout_type == 'LAYOUT_SECTION_HEADER':
                # Add as child of last chapter
                if hierarchy:
                    parent = hierarchy[-1]
                    section_num = len(parent.children) + 1
                    node = HierarchyNode(
                        id=f"{parent.id}_section_{section_num}",
                        level=2,
                        title=self._extract_text_from_block(block, blocks),
                        type='hierarchical',
                        parent_id=parent.id
                    )
                    parent.children.append(node)
        
        return hierarchy
    
    def _detect_node_type(self, title: str, line_num: int, lines: List[str]) -> str:
        """
        Detect if a section is hierarchical or sequential.
        
        Sequential indicators:
            - "Step", "Phase", "Stage" in title
            - Numbered list follows
            - Imperative verbs
        """
        # Check title for sequential keywords
        sequential_keywords = ['step', 'phase', 'stage', 'process', 'procedure']
        if any(kw in title.lower() for kw in sequential_keywords):
            return 'sequential'
        
        # Check following lines for numbered lists
        for i in range(line_num + 1, min(line_num + 5, len(lines))):
            if re.match(r'^\d+\.', lines[i].strip()):
                return 'sequential'
        
        return 'hierarchical'
```

---


### 3. Ensemble Concept Extractor (Extends Existing ConceptExtractor)

**File**: `backend/services/pbl/v7_concept_extractor.py`

**Purpose**: Multi-method keyword extraction with voting and confidence scoring

**Class Structure**:
```python
class V7ConceptExtractor(ConceptExtractor):
    """
    Extends existing ConceptExtractor with ensemble methods.
    Uses KeyBERT + YAKE + spaCy for higher accuracy.
    """
    
    def __init__(self):
        super().__init__()
        
        # Initialize ensemble models (lazy loading)
        self._keybert_model = None
        self._yake_extractor = None
        self._spacy_nlp = None
    
    async def extract_concepts_v7(
        self, 
        text: str,
        hierarchy_node: Optional[HierarchyNode] = None,
        top_n: int = 20
    ) -> List[Concept]:
        """
        Extract concepts using ensemble method.
        
        Process:
            1. Run KeyBERT, YAKE, spaCy in parallel
            2. Combine results with voting
            3. Keep only concepts with 2+ method agreement
            4. Calculate confidence scores
            5. Use Claude for high-confidence definitions only
        """
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
        
        # Filter to high-confidence only (2+ methods)
        high_confidence = [c for c in combined if c['methods_found'] >= 2]
        
        # Sort by confidence
        high_confidence.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Take top N
        top_concepts = high_confidence[:top_n]
        
        # Generate definitions with Claude (only for high-confidence)
        concepts = []
        for item in top_concepts:
            definition = await self._generate_definition_with_claude(
                term=item['term'],
                context=text,
                hierarchy_node=hierarchy_node
            )
            
            concept = Concept(
                term=item['term'],
                definition=definition,
                confidence=item['confidence'],
                methods_found=item['methods_found'],
                structure_id=hierarchy_node.id if hierarchy_node else None,
                structure_type=hierarchy_node.type if hierarchy_node else 'unclassified'
            )
            concepts.append(concept)
        
        return concepts
    
    async def _extract_with_keybert(self, text: str, top_n: int) -> List[Tuple[str, float]]:
        """
        KeyBERT: Semantic keyword extraction using BERT embeddings.
        Best for: Domain-specific technical terms.
        """
        if not self._keybert_model:
            from keybert import KeyBERT
            self._keybert_model = KeyBERT()
        
        keywords = self._keybert_model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 3),
            stop_words='english',
            top_n=top_n,
            use_mmr=True,  # Maximal Marginal Relevance for diversity
            diversity=0.5
        )
        
        return keywords  # [(term, score), ...]
    
    async def _extract_with_yake(self, text: str, top_n: int) -> List[Tuple[str, float]]:
        """
        YAKE: Statistical keyword extraction.
        Best for: Frequently mentioned important terms.
        """
        if not self._yake_extractor:
            import yake
            self._yake_extractor = yake.KeywordExtractor(
                lan="en",
                n=3,  # Max n-gram size
                dedupLim=0.9,
                top=top_n
            )
        
        keywords = self._yake_extractor.extract_keywords(text)
        
        # YAKE scores are inverse (lower = better), so invert
        inverted = [(term, 1 - score) for term, score in keywords]
        
        return inverted
    
    async def _extract_with_spacy(self, text: str, top_n: int) -> List[Tuple[str, float]]:
        """
        spaCy TextRank: Graph-based keyword extraction.
        Best for: Contextually important terms.
        """
        if not self._spacy_nlp:
            import spacy
            import pytextrank
            
            self._spacy_nlp = spacy.load("en_core_web_sm")
            self._spacy_nlp.add_pipe("textrank")
        
        doc = self._spacy_nlp(text)
        
        keywords = [
            (phrase.text, phrase.rank) 
            for phrase in doc._.phrases[:top_n]
        ]
        
        return keywords
    
    def _combine_with_voting(
        self,
        keybert_results: List[Tuple[str, float]],
        yake_results: List[Tuple[str, float]],
        spacy_results: List[Tuple[str, float]]
    ) -> List[Dict]:
        """
        Combine results from all three methods using voting.
        
        Scoring:
            - Each method contributes its score
            - Normalize to 0-1 range
            - Count how many methods found each term
            - Final confidence = average score * (methods_found / 3)
        """
        keyword_scores = {}
        
        # Add KeyBERT results
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
        
        # Add YAKE results
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
        
        # Add spaCy results
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
        
        return combined
```

---


### 4. RAG Relationship Detector (Extends Existing RelationshipService)

**File**: `backend/services/pbl/v7_relationship_service.py`

**Purpose**: Context-aware relationship detection using pgvector semantic search

**Class Structure**:
```python
class V7RelationshipService(RelationshipService):
    """
    Extends existing RelationshipService with RAG-powered detection.
    Uses pgvector to find related concepts before asking Claude.
    """
    
    def __init__(self):
        super().__init__()
        self.embedding_service = get_embedding_service()
    
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
        # Step 1: Generate embedding
        concept_embedding = await self.embedding_service.generate_embedding(
            concept.term + " " + concept.definition
        )
        
        # Step 2: Semantic search for related concepts
        related_concepts = await self._semantic_search(
            embedding=concept_embedding,
            document_id=document_id,
            chapter_id=concept.structure_id.split('_')[0] if concept.structure_id else None,
            exclude_concept_id=concept.id,
            top_k=10
        )
        
        # Step 3: If sparse results, expand search
        if len(related_concepts) < 3:
            related_concepts = await self._semantic_search(
                embedding=concept_embedding,
                document_id=document_id,
                chapter_id=None,  # Search all chapters
                exclude_concept_id=concept.id,
                top_k=10
            )
        
        # Step 4: Build context for Claude
        context = self._build_relationship_context(concept, related_concepts)
        
        # Step 5: Ask Claude to analyze
        relationships = await self._claude_analyze_relationships(context)
        
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
                AND (%s IS NULL OR structure_id LIKE %s || '%%')
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """
        
        params = [
            embedding,
            document_id,
            exclude_concept_id,
            chapter_id,
            chapter_id,
            embedding,
            top_k
        ]
        
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
Location: {main_concept.structure_id}
Type: {main_concept.structure_type}

Related Concepts Found (by semantic similarity):
"""
        
        for i, related in enumerate(related_concepts, 1):
            context += f"""
{i}. {related['term']} (similarity: {related['similarity']:.2f})
   Definition: {related['definition']}
   Location: {related['structure_id']}
"""
        
        return context
    
    async def _claude_analyze_relationships(self, context: str) -> List[Relationship]:
        """
        Ask Claude to analyze relationships with full context.
        """
        prompt = f"""
Analyze the relationships between the main concept and the related concepts provided.

{context}

For each related concept, determine:
1. Is there a meaningful relationship? (yes/no)
2. What type of relationship? (is_a, has_component, precedes, enables, etc.)
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
        
        response = await self.bedrock_client.invoke_claude(prompt)
        relationships_data = json.loads(response)
        
        # Convert to Relationship objects
        relationships = []
        for data in relationships_data:
            if not data['has_relationship']:
                continue
            
            rel = Relationship(
                source_concept_id=main_concept.id if data['direction'] == 'forward' else data['related_concept_id'],
                target_concept_id=data['related_concept_id'] if data['direction'] == 'forward' else main_concept.id,
                relationship_type=data['type'],
                strength=data['strength'],
                claude_confidence=data['strength'],
                explanation=data['explanation']
            )
            relationships.append(rel)
        
        return relationships
```

---


### 5. V7 Pipeline Orchestrator

**File**: `backend/services/pbl/v7_pipeline.py`

**Purpose**: Orchestrate the complete v7.0 processing pipeline

**Class Structure**:
```python
class V7Pipeline:
    """
    Main orchestrator for v7.0 PDF processing pipeline.
    Coordinates all v7 services and integrates with existing pipeline.
    """
    
    def __init__(self):
        self.parser = V7PDFParser()
        self.hierarchy_extractor = HierarchyExtractor()
        self.concept_extractor = V7ConceptExtractor()
        self.relationship_service = V7RelationshipService()
        self.cache_service = get_layer0_cache_service()
        self.cost_tracker = get_cost_tracker()
    
    async def process_document_v7(
        self,
        document_id: str,
        pdf_path: str,
        user_id: str
    ) -> V7ProcessingResult:
        """
        Complete v7.0 processing pipeline.
        
        Steps:
            1. Check cache
            2. Parse PDF with fallback chain
            3. Extract hierarchy
            4. Extract concepts with ensemble
            5. Detect relationships with RAG
            6. Store results
            7. Cache for future use
        """
        # Step 1: Check cache
        pdf_hash = compute_hash(pdf_path)
        cached = self.cache_service.lookup_by_hash(pdf_hash, version='v7')
        
        if cached:
            logger.info(f"Cache HIT for document {document_id}")
            return cached.results
        
        logger.info(f"Cache MISS - processing document {document_id}")
        
        # Step 2: Parse PDF
        parse_result = await self.parser.parse_with_v7(pdf_path)
        await self._update_status(document_id, "Parsing complete", 20)
        
        # Track parsing cost
        await self.cost_tracker.track_cost(
            service=f"parsing_{parse_result.method_used}",
            cost=self._estimate_parsing_cost(parse_result.method_used, pdf_path)
        )
        
        # Step 3: Extract hierarchy
        if parse_result.markdown:
            hierarchy = self.hierarchy_extractor.extract_from_markdown(parse_result.markdown)
        elif parse_result.method_used == 'textract':
            hierarchy = self.hierarchy_extractor.extract_from_textract(parse_result.metadata)
        else:
            hierarchy = self._create_page_based_hierarchy(parse_result.text)
        
        await self._update_status(document_id, "Hierarchy extracted", 40)
        
        # Step 4: Extract concepts with ensemble
        all_concepts = []
        
        for node in self._flatten_hierarchy(hierarchy):
            # Get text for this section
            section_text = self._extract_section_text(parse_result.text, node)
            
            # Extract concepts
            concepts = await self.concept_extractor.extract_concepts_v7(
                text=section_text,
                hierarchy_node=node,
                top_n=20
            )
            
            all_concepts.extend(concepts)
        
        await self._update_status(document_id, f"Extracted {len(all_concepts)} concepts", 60)
        
        # Track concept extraction cost
        await self.cost_tracker.track_cost(
            service="concept_extraction_v7",
            cost=len(all_concepts) * 0.001  # Estimate
        )
        
        # Step 5: Detect relationships with RAG
        all_relationships = []
        
        for concept in all_concepts:
            relationships = await self.relationship_service.detect_relationships_v7(
                concept=concept,
                all_concepts=all_concepts,
                document_id=document_id
            )
            all_relationships.extend(relationships)
        
        await self._update_status(document_id, f"Detected {len(all_relationships)} relationships", 80)
        
        # Step 6: Store results
        await self._store_results(
            document_id=document_id,
            hierarchy=hierarchy,
            concepts=all_concepts,
            relationships=all_relationships,
            parse_method=parse_result.method_used
        )
        
        await self._update_status(document_id, "Processing complete", 100)
        
        # Step 7: Cache results
        result = V7ProcessingResult(
            document_id=document_id,
            hierarchy=hierarchy,
            concepts=all_concepts,
            relationships=all_relationships,
            parse_method=parse_result.method_used,
            confidence=parse_result.confidence
        )
        
        self.cache_service.store_results(
            pdf_hash=pdf_hash,
            results=result,
            version='v7'
        )
        
        return result
    
    async def _update_status(self, document_id: str, message: str, progress: int):
        """
        Update processing status for real-time UI updates.
        """
        await self.db.execute(
            """
            UPDATE documents
            SET processing_status = %s,
                processing_progress = %s,
                updated_at = NOW()
            WHERE id = %s
            """,
            (message, progress, document_id)
        )
        
        # Emit WebSocket event for real-time updates
        await self.websocket_manager.broadcast(
            f"document_{document_id}",
            {
                'type': 'processing_update',
                'message': message,
                'progress': progress
            }
        )
```

---


## Database Schema Updates

### New Columns for Existing Tables

```sql
-- Add v7-specific columns to concepts table
ALTER TABLE concepts
ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS methods_found INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS extraction_methods TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add v7-specific columns to relationships table
ALTER TABLE relationships
ADD COLUMN IF NOT EXISTS similarity_score FLOAT,
ADD COLUMN IF NOT EXISTS claude_confidence FLOAT,
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Add v7-specific columns to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS parse_method TEXT,
ADD COLUMN IF NOT EXISTS parse_confidence FLOAT,
ADD COLUMN IF NOT EXISTS hierarchy_json JSONB;

-- Create index for confidence-based queries
CREATE INDEX IF NOT EXISTS idx_concepts_confidence 
ON concepts(confidence) WHERE confidence > 0.7;

-- Create index for similarity-based queries
CREATE INDEX IF NOT EXISTS idx_relationships_similarity 
ON relationships(similarity_score) WHERE similarity_score > 0.6;
```

### New Table for Processing Metrics

```sql
CREATE TABLE IF NOT EXISTS v7_processing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    parse_method TEXT NOT NULL,
    parse_duration_ms INTEGER,
    concepts_extracted INTEGER,
    high_confidence_concepts INTEGER,
    relationships_detected INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    total_cost DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_v7_metrics_document ON v7_processing_metrics(document_id);
CREATE INDEX idx_v7_metrics_created ON v7_processing_metrics(created_at);
```

---

## API Endpoints

### New V7-Specific Endpoints

```python
# backend/routers/v7_documents.py

@router.post("/api/v7/documents/upload")
async def upload_document_v7(
    file: UploadFile,
    user_id: str = Depends(get_current_user)
):
    """
    Upload and process document with v7.0 pipeline.
    
    Returns:
        {
            "document_id": "...",
            "status": "processing",
            "estimated_time": 180  # seconds
        }
    """
    # Save file
    pdf_path = await save_upload(file)
    
    # Detect document type
    doc_type = document_detector.detect_type(pdf_path)
    
    # Estimate cost
    estimated_cost = estimate_processing_cost(pdf_path, doc_type)
    
    # Create document record
    document_id = await create_document_record(
        user_id=user_id,
        filename=file.filename,
        doc_type=doc_type.classification
    )
    
    # Start async processing
    background_tasks.add_task(
        v7_pipeline.process_document_v7,
        document_id=document_id,
        pdf_path=pdf_path,
        user_id=user_id
    )
    
    return {
        "document_id": document_id,
        "status": "processing",
        "estimated_time": estimate_processing_time(pdf_path, doc_type),
        "estimated_cost": estimated_cost
    }

@router.get("/api/v7/documents/{document_id}/status")
async def get_processing_status_v7(
    document_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get real-time processing status.
    
    Returns:
        {
            "status": "processing",
            "message": "Extracting concepts",
            "progress": 60,
            "estimated_remaining": 45  # seconds
        }
    """
    doc = await get_document(document_id, user_id)
    
    return {
        "status": doc.processing_status,
        "message": doc.processing_message,
        "progress": doc.processing_progress,
        "estimated_remaining": estimate_remaining_time(doc)
    }

@router.get("/api/v7/documents/{document_id}/results")
async def get_v7_results(
    document_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get v7.0 processing results.
    
    Returns:
        {
            "hierarchy": [...],
            "concepts": [...],
            "relationships": [...],
            "metrics": {
                "parse_method": "llamaparse",
                "confidence": 0.95,
                "concepts_found": 142,
                "high_confidence_concepts": 118,
                "relationships_found": 287
            }
        }
    """
    # Get results
    hierarchy = await get_hierarchy(document_id)
    concepts = await get_concepts(document_id)
    relationships = await get_relationships(document_id)
    metrics = await get_v7_metrics(document_id)
    
    return {
        "hierarchy": hierarchy,
        "concepts": concepts,
        "relationships": relationships,
        "metrics": metrics
    }

@router.get("/api/v7/documents/{document_id}/metrics")
async def get_v7_metrics(
    document_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get detailed v7.0 processing metrics.
    
    Returns:
        {
            "parse_method": "llamaparse",
            "parse_duration_ms": 2340,
            "concepts_extracted": 142,
            "high_confidence_concepts": 118,
            "confidence_distribution": {
                "high": 118,
                "medium": 20,
                "low": 4
            },
            "relationships_detected": 287,
            "cache_hit": false,
            "total_cost": 0.45,
            "accuracy_improvement": "+165%"
        }
    """
    metrics = await db.fetch_one(
        "SELECT * FROM v7_processing_metrics WHERE document_id = %s",
        (document_id,)
    )
    
    # Calculate confidence distribution
    concepts = await get_concepts(document_id)
    confidence_dist = {
        "high": len([c for c in concepts if c.confidence > 0.7]),
        "medium": len([c for c in concepts if 0.5 < c.confidence <= 0.7]),
        "low": len([c for c in concepts if c.confidence <= 0.5])
    }
    
    return {
        **metrics,
        "confidence_distribution": confidence_dist,
        "accuracy_improvement": calculate_accuracy_improvement(metrics)
    }
```

---


## Frontend Components

### 1. V7 Processing Status Display

**File**: `src/components/pbl/V7ProcessingStatus.tsx`

```typescript
interface V7ProcessingStatusProps {
  documentId: string;
  onComplete: () => void;
}

export const V7ProcessingStatus: React.FC<V7ProcessingStatusProps> = ({
  documentId,
  onComplete
}) => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  
  useEffect(() => {
    // Poll for status updates
    const interval = setInterval(async () => {
      const response = await fetch(`/api/v7/documents/${documentId}/status`);
      const data = await response.json();
      setStatus(data);
      
      if (data.progress === 100) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [documentId]);
  
  if (!status) return <LoadingSpinner />;
  
  return (
    <div className="v7-processing-status">
      {/* Progress bar with Sensa gradient */}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{
            width: `${status.progress}%`,
            background: 'linear-gradient(90deg, #a855f7, #ec4899)'
          }}
        />
      </div>
      
      {/* Current step */}
      <div className="status-message">
        <span className="status-icon">
          {status.progress < 100 ? '⚙️' : '✅'}
        </span>
        <span className="status-text">{status.message}</span>
      </div>
      
      {/* Method badge */}
      {status.parse_method && (
        <div className={`method-badge method-${status.parse_method}`}>
          {status.parse_method === 'llamaparse' && '🦙 LlamaParse'}
          {status.parse_method === 'textract' && '📄 Textract (OCR)'}
          {status.parse_method === 'pdfplumber' && '📖 PDFPlumber'}
        </div>
      )}
      
      {/* Estimated time */}
      {status.estimated_remaining > 0 && (
        <div className="estimated-time">
          About {Math.ceil(status.estimated_remaining / 60)} minutes remaining
        </div>
      )}
    </div>
  );
};
```

### 2. Confidence Indicator

**File**: `src/components/pbl/ConfidenceIndicator.tsx`

```typescript
interface ConfidenceIndicatorProps {
  confidence: number;
  methodsFound?: number;
  size?: 'small' | 'medium' | 'large';
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  methodsFound,
  size = 'medium'
}) => {
  const getColor = (conf: number) => {
    if (conf > 0.7) return '#10b981'; // Green
    if (conf > 0.5) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };
  
  const getLabel = (conf: number) => {
    if (conf > 0.7) return 'High';
    if (conf > 0.5) return 'Medium';
    return 'Low';
  };
  
  return (
    <div className={`confidence-indicator confidence-${size}`}>
      <div 
        className="confidence-bar"
        style={{
          width: `${confidence * 100}%`,
          backgroundColor: getColor(confidence)
        }}
      />
      <span className="confidence-label">
        {getLabel(confidence)}
        {methodsFound && ` (${methodsFound}/3 methods)`}
      </span>
    </div>
  );
};
```

### 3. V7 Metrics Dashboard

**File**: `src/components/pbl/V7MetricsDashboard.tsx`

```typescript
interface V7MetricsDashboardProps {
  documentId: string;
}

export const V7MetricsDashboard: React.FC<V7MetricsDashboardProps> = ({
  documentId
}) => {
  const { data: metrics, isLoading } = useQuery(
    ['v7-metrics', documentId],
    () => fetch(`/api/v7/documents/${documentId}/metrics`).then(r => r.json())
  );
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="v7-metrics-dashboard">
      <h3>Processing Metrics</h3>
      
      {/* Parse method */}
      <div className="metric-card">
        <div className="metric-label">Parse Method</div>
        <div className={`metric-value method-${metrics.parse_method}`}>
          {metrics.parse_method === 'llamaparse' && '🦙 LlamaParse'}
          {metrics.parse_method === 'textract' && '📄 Textract'}
          {metrics.parse_method === 'pdfplumber' && '📖 PDFPlumber'}
        </div>
      </div>
      
      {/* Concepts found */}
      <div className="metric-card">
        <div className="metric-label">Concepts Extracted</div>
        <div className="metric-value">{metrics.concepts_extracted}</div>
        <div className="metric-breakdown">
          <span className="high">
            {metrics.confidence_distribution.high} high confidence
          </span>
          <span className="medium">
            {metrics.confidence_distribution.medium} medium
          </span>
          <span className="low">
            {metrics.confidence_distribution.low} low
          </span>
        </div>
      </div>
      
      {/* Relationships */}
      <div className="metric-card">
        <div className="metric-label">Relationships Detected</div>
        <div className="metric-value">{metrics.relationships_detected}</div>
      </div>
      
      {/* Accuracy improvement */}
      <div className="metric-card highlight">
        <div className="metric-label">Accuracy Improvement</div>
        <div className="metric-value success">
          {metrics.accuracy_improvement}
        </div>
      </div>
      
      {/* Cost */}
      <div className="metric-card">
        <div className="metric-label">Processing Cost</div>
        <div className="metric-value">${metrics.total_cost.toFixed(2)}</div>
        {metrics.cache_hit && (
          <div className="cache-badge">Loaded from cache</div>
        )}
      </div>
    </div>
  );
};
```

### 4. Enhanced Concept Card with V7 Data

**File**: Update `src/components/pbl/ConceptCard.tsx`

```typescript
// Add to existing ConceptCard component

{concept.confidence && (
  <ConfidenceIndicator 
    confidence={concept.confidence}
    methodsFound={concept.methods_found}
    size="small"
  />
)}

{concept.extraction_methods && (
  <div className="extraction-methods">
    {concept.extraction_methods.includes('keybert') && (
      <span className="method-badge">KeyBERT</span>
    )}
    {concept.extraction_methods.includes('yake') && (
      <span className="method-badge">YAKE</span>
    )}
    {concept.extraction_methods.includes('spacy') && (
      <span className="method-badge">spaCy</span>
    )}
  </div>
)}
```

---

## Cost Estimation

### Parsing Costs

| Method | Cost per Document | Best For |
|--------|------------------|----------|
| LlamaParse | $0.10 - $0.30 | Digital PDFs with structure |
| Textract | $1.00 - $3.00 | Scanned PDFs requiring OCR |
| pdfplumber | $0.00 | Simple digital PDFs |

### Concept Extraction Costs

| Method | Cost per Concept | Notes |
|--------|-----------------|-------|
| KeyBERT | $0.000 | Local processing |
| YAKE | $0.000 | Local processing |
| spaCy | $0.000 | Local processing |
| Claude (definitions) | $0.001 | Only for high-confidence |

### Relationship Detection Costs

| Component | Cost | Notes |
|-----------|------|-------|
| pgvector search | $0.000 | Database query |
| Claude analysis | $0.002 per concept | With RAG context |

### Total Estimated Costs

- **Digital PDF (150 pages)**: $0.30 (LlamaParse) + $0.15 (concepts) + $0.30 (relationships) = **$0.75**
- **Scanned PDF (150 pages)**: $2.00 (Textract) + $0.15 (concepts) + $0.30 (relationships) = **$2.45**
- **Cached document**: **$0.00** (instant retrieval)

---

## Performance Targets

| Metric | Target | V7.0 Expected |
|--------|--------|---------------|
| Content Capture | 75% | 100% ✅ |
| Concept Accuracy | 60% | 90% ✅ |
| Relationship Accuracy | 50% | 80% ✅ |
| Processing Time (200 pages) | 5 min | 4 min ✅ |
| Cache Hit Response | 2 sec | <0.5 sec ✅ |
| Cost per Document | $2.00 | $1.50 avg ✅ |

---

## Testing Strategy

### Unit Tests

```python
# test_v7_parser.py
async def test_llamaparse_fallback():
    """Test fallback chain when LlamaParse fails"""
    parser = V7PDFParser()
    
    # Mock LlamaParse failure
    with patch.object(parser, '_parse_with_llamaparse', side_effect=Exception):
        result = await parser.parse_with_v7('test.pdf')
        
        # Should fall back to textract or pdfplumber
        assert result.method_used in ['textract', 'pdfplumber']

# test_v7_concept_extractor.py
async def test_ensemble_voting():
    """Test that ensemble requires 2+ method agreement"""
    extractor = V7ConceptExtractor()
    
    # Mock results from different methods
    keybert_results = [('machine learning', 0.9)]
    yake_results = [('machine learning', 0.8), ('neural network', 0.7)]
    spacy_results = [('machine learning', 0.85)]
    
    combined = extractor._combine_with_voting(
        keybert_results,
        yake_results,
        spacy_results
    )
    
    # 'machine learning' found by all 3 methods
    ml_concept = next(c for c in combined if c['term'] == 'machine learning')
    assert ml_concept['methods_found'] == 3
    assert ml_concept['confidence'] > 0.8
    
    # 'neural network' found by only 1 method
    nn_concept = next(c for c in combined if c['term'] == 'neural network')
    assert nn_concept['methods_found'] == 1
    assert nn_concept['confidence'] < 0.5

# test_v7_relationship_service.py
async def test_rag_semantic_search():
    """Test RAG-powered relationship detection"""
    service = V7RelationshipService()
    
    concept = Concept(
        term="Virtual Machine",
        definition="A software emulation of a computer system"
    )
    
    # Should find related concepts via semantic search
    relationships = await service.detect_relationships_v7(
        concept=concept,
        all_concepts=[],
        document_id="test-doc"
    )
    
    # Should have similarity scores
    for rel in relationships:
        assert rel.similarity_score is not None
        assert 0.0 <= rel.similarity_score <= 1.0
```

### Integration Tests

```python
# test_v7_pipeline_integration.py
async def test_end_to_end_v7_pipeline():
    """Test complete v7.0 pipeline"""
    pipeline = V7Pipeline()
    
    # Process test document
    result = await pipeline.process_document_v7(
        document_id="test-doc",
        pdf_path="test_data/sample.pdf",
        user_id="test-user"
    )
    
    # Verify results
    assert result.hierarchy is not None
    assert len(result.concepts) > 0
    assert len(result.relationships) > 0
    assert result.parse_method in ['llamaparse', 'textract', 'pdfplumber']
    
    # Verify high-confidence concepts
    high_conf = [c for c in result.concepts if c.confidence > 0.7]
    assert len(high_conf) > len(result.concepts) * 0.7  # At least 70% high confidence
```

---

## Deployment Plan

### Phase 1: Development (Week 1-2)
- Implement V7PDFParser with fallback chain
- Implement HierarchyExtractor
- Set up LlamaParse API integration
- Unit tests for parsing

### Phase 2: Ensemble Extraction (Week 3)
- Implement V7ConceptExtractor
- Install and configure KeyBERT, YAKE, spaCy
- Implement voting algorithm
- Unit tests for ensemble

### Phase 3: RAG Relationships (Week 4)
- Implement V7RelationshipService
- Set up pgvector queries
- Implement context building
- Unit tests for RAG

### Phase 4: Pipeline Integration (Week 5)
- Implement V7Pipeline orchestrator
- Update API endpoints
- Database migrations
- Integration tests

### Phase 5: Frontend (Week 6)
- Implement V7ProcessingStatus
- Implement ConfidenceIndicator
- Implement V7MetricsDashboard
- Update existing components

### Phase 6: Testing & Optimization (Week 7)
- End-to-end testing
- Performance optimization
- Cost optimization
- Bug fixes

### Phase 7: Deployment (Week 8)
- Staging deployment
- User acceptance testing
- Production deployment
- Monitoring and metrics

---

## Success Metrics

- ✅ 100% content capture (including scanned PDFs)
- ✅ 40%+ improvement in concept extraction accuracy
- ✅ 50%+ improvement in relationship detection accuracy
- ✅ <5 minutes processing time for 200-page documents
- ✅ <$2 average cost per document
- ✅ 60%+ cache hit rate
- ✅ Zero breaking changes to existing features
- ✅ Sensa color theme consistency maintained

---

**Status**: Ready for Implementation  
**Estimated Duration**: 8 weeks  
**Expected Accuracy Gain**: +170%
