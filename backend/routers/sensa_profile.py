"""
Sensa Learn Profile API Router

Endpoints for managing user profiles.
"""

from fastapi import APIRouter, HTTPException, Depends
from backend.models.user_profile import (
    UserProfileResponse,
    UserProfileCreate,
    UserProfileUpdate
)
from backend.services.sensa.user_profile_service import UserProfileService

router = APIRouter(prefix="/api/sensa/users", tags=["Sensa Profile"])

# Initialize service (in production, use dependency injection)
profile_service = UserProfileService()


@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    """
    Get a user's profile.
    
    Returns profile with analogy statistics.
    """
    profile = await profile_service.get_profile_with_stats(user_id)
    
    if not profile:
        # Create default profile if doesn't exist
        default_profile = await profile_service.get_or_create_default_profile(user_id)
        profile = await profile_service.get_profile_with_stats(user_id)
    
    return profile


@router.put("/{user_id}/profile", response_model=UserProfileResponse)
async def update_user_profile(
    user_id: str,
    updates: UserProfileUpdate
):
    """
    Update a user's profile.
    
    Accepts partial updates to any profile section.
    """
    profile = await profile_service.update_profile(user_id, updates)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Return with stats
    return await profile_service.get_profile_with_stats(user_id)


@router.post("/{user_id}/profile", response_model=UserProfileResponse)
async def create_user_profile(
    user_id: str,
    profile_data: UserProfileCreate
):
    """
    Create a new user profile.
    
    Typically called after onboarding completion.
    """
    # Check if profile already exists
    existing = await profile_service.get_profile(user_id)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile = await profile_service.create_profile(user_id, profile_data)
    
    return await profile_service.get_profile_with_stats(user_id)


@router.get("/{user_id}/profile/completeness")
async def get_profile_completeness(user_id: str):
    """
    Get profile completeness percentage.
    
    Returns a score from 0.0 to 1.0 indicating how complete the profile is.
    """
    completeness = await profile_service.get_profile_completeness(user_id)
    has_completed_onboarding = await profile_service.has_completed_onboarding(user_id)
    
    return {
        "user_id": user_id,
        "completeness": completeness,
        "has_completed_onboarding": has_completed_onboarding,
        "percentage": int(completeness * 100)
    }


@router.delete("/{user_id}/profile")
async def delete_user_profile(user_id: str):
    """
    Delete a user's profile.
    
    This will remove all profile data but not analogies.
    """
    deleted = await profile_service.delete_profile(user_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"message": "Profile deleted successfully", "user_id": user_id}
