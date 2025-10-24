"""
V7 Pipeline Orchestrator
Coordinates the complete v7.0 PDF processing pipeline with all enhancements.
"""

import logging
import json
from typing import List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
from services.pbl.pdf_parser import get_pdf_parser, V7ParseResult
from services.pbl.hierarchy_extractor import get_hierarchy_extractor, HierarchyNode
from services.pbl.concept_service import get_concept_service
from services.pbl.v7_relationship_service import get_relationship_service
from services.pbl.concept_deduplicator import get_concept_deduplicator
from services.layer0.layer0_cache_service import get_layer0_cache_service
from services.layer0.pdf_hash_service import get_pdf_hash_service
from services.layer0.layer0_cost_optimizer import get_layer0_cost_optimizer
from models.pbl_concept import Concept
from models.pbl_relationship import Relationship

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
        # Database connection
        from config.db_connection import get_db_connection
        self.db = get_db_connection()
        
        # Reuse existing services with v7 methods
        self.parser = get_pdf_parser()  # Has parse_with_v7() method
        self.hierarchy_extractor = get_hierarchy_extractor()
        self.concept_service = get_concept_service()  # Has extract_concepts_v7() method
        self.relationship_service = get_relationship_service()
        self.deduplicator = get_concept_deduplicator()  # NEW: Cleaner results
        self.cache_service = get_layer0_cache_service()
        self.hash_service = get_pdf_hash_service()
        self.cost_optimizer = get_layer0_cost_optimizer()  # NEW: Better cost tracking
    
    async def process_document(
        self,
        pdf_path: str,
        document_id: str,
        user_id: str = "system"
    ) -> Dict[str, Any]:
        """
        Backward compatibility wrapper for process_document_v7.
        Returns dict format expected by main.py upload endpoint.
        """
        try:
            result = await self.process_document_v7(
                document_id=str(document_id),
                pdf_path=pdf_path,
                user_id=user_id
            )
            
            return {
                'success': True,
                'results': {
                    'concepts': [self._concept_to_dict(c) for c in result.concepts],
                    'relationships': [self._relationship_to_dict(r) for r in result.relationships],
                    'hierarchy': [self._node_to_dict(n) for n in result.hierarchy],
                    'metrics': result.metrics
                }
            }
        except Exception as e:
            logger.error(f"Processing failed: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'results': {}
            }
    
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
        cached = self.cache_service.lookup_by_hash(pdf_hash)
        
        if cached:
            logger.info(f"Cache HIT for document {document_id}")
            await self._update_status(document_id, "Loaded from cache", 100)
            
            # Convert cached dict back to V7ProcessingResult
            cached_data = cached.results if hasattr(cached, 'results') else cached
            return V7ProcessingResult(
                document_id=cached_data.get('document_id', document_id),
                hierarchy=cached_data.get('hierarchy', []),
                concepts=cached_data.get('concepts', []),
                relationships=cached_data.get('relationships', []),
                parse_method=cached_data.get('parse_method', 'cached'),
                confidence=cached_data.get('confidence', 1.0),
                metrics=cached_data.get('metrics', {})
            )
        
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
        
        # Step 4.5: Deduplicate concepts (NEW)
        await self._update_status(document_id, "Removing duplicates...", 65)
        duplicates = await self.deduplicator.find_duplicates(document_id, similarity_threshold=0.95)
        
        if duplicates:
            logger.info(f"Found {len(duplicates)} duplicate pairs, merging...")
            for dup_pair in duplicates:
                await self.deduplicator.merge_concepts(dup_pair.concept_a_id, dup_pair.concept_b_id)
            
            # Refresh concept list after merging
            all_concepts = [c for c in all_concepts if not c.merged_into]
            await self._update_status(document_id, f"Deduplicated to {len(all_concepts)} unique concepts", 68)
        
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
        
        # Calculate metrics with enhanced cost tracking
        processing_time = (datetime.now() - start_time).total_seconds()
        high_confidence_concepts = len([c for c in all_concepts if c.confidence > 0.7])
        
        # Log processing cost
        estimate = self.cost_optimizer.estimate_processing_cost(
            doc_type=parse_result.metadata.get('doc_type'),
            page_count=parse_result.metadata.get('page_count', 1),
            has_cache=False
        )
        
        self.cost_optimizer.log_processing(
            pdf_hash=pdf_hash,
            actual_cost=estimate.total,
            cache_hit=False,
            processing_time=processing_time * 1000,
            document_id=document_id,
            user_id=user_id
        )
        
        metrics = {
            'parse_method': parse_result.method_used,
            'parse_duration_ms': int(processing_time * 1000),
            'concepts_extracted': len(all_concepts),
            'high_confidence_concepts': high_confidence_concepts,
            'relationships_detected': len(all_relationships),
            'duplicates_merged': len(duplicates) if duplicates else 0,
            'cache_hit': False,
            'total_cost': estimate.total,
            'cost_breakdown': estimate.breakdown
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
        
        # Store in cache (convert result to dict for storage)
        result_dict = {
            'document_id': document_id,
            'hierarchy': [self._node_to_dict(n) for n in hierarchy],
            'concepts': [self._concept_to_dict(c) for c in all_concepts],
            'relationships': [self._relationship_to_dict(r) for r in all_relationships],
            'parse_method': parse_result.method_used,
            'confidence': parse_result.confidence,
            'metrics': metrics
        }
        
        self.cache_service.store_analogies(
            cache_key=pdf_hash,
            data=result_dict,
            metadata={'version': 'v7', 'page_count': metadata.get('page_count', 0)}
        )
        
        logger.info(f"V7 processing complete for document {document_id}")
        return result
    
    async def _update_status(self, document_id: str, message: str, progress: int):
        """
        Update processing status for real-time UI updates.
        """
        try:
            # NOTE: The processed_documents table doesn't have status tracking columns yet
            # This would need a separate task_status table or additional columns
            # For now, just log the status
            
            # Emit WebSocket event for real-time updates (if available)
            # await self.websocket_manager.broadcast(...)
            
            logger.debug(f"Status update: {message} ({progress}%)")
        except Exception as e:
            logger.warning(f"Failed to update status (non-critical): {e}")
    
    async def _store_results(
        self,
        document_id: str,
        hierarchy: List[HierarchyNode],
        concepts: List[Concept],
        relationships: List[Relationship],
        parse_method: str,
        parse_confidence: float
    ):
        """Store all results in database (if connected)"""
        try:
            # Only store in database if connected
            if not self.db or not hasattr(self.db, 'is_connected') or not self.db.is_connected:
                logger.info("Database not connected - skipping database storage (using in-memory)")
                return
            
            # Note: hierarchy, parse_method, and parse_confidence are not stored in database yet
            # They would need additional columns added to processed_documents table
            # For now, we just store concepts and relationships
            
            logger.info(f"Storing results for document {document_id}")
            logger.info(f"  Hierarchy nodes: {len(hierarchy)}")
            logger.info(f"  Parse method: {parse_method}, confidence: {parse_confidence}")
            
            # Bulk insert concepts
            for concept in concepts:
                await self.db.execute(
                    """
                    INSERT INTO concepts (
                        document_id, term, definition, confidence,
                        methods_found, extraction_methods, structure_id, structure_type
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT DO NOTHING
                    """,
                    document_id, concept.term, concept.definition, concept.confidence,
                    concept.methods_found, concept.extraction_methods,
                    concept.structure_id, concept.structure_type
                )
            
            # Bulk insert relationships
            for rel in relationships:
                await self.db.execute(
                    """
                    INSERT INTO relationships (
                        source_concept_id, target_concept_id, relationship_type,
                        strength, similarity_score, claude_confidence, explanation
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT DO NOTHING
                    """,
                    rel.source_concept_id, rel.target_concept_id, rel.relationship_type,
                    rel.strength, rel.similarity_score, rel.claude_confidence, rel.explanation
                )
            
            logger.info(f"Stored {len(concepts)} concepts and {len(relationships)} relationships")
        except Exception as e:
            logger.error(f"Failed to store results: {e}")
    
    async def _store_metrics(self, document_id: str, metrics: Dict):
        """Store processing metrics (if database connected)"""
        try:
            # Only store in database if connected
            if not self.db or not hasattr(self.db, 'is_connected') or not self.db.is_connected:
                logger.info("Database not connected - skipping metrics storage")
                return
            
            await self.db.execute(
                """
                INSERT INTO v7_processing_metrics (
                    document_id, parse_method, parse_duration_ms,
                    concepts_extracted, high_confidence_concepts,
                    relationships_detected, cache_hit, total_cost
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT DO NOTHING
                """,
                document_id, metrics['parse_method'], metrics['parse_duration_ms'],
                metrics['concepts_extracted'], metrics['high_confidence_concepts'],
                metrics['relationships_detected'], metrics['cache_hit'], metrics['total_cost']
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
    
    def _concept_to_dict(self, concept: Concept) -> Dict:
        """Convert Concept to dictionary"""
        return {
            'id': str(concept.id) if hasattr(concept, 'id') else None,
            'term': concept.term,
            'definition': concept.definition,
            'confidence': concept.confidence,
            'methods_found': concept.methods_found,
            'extraction_methods': concept.extraction_methods,
            'structure_id': concept.structure_id,
            'structure_type': concept.structure_type
        }
    
    def _relationship_to_dict(self, rel: Relationship) -> Dict:
        """Convert Relationship to dictionary"""
        return {
            'id': str(rel.id) if hasattr(rel, 'id') else None,
            'source_concept_id': str(rel.source_concept_id),
            'target_concept_id': str(rel.target_concept_id),
            'relationship_type': rel.relationship_type,
            'strength': rel.strength,
            'similarity_score': rel.similarity_score,
            'claude_confidence': rel.claude_confidence,
            'explanation': rel.explanation
        }


def get_v7_pipeline() -> V7Pipeline:
    """Factory function to get V7Pipeline instance"""
    return V7Pipeline()
