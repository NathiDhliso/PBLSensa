"""
Analogy Service

Manages user-created analogies connecting concepts to personal experiences.
"""

from typing import List, Optional
from datetime import datetime
from models.analogy import (
    Analogy,
    AnalogyCreate,
    AnalogyUpdate,
    AnalogyResponse,
    AnalogyStatistics,
    AnalogyTag
)
from services.bedrock_client import BedrockAnalogyGenerator
import re


class AnalogyService:
    """Service for managing analogies"""
    
    def __init__(self, db_connection=None, bedrock_client=None):
        """
        Initialize the service.
        
        Args:
            db_connection: Database connection
            bedrock_client: Bedrock client for AI features
        """
        self.db = db_connection
        self.bedrock_client = bedrock_client or BedrockAnalogyGenerator()
        # In-memory storage for development
        self._analogies = {}
    
    async def create_analogy(
        self,
        user_id: str,
        analogy_data: AnalogyCreate
    ) -> Analogy:
        """
        Create a new analogy.
        
        Args:
            user_id: User ID
            analogy_data: Analogy data
            
        Returns:
            Created Analogy
        """
        # Generate connection explanation with AI
        connection_explanation = await self._generate_connection_explanation(
            analogy_data.concept_id,
            analogy_data.user_experience_text
        )
        
        # Auto-tag the analogy
        tags = await self._auto_tag(analogy_data.user_experience_text)
        
        # Create analogy
        analogy_id = f"analogy-{len(self._analogies) + 1}"
        analogy = Analogy(
            id=analogy_id,
            user_id=user_id,
            concept_id=analogy_data.concept_id,
            user_experience_text=analogy_data.user_experience_text,
            connection_explanation=connection_explanation,
            strength=analogy_data.strength,
            type=analogy_data.type or 'experience',
            reusable=analogy_data.reusable,
            tags=tags,
            created_at=datetime.now(),
            usage_count=0
        )
        
        # TODO: Replace with actual database insert
        # INSERT INTO analogies (...) VALUES (...)
        
        self._analogies[analogy_id] = analogy
        
        return analogy
    
    async def get_analogy(self, analogy_id: str) -> Optional[Analogy]:
        """Get an analogy by ID"""
        # TODO: Replace with actual database query
        # SELECT * FROM analogies WHERE id = %s
        
        return self._analogies.get(analogy_id)
    
    async def get_analogies(
        self,
        user_id: str,
        concept_id: Optional[str] = None,
        document_id: Optional[str] = None,
        reusable_only: bool = False
    ) -> List[Analogy]:
        """
        Get analogies with optional filters.
        
        Args:
            user_id: User ID
            concept_id: Filter by concept
            document_id: Filter by document
            reusable_only: Only return reusable analogies
            
        Returns:
            List of analogies
        """
        # TODO: Replace with actual database query
        # SELECT * FROM analogies WHERE user_id = %s AND ...
        
        analogies = [a for a in self._analogies.values() if a.user_id == user_id]
        
        if concept_id:
            analogies = [a for a in analogies if a.concept_id == concept_id]
        
        if reusable_only:
            analogies = [a for a in analogies if a.reusable]
        
        return analogies
    
    async def update_analogy(
        self,
        analogy_id: str,
        updates: AnalogyUpdate
    ) -> Optional[Analogy]:
        """
        Update an analogy.
        
        Args:
            analogy_id: Analogy ID
            updates: Updates to apply
            
        Returns:
            Updated Analogy or None if not found
        """
        analogy = await self.get_analogy(analogy_id)
        
        if not analogy:
            return None
        
        # Apply updates
        if updates.user_experience_text:
            analogy.user_experience_text = updates.user_experience_text
            # Regenerate connection explanation
            analogy.connection_explanation = await self._generate_connection_explanation(
                analogy.concept_id,
                updates.user_experience_text
            )
            # Regenerate tags
            analogy.tags = await self._auto_tag(updates.user_experience_text)
        
        if updates.strength is not None:
            analogy.strength = updates.strength
        
        if updates.reusable is not None:
            analogy.reusable = updates.reusable
        
        if updates.tags is not None:
            analogy.tags = updates.tags
        
        # TODO: Replace with actual database update
        # UPDATE analogies SET ... WHERE id = %s
        
        self._analogies[analogy_id] = analogy
        
        return analogy
    
    async def delete_analogy(self, analogy_id: str) -> bool:
        """
        Delete an analogy.
        
        Args:
            analogy_id: Analogy ID
            
        Returns:
            True if deleted, False if not found
        """
        # TODO: Replace with actual database delete
        # DELETE FROM analogies WHERE id = %s
        
        if analogy_id in self._analogies:
            del self._analogies[analogy_id]
            return True
        
        return False
    
    async def increment_usage(self, analogy_id: str):
        """Increment usage count when analogy is reused"""
        analogy = await self.get_analogy(analogy_id)
        
        if analogy:
            analogy.usage_count += 1
            analogy.last_used = datetime.now()
            
            # TODO: Replace with actual database update
            # UPDATE analogies SET usage_count = usage_count + 1, last_used = NOW() WHERE id = %s
            
            self._analogies[analogy_id] = analogy
    
    async def get_by_concept(self, concept_id: str) -> List[Analogy]:
        """Get all analogies for a specific concept"""
        # TODO: Replace with actual database query
        # SELECT * FROM analogies WHERE concept_id = %s
        
        return [a for a in self._analogies.values() if a.concept_id == concept_id]
    
    async def get_statistics(self, user_id: str) -> AnalogyStatistics:
        """
        Get analogy statistics for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            AnalogyStatistics
        """
        analogies = await self.get_analogies(user_id)
        
        if not analogies:
            return AnalogyStatistics(
                total_analogies=0,
                reusable_analogies=0,
                avg_strength=0.0,
                most_used_tags=[],
                most_reused_analogy_id=None,
                concepts_with_analogies=0
            )
        
        # Calculate statistics
        total = len(analogies)
        reusable = len([a for a in analogies if a.reusable])
        avg_strength = sum(a.strength for a in analogies) / total
        
        # Count tag usage
        tag_counts = {}
        for analogy in analogies:
            for tag in analogy.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        most_used_tags = sorted(tag_counts.keys(), key=lambda t: tag_counts[t], reverse=True)[:5]
        
        # Find most reused analogy
        most_reused = max(analogies, key=lambda a: a.usage_count, default=None)
        
        # Count unique concepts
        unique_concepts = len(set(a.concept_id for a in analogies))
        
        return AnalogyStatistics(
            total_analogies=total,
            reusable_analogies=reusable,
            avg_strength=avg_strength,
            most_used_tags=most_used_tags,
            most_reused_analogy_id=most_reused.id if most_reused else None,
            concepts_with_analogies=unique_concepts
        )
    
    async def _generate_connection_explanation(
        self,
        concept_id: str,
        experience_text: str
    ) -> str:
        """
        Use AI to generate an explanation of how the experience relates to the concept.
        
        Args:
            concept_id: Concept ID
            experience_text: User's experience text
            
        Returns:
            Connection explanation
        """
        # TODO: Get concept details from database
        # For now, use a simple explanation
        
        # In production, this would call Claude via Bedrock:
        # prompt = f"Explain how this experience: '{experience_text}' relates to the concept..."
        # response = await self.bedrock_client.generate(prompt)
        
        # Mock explanation for development
        return f"This experience helps illustrate the concept by providing a relatable, real-world example that makes the abstract idea more concrete and memorable."
    
    async def _auto_tag(self, experience_text: str) -> List[str]:
        """
        Automatically tag an analogy based on its content.
        
        Args:
            experience_text: User's experience text
            
        Returns:
            List of tags
        """
        text_lower = experience_text.lower()
        tags = []
        
        # Check for common domains
        if any(word in text_lower for word in ['soccer', 'football', 'basketball', 'tennis', 'sport', 'game', 'team', 'player']):
            tags.append(AnalogyTag.SPORTS)
        
        if any(word in text_lower for word in ['cook', 'recipe', 'meal', 'food', 'kitchen', 'ingredient']):
            tags.append(AnalogyTag.COOKING)
        
        if any(word in text_lower for word in ['music', 'song', 'instrument', 'band', 'play', 'guitar', 'piano']):
            tags.append(AnalogyTag.MUSIC)
        
        if any(word in text_lower for word in ['art', 'paint', 'draw', 'create', 'design']):
            tags.append(AnalogyTag.ART)
        
        if any(word in text_lower for word in ['game', 'gaming', 'video', 'play', 'level']):
            tags.append(AnalogyTag.GAMING)
        
        if any(word in text_lower for word in ['computer', 'code', 'program', 'software', 'tech', 'app']):
            tags.append(AnalogyTag.TECHNOLOGY)
        
        if any(word in text_lower for word in ['nature', 'tree', 'plant', 'animal', 'forest', 'garden']):
            tags.append(AnalogyTag.NATURE)
        
        if any(word in text_lower for word in ['work', 'job', 'office', 'colleague', 'project']):
            tags.append(AnalogyTag.WORK)
        
        if any(word in text_lower for word in ['business', 'company', 'customer', 'sales', 'market']):
            tags.append(AnalogyTag.BUSINESS)
        
        if any(word in text_lower for word in ['teach', 'student', 'class', 'learn', 'school']):
            tags.append(AnalogyTag.TEACHING)
        
        if any(word in text_lower for word in ['family', 'parent', 'child', 'sibling', 'home']):
            tags.append(AnalogyTag.FAMILY)
        
        if any(word in text_lower for word in ['travel', 'trip', 'visit', 'country', 'city']):
            tags.append(AnalogyTag.TRAVEL)
        
        # If no tags found, add a generic one
        if not tags:
            tags.append('experience')
        
        return tags
