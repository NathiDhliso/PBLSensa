"""
PDF Parser Service

Parses PDF documents and extracts text with position data for concept extraction.
Includes v7.0 enhancements with multi-method parsing (LlamaParse, Textract, pdfplumber).
"""

import os
import pdfplumber
import boto3
import time
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, field
import logging
from models.pbl_concept import TextChunk

logger = logging.getLogger(__name__)


@dataclass
class V7ParseResult:
    """Result from v7 parsing with metadata"""
    text: str
    markdown: Optional[str]
    method_used: str  # 'llamaparse', 'textract', 'pdfplumber'
    confidence: float
    metadata: Dict = field(default_factory=dict)


class PDFParser:
    """
    Service for parsing PDF documents with position data.
    """
    
    def __init__(self):
        self.chunk_size = 1000  # tokens
        self.chunk_overlap = 200  # tokens
        self.chars_per_token = 4  # Approximate characters per token
        
        # V7.0 enhancements
        self._llama_parse_client = None  # Lazy init
        self.textract_client = None  # Lazy init
        self.s3_client = None  # Lazy init
        self.s3_bucket = os.getenv('S3_TEMP_BUCKET', 'pbl-temp-uploads')
    
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
    
    # ==================== V7.0 ENHANCEMENTS ====================
    
    async def parse_with_v7(
        self, 
        pdf_path: str,
        force_method: Optional[str] = None
    ) -> V7ParseResult:
        """
        V7.0 multi-method parsing with fallback chain.
        
        Tries: LlamaParse → Textract → pdfplumber
        
        Args:
            pdf_path: Path to PDF file
            force_method: Optional method to force ('llamaparse', 'textract', 'pdfplumber')
        
        Returns:
            V7ParseResult with text, method used, and confidence
        """
        logger.info(f"Starting v7 parsing for {pdf_path}")
        
        if force_method:
            return await self._parse_with_method(pdf_path, force_method)
        
        # Try LlamaParse first (best for structure)
        try:
            logger.info("Attempting LlamaParse...")
            result = await self._parse_with_llamaparse(pdf_path)
            if result.confidence > 0.8:
                logger.info("LlamaParse successful")
                return result
        except Exception as e:
            logger.warning(f"LlamaParse failed: {e}")
        
        # Fallback to Textract (good for OCR)
        try:
            logger.info("Attempting Textract...")
            result = await self._parse_with_textract(pdf_path)
            if result.confidence > 0.6:
                logger.info("Textract successful")
                return result
        except Exception as e:
            logger.warning(f"Textract failed: {e}")
        
        # Last resort: pdfplumber (existing method)
        logger.info("Using pdfplumber fallback")
        return await self._parse_with_pdfplumber_v7(pdf_path)
    
    async def _parse_with_llamaparse(self, pdf_path: str) -> V7ParseResult:
        """Parse with LlamaParse - best for structure preservation"""
        if not self._llama_parse_client:
            try:
                from llama_parse import LlamaParse
                api_key = os.getenv('LLAMA_CLOUD_API_KEY')
                if not api_key:
                    raise ValueError("LLAMA_CLOUD_API_KEY not set")
                
                self._llama_parse_client = LlamaParse(
                    api_key=api_key,
                    result_type="markdown"
                )
            except ImportError:
                raise ImportError("llama-parse not installed. Run: pip install llama-parse")
        
        documents = self._llama_parse_client.load_data(pdf_path)
        markdown_text = documents[0].text if documents else ""
        
        return V7ParseResult(
            text=markdown_text,
            markdown=markdown_text,
            method_used='llamaparse',
            confidence=0.95,
            metadata={'source': 'llamaparse'}
        )
    
    async def _parse_with_textract(self, pdf_path: str) -> V7ParseResult:
        """Parse with AWS Textract - best for scanned documents"""
        if not self.textract_client:
            self.textract_client = boto3.client('textract')
        if not self.s3_client:
            self.s3_client = boto3.client('s3')
        
        # Upload to S3 temporarily
        s3_key = f"temp/{os.path.basename(pdf_path)}"
        self.s3_client.upload_file(pdf_path, self.s3_bucket, s3_key)
        
        try:
            # Start Textract job
            response = self.textract_client.start_document_analysis(
                DocumentLocation={
                    'S3Object': {
                        'Bucket': self.s3_bucket,
                        'Name': s3_key
                    }
                },
                FeatureTypes=['TABLES', 'LAYOUT']
            )
            
            # Wait for completion
            job_id = response['JobId']
            result = await self._wait_for_textract(job_id)
            
            # Extract text
            text = self._extract_text_from_textract(result)
            
            return V7ParseResult(
                text=text,
                markdown=None,
                method_used='textract',
                confidence=0.85,
                metadata={'textract_result': result}
            )
        
        finally:
            # Cleanup S3
            self.s3_client.delete_object(Bucket=self.s3_bucket, Key=s3_key)
    
    async def _parse_with_pdfplumber_v7(self, pdf_path: str) -> V7ParseResult:
        """Parse with pdfplumber - fallback (reuses existing method)"""
        # Reuse existing parse_pdf_with_positions method
        chunks = self.parse_pdf_with_positions(pdf_path)
        text = '\n\n'.join([chunk.text for chunk in chunks])
        
        return V7ParseResult(
            text=text,
            markdown=None,
            method_used='pdfplumber',
            confidence=0.6,
            metadata={'source': 'pdfplumber', 'chunks': len(chunks)}
        )
    
    async def _wait_for_textract(self, job_id: str, max_wait: int = 300):
        """Wait for Textract job to complete"""
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            response = self.textract_client.get_document_analysis(JobId=job_id)
            status = response['JobStatus']
            
            if status == 'SUCCEEDED':
                return response
            elif status == 'FAILED':
                raise Exception(f"Textract job failed: {response.get('StatusMessage')}")
            
            time.sleep(5)
        
        raise TimeoutError(f"Textract job {job_id} timed out after {max_wait}s")
    
    def _extract_text_from_textract(self, result: Dict) -> str:
        """Extract plain text from Textract result"""
        blocks = result.get('Blocks', [])
        lines = [
            block['Text']
            for block in blocks
            if block.get('BlockType') == 'LINE' and 'Text' in block
        ]
        return '\n'.join(lines)
    
    async def _parse_with_method(self, pdf_path: str, method: str) -> V7ParseResult:
        """Force parsing with specific method"""
        if method == 'llamaparse':
            return await self._parse_with_llamaparse(pdf_path)
        elif method == 'textract':
            return await self._parse_with_textract(pdf_path)
        elif method == 'pdfplumber':
            return await self._parse_with_pdfplumber_v7(pdf_path)
        else:
            raise ValueError(f"Unknown method: {method}")


# Singleton instance
_pdf_parser_instance = None


def get_pdf_parser() -> PDFParser:
    """Get singleton PDF parser instance"""
    global _pdf_parser_instance
    if _pdf_parser_instance is None:
        _pdf_parser_instance = PDFParser()
    return _pdf_parser_instance
