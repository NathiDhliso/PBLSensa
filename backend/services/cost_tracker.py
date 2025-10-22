"""
Cost Tracking Service

Tracks AWS Bedrock costs and sends alerts when thresholds are exceeded.
"""

from datetime import datetime, date
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class CostEntry:
    """Represents a cost tracking entry"""
    service_name: str
    operation: str
    estimated_cost_usd: float
    units_consumed: int
    document_id: Optional[str]
    user_id: Optional[str]
    created_at: datetime


class CostTracker:
    """Track AWS Bedrock costs"""
    
    def __init__(self, daily_threshold_usd: float = 50.0):
        """
        Initialize cost tracker
        
        Args:
            daily_threshold_usd: Daily cost threshold for alerts
        """
        self.daily_threshold_usd = daily_threshold_usd
        # In-memory storage for development
        # In production, this would use the cost_tracking table
        self.cost_entries: List[CostEntry] = []
    
    def log_bedrock_call(
        self,
        model_id: str,
        prompt_tokens: int,
        completion_tokens: int,
        user_id: str,
        chapter_id: str
    ) -> float:
        """
        Log Bedrock API call for cost tracking
        
        Args:
            model_id: Bedrock model ID used
            prompt_tokens: Number of input tokens
            completion_tokens: Number of output tokens
            user_id: User who requested generation
            chapter_id: Chapter ID
            
        Returns:
            Total cost in USD
        """
        # Claude 3.5 Sonnet pricing (as of 2024)
        # Input: $3.00 per million tokens
        # Output: $15.00 per million tokens
        input_cost = (prompt_tokens / 1_000_000) * 3.00
        output_cost = (completion_tokens / 1_000_000) * 15.00
        total_cost = input_cost + output_cost
        
        # Store cost entry
        entry = CostEntry(
            service_name='bedrock',
            operation='generate_analogies',
            estimated_cost_usd=total_cost,
            units_consumed=prompt_tokens + completion_tokens,
            document_id=chapter_id,
            user_id=user_id,
            created_at=datetime.now()
        )
        self.cost_entries.append(entry)
        
        # Check daily threshold
        daily_cost = self.get_daily_cost()
        if daily_cost > self.daily_threshold_usd:
            self.send_cost_alert(daily_cost)
        
        return total_cost
    
    def get_daily_cost(self, target_date: Optional[date] = None) -> float:
        """
        Get total Bedrock cost for a specific day
        
        Args:
            target_date: Date to check (defaults to today)
            
        Returns:
            Total cost in USD
        """
        if target_date is None:
            target_date = date.today()
        
        total = 0.0
        for entry in self.cost_entries:
            if entry.created_at.date() == target_date:
                total += entry.estimated_cost_usd
        
        return total
    
    def get_monthly_cost(self, year: int, month: int) -> float:
        """
        Get total cost for a specific month
        
        Args:
            year: Year
            month: Month (1-12)
            
        Returns:
            Total cost in USD
        """
        total = 0.0
        for entry in self.cost_entries:
            if entry.created_at.year == year and entry.created_at.month == month:
                total += entry.estimated_cost_usd
        
        return total
    
    def get_user_cost(self, user_id: str, days: int = 30) -> float:
        """
        Get total cost for a specific user over the last N days
        
        Args:
            user_id: User ID
            days: Number of days to look back
            
        Returns:
            Total cost in USD
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        total = 0.0
        
        for entry in self.cost_entries:
            if entry.user_id == user_id and entry.created_at >= cutoff_date:
                total += entry.estimated_cost_usd
        
        return total
    
    def send_cost_alert(self, daily_cost: float) -> None:
        """
        Send alert when cost threshold is exceeded
        
        Args:
            daily_cost: Current daily cost
        """
        # In production, this would send email/Slack notification
        print(f"⚠️  COST ALERT: Daily Bedrock cost (${daily_cost:.2f}) exceeded threshold (${self.daily_threshold_usd:.2f})")
        
        # Log to file or monitoring system
        # In production: send to CloudWatch, SNS, etc.
    
    def get_cost_breakdown(self, days: int = 7) -> Dict:
        """
        Get cost breakdown for the last N days
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Dict with daily costs
        """
        from datetime import timedelta
        
        breakdown = {}
        today = date.today()
        
        for i in range(days):
            target_date = today - timedelta(days=i)
            daily_cost = self.get_daily_cost(target_date)
            breakdown[target_date.isoformat()] = daily_cost
        
        return breakdown
    
    def get_cost_stats(self) -> Dict:
        """
        Get overall cost statistics
        
        Returns:
            Dict with cost stats
        """
        if not self.cost_entries:
            return {
                'total_cost': 0.0,
                'total_calls': 0,
                'avg_cost_per_call': 0.0,
                'daily_cost': 0.0,
                'monthly_cost': 0.0
            }
        
        total_cost = sum(entry.estimated_cost_usd for entry in self.cost_entries)
        total_calls = len(self.cost_entries)
        avg_cost = total_cost / total_calls if total_calls > 0 else 0.0
        
        now = datetime.now()
        daily_cost = self.get_daily_cost()
        monthly_cost = self.get_monthly_cost(now.year, now.month)
        
        return {
            'total_cost': total_cost,
            'total_calls': total_calls,
            'avg_cost_per_call': avg_cost,
            'daily_cost': daily_cost,
            'monthly_cost': monthly_cost,
            'threshold': self.daily_threshold_usd,
            'threshold_percentage': (daily_cost / self.daily_threshold_usd * 100) if self.daily_threshold_usd > 0 else 0
        }


# Import timedelta for get_cost_breakdown
from datetime import timedelta
