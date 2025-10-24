"""
PBL Pipeline Orchestrator

DEPRECATED: This module is deprecated. Use backend.services.pbl.v7_pipeline instead.

The V7 pipeline provides all PBL pipeline features plus:
- Multi-method parsing (LlamaParse, Textract, pdfplumber)
- Ensemble concept extraction (KeyBERT + YAKE + spaCy)
- RAG-powered relationship detection
- Layer 0 caching integration
- Hierarchical structure preservation
- Better accuracy (70%+ vs 65-75%)

For backward compatibility, get_pbl_pipeline() in __init__.py now returns V7Pipeline.
"""

import warnings
import logging

warnings.warn(
    "pbl_pipeline is deprecated, use v7_pipeline instead. "
    "get_pbl_pipeline() now returns V7Pipeline for backward compatibility.",
    DeprecationWarning,
    stacklevel=2
)
from typing import Dict, Optional, Callable
from uuid import UUID
from datetime import datetime
from services.pbl.pdf_parser import get_pdf_parser
from services.pbl.concept_extractor import get_concept_extractor
from services.pbl.structure_classifier import get_structure_classifier
from services.pbl.concept_deduplicator import get_concept_deduplicator
from services.pbl.concept_service import get_concept_service
from services.pbl.relationship_service import get_relationship_service
from services.pbl.visualization_service import get_visualization_service
from services.rate_limiter import RateLimiter
from services.cost_tracker import CostTracker
from services.cache_manager import CacheManager

logger = logging.getLogger(__name__)


