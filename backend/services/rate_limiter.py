"""
Rate Limiting Service

Limits the number of analogy generations per user per day.
"""

from datetime import datetime, date, timedelta
from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class RateLimitInfo:
    """Information about rate limit status"""
    limit: int
    remaining: int
    reset_at: datetime
    is_limited: bool


class RateLimiter:
    """Rate limit analogy generation per user"""
    
    def __init__(self, daily_limit: int = 10):
        """
        Initialize rate limiter
        
        Args:
            daily_limit: Maximum generations per user per day
        """
        self.daily_limit = daily_limit
        # In-memory storage for development
        # In production, this would query the database
        self.user_counts: Dict[str, Dict[str, int]] = {}
    
    def check_user_limit(self, user_id: str) -> RateLimitInfo:
        """
        Check if user has exceeded daily generation limit
        
        Args:
            user_id: User ID to check
            
        Returns:
            RateLimitInfo with limit status
        """
        today = date.today().isoformat()
        
        # Get user's count for today
        if user_id not in self.user_counts:
            self.user_counts[user_id] = {}
        
        count = self.user_counts[user_id].get(today, 0)
        remaining = max(0, self.daily_limit - count)
        is_limited = count >= self.daily_limit
        reset_at = self.get_reset_time()
        
        return RateLimitInfo(
            limit=self.daily_limit,
            remaining=remaining,
            reset_at=reset_at,
            is_limited=is_limited
        )
    
    def increment_user_count(self, user_id: str) -> int:
        """
        Increment user's generation count for today
        
        Args:
            user_id: User ID
            
        Returns:
            New count for today
        """
        today = date.today().isoformat()
        
        if user_id not in self.user_counts:
            self.user_counts[user_id] = {}
        
        self.user_counts[user_id][today] = self.user_counts[user_id].get(today, 0) + 1
        
        # Clean up old dates
        self._cleanup_old_counts(user_id)
        
        return self.user_counts[user_id][today]
    
    def get_reset_time(self) -> datetime:
        """
        Get time when rate limit resets (midnight tomorrow)
        
        Returns:
            Datetime of next reset
        """
        tomorrow = date.today() + timedelta(days=1)
        return datetime.combine(tomorrow, datetime.min.time())
    
    def get_time_until_reset(self) -> timedelta:
        """
        Get time remaining until rate limit resets
        
        Returns:
            Timedelta until reset
        """
        reset_time = self.get_reset_time()
        return reset_time - datetime.now()
    
    def reset_user_limit(self, user_id: str) -> None:
        """
        Reset user's rate limit (admin function)
        
        Args:
            user_id: User ID to reset
        """
        if user_id in self.user_counts:
            today = date.today().isoformat()
            if today in self.user_counts[user_id]:
                del self.user_counts[user_id][today]
    
    def _cleanup_old_counts(self, user_id: str) -> None:
        """
        Remove counts older than 7 days
        
        Args:
            user_id: User ID to clean up
        """
        if user_id not in self.user_counts:
            return
        
        cutoff_date = (date.today() - timedelta(days=7)).isoformat()
        
        dates_to_remove = [
            d for d in self.user_counts[user_id].keys()
            if d < cutoff_date
        ]
        
        for d in dates_to_remove:
            del self.user_counts[user_id][d]
    
    def get_user_stats(self, user_id: str, days: int = 7) -> Dict:
        """
        Get user's generation statistics
        
        Args:
            user_id: User ID
            days: Number of days to look back
            
        Returns:
            Dict with user stats
        """
        if user_id not in self.user_counts:
            return {
                'total_generations': 0,
                'today_generations': 0,
                'daily_limit': self.daily_limit,
                'remaining_today': self.daily_limit,
                'daily_breakdown': {}
            }
        
        today = date.today()
        today_count = self.user_counts[user_id].get(today.isoformat(), 0)
        
        # Get daily breakdown
        daily_breakdown = {}
        total = 0
        
        for i in range(days):
            target_date = (today - timedelta(days=i)).isoformat()
            count = self.user_counts[user_id].get(target_date, 0)
            daily_breakdown[target_date] = count
            total += count
        
        return {
            'total_generations': total,
            'today_generations': today_count,
            'daily_limit': self.daily_limit,
            'remaining_today': max(0, self.daily_limit - today_count),
            'reset_at': self.get_reset_time().isoformat(),
            'daily_breakdown': daily_breakdown
        }
    
    def get_all_stats(self) -> Dict:
        """
        Get overall rate limiting statistics
        
        Returns:
            Dict with overall stats
        """
        today = date.today().isoformat()
        
        total_users = len(self.user_counts)
        active_today = sum(
            1 for user_counts in self.user_counts.values()
            if today in user_counts and user_counts[today] > 0
        )
        limited_today = sum(
            1 for user_counts in self.user_counts.values()
            if today in user_counts and user_counts[today] >= self.daily_limit
        )
        total_generations_today = sum(
            user_counts.get(today, 0)
            for user_counts in self.user_counts.values()
        )
        
        return {
            'total_users': total_users,
            'active_users_today': active_today,
            'limited_users_today': limited_today,
            'total_generations_today': total_generations_today,
            'daily_limit': self.daily_limit
        }
