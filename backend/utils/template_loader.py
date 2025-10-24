"""
Template Loader Utilities

Utilities for loading and parsing Markdown template files.
Replaces JSON template loading with more human-readable Markdown format.
"""

import re
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class QuestionTemplate:
    """Represents a question template"""
    template_id: str
    question_type: str
    structure_type: Optional[str]
    template_text: str
    example: Optional[str]
    domain: Optional[str] = None


@dataclass
class OnboardingQuestion:
    """Represents an onboarding question"""
    question_id: str
    category: str
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None


class MarkdownTemplateLoader:
    """Load templates from Markdown files"""
    
    @staticmethod
    def load_question_templates(file_path: str) -> Dict[str, List[QuestionTemplate]]:
        """
        Load question templates from Markdown file.
        
        Args:
            file_path: Path to the Markdown template file
            
        Returns:
            Dict with template categories as keys
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        templates = {
            'hierarchical_templates': [],
            'sequential_templates': [],
            'universal_templates': [],
            'guided_first_experience': []
        }
        
        # Split by ## headers (categories)
        sections = re.split(r'\n## ', content)
        
        for section in sections[1:]:  # Skip first (title)
            lines = section.split('\n')
            category_name = lines[0].strip()
            
            # Determine which category this belongs to
            if 'Hierarchical' in category_name:
                category_key = 'hierarchical_templates'
            elif 'Sequential' in category_name:
                category_key = 'sequential_templates'
            elif 'Universal' in category_name:
                category_key = 'universal_templates'
            elif 'Guided' in category_name:
                category_key = 'guided_first_experience'
            else:
                continue
            
            # Parse individual templates (### headers)
            template_sections = re.split(r'\n### ', section)
            
            for template_section in template_sections[1:]:
                template = MarkdownTemplateLoader._parse_template(template_section, category_key)
                if template:
                    templates[category_key].append(template)
        
        return templates
    
    @staticmethod
    def _parse_template(section: str, category: str) -> Optional[QuestionTemplate]:
        """Parse a single template section"""
        lines = section.split('\n')
        
        # Extract template name and ID
        header = lines[0].strip()
        template_match = re.search(r'Template: (.+?) \((\w+)\)', header)
        if not template_match:
            return None
        
        template_name = template_match.group(1)
        template_id = template_match.group(2)
        
        # Extract metadata
        structure_type = None
        question_type = None
        domain = None
        
        for line in lines[1:5]:
            if line.startswith('**Structure Type:**'):
                structure_type = line.split(':', 1)[1].strip()
            elif line.startswith('**Question Type:**'):
                question_type = line.split(':', 1)[1].strip()
            elif line.startswith('**Domain:**'):
                domain = line.split(':', 1)[1].strip()
        
        # Extract template text (first non-metadata paragraph)
        template_text = None
        example = None
        in_example = False
        
        for line in lines:
            if line.startswith('**Example:**'):
                in_example = True
                example = line.split(':', 1)[1].strip() if ':' in line else ''
            elif in_example and line.strip():
                example = (example + ' ' + line.strip()).strip()
            elif not template_text and line.strip() and not line.startswith('**') and not line.startswith('---'):
                template_text = line.strip()
        
        if not template_text:
            return None
        
        return QuestionTemplate(
            template_id=template_id,
            question_type=question_type or 'general_analogy',
            structure_type=structure_type,
            template_text=template_text,
            example=example,
            domain=domain
        )
    
    @staticmethod
    def load_onboarding_questions(file_path: str) -> Dict[str, List[OnboardingQuestion]]:
        """
        Load onboarding questions from Markdown file.
        
        Args:
            file_path: Path to the Markdown file
            
        Returns:
            Dict with categories as keys
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        questions_by_category = {}
        
        # Split by ## Category headers
        sections = re.split(r'\n## Category: ', content)
        
        for section in sections[1:]:  # Skip first (title)
            lines = section.split('\n')
            category_name = lines[0].strip()
            
            questions = []
            
            # Parse individual questions (### headers)
            question_sections = re.split(r'\n### Question: ', section)
            
            for i, q_section in enumerate(question_sections[1:]):
                question = MarkdownTemplateLoader._parse_onboarding_question(
                    q_section,
                    category_name,
                    i
                )
                if question:
                    questions.append(question)
            
            if questions:
                questions_by_category[category_name] = questions
        
        return questions_by_category
    
    @staticmethod
    def _parse_onboarding_question(section: str, category: str, index: int) -> Optional[OnboardingQuestion]:
        """Parse a single onboarding question"""
        lines = section.split('\n')
        
        # First line is the question text
        question_text = lines[0].strip()
        
        # Extract metadata
        question_type = None
        options = None
        placeholder = None
        
        for line in lines[1:]:
            if line.startswith('**Type:**'):
                question_type = line.split(':', 1)[1].strip()
            elif line.startswith('**Options:**'):
                options_str = line.split(':', 1)[1].strip()
                options = [opt.strip() for opt in options_str.split(',')]
            elif line.startswith('**Placeholder:**'):
                placeholder = line.split(':', 1)[1].strip()
        
        if not question_text or not question_type:
            return None
        
        # Generate question ID
        category_id = category.lower().replace(' ', '_').replace('&', 'and')
        question_id = f"{category_id}_{index + 1}"
        
        return OnboardingQuestion(
            question_id=question_id,
            category=category,
            question_text=question_text,
            question_type=question_type,
            options=options,
            placeholder=placeholder
        )


# Convenience functions
def load_question_templates() -> Dict[str, List[QuestionTemplate]]:
    """Load question templates from default location"""
    template_path = Path(__file__).parent.parent / "data" / "question_templates.md"
    return MarkdownTemplateLoader.load_question_templates(str(template_path))


def load_onboarding_questions() -> Dict[str, List[OnboardingQuestion]]:
    """Load onboarding questions from default location"""
    questions_path = Path(__file__).parent.parent / "data" / "onboarding_questions.md"
    return MarkdownTemplateLoader.load_onboarding_questions(str(questions_path))
