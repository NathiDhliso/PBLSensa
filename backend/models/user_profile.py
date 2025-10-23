"""
User Profile Model

Stores user background, interests, and experiences for personalized analogy generation.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class Background(BaseModel):
    """User's professional and educational background"""
    profession: Optional[str] = None
    education: List[str] = Field(default_factory=list)
    years_experience: Optional[int] = None
    current_role: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "profession": "Software Engineer",
                "education": ["BSc Computer Science", "MSc Data Science"],
                "years_experience": 5,
                "current_role": "Senior Developer"
            }
        }


class Interests(BaseModel):
    """User's hobbies and interests"""
    hobbies: List[str] = Field(default_factory=list)
    sports: List[str] = Field(default_factory=list)
    creative_activities: List[str] = Field(default_factory=list)
    other: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "hobbies": ["Reading", "Gaming", "Cooking"],
                "sports": ["Soccer", "Swimming"],
                "creative_activities": ["Photography", "Writing"],
                "other": ["Traveling", "Volunteering"]
            }
        }


class LifeExperiences(BaseModel):
    """User's life experiences and memories"""
    places_lived: List[str] = Field(default_factory=list)
    places_traveled: List[str] = Field(default_factory=list)
    jobs_held: List[str] = Field(default_factory=list)
    memorable_events: List[str] = Field(default_factory=list)
    challenges_overcome: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "places_lived": ["Cape Town", "Johannesburg", "Midrand"],
                "places_traveled": ["London", "Paris", "New York"],
                "jobs_held": ["Barista", "Intern Developer", "Software Engineer"],
                "memorable_events": ["Graduated university", "First marathon", "Started own business"],
                "challenges_overcome": ["Learned to code", "Moved to new city"]
            }
        }


class LearningStyle(BaseModel):
    """User's learning preferences and style"""
    preferred_metaphors: List[str] = Field(
        default_factory=list,
        description="Domains user prefers for analogies: sports, cooking, nature, technology, etc."
    )
    past_successful_analogies: List[str] = Field(
        default_factory=list,
        description="Types of analogies that worked well in the past"
    )
    learning_pace: Optional[str] = Field(None, description="fast, moderate, slow")
    preferred_format: Optional[str] = Field(None, description="visual, auditory, kinesthetic, reading-writing")
    
    class Config:
        json_schema_extra = {
            "example": {
                "preferred_metaphors": ["sports", "cooking", "technology"],
                "past_successful_analogies": ["soccer team analogy", "recipe analogy"],
                "learning_pace": "moderate",
                "preferred_format": "visual"
            }
        }


class UserProfile(BaseModel):
    """Complete user profile for personalized learning"""
    user_id: str
    background: Background = Field(default_factory=Background)
    interests: Interests = Field(default_factory=Interests)
    experiences: LifeExperiences = Field(default_factory=LifeExperiences)
    learning_style: LearningStyle = Field(default_factory=LearningStyle)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user-123",
                "background": {
                    "profession": "Software Engineer",
                    "education": ["BSc Computer Science"],
                    "years_experience": 5
                },
                "interests": {
                    "hobbies": ["Reading", "Gaming"],
                    "sports": ["Soccer"]
                },
                "experiences": {
                    "places_lived": ["Cape Town", "Johannesburg"],
                    "jobs_held": ["Barista", "Developer"]
                },
                "learning_style": {
                    "preferred_metaphors": ["sports", "technology"],
                    "learning_pace": "moderate"
                }
            }
        }


class UserProfileCreate(BaseModel):
    """Request model for creating a user profile"""
    background: Optional[Background] = None
    interests: Optional[Interests] = None
    experiences: Optional[LifeExperiences] = None
    learning_style: Optional[LearningStyle] = None


class UserProfileUpdate(BaseModel):
    """Request model for updating a user profile"""
    background: Optional[Background] = None
    interests: Optional[Interests] = None
    experiences: Optional[LifeExperiences] = None
    learning_style: Optional[LearningStyle] = None


class UserProfileResponse(BaseModel):
    """Response model for user profile API endpoints"""
    user_id: str
    background: Background
    interests: Interests
    experiences: LifeExperiences
    learning_style: LearningStyle
    created_at: datetime
    updated_at: datetime
    
    # Analytics
    total_analogies: Optional[int] = None
    reusable_analogies: Optional[int] = None
    avg_analogy_strength: Optional[float] = None


class OnboardingQuestion(BaseModel):
    """A question in the onboarding flow"""
    id: str
    category: str  # hobbies, places, work, sports, media, memories
    question_text: str
    question_type: str  # text, multi_select, single_select
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "q1",
                "category": "hobbies",
                "question_text": "What hobbies do you enjoy?",
                "question_type": "multi_select",
                "options": ["Reading", "Gaming", "Cooking", "Sports", "Music", "Art", "Other"],
                "placeholder": "Select all that apply"
            }
        }


class OnboardingResponse(BaseModel):
    """User's response to an onboarding question"""
    question_id: str
    answer: Any  # Can be string, list of strings, etc.


class OnboardingData(BaseModel):
    """Complete onboarding data"""
    responses: List[OnboardingResponse]
    
    def to_profile(self) -> UserProfileCreate:
        """Convert onboarding responses to a user profile"""
        # This will be implemented to parse responses and create profile
        background = Background()
        interests = Interests()
        experiences = LifeExperiences()
        learning_style = LearningStyle()
        
        for response in self.responses:
            # Parse each response and populate the appropriate section
            # Implementation will depend on question IDs and structure
            pass
        
        return UserProfileCreate(
            background=background,
            interests=interests,
            experiences=experiences,
            learning_style=learning_style
        )
