"""
PDF Hash Service

Computes SHA-256 hashes of PDF files for duplicate detection and caching.
Extracts PDF metadata for storage and analysis.
"""

import hashlib
import logging
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime
import pdfplumber

logger = logging.getLogger(__name__)


class PDFHashService:
    """
    Service for computing PDF hashes and extracting metadata.
    
    Uses SHA-256 for cryptographically secure hashing to ensure
    reliable duplicate detection with negligible collision probability.
    """
    
    def __init__(self, chunk_size: int = 8192):
        """
        Initialize PDF Hash Service.
        
        Args:
            chunk_size: Size of chunks for reading large files (default 8KB)
        """
        self.chunk_size = chunk_size
        logger.info(f"PDFHashService initialized with chunk_size={chunk_size}")
    
    def compute_hash(self, pdf_path: str) -> str:
        """
        Compute SHA-256 hash of PDF file.
        
        Reads file in chunks to handle large files efficiently without
        loading entire file into memory.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Hex string of SHA-256 hash (64 characters)
            
        Raises:
            FileNotFoundError: If PDF file doesn't exist
            IOError: If file cannot be read
        """
        try:
            path = Path(pdf_path)
            
            if not path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            if not path.is_file():
                raise IOError(f"Path is not a file: {pdf_path}")
            
            # Create SHA-256 hash object
            sha256_hash = hashlib.sha256()
            
            # Read file in chunks
            with open(pdf_path, 'rb') as f:
                while True:
                    chunk = f.read(self.chunk_size)
                    if not chunk:
                        break
                    sha256_hash.update(chunk)
            
            hash_value = sha256_hash.hexdigest()
            logger.debug(f"Computed hash for {pdf_path}: {hash_value}")
            
            return hash_value
            
        except FileNotFoundError:
            logger.error(f"PDF file not found: {pdf_path}")
            raise
        except Exception as e:
            logger.error(f"Error computing hash for {pdf_path}: {str(e)}")
            raise IOError(f"Failed to compute hash: {str(e)}")
    
    def compute_hash_from_bytes(self, pdf_bytes: bytes) -> str:
        """
        Compute SHA-256 hash from PDF bytes.
        
        Useful for uploaded files that are already in memory.
        
        Args:
            pdf_bytes: PDF file content as bytes
            
        Returns:
            Hex string of SHA-256 hash (64 characters)
        """
        try:
            sha256_hash = hashlib.sha256(pdf_bytes)
            hash_value = sha256_hash.hexdigest()
            
            logger.debug(f"Computed hash from bytes: {hash_value}")
            return hash_value
            
        except Exception as e:
            logger.error(f"Error computing hash from bytes: {str(e)}")
            raise IOError(f"Failed to compute hash from bytes: {str(e)}")
    
    def extract_metadata(self, pdf_path: str) -> Dict:
        """
        Extract metadata from PDF file.
        
        Extracts:
        - Page count
        - File size (bytes)
        - Creation date
        - Modification date
        - Author
        - Title
        - Producer
        - Subject
        - Keywords
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dict with metadata fields
            
        Raises:
            FileNotFoundError: If PDF file doesn't exist
            IOError: If PDF cannot be opened
        """
        try:
            path = Path(pdf_path)
            
            if not path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            # Get file system metadata
            file_stats = path.stat()
            file_size = file_stats.st_size
            file_modified = datetime.fromtimestamp(file_stats.st_mtime)
            
            # Extract PDF metadata using pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                page_count = len(pdf.pages)
                pdf_metadata = pdf.metadata or {}
                
                # Build metadata dict
                metadata = {
                    'page_count': page_count,
                    'file_size': file_size,
                    'file_name': path.name,
                    'file_modified': file_modified.isoformat(),
                    'title': pdf_metadata.get('Title', ''),
                    'author': pdf_metadata.get('Author', ''),
                    'subject': pdf_metadata.get('Subject', ''),
                    'keywords': pdf_metadata.get('Keywords', ''),
                    'creator': pdf_metadata.get('Creator', ''),
                    'producer': pdf_metadata.get('Producer', ''),
                    'creation_date': pdf_metadata.get('CreationDate', ''),
                    'modification_date': pdf_metadata.get('ModDate', ''),
                }
                
                # Clean up metadata (remove None values and empty strings)
                metadata = {k: v for k, v in metadata.items() if v}
                
                logger.info(
                    f"Extracted metadata from {pdf_path}: "
                    f"{page_count} pages, {file_size} bytes"
                )
                
                return metadata
                
        except FileNotFoundError:
            logger.error(f"PDF file not found: {pdf_path}")
            raise
        except Exception as e:
            logger.error(f"Error extracting metadata from {pdf_path}: {str(e)}")
            raise IOError(f"Failed to extract metadata: {str(e)}")
    
    def compute_hash_and_metadata(self, pdf_path: str) -> tuple[str, Dict]:
        """
        Compute hash and extract metadata in one operation.
        
        More efficient than calling both methods separately as it
        only opens the file once.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Tuple of (hash_string, metadata_dict)
            
        Raises:
            FileNotFoundError: If PDF file doesn't exist
            IOError: If file cannot be processed
        """
        try:
            # Compute hash first (faster operation)
            pdf_hash = self.compute_hash(pdf_path)
            
            # Extract metadata
            metadata = self.extract_metadata(pdf_path)
            
            logger.info(
                f"Computed hash and metadata for {pdf_path}: "
                f"hash={pdf_hash[:16]}..."
            )
            
            return pdf_hash, metadata
            
        except Exception as e:
            logger.error(
                f"Error computing hash and metadata for {pdf_path}: {str(e)}"
            )
            raise
    
    def verify_hash(self, pdf_path: str, expected_hash: str) -> bool:
        """
        Verify that PDF file matches expected hash.
        
        Useful for integrity checking after file transfer or storage.
        
        Args:
            pdf_path: Path to PDF file
            expected_hash: Expected SHA-256 hash
            
        Returns:
            True if hash matches, False otherwise
        """
        try:
            actual_hash = self.compute_hash(pdf_path)
            matches = actual_hash == expected_hash
            
            if matches:
                logger.debug(f"Hash verification passed for {pdf_path}")
            else:
                logger.warning(
                    f"Hash verification failed for {pdf_path}: "
                    f"expected {expected_hash}, got {actual_hash}"
                )
            
            return matches
            
        except Exception as e:
            logger.error(f"Error verifying hash for {pdf_path}: {str(e)}")
            return False


# Singleton instance
_pdf_hash_service_instance: Optional[PDFHashService] = None


def get_pdf_hash_service() -> PDFHashService:
    """
    Get singleton PDF Hash Service instance.
    
    Returns:
        PDFHashService instance
    """
    global _pdf_hash_service_instance
    if _pdf_hash_service_instance is None:
        _pdf_hash_service_instance = PDFHashService()
    return _pdf_hash_service_instance
