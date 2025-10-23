"""
PDF Parser Service

Parses PDF documents and extracts text with position data for concept extraction.
"""

import pdfplumber
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import logging
from models.pbl_concept import TextChunk

logger = logging.getLogger(__name__)


class PDFParser:
    """
    Service for parsing PDF documents with position data.
    """
    
    def __init__(self):
        self.chunk_size = 1000  # tokens
        self.chunk_overlap = 200  # tokens
        self.chars_per_token = 4  # Approximate characters per token
    
    def parse_pdf_with_positions(self, pdf_path: str) -> List[TextChunk]:
        """
        Parse PDF and extract text with page numbers and positions.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of TextChunk objects with text and metadata
        """
        try:
            print(f"  📖 Opening PDF: {pdf_path}")
            logger.info(f"Starting PDF parsing: {pdf_path}")
            
            # Validate file exists
            if not Path(pdf_path).exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            # Extract text from all pages
            print(f"  📄 Extracting text from all pages...")
            pages_text = self._extract_text_from_pages(pdf_path)
            print(f"  ✅ Extracted text from {len(pages_text)} pages")
            
            # Combine into chunks
            print(f"  ✂️  Chunking text...")
            chunks = self._chunk_text(pages_text)
            
            print(f"  ✅ Created {len(chunks)} chunks")
            logger.info(f"PDF parsing complete: {len(chunks)} chunks created from {len(pages_text)} pages")
            
            return chunks
            
        except Exception as e:
            print(f"  ❌ PDF parsing error: {str(e)}")
            logger.error(f"Error parsing PDF {pdf_path}: {str(e)}")
            raise
    
    def _extract_text_from_pages(self, pdf_path: str) -> List[Dict]:
        """
        Extract text from each page with metadata.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            List of dicts with page_number, text, and position data
        """
        pages_data = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    # Extract text
                    text = page.extract_text()
                    
                    if not text or not text.strip():
                        logger.warning(f"Page {page_num} has no extractable text")
                        continue
                    
                    # Get page dimensions for position context
                    page_data = {
                        'page_number': page_num,
                        'text': text.strip(),
                        'width': page.width,
                        'height': page.height,
                        'char_count': len(text)
                    }
                    
                    pages_data.append(page_data)
                    
                    logger.debug(f"Extracted {len(text)} characters from page {page_num}")
        
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise
        
        return pages_data
    
    def _chunk_text(self, pages_data: List[Dict]) -> List[TextChunk]:
        """
        Split text into overlapping chunks for processing.
        
        Args:
            pages_data: List of page data dicts
            
        Returns:
            List of TextChunk objects
        """
        chunks = []
        chunk_index = 0
        
        # Calculate chunk sizes in characters
        chunk_size_chars = self.chunk_size * self.chars_per_token
        overlap_chars = self.chunk_overlap * self.chars_per_token
        
        # Process each page
        for page_data in pages_data:
            page_num = page_data['page_number']
            text = page_data['text']
            
            # If page is smaller than chunk size, create single chunk
            if len(text) <= chunk_size_chars:
                chunk = TextChunk(
                    text=text,
                    page_number=page_num,
                    chunk_index=chunk_index,
                    start_position=0,
                    end_position=len(text)
                )
                chunks.append(chunk)
                chunk_index += 1
                continue
            
            # Split page into overlapping chunks
            start = 0
            while start < len(text):
                end = min(start + chunk_size_chars, len(text))
                
                # Try to break at sentence boundary
                if end < len(text):
                    # Look for sentence endings near the chunk boundary
                    sentence_endings = ['. ', '.\n', '! ', '!\n', '? ', '?\n']
                    best_break = end
                    
                    # Search within last 200 chars for sentence ending
                    search_start = max(end - 200, start)
                    for ending in sentence_endings:
                        pos = text.rfind(ending, search_start, end)
                        if pos != -1 and pos > best_break - 100:
                            best_break = pos + len(ending)
                    
                    end = best_break
                
                chunk_text = text[start:end].strip()
                
                if chunk_text:  # Only add non-empty chunks
                    chunk = TextChunk(
                        text=chunk_text,
                        page_number=page_num,
                        chunk_index=chunk_index,
                        start_position=start,
                        end_position=end
                    )
                    chunks.append(chunk)
                    chunk_index += 1
                
                # Move start position with overlap
                start = end - overlap_chars if end < len(text) else len(text)
        
        logger.info(f"Created {len(chunks)} chunks from {len(pages_data)} pages")
        return chunks
    
    def _handle_multi_column_layout(self, page) -> str:
        """
        Handle multi-column layouts by extracting text in reading order.
        
        Args:
            page: pdfplumber page object
            
        Returns:
            Extracted text in reading order
        """
        # Get all text with bounding boxes
        words = page.extract_words()
        
        if not words:
            return ""
        
        # Sort words by vertical position (top to bottom), then horizontal (left to right)
        # This handles multi-column layouts
        sorted_words = sorted(words, key=lambda w: (int(w['top'] / 10), w['x0']))
        
        # Reconstruct text
        text_parts = []
        current_line_y = None
        current_line = []
        
        for word in sorted_words:
            word_y = int(word['top'] / 10)  # Group words on same line
            
            if current_line_y is None:
                current_line_y = word_y
            
            # New line detected
            if abs(word_y - current_line_y) > 1:
                if current_line:
                    text_parts.append(' '.join(current_line))
                current_line = [word['text']]
                current_line_y = word_y
            else:
                current_line.append(word['text'])
        
        # Add last line
        if current_line:
            text_parts.append(' '.join(current_line))
        
        return '\n'.join(text_parts)
    
    def get_pdf_metadata(self, pdf_path: str) -> Dict:
        """
        Extract metadata from PDF.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dict with metadata (title, author, pages, etc.)
        """
        try:
            with pdfplumber.open(pdf_path) as pdf:
                metadata = {
                    'num_pages': len(pdf.pages),
                    'metadata': pdf.metadata,
                    'file_size': Path(pdf_path).stat().st_size,
                    'file_name': Path(pdf_path).name
                }
                
                return metadata
                
        except Exception as e:
            logger.error(f"Error extracting PDF metadata: {str(e)}")
            return {}
    
    def validate_pdf(self, pdf_path: str, max_size_mb: int = 50) -> Tuple[bool, Optional[str]]:
        """
        Validate PDF file before processing.
        
        Args:
            pdf_path: Path to PDF file
            max_size_mb: Maximum file size in MB
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check file exists
            if not Path(pdf_path).exists():
                return False, "File does not exist"
            
            # Check file extension
            if not pdf_path.lower().endswith('.pdf'):
                return False, "File is not a PDF"
            
            # Check file size
            file_size_mb = Path(pdf_path).stat().st_size / (1024 * 1024)
            if file_size_mb > max_size_mb:
                return False, f"File size ({file_size_mb:.1f}MB) exceeds maximum ({max_size_mb}MB)"
            
            # Try to open with pdfplumber
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    if len(pdf.pages) == 0:
                        return False, "PDF has no pages"
            except Exception as e:
                return False, f"Cannot open PDF: {str(e)}"
            
            return True, None
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"


# Singleton instance
_pdf_parser_instance = None


def get_pdf_parser() -> PDFParser:
    """Get singleton PDF parser instance"""
    global _pdf_parser_instance
    if _pdf_parser_instance is None:
        _pdf_parser_instance = PDFParser()
    return _pdf_parser_instance
