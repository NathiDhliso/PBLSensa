"""
API Health Monitoring Service
Tracks health of external APIs and sends alerts
"""

import os
import logging
from typing import Dict, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class HealthAlert:
    """Health alert"""
    service: str
    severity: str  # 'warning', 'critical'
    message: str
    timestamp: datetime = field(default_factory=datetime.now)


class APIHealthMonitor:
    """
    Monitors health of external APIs:
    - AWS Bedrock
    - AWS Textract
    - LlamaParse
    """
    
    def __init__(self):
        self.enabled = os.getenv('ENABLE_API_HEALTH_CHECK', 'true').lower() == 'true'
        self.check_interval = int(os.getenv('HEALTH_CHECK_INTERVAL', '300'))  # 5 minutes
        self.alerts: List[HealthAlert] = []
        self.last_check = {}
        
        if self.enabled:
            logger.info(f"API Health Monitor enabled (interval: {self.check_interval}s)")
    
    async def start_monitoring(self):
        """Start background health monitoring"""
        if not self.enabled:
            return
        
        while True:
            try:
                await self.check_all_services()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(60)
    
    async def check_all_services(self):
        """Check health of all services"""
        logger.info("Running health checks...")
        
        # Check Bedrock
        await self.check_bedrock()
        
        # Check Textract
        if os.getenv('TEXTRACT_ENABLED', 'true').lower() == 'true':
            await self.check_textract()
        
        # Check LlamaParse
        if os.getenv('LLAMA_PARSE_ENABLED', 'false').lower() == 'true':
            await self.check_llamaparse()
        
        # Log summary
        self.log_health_summary()
    
    async def check_bedrock(self):
        """Check Bedrock health"""
        try:
            from services.bedrock_client_v2 import get_bedrock_client
            
            client = get_bedrock_client()
            health = client.get_health_status()
            
            self.last_check['bedrock'] = {
                'status': health['status'],
                'timestamp': datetime.now(),
                'details': health
            }
            
            # Check for issues
            success_rate = float(health['success_rate'].rstrip('%'))
            if success_rate < 95:
                self.add_alert(
                    'bedrock',
                    'warning' if success_rate > 90 else 'critical',
                    f"Bedrock success rate: {health['success_rate']}"
                )
            
            # Check cost
            total_cost = float(health['total_cost'].lstrip('$'))
            if total_cost > 10.0:  # Alert if over $10
                self.add_alert(
                    'bedrock',
                    'warning',
                    f"Bedrock cost: {health['total_cost']}"
                )
            
            logger.info(f"Bedrock health: {health['status']} ({health['success_rate']})")
            
        except Exception as e:
            logger.error(f"Bedrock health check failed: {e}")
            self.add_alert('bedrock', 'critical', f"Health check failed: {str(e)}")
    
    async def check_textract(self):
        """Check Textract health"""
        try:
            import boto3
            
            client = boto3.client('textract', region_name=os.getenv('AWS_REGION', 'eu-west-1'))
            
            # Simple API call to check connectivity
            # This doesn't actually process anything
            try:
                client.list_adapters(MaxResults=1)
                self.last_check['textract'] = {
                    'status': 'healthy',
                    'timestamp': datetime.now()
                }
                logger.info("Textract health: healthy")
            except Exception as e:
                self.last_check['textract'] = {
                    'status': 'unhealthy',
                    'timestamp': datetime.now(),
                    'error': str(e)
                }
                self.add_alert('textract', 'warning', f"Textract check failed: {str(e)}")
                
        except Exception as e:
            logger.error(f"Textract health check failed: {e}")
    
    async def check_llamaparse(self):
        """Check LlamaParse health"""
        api_key = os.getenv('LLAMA_CLOUD_API_KEY')
        
        if not api_key:
            self.last_check['llamaparse'] = {
                'status': 'disabled',
                'timestamp': datetime.now(),
                'reason': 'No API key configured'
            }
            return
        
        # LlamaParse doesn't have a health endpoint
        # Just mark as configured
        self.last_check['llamaparse'] = {
            'status': 'configured',
            'timestamp': datetime.now()
        }
        logger.info("LlamaParse: configured")
    
    def add_alert(self, service: str, severity: str, message: str):
        """Add health alert"""
        alert = HealthAlert(service, severity, message)
        self.alerts.append(alert)
        
        # Keep only last 100 alerts
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-100:]
        
        # Log alert
        log_func = logger.critical if severity == 'critical' else logger.warning
        log_func(f"ALERT [{service}] {message}")
    
    def log_health_summary(self):
        """Log health summary"""
        summary = []
        for service, check in self.last_check.items():
            status = check.get('status', 'unknown')
            summary.append(f"{service}: {status}")
        
        logger.info(f"Health Summary: {', '.join(summary)}")
    
    def get_health_report(self) -> Dict:
        """Get complete health report"""
        return {
            'services': self.last_check,
            'recent_alerts': [
                {
                    'service': alert.service,
                    'severity': alert.severity,
                    'message': alert.message,
                    'timestamp': alert.timestamp.isoformat()
                }
                for alert in self.alerts[-10:]  # Last 10 alerts
            ],
            'monitoring_enabled': self.enabled,
            'check_interval': self.check_interval
        }


# Singleton instance
_health_monitor = None


def get_health_monitor() -> APIHealthMonitor:
    """Get singleton health monitor"""
    global _health_monitor
    if _health_monitor is None:
        _health_monitor = APIHealthMonitor()
    return _health_monitor
