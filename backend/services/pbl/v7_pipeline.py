"""
V7 Pipeline Orchestrator
Coordinates the complete v7.0 PDF processing pipeline with all enhancements.
"""

import logging
import json
from typing import List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
from backend.services.pbl.pdf_parser import get_pdf_parser, V7ParseResult
from backend.services.pbl.hierarchy_extractor import get_hierarchy_extractor, HierarchyNode
from backend.services.pbl.concept_service import get_concept_service
from backend.services.pbl.v7_relationship_service import get_v7_relationship_service
from backend.services.layer0.layer0_cache_service import get_layer0_cache_service
from backend.services.layer0.pdf_hash_service import get_pdf_hash_service
from backend.services.cost_tracker import get_cost_tracker
from backend.models.pbl_concept import Concept
from backend.models.pbl_relationship import Relationship

logger = logging.getLogger(__name__)


@dataclass
class V7ProcessingResult:
    """Complete result from v7.0 processing"""
    document_id: str
    hierarchy: List[HierarchyNode]
    concepts: List[Concept]
    relationships: List[Relationship]
    parse_method: str
    confidence: float
    metrics: Dict[str, Any] = field(default_factory=dict)


class V7Pipeline:
    """
    Main orchestrator for v7.0 PDF processing pipeline.
    Coordinates all v7 services and integrates with existing pipeline.
    """
    
    def __init__(self):
        # Reuse existing services with v7 methods
        self.parser = get_pdf_parser()  # Has parse_with_v7() method
        self.hierarchy_extractor = get_hierarchy_extractor()
        self.concept_service = get_concept_service()  # Has extract_concepts_v7() method
        self.relationship_service = get_v7_relationship_service()
        self.cache_service = get_layer0_cache_service()
        self.hash_service = get_pdf_hash_service()
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
        start_time = datetime.now()
        logger.info(f"Starting v7.0 processing for document {document_id}")
        
        # Step 1: Check cache
        pdf_hash, metadata = self.hash_service.compute_hash_and_metadata(pdf_path)
        cached = self.cache_service.lookup_by_hash(pdf_hash, version='v7')
        
        if cached:
            logger.info(f"Cache HIT for document {document_id}")
            await self._update_status(document_id, "Loaded from cache", 100)
            return cached.results
        
        logger.info(f"Cache MISS - processing document {document_id}")
        
        # Step 2: Parse PDF
        await self._update_status(document_id, "Parsing PDF...", 10)
        parse_result = await self.parser.parse_with_v7(pdf_path)
        await self._update_status(document_id, f"Parsing complete ({parse_result.method_used})", 20)
        
        # Step 3: Extract hierarchy
        await self._update_status(document_id, "Extracting document structure...", 30)
        
        if parse_result.markdown:
            hierarchy = self.hierarchy_extractor.extract_from_markdown(parse_result.markdown)
        elif parse_result.method_used == 'textract' and 'textract_result' in parse_result.metadata:
            hierarchy = self.hierarchy_extractor.extract_from_textract(parse_result.metadata['textract_result'])
        else:
            hierarchy = self.hierarchy_extractor.create_page_based_hierarchy(parse_result.text)
        
        await self._update_status(document_id, f"Structure extracted ({len(hierarchy)} chapters)", 40)
        
        # Step 4: Extract concepts with ensemble
        await self._update_status(document_id, "Extracting concepts...", 50)
        all_concepts = []
        
        for node in self._flatten_hierarchy(hierarchy):
            # Get text for this section
            section_text = self._extract_section_text(parse_result.text, node)
            
            if len(section_text) < 100:  # Skip very short sections
                continue
            
            # Extract concepts using v7 ensemble method
            concepts = await self.concept_service.extract_concepts_v7(
                text=section_text,
                document_id=document_id,
                structure_id=node.id,
                structure_type=node.type,
                top_n=20
            )
            
            all_concepts.extend(concepts)
        
        await self._update_status(document_id, f"Extracted {len(all_concepts)} concepts", 60)
        
        # Step 5: Detect relationships with RAG
        await self._update_status(document_id, "Detecting relationships...", 70)
        all_relationships = []
        
        for i, concept in enumerate(all_concepts):
            if i % 10 == 0:  # Update progress every 10 concepts
                progress = 70 + int((i / len(all_concepts)) * 20)
                await self._update_status(document_id, f"Analyzing concept {i+1}/{len(all_concepts)}", progress)
            
            relationships = await self.relationship_service.detect_relationships_v7(
                concept=concept,
                all_concepts=all_concepts,
                document_id=document_id
            )
            all_relationships.extend(relationships)
        
        await self._update_status(document_id, f"Detected {len(all_relationships)} relationships", 90)
        
        # Step 6: Store results
        await self._update_status(document_id, "Saving results...", 95)
        await self._store_results(
            document_id=document_id,
            hierarchy=hierarchy,
            concepts=all_concepts,
            relationships=all_relationships,
            parse_method=parse_result.method_used,
            parse_confidence=parse_result.confidence
        )
        
        # Calculate metrics
        processing_time = (datetime.now() - start_time).total_seconds()
        high_confidence_concepts = len([c for c in all_concepts if c.confidence > 0.7])
        
        metrics = {
            'parse_method': parse_result.method_used,
            'parse_duration_ms': int(processing_time * 1000),
            'concepts_extracted': len(all_concepts),
            'high_confidence_concepts': high_confidence_concepts,
            'relationships_detected': len(all_relationships),
            'cache_hit': False,
            'total_cost': await self.cost_tracker.get_total_cost()
        }
        
        await self._store_metrics(document_id, metrics)
        
        await self._update_status(document_id, "Processing complete!", 100)
        
        # Step 7: Cache results
        result = V7ProcessingResult(
            document_id=document_id,
            hierarchy=hierarchy,
            concepts=all_concepts,
            relationships=all_relationships,
            parse_method=parse_result.method_used,
            confidence=parse_result.confidence,
            metrics=metrics
        )
        
        self.cache_service.store_results(
            pdf_hash=pdf_hash,
            results=result,
            version='v7'
        )
        
        logger.info(f"V7 processing complete for document {document_id}")
        return result
    
    async def _update_status(self, document_id: str, message: str, progress: int):
        """
        Update processing status for real-time UI updates.
        """
        try:
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
            
            # Emit WebSocket event for real-time updates (if available)
            # await self.websocket_manager.broadcast(...)
            
            logger.debug(f"Status update: {message} ({progress}%)")
        except Exception as e:
            logger.error(f"Failed to update status: {e}")
    
    async def _store_results(
        self,
        document_id: str,
        hierarchy: List[HierarchyNode],
        concepts: List[Concept],
        relationships: List[Relationship],
        parse_method: str,
        parse_confidence: float
    ):
        """Store all results in database"""
        try:
            # Store hierarchy as JSON
            hierarchy_json = json.dumps([self._node_to_dict(n) for n in hierarchy])
            
            await self.db.execute(
                """
                UPDATE documents
                SET hierarchy_json = %s,
                    parse_method = %s,
                    parse_confidence = %s
                WHERE id = %s
                """,
                (hierarchy_json, parse_method, parse_confidence, document_id)
            )
            
            # Bulk insert concepts
            for concept in concepts:
                await self.db.execute(
                    """
                    INSERT INTO concepts (
                        document_id, term, definition, confidence,
                        methods_found, extraction_methods, structure_id, structure_type
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        document_id, concept.term, concept.definition, concept.confidence,
                        concept.methods_found, concept.extraction_methods,
                        concept.structure_id, concept.structure_type
                    )
                )
            
            # Bulk insert relationships
            for rel in relationships:
                await self.db.execute(
                    """
                    INSERT INTO relationships (
                        source_concept_id, target_concept_id, relationship_type,
                        strength, similarity_score, claude_confidence, explanation
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        rel.source_concept_id, rel.target_concept_id, rel.relationship_type,
                        rel.strength, rel.similarity_score, rel.claude_confidence, rel.explanation
                    )
                )
            
            logger.info(f"Stored {len(concepts)} concepts and {len(relationships)} relationships")
        except Exception as e:
            logger.error(f"Failed to store results: {e}")
    
    async def _store_metrics(self, document_id: str, metrics: Dict):
        """Store processing metrics"""
        try:
            await self.db.execute(
                """
                INSERT INTO v7_processing_metrics (
                    document_id, parse_method, parse_duration_ms,
                    concepts_extracted, high_confidence_concepts,
                    relationships_detected, cache_hit, total_cost
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    document_id, metrics['parse_method'], metrics['parse_duration_ms'],
                    metrics['concepts_extracted'], metrics['high_confidence_concepts'],
                    metrics['relationships_detected'], metrics['cache_hit'], metrics['total_cost']
                )
            )
        except Exception as e:
            logger.error(f"Failed to store metrics: {e}")
    
    def _flatten_hierarchy(self, hierarchy: List[HierarchyNode]) -> List[HierarchyNode]:
        """Flatten hierarchy tree to list of all nodes"""
        result = []
        for node in hierarchy:
            result.append(node)
            result.extend(self._flatten_hierarchy(node.children))
        return result
    
    def _extract_section_text(self, full_text: str, node: HierarchyNode) -> str:
        """Extract text for a specific section (simplified)"""
        # This is a simplified version - in production, would use page ranges
        # For now, return a chunk of text
        return full_text[:5000]  # First 5000 chars as sample
    
    def _node_to_dict(self, node: HierarchyNode) -> Dict:
        """Convert HierarchyNode to dictionary for JSON storage"""
        return {
            'id': node.id,
            'level': node.level,
            'title': node.title,
            'type': node.type,
            'parent_id': node.parent_id,
            'children': [self._node_to_dict(c) for c in node.children],
            'page_range': node.page_range
        }


def get_v7_pipeline() -> V7Pipeline:
    """Factory function to get V7Pipeline instance"""
    return V7Pipeline()
