"""
Backend Services Module

Contains all service classes for the PBL platform.
"""

from .content_analyzer import ChapterContentAnalyzer, ChapterContent, Concept
from .bedrock_client import BedrockAnalogyGenerator, Analogy, MemoryTechnique, LearningMantra, AnalogyGenerationResult
from .analogy_generator import MockAnalogyGenerator
from .cache_manager import CacheManager
from .cost_tracker import CostTracker, CostEntry
from .rate_limiter import RateLimiter, RateLimitInfo

__all__ = [
    'ChapterContentAnalyzer',
    'ChapterContent',
    'Concept',
    'BedrockAnalogyGenerator',
    'MockAnalogyGenerator',
    'Analogy',
    'MemoryTechnique',
    'LearningMantra',
    'AnalogyGenerationResult',
    'CacheManager',
    'CostTracker',
    'CostEntry',
    'RateLimiter',
    'RateLimitInfo',
]
