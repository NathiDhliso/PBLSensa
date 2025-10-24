"""
Layer 0 Services

PDF optimization layer providing validation, caching, and cost optimization.
"""

from .pdf_hash_service import PDFHashService, get_pdf_hash_service
from .document_type_detector import (
    DocumentTypeDetector,
    DocumentType,
    PageAnalysis,
    get_document_type_detector,
)
from .layer0_cache_service import (
    Layer0CacheService,
    CachedResult,
    get_layer0_cache_service,
)
from .layer0_cost_optimizer import (
    Layer0CostOptimizer,
    CostEstimate,
    CostSavings,
    get_layer0_cost_optimizer,
)
from .layer0_orchestrator import (
    Layer0Orchestrator,
    ProcessingResult,
    get_layer0_orchestrator,
)

__all__ = [
    "PDFHashService",
    "get_pdf_hash_service",
    "DocumentTypeDetector",
    "DocumentType",
    "PageAnalysis",
    "get_document_type_detector",
    "Layer0CacheService",
    "CachedResult",
    "get_layer0_cache_service",
    "Layer0CostOptimizer",
    "CostEstimate",
    "CostSavings",
    "get_layer0_cost_optimizer",
    "Layer0Orchestrator",
    "ProcessingResult",
    "get_layer0_orchestrator",
]
