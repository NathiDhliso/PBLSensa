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
    
    # Model configurations with pricing
    MODELS = {
        "sonnet": {
            "id": "anthropic.claude-3-5-sonnet-20240620-v1:0",
            "name": "Claude 3.5 Sonnet",
            "input_cost_per_million": 3.00,
            "output_cost_per_million": 15.00,
        },
        "haiku": {
            "id": "anthropic.claude-3-5-haiku-20241022-v1:0",
            "name": "Claude 3.5 Haiku",
            "input_cost_per_million": 0.80,
            "output_cost_per_million": 4.00,
        }
    }
    
    def __init__(
        self,
        region_name: str = "us-east-1",
        model_id: str = "anthropic.claude-3-5-sonnet-20240620-v1:0",
        fallback_model_id: str = "anthropic.claude-3-5-haiku-20241022-v1:0"
    ):
        """
        Initialize Bedrock client with fallback support
        
        Args:
            region_name: AWS region for Bedrock
            model_id: Primary Claude model ID (default: Sonnet)
            fallback_model_id: Fallback model for throttling (default: Haiku)
        """
        self.region_name = region_name
        self.model_id = model_id
        self.fallback_model_id = fallback_model_id
        self.current_model_id = model_id
        self.max_tokens = 2000
        self.temperature = 0.7
        self.top_p = 0.9
        
        # Initialize boto3 client
        try:
            self.client = boto3.client('bedrock-runtime', region_name=region_name)
        except Exception as e:
            raise Exception(f"Failed to initialize Bedrock client: {e}. Check AWS credentials and region.")
    
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
        # Construct prompt
        prompt = self._construct_prompt(chapter_content, user_profile, num_analogies)
        
        # Call Bedrock with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self._call_bedrock(prompt)
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

**Output Format (XML):**

<response>
  <analogies>
    <analogy>
      <concept>concept name</concept>
      <analogy_text>detailed analogy explanation</analogy_text>
      <based_on_interest>which interest this uses</based_on_interest>
      <learning_style_adaptation>how it fits their learning style</learning_style_adaptation>
    </analogy>
  </analogies>
  <memory_techniques>
    <technique>
      <technique_type>acronym|mind_palace|chunking|spaced_repetition</technique_type>
      <technique_text>detailed technique description</technique_text>
      <application>how to apply this technique</application>
    </technique>
  </memory_techniques>
  <learning_mantras>
    <mantra>
      <mantra_text>short motivational phrase</mantra_text>
      <explanation>brief explanation of the mantra</explanation>
    </mantra>
  </learning_mantras>
</response>

