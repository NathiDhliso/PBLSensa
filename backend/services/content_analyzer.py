"""
Content Analysis Service

Analyzes chapter content to extract key concepts and calculate complexity scores.
"""

from dataclasses import dataclass
from typing import List, Optional
import re


@dataclass
class Concept:
    """Represents a key concept from a chapter"""
    keyword: str
    score: float
    context_snippet: str
    exam_relevance: Optional[float] = None


@dataclass
class ChapterContent:
    """Represents analyzed chapter content"""
    chapter_id: str
    chapter_title: str
    text_content: str
    key_concepts: List[str]
    complexity_score: float
    word_count: int
    estimated_reading_time: int  # minutes


class ChapterContentAnalyzer:
    """Analyzes chapter content to extract key concepts and calculate complexity"""
    
    def __init__(self):
        # Technical terms that indicate higher complexity
        self.technical_indicators = {
            'algorithm', 'paradigm', 'methodology', 'framework', 'architecture',
            'implementation', 'optimization', 'integration', 'synthesis', 'analysis'
        }
    
    def extract_chapter_content(
        self,
        document_id: str,
        chapter_id: str,
        structured_content: dict
    ) -> ChapterContent:
        """
        Extract chapter content from processed document
        
        Args:
            document_id: UUID of the processed document
            chapter_id: Chapter identifier (e.g., "chapter_1")
            structured_content: JSONB structure from processed_documents
            
        Returns:
            ChapterContent with text, concepts, and metadata
        """
        # Extract chapter from structured content
        # This is a simplified version - in production, parse the actual JSONB structure
        chapter_data = structured_content.get('chapters', {}).get(chapter_id, {})
        
        text_content = chapter_data.get('text', '')
        chapter_title = chapter_data.get('title', f'Chapter {chapter_id}')
        
        # Calculate word count
        word_count = len(text_content.split())
        
        # Estimate reading time (average 200 words per minute)
        estimated_reading_time = max(1, word_count // 200)
        
        # Extract key concepts (simplified - in production, use the keywords table)
        key_concepts = self._extract_concepts_from_text(text_content)
        
        # Calculate complexity
        complexity_score = self.calculate_complexity_score_from_text(text_content, key_concepts)
        
        return ChapterContent(
            chapter_id=chapter_id,
            chapter_title=chapter_title,
            text_content=text_content,
            key_concepts=key_concepts,
            complexity_score=complexity_score,
            word_count=word_count,
            estimated_reading_time=estimated_reading_time
        )
    
    def calculate_complexity_score(self, chapter_content: ChapterContent) -> float:
        """
        Calculate complexity score (0.0 - 1.0) based on multiple factors
        
        Factors:
        - Concept density (concepts per 1000 words)
        - Vocabulary difficulty (average word length, technical terms)
        - Relationship complexity (number of cross-references)
        - Prerequisite depth (how many prior concepts needed)
        
        Returns:
            Float between 0.0 (simple) and 1.0 (very complex)
        """
        return self.calculate_complexity_score_from_text(
            chapter_content.text_content,
            chapter_content.key_concepts
        )
    
    def calculate_complexity_score_from_text(
        self,
        text: str,
        key_concepts: List[str]
    ) -> float:
        """Calculate complexity from text and concepts"""
        if not text:
            return 0.0
        
        words = text.split()
        word_count = len(words)
        
        if word_count == 0:
            return 0.0
        
        # Factor 1: Concept density (0-0.3)
        concept_density = min(0.3, (len(key_concepts) / max(1, word_count / 1000)) / 10)
        
        # Factor 2: Vocabulary difficulty (0-0.3)
        avg_word_length = sum(len(word) for word in words) / word_count
        vocab_difficulty = min(0.3, (avg_word_length - 4) / 10)
        
        # Factor 3: Technical term ratio (0-0.2)
        technical_count = sum(
            1 for word in words
            if word.lower() in self.technical_indicators
        )
        technical_ratio = min(0.2, technical_count / max(1, word_count / 100))
        
        # Factor 4: Sentence complexity (0-0.2)
        sentences = re.split(r'[.!?]+', text)
        avg_sentence_length = word_count / max(1, len(sentences))
        sentence_complexity = min(0.2, (avg_sentence_length - 15) / 50)
        
        # Combine factors
        total_score = concept_density + vocab_difficulty + technical_ratio + sentence_complexity
        
        # Normalize to 0-1 range
        return min(1.0, max(0.0, total_score))
    
    def get_key_concepts(
        self,
        chapter_id: str,
        keywords_data: List[dict],
        limit: int = 7
    ) -> List[Concept]:
        """
        Get top N key concepts for a chapter
        
        Uses existing keywords table with filtering by chapter_id
        Orders by score and exam_relevance_score
        
        Args:
            chapter_id: Chapter identifier
            keywords_data: List of keyword dictionaries from database
            limit: Maximum number of concepts to return
            
        Returns:
            List of Concept objects
        """
        # Filter by chapter_id
        chapter_keywords = [
            kw for kw in keywords_data
            if kw.get('chapter_id') == chapter_id
        ]
        
        # Sort by score and exam relevance
        sorted_keywords = sorted(
            chapter_keywords,
            key=lambda k: (
                k.get('exam_relevance_score', 0) * 0.6 +
                k.get('score', 0) * 0.4
            ),
            reverse=True
        )
        
        # Convert to Concept objects
        concepts = []
        for kw in sorted_keywords[:limit]:
            concepts.append(Concept(
                keyword=kw.get('keyword', ''),
                score=kw.get('score', 0.0),
                context_snippet=kw.get('context_snippet', ''),
                exam_relevance=kw.get('exam_relevance_score')
            ))
        
        return concepts
    
    def _extract_concepts_from_text(self, text: str, max_concepts: int = 10) -> List[str]:
        """
        Simple concept extraction from text
        In production, this would use the keywords table
        """
        # Remove common words
        common_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        }
        
        # Extract words
        words = re.findall(r'\b[a-z]{4,}\b', text.lower())
        
        # Count frequency
        word_freq = {}
        for word in words:
            if word not in common_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top concepts
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, _ in sorted_words[:max_concepts]]
    
    def get_complexity_level(self, score: float) -> str:
        """Convert complexity score to human-readable level"""
        if score < 0.3:
            return "beginner"
        elif score < 0.6:
            return "intermediate"
        else:
            return "advanced"
