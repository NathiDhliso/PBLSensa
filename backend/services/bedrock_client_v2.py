"""
Production-Ready AWS Bedrock Client
With rate limiting, retry logic, and health monitoring
"""

import os
import time
import json
import logging
from typing import Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
import asyncio
from collections import deque

logger = logging.getLogger(__name__)


@dataclass
class BedrockConfig:
    """Bedrock configuration"""
    model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    max_tokens: int = 4096
    temperature: float = 0.7
    rpm_limit: int = 50  # Requests per minute
    daily_limit: int = 1000
    max_retries: int = 3
    retry_initial_delay: float = 1.0
    retry_max_delay: float = 60.0
    retry_exponential_base: float = 2.0


class RateLimiter:
    """Token bucket rate limiter"""
    
    def __init__(self, rpm_limit: int, daily_limit: int):
        self.rpm_limit = rpm_limit
        self.daily_limit = daily_limit
        self.minute_requests = deque()
        self.daily_requests = deque()
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        """Wait until request can be made"""
        async with self.lock:
            now = datetime.now()
            
            # Clean old requests
            minute_ago = now - timedelta(minutes=1)
            while self.minute_requests and self.minute_requests[0] < minute_ago:
                self.minute_requests.popleft()
            
            day_ago = now - timedelta(days=1)
            while self.daily_requests and self.daily_requests[0] < day_ago:
                self.daily_requests.popleft()
            
            # Check limits
            if len(self.minute_requests) >= self.rpm_limit:
                wait_time = 60 - (now - self.minute_requests[0]).total_seconds()
                logger.warning(f"Rate limit reached, waiting {wait_time:.1f}s")
                await asyncio.sleep(wait_time)
                return await self.acquire()
            
            if len(self.daily_requests) >= self.daily_limit:
                raise Exception(f"Daily limit of {self.daily_limit} requests exceeded")
            
            # Record request
            self.minute_requests.append(now)
            self.daily_requests.append(now)


