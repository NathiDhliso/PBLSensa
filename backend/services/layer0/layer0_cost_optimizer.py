"""
Layer 0 Cost Optimizer

Enhanced cost tracking for PDF processing.
Extends existing CostTracker with Layer 0 specific functionality.
"""

import logging
from datetime import datetime, date, timedelta
from typing import Dict, Optional
from dataclasses import dataclass, asdict
from services.cost_tracker import CostTracker, CostEntry
from .document_type_detector import DocumentType

logger = logging.getLogger(__name__)


@dataclass
class CostEstimate:
    """Cost estimation breakdown"""
    ocr_cost: float
    extraction_cost: float
    embedding_cost: float
    storage_cost: float
    total: float
    breakdown: Dict[str, float]


@dataclass
class CostSavings:
    """Cost savings from caching"""
    total_cost: float
    cost_saved: float
    savings_percentage: float
    cache_hits: int
    cache_misses: int
    hit_rate: float


class Layer0CostOptimizer(CostTracker):
    """
    Enhanced cost optimizer for Layer 0 PDF processing.
    
    Extends CostTracker with:
    - PDF-specific cost estimation
    - Cache savings calculation
    - Document type-based costing
    """
    
    # Cost constants (per unit)
    CLAUDE_INPUT_COST = 3.00 / 1_000_000  # per token
    CLAUDE_OUTPUT_COST = 15.00 / 1_000_000  # per token
    EMBEDDING_COST = 0.10 / 1_000_000  # per token
    OCR_COST_PER_PAGE = 0.05  # Textract pricing
    STORAGE_COST_PER_GB_MONTH = 0.023  # S3 pricing
    
    def __init__(self, daily_threshold_usd: float = 50.0):
        """
        Initialize Layer 0 cost optimizer.
        
        Args:
            daily_threshold_usd: Daily cost threshold for alerts
        """
        super().__init__(daily_threshold_usd)
        
        # Track cache-specific costs
        self.cache_hits_count = 0
        self.cache_misses_count = 0
        
        logger.info(f"Layer0CostOptimizer initialized with threshold=${daily_threshold_usd}")
    
    def estimate_processing_cost(
        self,
        doc_type: DocumentType,
        page_count: int,
        has_cache: bool = False
    ) -> CostEstimate:
        """
        Estimate total processing cost for a document.
        
        Args:
            doc_type: Document type classification
            page_count: Number of pages
            has_cache: Whether document is cached
            
        Returns:
            CostEstimate with breakdown
        """
        if has_cache:
            # Cached documents have minimal cost
            return CostEstimate(
                ocr_cost=0.0,
                extraction_cost=0.0,
                embedding_cost=0.0,
                storage_cost=0.0,
                total=0.0,
                breakdown={'cache_hit': 0.0}
            )
        
        # OCR cost (if needed)
        if doc_type.classification == "scanned":
            ocr_cost = page_count * self.OCR_COST_PER_PAGE
        elif doc_type.classification == "hybrid":
            ocr_cost = doc_type.image_pages * self.OCR_COST_PER_PAGE
        else:
            ocr_cost = 0.0
        
        # Concept extraction cost (Claude)
        estimated_tokens = page_count * 500  # avg tokens per page
        input_cost = estimated_tokens * self.CLAUDE_INPUT_COST
        output_cost = (estimated_tokens * 0.3) * self.CLAUDE_OUTPUT_COST
        extraction_cost = input_cost + output_cost
        
        # Embedding cost
        concept_count = page_count * 10  # avg concepts per page
        embedding_cost = concept_count * 100 * self.EMBEDDING_COST
        
        # Storage cost (minimal for single document)
        storage_cost = 0.001  # ~1MB storage
        
        total = ocr_cost + extraction_cost + embedding_cost + storage_cost
        
        breakdown = {
            'ocr': ocr_cost,
            'claude_input': input_cost,
            'claude_output': output_cost,
            'embeddings': embedding_cost,
            'storage': storage_cost
        }
        
        logger.debug(
            f"Cost estimate for {page_count} pages ({doc_type.classification}): "
            f"${total:.4f}"
        )
        
        return CostEstimate(
            ocr_cost=ocr_cost,
            extraction_cost=extraction_cost,
            embedding_cost=embedding_cost,
            storage_cost=storage_cost,
            total=total,
            breakdown=breakdown
        )
    
    def log_processing(
        self,
        pdf_hash: str,
        actual_cost: float,
        cache_hit: bool,
        processing_time: float,
        document_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> None:
        """
        Log processing event with costs.
        
        Args:
            pdf_hash: PDF hash
            actual_cost: Actual processing cost
            cache_hit: Whether this was a cache hit
            processing_time: Processing time in ms
            document_id: Optional document ID
            user_id: Optional user ID
        """
        # Track cache statistics
        if cache_hit:
            self.cache_hits_count += 1
        else:
            self.cache_misses_count += 1
        
        # Log to parent CostTracker
        entry = CostEntry(
            service_name='layer0',
            operation='pdf_processing',
            estimated_cost_usd=actual_cost,
            units_consumed=int(processing_time),  # Use time as units
            document_id=document_id,
            user_id=user_id,
            created_at=datetime.now()
        )
        self.cost_entries.append(entry)
        
        # Check threshold
        daily_cost = self.get_daily_cost()
        if daily_cost > self.daily_threshold_usd:
            self.send_cost_alert(daily_cost)
        
        logger.info(
            f"Logged processing: hash={pdf_hash[:16]}, cost=${actual_cost:.4f}, "
            f"cache_hit={cache_hit}, time={processing_time:.0f}ms"
        )
    
    def calculate_savings(self, period_days: int = 30) -> CostSavings:
        """
        Calculate cost savings from caching over a period.
        
        Args:
            period_days: Number of days to analyze
            
        Returns:
            CostSavings with detailed breakdown
        """
        cutoff_date = datetime.now() - timedelta(days=period_days)
        
        # Calculate total cost (what we actually spent)
        total_cost = sum(
            entry.estimated_cost_usd
            for entry in self.cost_entries
            if entry.created_at >= cutoff_date
        )
        
        # Estimate what we would have spent without caching
        # Assume average cost per document is $0.50
        avg_cost_per_doc = 0.50
        total_requests = self.cache_hits_count + self.cache_misses_count
        estimated_cost_without_cache = total_requests * avg_cost_per_doc
        
        # Calculate savings
        cost_saved = estimated_cost_without_cache - total_cost
        savings_percentage = (cost_saved / estimated_cost_without_cache * 100) if estimated_cost_without_cache > 0 else 0
        
        # Calculate hit rate
        hit_rate = (self.cache_hits_count / total_requests * 100) if total_requests > 0 else 0
        
        logger.info(
            f"Cost savings ({period_days}d): saved=${cost_saved:.2f} "
            f"({savings_percentage:.1f}%), hit_rate={hit_rate:.1f}%"
        )
        
        return CostSavings(
            total_cost=total_cost,
            cost_saved=cost_saved,
            savings_percentage=savings_percentage,
            cache_hits=self.cache_hits_count,
            cache_misses=self.cache_misses_count,
            hit_rate=hit_rate
        )
    
    def get_cost_breakdown(self, days: int = 7) -> Dict:
        """
        Get detailed cost breakdown.
        
        Extends parent method with cache-specific metrics.
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Dict with cost breakdown
        """
        # Get base breakdown from parent
        base_breakdown = super().get_cost_breakdown(days)
        
        # Add cache-specific metrics
        total_requests = self.cache_hits_count + self.cache_misses_count
        hit_rate = (self.cache_hits_count / total_requests * 100) if total_requests > 0 else 0
        
        base_breakdown.update({
            'cache_hits': self.cache_hits_count,
            'cache_misses': self.cache_misses_count,
            'cache_hit_rate': round(hit_rate, 2),
            'total_requests': total_requests
        })
        
        return base_breakdown
    
    def get_cost_stats(self) -> Dict:
        """
        Get comprehensive cost statistics.
        
        Extends parent method with Layer 0 metrics.
        
        Returns:
            Dict with cost stats
        """
        # Get base stats from parent
        base_stats = super().get_cost_stats()
        
        # Add Layer 0 specific stats
        total_requests = self.cache_hits_count + self.cache_misses_count
        hit_rate = (self.cache_hits_count / total_requests) if total_requests > 0 else 0
        
        # Calculate savings
        savings = self.calculate_savings(30)
        
        base_stats.update({
            'cache_hits': self.cache_hits_count,
            'cache_misses': self.cache_misses_count,
            'cache_hit_rate': round(hit_rate * 100, 2),
            'total_requests': total_requests,
            'cost_saved_30d': round(savings.cost_saved, 2),
            'savings_percentage_30d': round(savings.savings_percentage, 2)
        })
        
        return base_stats


# Singleton instance
_layer0_cost_optimizer_instance: Optional[Layer0CostOptimizer] = None


def get_layer0_cost_optimizer() -> Layer0CostOptimizer:
    """
    Get singleton Layer 0 Cost Optimizer instance.
    
    Returns:
        Layer0CostOptimizer instance
    """
    global _layer0_cost_optimizer_instance
    if _layer0_cost_optimizer_instance is None:
        _layer0_cost_optimizer_instance = Layer0CostOptimizer()
    return _layer0_cost_optimizer_instance
