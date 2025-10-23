"""
User Profile Service

Manages user profiles for personalized analogy generation.
"""

from typing import Optional
from datetime import datetime
from backend.models.user_profile import (
    UserProfile,
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse,
    Background,
    Interests,
    LifeExperiences,
    LearningStyle
)


class UserProfileService:
    """Service for managing user profiles"""
    
    def __init__(self, db_connection=None):
        """
        Initialize the service.
        
        Args:
            db_connection: Database connection (will be implemented with actual DB)
        """
        self.db = db_connection
        # In-memory storage for development
        self._profiles = {}
    
    async def get_profile(self, user_id: str) -> Optional[UserProfile]:
        """
        Get a user's profile.
        
        Args:
            user_id: User ID
            
        Returns:
            UserProfile or None if not found
        """
        # TODO: Replace with actual database query
        # SELECT * FROM user_profiles WHERE user_id = %s
        
        if user_id in self._profiles:
            return self._profiles[user_id]
        
        return None
    
    async def create_profile(
        self,
        user_id: str,
        profile_data: UserProfileCreate
    ) -> UserProfile:
        """
        Create a new user profile.
        
        Args:
            user_id: User ID
            profile_data: Profile data
            
        Returns:
            Created UserProfile
        """
        now = datetime.now()
        
        profile = UserProfile(
            user_id=user_id,
            background=profile_data.background or Background(),
            interests=profile_data.interests or Interests(),
            experiences=profile_data.experiences or LifeExperiences(),
            learning_style=profile_data.learning_style or LearningStyle(),
            created_at=now,
            updated_at=now
        )
        
        # TODO: Replace with actual database insert
        # INSERT INTO user_profiles (user_id, background_json, ...) VALUES (...)
        
        self._profiles[user_id] = profile
        
        return profile
    
    async def update_profile(
        self,
        user_id: str,
        updates: UserProfileUpdate
    ) -> Optional[UserProfile]:
        """
        Update a user's profile.
        
        Args:
            user_id: User ID
            updates: Profile updates
            
        Returns:
            Updated UserProfile or None if not found
        """
        profile = await self.get_profile(user_id)
        
        if not profile:
            return None
        
        # Update fields
        if updates.background:
            profile.background = updates.background
        if updates.interests:
            profile.interests = updates.interests
        if updates.experiences:
            profile.experiences = updates.experiences
        if updates.learning_style:
            profile.learning_style = updates.learning_style
        
        profile.updated_at = datetime.now()
        
        # TODO: Replace with actual database update
        # UPDATE user_profiles SET background_json = %s, ... WHERE user_id = %s
        
        self._profiles[user_id] = profile
        
        return profile
    
    async def delete_profile(self, user_id: str) -> bool:
        """
        Delete a user's profile.
        
        Args:
            user_id: User ID
            
        Returns:
            True if deleted, False if not found
        """
        # TODO: Replace with actual database delete
        # DELETE FROM user_profiles WHERE user_id = %s
        
        if user_id in self._profiles:
            del self._profiles[user_id]
            return True
        
        return False
    
    async def get_or_create_default_profile(self, user_id: str) -> UserProfile:
        """
        Get a user's profile, or create a default one if it doesn't exist.
        
        Args:
            user_id: User ID
            
        Returns:
            UserProfile
        """
        profile = await self.get_profile(user_id)
        
        if not profile:
            profile = await self.create_profile(
                user_id,
                UserProfileCreate()
            )
        
        return profile
    
    async def has_completed_onboarding(self, user_id: str) -> bool:
        """
        Check if a user has completed onboarding.
        
        Args:
            user_id: User ID
            
        Returns:
            True if profile has meaningful data
        """
        profile = await self.get_profile(user_id)
        
        if not profile:
            return False
        
        # Check if profile has at least some data
        has_interests = len(profile.interests.hobbies) > 0 or len(profile.interests.sports) > 0
        has_experiences = len(profile.experiences.places_lived) > 0 or len(profile.experiences.jobs_held) > 0
        has_background = profile.background.profession is not None
        
        return has_interests or has_experiences or has_background
    
    async def get_profile_completeness(self, user_id: str) -> float:
        """
        Calculate profile completeness percentage.
        
        Args:
            user_id: User ID
            
        Returns:
            Completeness score (0.0 to 1.0)
        """
        profile = await self.get_profile(user_id)
        
        if not profile:
            return 0.0
        
        total_fields = 0
        filled_fields = 0
        
        # Background (4 fields)
        total_fields += 4
        if profile.background.profession:
            filled_fields += 1
        if profile.background.education:
            filled_fields += 1
        if profile.background.years_experience:
            filled_fields += 1
        if profile.background.current_role:
            filled_fields += 1
        
        # Interests (4 fields)
        total_fields += 4
        if profile.interests.hobbies:
            filled_fields += 1
        if profile.interests.sports:
            filled_fields += 1
        if profile.interests.creative_activities:
            filled_fields += 1
        if profile.interests.other:
            filled_fields += 1
        
        # Experiences (5 fields)
        total_fields += 5
        if profile.experiences.places_lived:
            filled_fields += 1
        if profile.experiences.places_traveled:
            filled_fields += 1
        if profile.experiences.jobs_held:
            filled_fields += 1
        if profile.experiences.memorable_events:
            filled_fields += 1
        if profile.experiences.challenges_overcome:
            filled_fields += 1
        
        # Learning style (4 fields)
        total_fields += 4
        if profile.learning_style.preferred_metaphors:
            filled_fields += 1
        if profile.learning_style.past_successful_analogies:
            filled_fields += 1
        if profile.learning_style.learning_pace:
            filled_fields += 1
        if profile.learning_style.preferred_format:
            filled_fields += 1
        
        return filled_fields / total_fields if total_fields > 0 else 0.0
    
    async def get_profile_with_stats(self, user_id: str) -> Optional[UserProfileResponse]:
        """
        Get profile with analogy statistics.
        
        Args:
            user_id: User ID
            
        Returns:
            UserProfileResponse with stats or None
        """
        profile = await self.get_profile(user_id)
        
        if not profile:
            return None
        
        # TODO: Get analogy stats from database
        # SELECT COUNT(*), AVG(strength) FROM analogies WHERE user_id = %s
        
        return UserProfileResponse(
            user_id=profile.user_id,
            background=profile.background,
            interests=profile.interests,
            experiences=profile.experiences,
            learning_style=profile.learning_style,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
            total_analogies=0,  # TODO: Get from DB
            reusable_analogies=0,  # TODO: Get from DB
            avg_analogy_strength=0.0  # TODO: Get from DB
        )