class BedrockClientV2:
    """
    Production-ready Bedrock client with:
    - Rate limiting
    - Exponential backoff retry
    - Health monitoring
    - Cost tracking
    """
    
    def __init__(self, config: Optional[BedrockConfig] = None):
        self.config = config or self._load_config()
        self.client = boto3.client('bedrock-runtime', region_name=os.getenv('AWS_REGION', 'eu-west-1'))
        self.rate_limiter = RateLimiter(self.config.rpm_limit, self.config.daily_limit)
        
        # Health tracking
        self.total_requests = 0
        self.failed_requests = 0
        self.total_tokens = 0
        self.total_cost = 0.0
        self.last_health_check = datetime.now()
        
        logger.info(f"BedrockClientV2 initialized: {self.config.model_id}")
    
    def _load_config(self) -> BedrockConfig:
        """Load configuration from environment"""
        return BedrockConfig(
            model_id=os.getenv('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0'),
            max_tokens=int(os.getenv('BEDROCK_MAX_TOKENS', '4096')),
            temperature=float(os.getenv('BEDROCK_TEMPERATURE', '0.7')),
            rpm_limit=int(os.getenv('BEDROCK_RPM_LIMIT', '50')),
            daily_limit=int(os.getenv('BEDROCK_DAILY_LIMIT', '1000')),
            max_retries=int(os.getenv('MAX_RETRIES', '3')),
            retry_initial_delay=float(os.getenv('RETRY_INITIAL_DELAY', '1.0')),
            retry_max_delay=float(os.getenv('RETRY_MAX_DELAY', '60.0')),
            retry_exponential_base=float(os.getenv('RETRY_EXPONENTIAL_BASE', '2.0'))
        )
    
    async def invoke(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Dict:
        """
        Invoke Bedrock with retry logic and rate limiting
        
        Returns:
            {
                'text': str,
                'usage': {'input_tokens': int, 'output_tokens': int},
                'cost': float
            }
        """
        # Apply rate limiting
        await self.rate_limiter.acquire()
        
        # Prepare request
        max_tokens = max_tokens or self.config.max_tokens
        temperature = temperature or self.config.temperature
        
        messages = [{"role": "user", "content": prompt}]
        
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages
        }
        
        if system_prompt:
            body["system"] = system_prompt
        
        # Retry logic with exponential backoff
        last_error = None
        for attempt in range(self.config.max_retries):
            try:
                logger.debug(f"Bedrock request attempt {attempt + 1}/{self.config.max_retries}")
                
                response = self.client.invoke_model(
                    modelId=self.config.model_id,
                    body=json.dumps(body)
                )
                
                result = json.loads(response['body'].read())
                
                # Extract response
                text = result['content'][0]['text']
                usage = result.get('usage', {})
                input_tokens = usage.get('input_tokens', 0)
                output_tokens = usage.get('output_tokens', 0)
                
                # Calculate cost (Claude 3 Sonnet pricing)
                cost = self._calculate_cost(input_tokens, output_tokens)
                
                # Update metrics
                self.total_requests += 1
                self.total_tokens += input_tokens + output_tokens
                self.total_cost += cost
                
                logger.info(f"Bedrock success: {input_tokens + output_tokens} tokens, ${cost:.4f}")
                
                return {
                    'text': text,
                    'usage': {
                        'input_tokens': input_tokens,
                        'output_tokens': output_tokens
                    },
                    'cost': cost
                }
                
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')
                last_error = e
                
                # Don't retry on certain errors
                if error_code in ['ValidationException', 'AccessDeniedException']:
                    logger.error(f"Non-retryable error: {error_code}")
                    self.failed_requests += 1
                    raise
                
                # Exponential backoff
                if attempt < self.config.max_retries - 1:
                    delay = min(
                        self.config.retry_initial_delay * (self.config.retry_exponential_base ** attempt),
                        self.config.retry_max_delay
                    )
                    logger.warning(f"Bedrock error {error_code}, retrying in {delay:.1f}s")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Bedrock failed after {self.config.max_retries} attempts")
                    self.failed_requests += 1
            
            except Exception as e:
                last_error = e
                logger.error(f"Unexpected error: {str(e)}")
                self.failed_requests += 1
                if attempt == self.config.max_retries - 1:
                    break
                await asyncio.sleep(self.config.retry_initial_delay)
        
        raise Exception(f"Bedrock invocation failed: {str(last_error)}")
    
    def _calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """
        Calculate cost based on Claude 3 Sonnet pricing
        Input: $0.003 per 1K tokens
        Output: $0.015 per 1K tokens
        """
        input_cost = (input_tokens / 1000) * 0.003
        output_cost = (output_tokens / 1000) * 0.015
        return input_cost + output_cost
    
    def get_health_status(self) -> Dict:
        """Get API health metrics"""
        success_rate = (
            (self.total_requests - self.failed_requests) / self.total_requests * 100
            if self.total_requests > 0 else 100.0
        )
        
        return {
            'status': 'healthy' if success_rate > 95 else 'degraded',
            'total_requests': self.total_requests,
            'failed_requests': self.failed_requests,
            'success_rate': f"{success_rate:.1f}%",
            'total_tokens': self.total_tokens,
            'total_cost': f"${self.total_cost:.2f}",
            'avg_cost_per_request': f"${self.total_cost / max(self.total_requests, 1):.4f}",
            'last_check': self.last_health_check.isoformat()
        }
    
    def reset_metrics(self):
        """Reset health metrics"""
        self.total_requests = 0
        self.failed_requests = 0
        self.total_tokens = 0
        self.total_cost = 0.0
        self.last_health_check = datetime.now()


# Singleton instance
_bedrock_client = None


def get_bedrock_client() -> BedrockClientV2:
    """Get singleton Bedrock client"""
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = BedrockClientV2()
    return _bedrock_client
