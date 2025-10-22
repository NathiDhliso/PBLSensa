"""
Cache Manager Service

Handles caching of generated analogies with expiration and invalidation logic.
"""

import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List


class CacheManager:
    """Manages caching of analogy generation results"""
    
    def __init__(self, cache_duration_days: int = 30):
        """
        Initialize cache manager
        
        Args:
            cache_duration_days: Number of days before cache expires
        """
        self.cache_duration_days = cache_duration_days
        # In-memory cache for development
        # In production, this would use the database
        self.cache_store = {}
    
    def generate_cache_key(self, chapter_id: str, user_profile: Dict) -> str:
        """
        Generate cache key based on chapter and user profile
        
        Key format: "analogies:{chapter_id}:{profile_hash}"
        Profile hash includes: interests, learning_style, education_level
        
        Args:
            chapter_id: Chapter identifier
            user_profile: User profile dictionary
            
        Returns:
            Cache key string
        """
        profile_data = {
            "interests": sorted(user_profile.get('interests', [])),
            "learning_style": user_profile.get('learning_style', ''),
            "education_level": user_profile.get('education_level', '')
        }
        
        profile_json = json.dumps(profile_data, sort_keys=True)
        profile_hash = hashlib.md5(profile_json.encode()).hexdigest()[:8]
        
        return f"analogies:{chapter_id}:{profile_hash}"
    
    def get_cached_analogies(self, cache_key: str) -> Optional[Dict]:
        """
        Retrieve cached analogies if not expired
        
        Args:
            cache_key: Cache key to lookup
            
        Returns:
            Cached data dict or None if not found/expired
        """
        if cache_key not in self.cache_store:
            return None
        
        cached_data = self.cache_store[cache_key]
        expires_at = cached_data.get('expires_at')
        
        # Check if expired
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now():
            # Remove expired cache
            del self.cache_store[cache_key]
            return None
        
        return cached_data.get('data')
    
    def store_analogies(
        self,
        cache_key: str,
        data: Dict,
        metadata: Optional[Dict] = None
    ) -> None:
        """
        Store analogies in cache
        
        Args:
            cache_key: Cache key
            data: Analogy data to cache
            metadata: Optional metadata (model_version, tokens, cost, etc.)
        """
        expires_at = datetime.now() + timedelta(days=self.cache_duration_days)
        
        self.cache_store[cache_key] = {
            'data': data,
            'metadata': metadata or {},
            'created_at': datetime.now().isoformat(),
            'expires_at': expires_at.isoformat()
        }
    
    def invalidate_cache(self, cache_key: str) -> bool:
        """
        Invalidate (delete) cached data
        
        Args:
            cache_key: Cache key to invalidate
            
        Returns:
            True if cache was found and deleted, False otherwise
        """
        if cache_key in self.cache_store:
            del self.cache_store[cache_key]
            return True
        return False
    
    def invalidate_user_cache(self, user_id: str) -> int:
        """
        Invalidate all cache entries for a user
        
        This is called when user updates their profile (interests or learning_style)
        
        Args:
            user_id: User ID
            
        Returns:
            Number of cache entries invalidated
        """
        # In production, this would query the database
        # For now, we can't easily identify user-specific cache in memory
        # This would be implemented with database queries
        count = 0
        keys_to_delete = []
        
        for key in self.cache_store.keys():
            # In production, we'd query by user_id
            # For now, just mark for deletion if it matches pattern
            if f"user_{user_id}" in key:
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self.cache_store[key]
            count += 1
        
        return count
    
    def cleanup_expired(self) -> int:
        """
        Remove all expired cache entries
        
        Returns:
            Number of entries removed
        """
        now = datetime.now()
        keys_to_delete = []
        
        for key, value in self.cache_store.items():
            expires_at = value.get('expires_at')
            if expires_at and datetime.fromisoformat(expires_at) < now:
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self.cache_store[key]
        
        return len(keys_to_delete)
    
    def get_cache_stats(self) -> Dict:
        """
        Get cache statistics
        
        Returns:
            Dict with cache stats (total entries, expired, etc.)
        """
        now = datetime.now()
        total = len(self.cache_store)
        expired = 0
        
        for value in self.cache_store.values():
            expires_at = value.get('expires_at')
            if expires_at and datetime.fromisoformat(expires_at) < now:
                expired += 1
        
        return {
            'total_entries': total,
            'expired_entries': expired,
            'active_entries': total - expired
        }
