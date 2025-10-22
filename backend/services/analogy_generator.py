"""
Mock Analogy Generator Service

This is a mock implementation that generates sample analogies based on user profiles.
In production, this will be replaced with AWS Bedrock integration.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass
import hashlib
import json
from datetime import datetime, timedelta
import random


@dataclass
class Analogy:
    """Represents a generated analogy"""
    concept: str
    analogy_text: str
    based_on_interest: str
    learning_style_adaptation: str


@dataclass
class MemoryTechnique:
    """Represents a memory technique"""
    technique_type: str
    technique_text: str
    application: str


@dataclass
class LearningMantra:
    """Represents a learning mantra"""
    mantra_text: str
    explanation: str


@dataclass
class AnalogyGenerationResult:
    """Result of analogy generation"""
    analogies: List[Analogy]
    memory_techniques: List[MemoryTechnique]
    learning_mantras: List[LearningMantra]
    prompt_tokens: int
    completion_tokens: int
    generation_cost_usd: float


class MockAnalogyGenerator:
    """Mock analogy generator for development without AWS Bedrock"""
    
    def __init__(self):
        self.analogy_templates = {
            'cooking': [
                "Think of {concept} like preparing a {dish}. Just as you need to {cooking_action}, in {concept} you need to {technical_action}.",
                "{concept} is similar to following a recipe. Each step builds on the previous one, and missing an ingredient can affect the final result."
            ],
            'sports': [
                "Understanding {concept} is like learning a new sport. You start with basic drills, practice consistently, and gradually build muscle memory.",
                "{concept} works like a team sport where each component plays a specific position and must work together to win."
            ],
            'music': [
                "{concept} is like learning to play an instrument. You start with scales (basics), then chords (combinations), and finally full songs (applications).",
                "Think of {concept} as a symphony where different sections (concepts) must harmonize to create beautiful music (solutions)."
            ],
            'default': [
                "{concept} can be understood by breaking it down into smaller, manageable pieces and seeing how they connect.",
                "Imagine {concept} as a puzzle where each piece represents a key idea that fits together to form the complete picture."
            ]
        }
        
        self.memory_technique_templates = [
            {
                'type': 'acronym',
                'template': 'Create an acronym from the first letters of key terms: {acronym}. This helps you remember the sequence and main points.'
            },
            {
                'type': 'mind_palace',
                'template': 'Associate each concept with a location in a familiar place. For example, place {concept1} at your front door, {concept2} in your living room.'
            },
            {
                'type': 'chunking',
                'template': 'Group related concepts together into chunks of 3-5 items. This reduces cognitive load and improves retention.'
            },
            {
                'type': 'spaced_repetition',
                'template': 'Review this material after 1 day, 3 days, 1 week, and 2 weeks to move it into long-term memory.'
            }
        ]
        
        self.mantra_templates = [
            ("Progress over perfection", "Every step forward is a victory, no matter how small"),
            ("Connect, don't just collect", "Link new knowledge to what you already know"),
            ("Practice makes permanent", "Repetition builds mastery and confidence"),
            ("Teach to truly learn", "Explaining concepts solidifies your understanding")
        ]
    
    async def generate_analogies(
        self,
        chapter_content: Dict,
        user_profile: Dict,
        num_analogies: int = 3
    ) -> AnalogyGenerationResult:
        """
        Generate mock analogies based on user profile
        
        Args:
            chapter_content: Dict with chapter info
            user_profile: Dict with user info
            num_analogies: Number of analogies to generate
            
        Returns:
            AnalogyGenerationResult with mock content
        """
        interests = user_profile.get('interests', ['general topics'])
        learning_style = user_profile.get('learning_style', 'visual')
        key_concepts = chapter_content.get('key_concepts', ['concept1', 'concept2', 'concept3'])
        
        # Generate analogies
        analogies = []
        for i in range(min(num_analogies, len(key_concepts))):
            concept = key_concepts[i]
            interest = interests[i % len(interests)] if interests else 'general topics'
            
            # Get template for this interest
            templates = self.analogy_templates.get(
                interest.lower(),
                self.analogy_templates['default']
            )
            template = random.choice(templates)
            
            analogy_text = template.format(
                concept=concept,
                dish="lasagna" if 'cooking' in interest.lower() else "dish",
                cooking_action="layer ingredients carefully",
                technical_action="build components systematically"
            )
            
            adaptation = self._get_learning_style_adaptation(learning_style)
            
            analogies.append(Analogy(
                concept=concept,
                analogy_text=analogy_text,
                based_on_interest=interest,
                learning_style_adaptation=adaptation
            ))
        
        # Generate memory techniques
        memory_techniques = []
        for i, template in enumerate(self.memory_technique_templates[:3]):
            memory_techniques.append(MemoryTechnique(
                technique_type=template['type'],
                technique_text=template['template'].format(
                    acronym="LEARN",
                    concept1=key_concepts[0] if key_concepts else "concept1",
                    concept2=key_concepts[1] if len(key_concepts) > 1 else "concept2"
                ),
                application=f"Apply this technique when studying {key_concepts[0] if key_concepts else 'this chapter'}"
            ))
        
        # Generate learning mantras
        learning_mantras = []
        for mantra_text, explanation in self.mantra_templates[:4]:
            learning_mantras.append(LearningMantra(
                mantra_text=mantra_text,
                explanation=explanation
            ))
        
        # Mock token counts and cost
        prompt_tokens = 500
        completion_tokens = 800
        generation_cost_usd = 0.0  # Mock is free
        
        return AnalogyGenerationResult(
            analogies=analogies,
            memory_techniques=memory_techniques,
            learning_mantras=learning_mantras,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            generation_cost_usd=generation_cost_usd
        )
    
    def _get_learning_style_adaptation(self, learning_style: str) -> str:
        """Get adaptation text for learning style"""
        adaptations = {
            'visual': 'This analogy uses visual imagery to help you picture the concept in your mind.',
            'auditory': 'Try reading this analogy out loud or discussing it with others to reinforce learning.',
            'kinesthetic': 'Consider acting out or physically demonstrating this analogy to deepen understanding.',
            'reading-writing': 'Write this analogy in your own words and create notes to reinforce the connection.'
        }
        return adaptations.get(learning_style, adaptations['visual'])