Generate the XML response now:"""
        
        return prompt
    
    def _call_bedrock(self, prompt: str, use_fallback: bool = False) -> Dict:
        """
        Call Bedrock API with fallback support
        
        Args:
            prompt: The prompt to send
            use_fallback: If True, use fallback model instead of primary
            
        Returns:
            Response from Bedrock
        """
        model_to_use = self.fallback_model_id if use_fallback else self.current_model_id
        
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
        
        try:
            response = self.client.invoke_model(
                modelId=model_to_use,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            response_body['_model_used'] = model_to_use  # Track which model was used
            return response_body
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            
            # If throttled and not already using fallback, try fallback model
            if error_code == 'ThrottlingException' and not use_fallback and self.fallback_model_id:
                print(f"⚠️  {self._get_model_name(model_to_use)} throttled, switching to {self._get_model_name(self.fallback_model_id)}")
                return self._call_bedrock(prompt, use_fallback=True)
            
            # Otherwise, re-raise the error
            raise
    
    def invoke_claude(self, prompt: str, max_tokens: Optional[int] = None, retry_count: int = 0) -> str:
        """
        Simple Claude invocation for concept extraction and validation with fallback.
        
        Args:
            prompt: Prompt to send to Claude
            max_tokens: Optional max tokens override
            retry_count: Current retry attempt (for internal use)
            
        Returns:
            Claude's response text
        """
        model_to_use = self.fallback_model_id if retry_count > 0 else self.current_model_id
        
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens or self.max_tokens,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": self.temperature,
            "top_p": self.top_p
        }
        
        try:
            response = self.client.invoke_model(
                modelId=model_to_use,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            content = response_body.get('content', [])
            
            if not content:
                raise ValueError("Empty response from Claude")
            
            return content[0].get('text', '')
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            
            # If throttled and haven't tried fallback yet, use fallback model
            if error_code == 'ThrottlingException' and retry_count == 0 and self.fallback_model_id:
                print(f"⚠️  {self._get_model_name(model_to_use)} throttled, switching to {self._get_model_name(self.fallback_model_id)}")
                return self.invoke_claude(prompt, max_tokens, retry_count=1)
            
            # Otherwise, re-raise
            raise
    
    def _get_model_name(self, model_id: str) -> str:
        """Get friendly model name from model ID"""
        for model_key, model_info in self.MODELS.items():
            if model_info["id"] == model_id:
                return model_info["name"]
        return model_id
    
    def _get_model_pricing(self, model_id: str) -> tuple:
        """Get pricing for a model (input_cost, output_cost per million tokens)"""
        for model_key, model_info in self.MODELS.items():
            if model_info["id"] == model_id:
                return (
                    model_info["input_cost_per_million"],
                    model_info["output_cost_per_million"]
                )
        # Default to Sonnet pricing if unknown
        return (3.00, 15.00)
    
    def _parse_response(self, response: Dict) -> AnalogyGenerationResult:
        """Parse and validate Bedrock XML response"""
        import xml.etree.ElementTree as ET
        
        # Extract content from response
        content = response.get('content', [])
        if not content:
            raise ValueError("Empty response from Bedrock")
        
        # Get text content
        text_content = content[0].get('text', '')
        
        # Extract XML from response
        xml_start = text_content.find('<response>')
        xml_end = text_content.rfind('</response>') + len('</response>')
        
        if xml_start == -1 or xml_end < len('</response>'):
            raise ValueError("No <response> XML found in Bedrock response")
        
        xml_str = text_content[xml_start:xml_end]
        root = ET.fromstring(xml_str)
        
        # Parse analogies
        analogies = []
        analogies_elem = root.find('analogies')
        if analogies_elem is not None:
            for analogy_elem in analogies_elem.findall('analogy'):
                concept = analogy_elem.find('concept')
                analogy_text = analogy_elem.find('analogy_text')
                based_on_interest = analogy_elem.find('based_on_interest')
                learning_style_adaptation = analogy_elem.find('learning_style_adaptation')
                
                analogies.append(Analogy(
                    concept=concept.text if concept is not None and concept.text else '',
                    analogy_text=analogy_text.text if analogy_text is not None and analogy_text.text else '',
                    based_on_interest=based_on_interest.text if based_on_interest is not None and based_on_interest.text else '',
                    learning_style_adaptation=learning_style_adaptation.text if learning_style_adaptation is not None and learning_style_adaptation.text else ''
                ))
        
        # Parse memory techniques
        memory_techniques = []
        techniques_elem = root.find('memory_techniques')
        if techniques_elem is not None:
            for technique_elem in techniques_elem.findall('technique'):
                technique_type = technique_elem.find('technique_type')
                technique_text = technique_elem.find('technique_text')
                application = technique_elem.find('application')
                
                memory_techniques.append(MemoryTechnique(
                    technique_type=technique_type.text if technique_type is not None and technique_type.text else '',
                    technique_text=technique_text.text if technique_text is not None and technique_text.text else '',
                    application=application.text if application is not None and application.text else ''
                ))
        
        # Parse learning mantras
        learning_mantras = []
        mantras_elem = root.find('learning_mantras')
        if mantras_elem is not None:
            for mantra_elem in mantras_elem.findall('mantra'):
                mantra_text = mantra_elem.find('mantra_text')
                explanation = mantra_elem.find('explanation')
                
                learning_mantras.append(LearningMantra(
                    mantra_text=mantra_text.text if mantra_text is not None and mantra_text.text else '',
                    explanation=explanation.text if explanation is not None and explanation.text else ''
                ))
        
        # Calculate costs based on which model was used
        usage = response.get('usage', {})
        prompt_tokens = usage.get('input_tokens', 0)
        completion_tokens = usage.get('output_tokens', 0)
        model_used = response.get('_model_used', self.model_id)
        
        # Get pricing for the model that was actually used
        input_cost_per_million, output_cost_per_million = self._get_model_pricing(model_used)
        
        input_cost = (prompt_tokens / 1_000_000) * input_cost_per_million
        output_cost = (completion_tokens / 1_000_000) * output_cost_per_million
        total_cost = input_cost + output_cost
        
        # Log which model was used
        model_name = self._get_model_name(model_used)
        print(f"💰 Cost: ${total_cost:.4f} using {model_name}")
        
        return AnalogyGenerationResult(
            analogies=analogies,
            memory_techniques=memory_techniques,
            learning_mantras=learning_mantras,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            generation_cost_usd=total_cost
        )
