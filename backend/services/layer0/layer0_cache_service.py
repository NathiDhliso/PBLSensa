"""
Layer 0 Cache Service

Enhanced cache service for PDF processing results.
Extends existing CacheManager with PDF-specific functionality.
"""

import gzip
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from dataclasses import dataclass, asdict
from services.cache_manager import CacheManager

logger = logging.getLogger(__name__)


@dataclass
class CachedResult:
    """Cached PDF processing results"""
    pdf_hash: str
    results: Dict
    metadata: Dict
    created_at: str
    last_accessed: str
    access_count: int
    compression_ratio: float


class Layer0CacheService(CacheManager):
    """
    Enhanced cache service for Layer 0 PDF processing.
    
    Extends CacheManager with:
    - Database-backed storage
    - Compression support
    - LRU eviction
    - PDF-specific caching
    """
    
    def __init__(
        self,
        cache_duration_days: int = 90,
        max_size_gb: int = 100,
        enable_compression: bool = True
    ):
        """
        Initialize Layer 0 cache service.
        
        Args:
            cache_duration_days: Days before cache expires
            max_size_gb: Maximum cache size in GB
            enable_compression: Whether to compress cached data
        """
        # Initialize parent CacheManager
        super().__init__(cache_duration_days)
        
        self.max_size_gb = max_size_gb
        self.enable_compression = enable_compression
        
        # Database connection would be initialized here
        # For now, using in-memory storage from parent
        self.db_cache = {}  # Simulates database storage
        
        logger.info(
            f"Layer0CacheService initialized: "
            f"ttl={cache_duration_days}d, max_size={max_size_gb}GB, "
            f"compression={enable_compression}"
        )
    
    def lookup_by_hash(self, pdf_hash: str) -> Optional[CachedResult]:
        """
        Lookup cached results by PDF hash.
        
        Fast path: Check in-memory cache first
        Slow path: Query database if not in memory
        
        Args:
            pdf_hash: SHA-256 hash of PDF
            
        Returns:
            CachedResult if found and not expired, None otherwise
        """
        try:
            # Check in-memory cache first (fast path)
            if pdf_hash in self.cache_store:
                cached_data = self.cache_store[pdf_hash]
                
                # Check expiration
                expires_at = cached_data.get('expires_at')
                if expires_at and datetime.fromisoformat(expires_at) < datetime.now():
                    # Expired - remove and return None
                    del self.cache_store[pdf_hash]
                    logger.debug(f"Cache expired for hash: {pdf_hash[:16]}...")
                    return None
                
                # Update access tracking
                self._update_access(pdf_hash, cached_data)
                
                logger.info(f"Cache HIT for hash: {pdf_hash[:16]}...")
                return self._to_cached_result(pdf_hash, cached_data)
            
            # Check database cache (slow path)
            if pdf_hash in self.db_cache:
                db_data = self.db_cache[pdf_hash]
                
                # Decompress if needed
                results = self._decompress_data(db_data['results'])
                
                # Move to in-memory cache for faster access
                self.cache_store[pdf_hash] = {
                    'data': results,
                    'metadata': db_data['metadata'],
                    'created_at': db_data['created_at'],
                    'expires_at': db_data['expires_at'],
                    'access_count': db_data.get('access_count', 0) + 1,
                    'last_accessed': datetime.now().isoformat()
                }
                
                logger.info(f"Cache HIT (DB) for hash: {pdf_hash[:16]}...")
                return self._to_cached_result(pdf_hash, self.cache_store[pdf_hash])
            
            logger.info(f"Cache MISS for hash: {pdf_hash[:16]}...")
            return None
            
        except Exception as e:
            logger.error(f"Error looking up cache for {pdf_hash[:16]}: {str(e)}")
            return None
    
    def store_results(
        self,
        pdf_hash: str,
        results: Dict,
        metadata: Dict,
        compression: bool = True
    ) -> None:
        """
        Store processing results with optional compression.
        
        Args:
            pdf_hash: SHA-256 hash of PDF
            results: Processing results to cache
            metadata: File metadata
            compression: Whether to compress (default: True)
        """
        try:
            expires_at = datetime.now() + timedelta(days=self.cache_duration_days)
            
            # Compress if enabled
            if compression and self.enable_compression:
                compressed_results = self._compress_data(results)
                original_size = len(json.dumps(results).encode('utf-8'))
                compressed_size = len(compressed_results)
                compression_ratio = compressed_size / original_size if original_size > 0 else 1.0
            else:
                compressed_results = results
                compression_ratio = 1.0
            
            # Store in database cache (simulated)
            self.db_cache[pdf_hash] = {
                'results': compressed_results,
                'metadata': metadata,
                'created_at': datetime.now().isoformat(),
                'expires_at': expires_at.isoformat(),
                'access_count': 0,
                'last_accessed': datetime.now().isoformat(),
                'compression_ratio': compression_ratio,
                'storage_size_bytes': len(compressed_results) if isinstance(compressed_results, bytes) else len(json.dumps(compressed_results).encode('utf-8'))
            }
            
            # Also store in memory cache for fast access
            self.cache_store[pdf_hash] = {
                'data': results,
                'metadata': metadata,
                'created_at': datetime.now().isoformat(),
                'expires_at': expires_at.isoformat(),
                'access_count': 0,
                'last_accessed': datetime.now().isoformat()
            }
            
            logger.info(
                f"Cached results for {pdf_hash[:16]}: "
                f"compression_ratio={compression_ratio:.2f}"
            )
            
        except Exception as e:
            logger.error(f"Error storing cache for {pdf_hash[:16]}: {str(e)}")
    
    def evict_lru(self, target_size_mb: int) -> int:
        """
        Evict least recently used entries to reach target size.
        
        Args:
            target_size_mb: Target cache size in MB
            
        Returns:
            Number of entries evicted
        """
        try:
            # Calculate current size
            current_size_mb = self._calculate_cache_size_mb()
            
            if current_size_mb <= target_size_mb:
                logger.debug(f"Cache size ({current_size_mb}MB) within target ({target_size_mb}MB)")
                return 0
            
            # Sort by last accessed (oldest first)
            sorted_entries = sorted(
                self.db_cache.items(),
                key=lambda x: x[1].get('last_accessed', ''),
            )
            
            evicted_count = 0
            for pdf_hash, data in sorted_entries:
                if current_size_mb <= target_size_mb:
                    break
                
                # Remove from both caches
                if pdf_hash in self.db_cache:
                    entry_size = data.get('storage_size_bytes', 0) / (1024 * 1024)
                    del self.db_cache[pdf_hash]
                    current_size_mb -= entry_size
                    evicted_count += 1
                
                if pdf_hash in self.cache_store:
                    del self.cache_store[pdf_hash]
            
            logger.info(f"Evicted {evicted_count} LRU entries, new size: {current_size_mb:.2f}MB")
            return evicted_count
            
        except Exception as e:
            logger.error(f"Error during LRU eviction: {str(e)}")
            return 0
    
    def cleanup_expired(self, max_age_days: int = 90) -> int:
        """
        Remove expired cache entries.
        
        Args:
            max_age_days: Maximum age in days
            
        Returns:
            Number of entries removed
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=max_age_days)
            removed_count = 0
            
            # Check database cache
            hashes_to_remove = []
            for pdf_hash, data in self.db_cache.items():
                last_accessed = datetime.fromisoformat(data.get('last_accessed', datetime.now().isoformat()))
                if last_accessed < cutoff_date:
                    hashes_to_remove.append(pdf_hash)
            
            # Remove expired entries
            for pdf_hash in hashes_to_remove:
                if pdf_hash in self.db_cache:
                    del self.db_cache[pdf_hash]
                if pdf_hash in self.cache_store:
                    del self.cache_store[pdf_hash]
                removed_count += 1
            
            logger.info(f"Cleaned up {removed_count} expired entries (>{max_age_days} days old)")
            return removed_count
            
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            return 0
    
    def get_cache_stats(self) -> Dict:
        """
        Get comprehensive cache statistics.
        
        Returns:
            Dict with cache stats
        """
        try:
            total_entries = len(self.db_cache)
            total_size_mb = self._calculate_cache_size_mb()
            
            # Calculate average compression ratio
            compression_ratios = [
                data.get('compression_ratio', 1.0)
                for data in self.db_cache.values()
            ]
            avg_compression = sum(compression_ratios) / len(compression_ratios) if compression_ratios else 1.0
            
            # Calculate access patterns
            now = datetime.now()
            active_7d = sum(
                1 for data in self.db_cache.values()
                if datetime.fromisoformat(data.get('last_accessed', '2000-01-01')) > now - timedelta(days=7)
            )
            active_30d = sum(
                1 for data in self.db_cache.values()
                if datetime.fromisoformat(data.get('last_accessed', '2000-01-01')) > now - timedelta(days=30)
            )
            
            return {
                'total_entries': total_entries,
                'total_size_mb': round(total_size_mb, 2),
                'max_size_mb': self.max_size_gb * 1024,
                'utilization_percent': round((total_size_mb / (self.max_size_gb * 1024)) * 100, 2) if self.max_size_gb > 0 else 0,
                'avg_compression_ratio': round(avg_compression, 3),
                'active_entries_7d': active_7d,
                'active_entries_30d': active_30d,
                'compression_enabled': self.enable_compression,
                'ttl_days': self.cache_duration_days
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {str(e)}")
            return {}
    
    def _compress_data(self, data: Dict) -> bytes:
        """Compress data using gzip"""
        json_str = json.dumps(data)
        return gzip.compress(json_str.encode('utf-8'))
    
    def _decompress_data(self, compressed: bytes) -> Dict:
        """Decompress gzip data"""
        if isinstance(compressed, bytes):
            json_str = gzip.decompress(compressed).decode('utf-8')
            return json.loads(json_str)
        return compressed  # Already decompressed
    
    def _update_access(self, pdf_hash: str, cached_data: Dict) -> None:
        """Update access tracking"""
        cached_data['access_count'] = cached_data.get('access_count', 0) + 1
        cached_data['last_accessed'] = datetime.now().isoformat()
        
        # Update in database cache too
        if pdf_hash in self.db_cache:
            self.db_cache[pdf_hash]['access_count'] = cached_data['access_count']
            self.db_cache[pdf_hash]['last_accessed'] = cached_data['last_accessed']
    
    def _to_cached_result(self, pdf_hash: str, cached_data: Dict) -> CachedResult:
        """Convert cached data to CachedResult"""
        return CachedResult(
            pdf_hash=pdf_hash,
            results=cached_data.get('data', {}),
            metadata=cached_data.get('metadata', {}),
            created_at=cached_data.get('created_at', ''),
            last_accessed=cached_data.get('last_accessed', ''),
            access_count=cached_data.get('access_count', 0),
            compression_ratio=cached_data.get('compression_ratio', 1.0)
        )
    
    def _calculate_cache_size_mb(self) -> float:
        """Calculate total cache size in MB"""
        total_bytes = sum(
            data.get('storage_size_bytes', 0)
            for data in self.db_cache.values()
        )
        return total_bytes / (1024 * 1024)


# Singleton instance
_layer0_cache_service_instance: Optional[Layer0CacheService] = None


def get_layer0_cache_service() -> Layer0CacheService:
    """
    Get singleton Layer 0 Cache Service instance.
    
    Returns:
        Layer0CacheService instance
    """
    global _layer0_cache_service_instance
    if _layer0_cache_service_instance is None:
        _layer0_cache_service_instance = Layer0CacheService()
    return _layer0_cache_service_instance
