"""
Document Type Detector

Detects whether a PDF is digital (extractable text), scanned (images requiring OCR),
or hybrid (mix of both). This drives processing strategy and cost estimation.
"""

import pdfplumber
import logging
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class DocumentType:
    """Classification of document type"""
    classification: str  # "digital", "scanned", "hybrid"
    confidence: float  # 0.0 to 1.0
    text_pages: int
    image_pages: int
    total_pages: int
    characteristics: Dict


@dataclass
class PageAnalysis:
    """Analysis of a single page"""
    page_number: int
    has_text: bool
    text_length: int
    has_images: bool
    image_count: int
    is_likely_scanned: bool


class DocumentTypeDetector:
    """
    Detects if PDF is scanned or digital for processing optimization.
    
    Reuses existing pdfplumber infrastructure for efficiency.
    """
    
    def __init__(
        self,
        text_threshold: int = 50,
        digital_threshold: float = 0.8,
        scanned_threshold: float = 0.2
    ):
        """
        Initialize document type detector.
        
        Args:
            text_threshold: Minimum characters to consider page as having text
            digital_threshold: Ratio of text pages to classify as digital
            scanned_threshold: Ratio of text pages below which is scanned
        """
        self.text_threshold = text_threshold
        self.digital_threshold = digital_threshold
        self.scanned_threshold = scanned_threshold
        logger.info("DocumentTypeDetector initialized")
    
    def detect_type(self, pdf_path: str) -> DocumentType:
        """
        Analyze PDF and classify document type.
        
        Strategy:
        - Sample pages (first 5, middle 2, last 2)
        - Check text extractability
        - Classify based on text/image ratio
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            DocumentType with classification and confidence
            
        Raises:
            FileNotFoundError: If PDF doesn't exist
            IOError: If PDF cannot be opened
        """
        try:
            path = Path(pdf_path)
            if not path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            logger.info(f"Detecting document type for: {pdf_path}")
            
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                
                # Sample pages for analysis
                sample_indices = self._get_sample_pages(total_pages)
                
                # Analyze sampled pages
                page_analyses = []
                for idx in sample_indices:
                    analysis = self._analyze_page(pdf.pages[idx], idx + 1)
                    page_analyses.append(analysis)
                
                # Classify based on analysis
                doc_type = self._classify_document(page_analyses, total_pages)
                
                logger.info(
                    f"Document classified as {doc_type.classification} "
                    f"with {doc_type.confidence:.2f} confidence"
                )
                
                return doc_type
                
        except FileNotFoundError:
            logger.error(f"PDF file not found: {pdf_path}")
            raise
        except Exception as e:
            logger.error(f"Error detecting document type: {str(e)}")
            raise IOError(f"Failed to detect document type: {str(e)}")
    
    def _get_sample_pages(self, total_pages: int) -> List[int]:
        """
        Get indices of pages to sample.
        
        Strategy: First 5, middle 2, last 2 (max 9 pages)
        
        Args:
            total_pages: Total number of pages in PDF
            
        Returns:
            List of page indices (0-based)
        """
        if total_pages <= 9:
            # Sample all pages if document is small
            return list(range(total_pages))
        
        sample_indices = []
        
        # First 5 pages
        sample_indices.extend(range(min(5, total_pages)))
        
        # Middle 2 pages
        mid = total_pages // 2
        sample_indices.extend([mid - 1, mid])
        
        # Last 2 pages
        sample_indices.extend([total_pages - 2, total_pages - 1])
        
        # Remove duplicates and sort
        return sorted(set(sample_indices))
    
    def _analyze_page(self, page, page_number: int) -> PageAnalysis:
        """
        Analyze single page for text/image content.
        
        Args:
            page: pdfplumber page object
            page_number: Page number (1-based)
            
        Returns:
            PageAnalysis with page characteristics
        """
        try:
            # Extract text
            text = page.extract_text() or ""
            text_length = len(text.strip())
            has_text = text_length >= self.text_threshold
            
            # Check for images
            images = page.images if hasattr(page, 'images') else []
            image_count = len(images)
            has_images = image_count > 0
            
            # Determine if likely scanned
            # Scanned pages typically have few/no extractable text
            # but may have large images covering the page
            is_likely_scanned = (
                not has_text and has_images
            ) or (
                text_length < self.text_threshold and image_count > 0
            )
            
            logger.debug(
                f"Page {page_number}: text_length={text_length}, "
                f"images={image_count}, scanned={is_likely_scanned}"
            )
            
            return PageAnalysis(
                page_number=page_number,
                has_text=has_text,
                text_length=text_length,
                has_images=has_images,
                image_count=image_count,
                is_likely_scanned=is_likely_scanned
            )
            
        except Exception as e:
            logger.warning(f"Error analyzing page {page_number}: {str(e)}")
            # Return conservative analysis on error
            return PageAnalysis(
                page_number=page_number,
                has_text=False,
                text_length=0,
                has_images=False,
                image_count=0,
                is_likely_scanned=True
            )
    
    def _classify_document(
        self,
        page_analyses: List[PageAnalysis],
        total_pages: int
    ) -> DocumentType:
        """
        Classify document based on page analyses.
        
        Classification logic:
        - Digital: >80% of sampled pages have extractable text
        - Scanned: <20% of sampled pages have extractable text
        - Hybrid: Between 20% and 80%
        
        Args:
            page_analyses: List of page analyses
            total_pages: Total pages in document
            
        Returns:
            DocumentType with classification
        """
        sampled_count = len(page_analyses)
        text_pages = sum(1 for p in page_analyses if p.has_text)
        scanned_pages = sum(1 for p in page_analyses if p.is_likely_scanned)
        
        # Calculate ratio of text pages
        text_ratio = text_pages / sampled_count if sampled_count > 0 else 0
        
        # Classify
        if text_ratio >= self.digital_threshold:
            classification = "digital"
            confidence = text_ratio
        elif text_ratio <= self.scanned_threshold:
            classification = "scanned"
            confidence = 1.0 - text_ratio
        else:
            classification = "hybrid"
            # Confidence is lower for hybrid (ambiguous)
            confidence = 0.5 + abs(0.5 - text_ratio)
        
        # Estimate counts for full document
        estimated_text_pages = int(text_ratio * total_pages)
        estimated_image_pages = total_pages - estimated_text_pages
        
        characteristics = {
            'sampled_pages': sampled_count,
            'text_ratio': text_ratio,
            'avg_text_length': sum(p.text_length for p in page_analyses) / sampled_count,
            'pages_with_images': sum(1 for p in page_analyses if p.has_images),
            'total_images': sum(p.image_count for p in page_analyses)
        }
        
        return DocumentType(
            classification=classification,
            confidence=confidence,
            text_pages=estimated_text_pages,
            image_pages=estimated_image_pages,
            total_pages=total_pages,
            characteristics=characteristics
        )
    
    def estimate_ocr_cost(
        self,
        doc_type: DocumentType,
        page_count: int,
        ocr_cost_per_page: float = 0.05
    ) -> float:
        """
        Estimate OCR processing cost.
        
        Args:
            doc_type: Document type classification
            page_count: Number of pages
            ocr_cost_per_page: Cost per page for OCR (default: $0.05)
            
        Returns:
            Estimated OCR cost in USD
        """
        if doc_type.classification == "digital":
            # No OCR needed
            return 0.0
        elif doc_type.classification == "scanned":
            # All pages need OCR
            return page_count * ocr_cost_per_page
        else:  # hybrid
            # Only image pages need OCR
            return doc_type.image_pages * ocr_cost_per_page


# Singleton instance
_document_type_detector_instance: Optional[DocumentTypeDetector] = None


def get_document_type_detector() -> DocumentTypeDetector:
    """
    Get singleton Document Type Detector instance.
    
    Returns:
        DocumentTypeDetector instance
    """
    global _document_type_detector_instance
    if _document_type_detector_instance is None:
        _document_type_detector_instance = DocumentTypeDetector()
    return _document_type_detector_instance