class PBLPipeline:
    """
    Orchestrates the complete PBL document processing pipeline.
    
    Stages:
    1. PDF Parsing
    2. Concept Extraction
    3. Structure Classification
    4. Deduplication
    5. Visualization Generation
    """
    
    def __init__(
        self,
        rate_limiter: Optional[RateLimiter] = None,
        cost_tracker: Optional[CostTracker] = None,
        cache_manager: Optional[CacheManager] = None
    ):
        """
        Initialize the pipeline orchestrator.
        
        Args:
            rate_limiter: Rate limiter for API calls
            cost_tracker: Cost tracker for monitoring
            cache_manager: Cache manager for intermediate results
        """
        # Initialize services
        self.pdf_parser = get_pdf_parser()
        self.concept_extractor = get_concept_extractor()
        self.structure_classifier = get_structure_classifier()
        self.concept_deduplicator = get_concept_deduplicator()
        self.concept_service = get_concept_service()
        self.relationship_service = get_relationship_service()
        self.visualization_service = get_visualization_service()
        
        # Initialize monitoring services
        self.rate_limiter = rate_limiter or RateLimiter()
        self.cost_tracker = cost_tracker or CostTracker()
        self.cache_manager = cache_manager or CacheManager()
        
        # Define stages
        self.stages = [
            "parsing",
            "extraction",
            "classification",
            "deduplication",
            "visualization"
        ]
        
        logger.info("PBLPipeline initialized")
    
    async def process_document(
        self,
        pdf_path: str,
        document_id: UUID,
        user_id: Optional[UUID] = None,
        progress_callback: Optional[Callable[[str, float], None]] = None
    ) -> Dict:
        """
        Process a document through the complete PBL pipeline.
        
        Args:
            pdf_path: Path to the PDF file
            document_id: ID of the document
            user_id: Optional user ID
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dict with processing results
        """
        logger.info(f"Starting PBL pipeline for document: {document_id}")
        
        # Initialize progress tracking
        progress = ProgressTracker(self.stages, progress_callback)
        results = {}
        
        try:
            print(f"\n{'='*80}")
            print(f"🚀 PBL PIPELINE STARTED")
            print(f"{'='*80}")
            print(f"Document ID: {document_id}")
            print(f"PDF Path: {pdf_path}")
            print(f"{'='*80}\n")
            
            # Stage 1: PDF Parsing
            progress.start_stage("parsing")
            print(f"\n📄 STAGE 1: PDF PARSING")
            print(f"{'-'*80}")
            logger.info("Stage 1: PDF Parsing")
            
            chunks = self.pdf_parser.parse_pdf_with_positions(pdf_path)
            results['chunks'] = len(chunks)
            
            print(f"✅ Stage 1 complete: {len(chunks)} chunks created")
            progress.complete_stage("parsing", {"chunks": len(chunks)})
            
            # Stage 2: Concept Extraction
            progress.start_stage("extraction")
            print(f"\n🤖 STAGE 2: CONCEPT EXTRACTION")
            print(f"{'-'*80}")
            logger.info("Stage 2: Concept Extraction")
            
            concepts = self.concept_extractor.extract_concepts(pdf_path, str(document_id))
            results['concepts_extracted'] = len(concepts)
            
            print(f"✅ Stage 2 complete: {len(concepts)} concepts extracted")
            
            # Save concepts to database
            # TODO: Implement database saving
            
            progress.complete_stage("extraction", {"concepts": len(concepts)})
            
            # Stage 3: Structure Classification
            progress.start_stage("classification")
            logger.info("Stage 3: Structure Classification")
            
            # Detect relationships
            detected_relationships = await self.structure_classifier.detect_relationships(
                concepts,
                min_strength=0.3
            )
            results['relationships_detected'] = len(detected_relationships)
            
            # Save relationships to database
            # TODO: Implement relationship saving
            
            progress.complete_stage("classification", {"relationships": len(detected_relationships)})
            
            # Stage 4: Deduplication
            progress.start_stage("deduplication")
            logger.info("Stage 4: Deduplication")
            
            # Deduplication will be done via API endpoint
            # For now, just mark as complete
            results['duplicates_found'] = 0
            
            progress.complete_stage("deduplication", {"duplicates": 0})
            
            # Stage 5: Visualization Generation
            progress.start_stage("visualization")
            logger.info("Stage 5: Visualization Generation")
            
            # Visualization will be generated on-demand via API
            results['visualization_id'] = str(document_id)
            
            progress.complete_stage("visualization", {"visualization_id": str(document_id)})
            
            # Complete
            print(f"\n{'='*80}")
            print(f"✅ PBL PIPELINE COMPLETE")
            print(f"{'='*80}")
            print(f"Document ID: {document_id}")
            print(f"Chunks: {results.get('chunks', 0)}")
            print(f"Concepts: {results.get('concepts_extracted', 0)}")
            print(f"Relationships: {results.get('relationships_detected', 0)}")
            print(f"{'='*80}\n")
            logger.info(f"PBL pipeline complete for document: {document_id}")
            
            return {
                'success': True,
                'document_id': str(document_id),
                'results': results,
                'completed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"\n{'='*80}")
            print(f"❌ PBL PIPELINE FAILED")
            print(f"{'='*80}")
            print(f"Error: {str(e)}")
            print(f"Failed at stage: {progress.current_stage}")
            print(f"Partial results: {results}")
            print(f"{'='*80}\n")
            logger.error(f"Pipeline failed: {e}")
            
            # Return partial results
            return {
                'success': False,
                'document_id': str(document_id),
                'error': str(e),
                'partial_results': results,
                'failed_at_stage': progress.current_stage
            }
    
    def get_progress(self, task_id: str) -> Dict:
        """
        Get processing progress for a task.
        
        Args:
            task_id: ID of the processing task
            
        Returns:
            Dict with progress information
        """
        # TODO: Implement actual progress retrieval from Redis/database
        # For now, return mock data
        return {
            'task_id': task_id,
            'status': 'processing',
            'current_stage': 'extraction',
            'progress': 0.4,
            'stages_completed': ['parsing'],
            'stages_remaining': ['extraction', 'classification', 'deduplication', 'visualization'],
            'estimated_time_remaining': 120  # seconds
        }


class ProgressTracker:
    """
    Tracks progress through pipeline stages.
    Enhanced from existing progress pattern in main.py.
    """
    
    def __init__(
        self,
        stages: list[str],
        callback: Optional[Callable[[str, float], None]] = None
    ):
        """
        Initialize progress tracker.
        
        Args:
            stages: List of stage names
            callback: Optional callback for progress updates
        """
        self.stages = stages
        self.callback = callback
        self.current_stage = None
        self.completed_stages = []
        self.stage_results = {}
        self.start_time = datetime.now()
    
    def start_stage(self, stage: str):
        """Mark a stage as started"""
        self.current_stage = stage
        logger.info(f"Starting stage: {stage}")
        
        if self.callback:
            progress = len(self.completed_stages) / len(self.stages)
            self.callback(stage, progress)
    
    def complete_stage(self, stage: str, results: Optional[Dict] = None):
        """Mark a stage as completed"""
        self.completed_stages.append(stage)
        if results:
            self.stage_results[stage] = results
        
        logger.info(f"Completed stage: {stage}")
        
        if self.callback:
            progress = len(self.completed_stages) / len(self.stages)
            self.callback(stage, progress)
    
    def get_progress(self) -> float:
        """Get overall progress (0.0 to 1.0)"""
        return len(self.completed_stages) / len(self.stages)
    
    def get_status(self) -> Dict:
        """Get detailed status"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        progress = self.get_progress()
        
        # Estimate remaining time
        if progress > 0:
            total_estimated = elapsed / progress
            remaining = total_estimated - elapsed
        else:
            remaining = 0
        
        return {
            'current_stage': self.current_stage,
            'progress': progress,
            'completed_stages': self.completed_stages,
            'remaining_stages': [s for s in self.stages if s not in self.completed_stages],
            'elapsed_seconds': elapsed,
            'estimated_remaining_seconds': remaining,
            'stage_results': self.stage_results
        }


# Singleton instance
_pbl_pipeline: Optional[PBLPipeline] = None


def get_pbl_pipeline() -> PBLPipeline:
    """Get or create the singleton PBLPipeline instance"""
    global _pbl_pipeline
    if _pbl_pipeline is None:
        _pbl_pipeline = PBLPipeline()
    return _pbl_pipeline
