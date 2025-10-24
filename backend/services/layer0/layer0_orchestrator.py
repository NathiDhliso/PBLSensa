"""
Layer 0 Orchestrator

Main entry point that coordinates all Layer 0 services.
Ties together hashing, detection, caching, and cost optimization.
"""

import time
import logging
import asyncio
from typing import Optional, Dict
from uuid import UUID
from dataclasses import dataclass, asdict
from .pdf_hash_service import get_pdf_hash_service
from .document_type_detector import get_document_type_detector, DocumentType
from .layer0_cache_service import get_layer0_cache_service
from .layer0_cost_optimizer import get_layer0_cost_optimizer
from services.pbl.pbl_pipeline import PBLPipeline

logger = logging.getLogger(__name__)


@dataclass
class ProcessingResult:
    """Result of Layer 0 processing"""
    success: bool
    cached: bool
    data: Dict
    processing_time_ms: float
    cost_usd: Optional[float]
    error: Optional[str]
    pdf_hash: str
    document_type: Optional[DocumentType]


class Layer0Orchestrator:
    """
    Main orchestrator for Layer 0 PDF processing.
    
    Coordinates:
    - PDF hashing
    - Cache lookup
    - Document type detection
    - Cost estimation
    - Pipeline integration
    """
    
    # Retry configuration
    MAX_RETRIES = 3
    BASE_RETRY_DELAY = 1.0  # seconds
    MAX_RETRY_DELAY = 30.0  # seconds
    
    def __init__(self):
        """Initialize Layer 0 orchestrator with all services."""
        self.hash_service = get_pdf_hash_service()
        self.type_detector = get_document_type_detector()
        self.cache_service = get_layer0_cache_service()
        self.cost_optimizer = get_layer0_cost_optimizer()
        self.pbl_pipeline = PBLPipeline(
            rate_limiter=None,
            cost_tracker=self.cost_optimizer,
            cache_manager=self.cache_service
        )
        
        logger.info("Layer0Orchestrator initialized with PBL pipeline integration")
    
    async def _retry_with_exponential_backoff(
        self,
        func,
        operation_name: str,
        *args,
        **kwargs
    ):
        """
        Retry an operation with exponential backoff.
        
        Args:
            func: Function to retry
            operation_name: Name of operation for logging
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func
            
        Returns:
            Result of func
            
        Raises:
            Exception: If all retries fail
        """
        last_exception = None
        
        for attempt in range(self.MAX_RETRIES):
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                if attempt < self.MAX_RETRIES - 1:
                    # Calculate delay with exponential backoff
                    delay = min(
                        self.BASE_RETRY_DELAY * (2 ** attempt),
                        self.MAX_RETRY_DELAY
                    )
                    
                    logger.warning(
                        f"{operation_name} failed (attempt {attempt + 1}/{self.MAX_RETRIES}): {str(e)}. "
                        f"Retrying in {delay:.1f}s..."
                    )
                    
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"{operation_name} failed after {self.MAX_RETRIES} attempts: {str(e)}"
                    )
        
        raise last_exception
    
    async def process_pdf(
        self,
        pdf_path: str,
        document_id: UUID,
        user_id: UUID,
        force_reprocess: bool = False
    ) -> ProcessingResult:
        """
        Main entry point for PDF processing.
        
        Flow:
        1. Compute hash
        2. Check cache (unless force_reprocess)
        3. Validate PDF
        4. Detect document type
        5. Estimate cost
        6. Process or return cached
        7. Update cache
        8. Return results
        
        Args:
            pdf_path: Path to PDF file
            document_id: Document ID
            user_id: User ID
            force_reprocess: Skip cache lookup
            
        Returns:
            ProcessingResult with data and metadata
        """
        start_time = time.time()
        pdf_hash = ""
        
        try:
            logger.info(f"Processing PDF: {pdf_path}")
            
            # Step 1: Compute hash and extract metadata with retry
            try:
                pdf_hash, metadata = await self._retry_with_exponential_backoff(
                    self.hash_service.compute_hash_and_metadata,
                    "Hash computation",
                    pdf_path
                )
                logger.info(f"PDF hash: {pdf_hash[:16]}...")
            except FileNotFoundError as e:
                logger.error(f"PDF file not found: {pdf_path}")
                return ProcessingResult(
                    success=False,
                    cached=False,
                    data={},
                    processing_time_ms=(time.time() - start_time) * 1000,
                    cost_usd=None,
                    error=f"File not found: {str(e)}",
                    pdf_hash="",
                    document_type=None
                )
            except Exception as e:
                logger.error(f"Failed to compute hash: {str(e)}")
                return ProcessingResult(
                    success=False,
                    cached=False,
                    data={},
                    processing_time_ms=(time.time() - start_time) * 1000,
                    cost_usd=None,
                    error=f"Hash computation failed: {str(e)}",
                    pdf_hash="",
                    document_type=None
                )
            
            # Step 2: Cache lookup with fallback on failure
            if not force_reprocess:
                try:
                    cached = self.cache_service.lookup_by_hash(pdf_hash)
                    if cached:
                        processing_time = (time.time() - start_time) * 1000
                        
                        # Log cache hit
                        self.cost_optimizer.log_processing(
                            pdf_hash=pdf_hash,
                            actual_cost=0.0,
                            cache_hit=True,
                            processing_time=processing_time,
                            document_id=str(document_id),
                            user_id=str(user_id)
                        )
                        
                        logger.info(f"Cache HIT - returning cached results ({processing_time:.0f}ms)")
                        
                        return ProcessingResult(
                            success=True,
                            cached=True,
                            data=cached.results,
                            processing_time_ms=processing_time,
                            cost_usd=0.0,
                            error=None,
                            pdf_hash=pdf_hash,
                            document_type=None
                        )
                except Exception as e:
                    logger.warning(f"Cache lookup failed, proceeding with processing: {str(e)}")
            
            # Step 3: Detect document type with retry
            try:
                doc_type = await self._retry_with_exponential_backoff(
                    self.type_detector.detect_type,
                    "Document type detection",
                    pdf_path
                )
                logger.info(
                    f"Document type: {doc_type.classification} "
                    f"(confidence: {doc_type.confidence:.2f})"
                )
            except Exception as e:
                logger.error(f"Document type detection failed: {str(e)}")
                return ProcessingResult(
                    success=False,
                    cached=False,
                    data={'pdf_hash': pdf_hash, 'metadata': metadata},
                    processing_time_ms=(time.time() - start_time) * 1000,
                    cost_usd=None,
                    error=f"Document type detection failed: {str(e)}",
                    pdf_hash=pdf_hash,
                    document_type=None
                )
            
            # Step 4: Estimate cost
            try:
                cost_estimate = self.cost_optimizer.estimate_processing_cost(
                    doc_type=doc_type,
                    page_count=metadata['page_count'],
                    has_cache=False
                )
                logger.info(f"Estimated cost: ${cost_estimate.total:.4f}")
            except Exception as e:
                logger.warning(f"Cost estimation failed, using default: {str(e)}")
                # Create default cost estimate
                from .layer0_cost_optimizer import CostEstimate
                cost_estimate = CostEstimate(
                    ocr_cost=0.0,
                    extraction_cost=0.0,
                    embedding_cost=0.0,
                    storage_cost=0.0,
                    total=0.0,
                    breakdown={}
                )
            
            # Step 5: Process through PBL pipeline with retry
            logger.info("Processing through PBL pipeline...")
            try:
                pipeline_results = await self._retry_with_exponential_backoff(
                    self.pbl_pipeline.process_document,
                    "PBL pipeline processing",
                    pdf_path=pdf_path,
                    document_id=document_id,
                    user_id=user_id,
                    progress_callback=None
                )
            except Exception as e:
                logger.error(f"PBL pipeline processing failed after retries: {str(e)}")
                processing_time = (time.time() - start_time) * 1000
                return ProcessingResult(
                    success=False,
                    cached=False,
                    data={
                        'pdf_hash': pdf_hash,
                        'metadata': metadata,
                        'document_type': doc_type.classification
                    },
                    processing_time_ms=processing_time,
                    cost_usd=cost_estimate.total,
                    error=f"Pipeline processing failed: {str(e)}",
                    pdf_hash=pdf_hash,
                    document_type=doc_type
                )
            
            # Combine results
            results = {
                'document_id': str(document_id),
                'pdf_hash': pdf_hash,
                'metadata': metadata,
                'document_type': doc_type.classification,
                'page_count': metadata['page_count'],
                'processed_at': time.time(),
                'pipeline_results': pipeline_results.get('results', {}),
                'chunks': pipeline_results.get('results', {}).get('chunks', 0),
                'concepts_extracted': pipeline_results.get('results', {}).get('concepts_extracted', 0),
                'relationships_detected': pipeline_results.get('results', {}).get('relationships_detected', 0)
            }
            
            # Step 6: Cache results after successful processing (with fallback)
            if pipeline_results.get('success', False):
                try:
                    self.cache_service.store_results(
                        pdf_hash=pdf_hash,
                        results=results,
                        metadata=metadata,
                        compression=True
                    )
                    logger.info(f"Results cached for hash: {pdf_hash[:16]}...")
                except Exception as e:
                    logger.warning(f"Failed to cache results (non-critical): {str(e)}")
            else:
                logger.warning(f"Pipeline processing failed, not caching results")
            
            # Step 7: Log costs and update tracking (with fallback)
            processing_time = (time.time() - start_time) * 1000
            try:
                self.cost_optimizer.log_processing(
                    pdf_hash=pdf_hash,
                    actual_cost=cost_estimate.total,
                    cache_hit=False,
                    processing_time=processing_time,
                    document_id=str(document_id),
                    user_id=str(user_id)
                )
            except Exception as e:
                logger.warning(f"Failed to log cost tracking (non-critical): {str(e)}")
            
            logger.info(
                f"Processing complete: {processing_time:.0f}ms, "
                f"cost=${cost_estimate.total:.4f}, "
                f"concepts={results.get('concepts_extracted', 0)}"
            )
            
            return ProcessingResult(
                success=pipeline_results.get('success', False),
                cached=False,
                data=results,
                processing_time_ms=processing_time,
                cost_usd=cost_estimate.total,
                error=pipeline_results.get('error') if not pipeline_results.get('success') else None,
                pdf_hash=pdf_hash,
                document_type=doc_type
            )
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            logger.error(f"Unexpected error during processing: {str(e)}", exc_info=True)
            
            # Try to log the failure for monitoring
            try:
                self.cost_optimizer.log_processing(
                    pdf_hash=pdf_hash or "unknown",
                    actual_cost=0.0,
                    cache_hit=False,
                    processing_time=processing_time,
                    document_id=str(document_id),
                    user_id=str(user_id)
                )
            except:
                pass  # Ignore logging errors in error handler
            
            return ProcessingResult(
                success=False,
                cached=False,
                data={'pdf_hash': pdf_hash} if pdf_hash else {},
                processing_time_ms=processing_time,
                cost_usd=None,
                error=f"Unexpected error: {str(e)}",
                pdf_hash=pdf_hash or "",
                document_type=None
            )
    
    def get_stats(self) -> Dict:
        """
        Get comprehensive Layer 0 statistics.
        
        Returns:
            Dict with cache, cost, and performance stats
        """
        return {
            'cache': self.cache_service.get_cache_stats(),
            'cost': self.cost_optimizer.get_cost_stats(),
            'cost_breakdown': self.cost_optimizer.get_cost_breakdown(7)
        }


# Singleton instance
_layer0_orchestrator_instance: Optional[Layer0Orchestrator] = None


def get_layer0_orchestrator() -> Layer0Orchestrator:
    """
    Get singleton Layer 0 Orchestrator instance.
    
    Returns:
        Layer0Orchestrator instance
    """
    global _layer0_orchestrator_instance
    if _layer0_orchestrator_instance is None:
        _layer0_orchestrator_instance = Layer0Orchestrator()
    return _layer0_orchestrator_instance
