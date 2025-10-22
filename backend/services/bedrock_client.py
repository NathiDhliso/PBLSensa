"""
AWS Bedrock Client for Analogy Generation

Integrates with AWS Bedrock Claude models to generate personalized learning content.
"""

import json
import os
from typing import Dict, List, Optional
from dataclasses import dataclass
import boto3
from botocore.exceptions import ClientError
import time


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
    technique_type: str  # acronym, mind_palace, chunking, spaced_repetition
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


class BedrockAnalogyGenerator:
    """AWS Bedrock client for generating personalized analogies"""
    
    def __init__(
        self,
        region_name: str = "us-east-1",
        model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    ):
        """
        Initialize Bedrock client
        
        Args:
            region_name: AWS region for Bedrock
            model_id: Claude model ID to use
        """
        self.region_name = region_name
        self.model_id = model_id
        self.max_tokens = 2000
        self.temperature = 0.7
        self.top_p = 0.9
        
        # Initialize boto3 client
        try:
            self.client = boto3.client('bedrock-runtime', region_name=region_name)
        except Exception as e:
            print(f"Warning: Could not initialize Bedrock client: {e}")
            self.client = None
    
    async def generate_analogies(
        self,
        chapter_content: Dict,
        user_profile: Dict,
        num_analogies: int = 3
    ) -> AnalogyGenerationResult:
        """
        Generate personalized analogies using AWS Bedrock
        
        Args:
            chapter_content: Dict with chapter info (title, concepts, complexity, etc.)
            user_profile: Dict with user info (interests, learning_style, etc.)
            num_analogies: Number of analogies to generate
            
        Returns:
            AnalogyGenerationResult with generated content
        """
        if not self.client:
            raise Exception("Bedrock client not initialized. Check AWS credentials.")
        
        # Construct prompt
        prompt = self._construct_prompt(chapter_content, user_profile, num_analogies)
        
        # Call Bedrock with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = await self._call_bedrock(prompt)
                result = self._parse_response(response)
                return result
            except ClientError as e:
                if attempt < max_retries - 1:
                    # Exponential backoff
                    wait_time = (2 ** attempt) * 1
                    print(f"Bedrock call failed, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"Failed to generate analogies after {max_retries} attempts: {str(e)}")
            except Exception as e:
                raise Exception(f"Unexpected error during analogy generation: {str(e)}")
    
    def _construct_prompt(
        self,
        chapter_content: Dict,
        user_profile: Dict,
        num_analogies: int
    ) -> str:
        """Construct the prompt for Claude"""
        
        interests_str = ", ".join(user_profile.get('interests', ['general topics']))
        learning_style = user_profile.get('learning_style', 'visual')
        background = user_profile.get('background', 'student')
        education_level = user_profile.get('education_level', 'undergraduate')
        
        chapter_title = chapter_content.get('chapter_title', 'Chapter')
        complexity_score = chapter_content.get('complexity_score', 0.5)
        key_concepts = chapter_content.get('key_concepts', [])
        chapter_summary = chapter_content.get('text_content', '')[:1000]  # First 1000 chars
        
        prompt = f"""You are an expert educational content creator specializing in personalized learning. Your task is to create engaging, memorable analogies and learning aids for a student.

**Student Profile:**
- Interests: {interests_str}
- Learning Style: {learning_style}
- Background: {background}
- Education Level: {education_level}

**Chapter Information:**
- Title: {chapter_title}
- Complexity: {complexity_score:.2f}/1.0
- Key Concepts: {', '.join(key_concepts[:7])}

**Chapter Content Summary:**
{chapter_summary}

**Your Task:**
Generate {num_analogies} personalized analogies that explain the key concepts using the student's interests. Also create memory techniques and learning mantras.

**Requirements:**
1. Each analogy should connect a complex concept to one of the student's interests
2. Tailor the explanation style to their learning style ({learning_style})
3. Make analogies concrete, relatable, and memorable
4. Include 2-4 memory techniques (acronyms, mind palace, chunking, spaced repetition)
5. Create 3-4 short, motivational learning mantras

**Output Format (JSON):**
{{
  "analogies": [
    {{
      "concept": "concept name",
      "analogy_text": "detailed analogy explanation",
      "based_on_interest": "which interest this uses",
      "learning_style_adaptation": "how it fits their learning style"
    }}
  ],
  "memory_techniques": [
    {{
      "technique_type": "acronym|mind_palace|chunking|spaced_repetition",
      "technique_text": "detailed technique description",
      "application": "how to apply this technique"
    }}
  ],
  "learning_mantras": [
    {{
      "mantra_text": "short motivational phrase",
      "explanation": "brief explanation of the mantra"
    }}
  ]
}}

Generate the response now:"""
        
        return prompt
    
    async def _call_bedrock(self, prompt: str) -> Dict:
        """Call Bedrock API with retry logic"""
        
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.max_tokens,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": self.temperature,
            "top_p": self.top_p
        }
        
        response = self.client.invoke_model(
            modelId=self.model_id,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        return response_body
    
    def _parse_response(self, response: Dict) -> AnalogyGenerationResult:
        """Parse and validate Bedrock response"""
        
        # Extract content from response
        content = response.get('content', [])
        if not content:
            raise ValueError("Empty response from Bedrock")
        
        # Get text content
        text_content = content[0].get('text', '')
        
        # Extract JSON from response (Claude sometimes wraps it in markdown)
        json_start = text_content.find('{')
        json_end = text_content.rfind('}') + 1
        
        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON found in Bedrock response")
        
        json_str = text_content[json_start:json_end]
        data = json.loads(json_str)
        
        # Parse analogies
        analogies = []
        for a in data.get('analogies', []):
            analogies.append(Analogy(
                concept=a.get('concept', ''),
                analogy_text=a.get('analogy_text', ''),
                based_on_interest=a.get('based_on_interest', ''),
                learning_style_adaptation=a.get('learning_style_adaptation', '')
            ))
        
        # Parse memory techniques
        memory_techniques = []
        for mt in data.get('memory_techniques', []):
            memory_techniques.append(MemoryTechnique(
                technique_type=mt.get('technique_type', ''),
                technique_text=mt.get('technique_text', ''),
                application=mt.get('application', '')
            ))
        
        # Parse learning mantras
        learning_mantras = []
        for lm in data.get('learning_mantras', []):
            learning_mantras.append(LearningMantra(
                mantra_text=lm.get('mantra_text', ''),
                explanation=lm.get('explanation', '')
            ))
        
        # Calculate costs
        usage = response.get('usage', {})
        prompt_tokens = usage.get('input_tokens', 0)
        completion_tokens = usage.get('output_tokens', 0)
        
        # Claude 3.5 Sonnet pricing (as of 2024)
        # Input: $3.00 per million tokens
        # Output: $15.00 per million tokens
        input_cost = (prompt_tokens / 1_000_000) * 3.00
        output_cost = (completion_tokens / 1_000_000) * 15.00
        total_cost = input_cost + output_cost
        
        return AnalogyGenerationResult(
            analogies=analogies,
            memory_techniques=memory_techniques,
            learning_mantras=learning_mantras,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            generation_cost_usd=total_cost
        )
