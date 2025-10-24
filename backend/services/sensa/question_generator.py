"""
Analogy Question Generator Service

Generates personalized questions to help users create analogies.
"""

import json
import random
from typing import List, Dict, Optional
from pathlib import Path
from models.pbl_concept import Concept
from models.user_profile import UserProfile
from models.question import Question, QuestionType, QuestionTemplate
from services.bedrock_client import BedrockAnalogyGenerator


class AnalogyQuestionGenerator:
    """
    Generates personalized questions based on concept structure and user profile.
    """
    
    def __init__(self, bedrock_client: Optional[BedrockAnalogyGenerator] = None):
        self.bedrock_client = bedrock_client or BedrockAnalogyGenerator()
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict:
        """Load question templates from JSON file"""
        template_path = Path(__file__).parent.parent.parent / "data" / "question_templates.json"
        with open(template_path, 'r') as f:
            return json.load(f)
    
    async def generate_questions(
        self,
        concept: Concept,
        user_profile: UserProfile,
        max_questions: int = 3
    ) -> List[Question]:
        """
        Generate personalized questions for a concept.
        
        Args:
            concept: The concept to generate questions for
            user_profile: User's profile with interests and experiences
            max_questions: Maximum number of questions to generate
            
        Returns:
            List of generated questions
        """
        # Analyze concept characteristics
        concept_traits = self._analyze_concept(concept)
        
        # Check if user has sufficient profile data
        has_rich_profile = self._has_rich_profile(user_profile)
        
        if has_rich_profile:
            # Match concept to user's experience domains
            relevant_domains = self._match_to_user_domains(concept_traits, user_profile)
            
            # Generate with Claude using user's specific experiences
            questions = await self._claude_generate_questions(
                concept=concept,
                user_profile=user_profile,
                domains=relevant_domains,
                max_questions=max_questions
            )
        else:
            # Use guided first experience with universal domains
            questions = self._generate_guided_first_experience(
                concept=concept,
                max_questions=max_questions
            )
        
        return questions
    
    def _analyze_concept(self, concept: Concept) -> Dict:
        """
        Analyze concept to determine its characteristics.
        
        Returns:
            Dict with 'structure_type', 'complexity', 'domain'
        """
        return {
            'structure_type': concept.structure_type or 'unclassified',
            'complexity': concept.importance_score or 0.5,
            'term': concept.term,
            'definition': concept.definition
        }
    
    def _has_rich_profile(self, user_profile: UserProfile) -> bool:
        """Check if user has enough profile data for personalized questions"""
        has_interests = (
            len(user_profile.interests.hobbies) > 0 or
            len(user_profile.interests.sports) > 0 or
            len(user_profile.interests.creative_activities) > 0
        )
        
        has_experiences = (
            len(user_profile.experiences.places_lived) > 0 or
            len(user_profile.experiences.jobs_held) > 0 or
            len(user_profile.experiences.memorable_events) > 0
        )
        
        has_background = user_profile.background.profession is not None
        
        # Need at least 2 of 3 categories filled
        filled_categories = sum([has_interests, has_experiences, has_background])
        return filled_categories >= 2
    
    def _match_to_user_domains(
        self,
        concept_traits: Dict,
        user_profile: UserProfile
    ) -> List[str]:
        """
        Match concept to user's experience domains.
        
        Returns:
            List of relevant domains from user's profile
        """
        relevant_domains = []
        
        # Add interests
        relevant_domains.extend(user_profile.interests.hobbies[:3])
        relevant_domains.extend(user_profile.interests.sports[:2])
        relevant_domains.extend(user_profile.interests.creative_activities[:2])
        
        # Add work/education
        if user_profile.background.profession:
            relevant_domains.append(user_profile.background.profession)
        
        # Add memorable experiences
        relevant_domains.extend(user_profile.experiences.memorable_events[:2])
        
        return relevant_domains[:5]  # Limit to top 5
    
    async def _claude_generate_questions(
        self,
        concept: Concept,
        user_profile: UserProfile,
        domains: List[str],
        max_questions: int
    ) -> List[Question]:
        """
        Use Claude to generate personalized questions.
        """
        prompt = self._build_claude_prompt(concept, user_profile, domains, max_questions)
        
        try:
            # Call Claude via Bedrock
            response = await self._call_claude(prompt)
            
            # Parse response
            questions = self._parse_claude_questions(response, concept, user_profile)
            
            return questions[:max_questions]
            
        except Exception as e:
            print(f"Claude generation failed: {e}")
            # Fallback to template-based generation
            return self._generate_from_templates(concept, user_profile, max_questions)
    
    def _build_claude_prompt(
        self,
        concept: Concept,
        user_profile: UserProfile,
        domains: List[str],
        max_questions: int
    ) -> str:
        """Build prompt for Claude question generation"""
        
        interests_str = ", ".join(domains)
        structure_type = concept.structure_type or "unclassified"
        
        prompt = f"""You are an expert at creating personalized learning questions. Generate {max_questions} questions to help a student create analogies for a concept.

**Concept:**
Term: {concept.term}
Definition: {concept.definition}
Structure Type: {structure_type}

**Student Profile:**
Interests/Experiences: {interests_str}
Profession: {user_profile.background.profession or 'Student'}
Places Lived: {', '.join(user_profile.experiences.places_lived[:3]) or 'Not specified'}

**Question Requirements:**
1. Reference specific items from the student's profile
2. Use conversational, non-technical language
3. Open-ended (not multiple choice)
4. Help connect {concept.term} to their personal experiences
5. Match the structure type ({structure_type})

**Question Types:**
- For hierarchical concepts: Ask about organizing, categorizing, or breaking things into parts
- For sequential concepts: Ask about processes, routines, or step-by-step experiences
- For unclassified: Ask general analogy questions

**Output Format (JSON):**
{{
**Return as XML:**

<questions>
  <question>
    <question_text>specific question text</question_text>
    <question_type>experience_mapping|process_parallel|etc</question_type>
    <reasoning>why this question fits the student</reasoning>
  </question>
</questions>

Generate {max_questions} questions in XML format now:"""
        
        return prompt
    
    async def _call_claude(self, prompt: str) -> str:
        """Call Claude via Bedrock"""
        # Mock response for development
        # In production: self.bedrock_client.client.invoke_model(...)
        return """<questions>
  <question>
    <question_text>Think of a time you organized items into groups. How did you decide what belonged where?</question_text>
    <question_type>experience_mapping</question_type>
    <reasoning>Matches hierarchical structure and user's organizational experience</reasoning>
  </question>
  <question>
    <question_text>In your work, have you ever had to break a complex task into smaller parts? Describe your approach.</question_text>
    <question_type>classification_memory</question_type>
    <reasoning>Relates to user's professional background</reasoning>
  </question>
  <question>
    <question_text>What's something from your hobbies that has different types or categories? How are they different?</question_text>
    <question_type>metaphorical_bridge</question_type>
    <reasoning>Connects to user's interests</reasoning>
  </question>
</questions>"""
    
    def _parse_claude_questions(
        self,
        response: str,
        concept: Concept,
        user_profile: UserProfile
    ) -> List[Question]:
        """Parse Claude's XML response into Question objects"""
        try:
            import xml.etree.ElementTree as ET
            
            # Extract XML from response
            xml_start = response.find('<questions>')
            xml_end = response.rfind('</questions>') + len('</questions>')
            
            if xml_start == -1 or xml_end < len('</questions>'):
                print(f"No <questions> XML found in response")
                return []
            
            xml_str = response[xml_start:xml_end]
            root = ET.fromstring(xml_str)
            
            questions = []
            for i, q_elem in enumerate(root.findall('question')):
                question_text_elem = q_elem.find('question_text')
                question_type_elem = q_elem.find('question_type')
                
                question_text = question_text_elem.text if question_text_elem is not None and question_text_elem.text else ''
                question_type = question_type_elem.text if question_type_elem is not None and question_type_elem.text else 'general_analogy'
                
                if question_text:
                    question = Question(
                        id=f"q-{concept.id}-{i}",
                        concept_id=concept.id,
                        user_id=user_profile.user_id,
                        question_text=question_text,
                        question_type=question_type,
                        answered=False
                    )
                    questions.append(question)
            
            return questions
            
        except Exception as e:
            print(f"Failed to parse Claude questions: {e}")
            return []
    
    def _generate_from_templates(
        self,
        concept: Concept,
        user_profile: UserProfile,
        max_questions: int
    ) -> List[Question]:
        """
        Generate questions using templates (fallback method).
        """
        structure_type = concept.structure_type or 'unclassified'
        
        # Select appropriate templates
        if structure_type == 'hierarchical':
            templates = self.templates['hierarchical_templates']
        elif structure_type == 'sequential':
            templates = self.templates['sequential_templates']
        else:
            templates = self.templates['universal_templates']
        
        # Randomly select templates
        selected_templates = random.sample(templates, min(max_questions, len(templates)))
        
        questions = []
        for i, template in enumerate(selected_templates):
            # Fill in placeholders
            question_text = self._fill_template(template, concept, user_profile)
            
            question = Question(
                id=f"q-{concept.id}-{i}",
                concept_id=concept.id,
                user_id=user_profile.user_id,
                question_text=question_text,
                question_type=template['question_type'],
                answered=False
            )
            questions.append(question)
        
        return questions
    
    def _fill_template(
        self,
        template: Dict,
        concept: Concept,
        user_profile: UserProfile
    ) -> str:
        """Fill in template placeholders with user-specific data"""
        text = template['template_text']
        
        # Replace placeholders
        text = text.replace('{concept}', concept.term)
        text = text.replace('{items}', 'items or information')
        
        # User-specific replacements
        if '{user_interest}' in text:
            interest = self._get_random_interest(user_profile)
            text = text.replace('{user_interest}', interest)
        
        if '{user_activity}' in text:
            activity = self._get_random_activity(user_profile)
            text = text.replace('{user_activity}', activity)
        
        if '{user_background}' in text:
            background = user_profile.background.profession or 'your experience'
            text = text.replace('{user_background}', background)
        
        if '{user_experience}' in text:
            experience = self._get_random_experience(user_profile)
            text = text.replace('{user_experience}', experience)
        
        if '{time_period}' in text:
            text = text.replace('{time_period}', 'day')
        
        if '{user_context}' in text:
            context = user_profile.background.current_role or 'daily routine'
            text = text.replace('{user_context}', context)
        
        if '{related_domain}' in text:
            text = text.replace('{related_domain}', 'things')
        
        return text
    
    def _get_random_interest(self, user_profile: UserProfile) -> str:
        """Get a random interest from user profile"""
        all_interests = (
            user_profile.interests.hobbies +
            user_profile.interests.sports +
            user_profile.interests.creative_activities
        )
        return random.choice(all_interests) if all_interests else 'a hobby'
    
    def _get_random_activity(self, user_profile: UserProfile) -> str:
        """Get a random activity from user profile"""
        activities = user_profile.interests.hobbies + user_profile.interests.sports
        return random.choice(activities) if activities else 'an activity you enjoy'
    
    def _get_random_experience(self, user_profile: UserProfile) -> str:
        """Get a random experience from user profile"""
        experiences = (
            user_profile.experiences.jobs_held +
            user_profile.experiences.memorable_events
        )
        return random.choice(experiences) if experiences else 'your life'
    
    def _generate_guided_first_experience(
        self,
        concept: Concept,
        max_questions: int
    ) -> List[Question]:
        """
        Generate questions for new users using universal domains.
        """
        guided_templates = self.templates['guided_first_experience']['templates']
        
        # Select templates
        selected = random.sample(guided_templates, min(max_questions, len(guided_templates)))
        
        questions = []
        for i, template in enumerate(selected):
            question_text = template['template_text'].replace('{concept}', concept.term)
            
            question = Question(
                id=f"q-{concept.id}-guided-{i}",
                concept_id=concept.id,
                user_id='',  # Will be set by caller
                question_text=question_text,
                question_type=QuestionType.GENERAL_ANALOGY,
                answered=False
            )
            questions.append(question)
        
        return questions
