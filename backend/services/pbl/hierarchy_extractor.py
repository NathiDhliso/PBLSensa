"""
Hierarchy Extractor
Extracts and normalizes document hierarchy from various sources (markdown, Textract, plain text).
"""

import re
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class HierarchyNode:
    """Represents a node in the document hierarchy"""
    id: str  # e.g., "chapter_1", "chapter_1_section_2"
    level: int  # 1-6
    title: str
    type: str  # 'hierarchical' or 'sequential'
    parent_id: Optional[str]
    children: List['HierarchyNode'] = field(default_factory=list)
    page_range: Tuple[int, int] = (0, 0)


class HierarchyExtractor:
    """
    Extracts hierarchical structure from markdown, Textract, or plain text.
    Normalizes to consistent HierarchyNode format.
    """
    
    def __init__(self):
        # Sequential keywords for detection
        self.sequential_keywords = [
            'step', 'phase', 'stage', 'process', 'procedure',
            'workflow', 'algorithm', 'method', 'approach'
        ]
    
    def extract_from_markdown(self, markdown_text: str) -> List[HierarchyNode]:
        """
        Extract hierarchy from markdown headings (H1-H6).
        
        Example:
            # Chapter 1: Introduction    → level 1
            ## Section 1.1: Overview     → level 2
            ### Subsection 1.1.1         → level 3
        """
        hierarchy = []
        lines = markdown_text.split('\n')
        
        # Stack to track parent nodes
        parent_stack = []
        chapter_counter = 0
        section_counters = {}
        
        for line_num, line in enumerate(lines):
            # Match markdown headers
            match = re.match(r'^(#{1,6})\s+(.+)', line)
            if not match:
                continue
            
            level = len(match.group(1))
            title = match.group(2).strip()
            
            # Assign ID based on level
            if level == 1:
                chapter_counter += 1
                node_id = f"chapter_{chapter_counter}"
                section_counters[node_id] = 0
                parent_id = None
            elif level == 2:
                parent_id = parent_stack[-1].id if parent_stack else f"chapter_{chapter_counter}"
                section_counters[parent_id] = section_counters.get(parent_id, 0) + 1
                node_id = f"{parent_id}_section_{section_counters[parent_id]}"
            else:
                parent_id = parent_stack[-1].id if parent_stack else f"chapter_{chapter_counter}"
                node_id = f"{parent_id}_subsection_{line_num}"
            
            # Detect if sequential (numbered list, steps, etc.)
            node_type = self._detect_node_type(title, line_num, lines)
            
            # Create node
            node = HierarchyNode(
                id=node_id,
                level=level,
                title=title,
                type=node_type,
                parent_id=parent_id
            )
            
            # Manage parent stack
            while parent_stack and parent_stack[-1].level >= level:
                parent_stack.pop()
            
            if parent_stack:
                parent_stack[-1].children.append(node)
            else:
                hierarchy.append(node)
            
            parent_stack.append(node)
        
        logger.info(f"Extracted {len(hierarchy)} top-level nodes from markdown")
        return hierarchy
    
    def extract_from_textract(self, textract_result: Dict) -> List[HierarchyNode]:
        """
        Extract hierarchy from Textract layout blocks.
        Textract provides LAYOUT_TITLE, LAYOUT_SECTION_HEADER, etc.
        """
        hierarchy = []
        blocks = textract_result.get('Blocks', [])
        
        # Filter for layout blocks
        layout_blocks = [b for b in blocks if b.get('BlockType') == 'LAYOUT']
        
        chapter_counter = 0
        current_chapter = None
        
        for block in layout_blocks:
            layout_type = block.get('LayoutType')
            
            if layout_type == 'LAYOUT_TITLE':
                chapter_counter += 1
                node = HierarchyNode(
                    id=f"chapter_{chapter_counter}",
                    level=1,
                    title=self._extract_text_from_block(block, blocks),
                    type='hierarchical',
                    parent_id=None
                )
                hierarchy.append(node)
                current_chapter = node
            
            elif layout_type == 'LAYOUT_SECTION_HEADER' and current_chapter:
                # Add as child of last chapter
                section_num = len(current_chapter.children) + 1
                node = HierarchyNode(
                    id=f"{current_chapter.id}_section_{section_num}",
                    level=2,
                    title=self._extract_text_from_block(block, blocks),
                    type='hierarchical',
                    parent_id=current_chapter.id
                )
                current_chapter.children.append(node)
        
        logger.info(f"Extracted {len(hierarchy)} top-level nodes from Textract")
        return hierarchy
    
    def create_page_based_hierarchy(self, text: str, pages_per_chapter: int = 10) -> List[HierarchyNode]:
        """
        Create synthetic hierarchy based on page breaks.
        Fallback when no structure is detected.
        """
        # Split by page breaks (form feed character)
        pages = text.split('\f')
        total_pages = len(pages)
        
        hierarchy = []
        chapter_counter = 0
        
        for i in range(0, total_pages, pages_per_chapter):
            chapter_counter += 1
            start_page = i + 1
            end_page = min(i + pages_per_chapter, total_pages)
            
            node = HierarchyNode(
                id=f"chapter_{chapter_counter}",
                level=1,
                title=f"Pages {start_page}-{end_page}",
                type='hierarchical',
                parent_id=None,
                page_range=(start_page, end_page)
            )
            hierarchy.append(node)
        
        logger.info(f"Created {len(hierarchy)} page-based chapters")
        return hierarchy
    
    def _detect_node_type(self, title: str, line_num: int, lines: List[str]) -> str:
        """
        Detect if a section is hierarchical or sequential.
        
        Sequential indicators:
            - "Step", "Phase", "Stage" in title
            - Numbered list follows
            - Imperative verbs
        """
        # Check title for sequential keywords
        if any(kw in title.lower() for kw in self.sequential_keywords):
            return 'sequential'
        
        # Check following lines for numbered lists
        for i in range(line_num + 1, min(line_num + 5, len(lines))):
            if re.match(r'^\d+\.', lines[i].strip()):
                return 'sequential'
        
        return 'hierarchical'
    
    def _extract_text_from_block(self, block: Dict, all_blocks: List[Dict]) -> str:
        """Extract text content from a Textract block"""
        if 'Text' in block:
            return block['Text']
        
        # If no direct text, look for child blocks
        if 'Relationships' in block:
            for rel in block['Relationships']:
                if rel['Type'] == 'CHILD':
                    child_ids = rel['Ids']
                    child_texts = []
                    for child_id in child_ids:
                        child_block = next((b for b in all_blocks if b['Id'] == child_id), None)
                        if child_block and 'Text' in child_block:
                            child_texts.append(child_block['Text'])
                    return ' '.join(child_texts)
        
        return "Untitled Section"


def get_hierarchy_extractor() -> HierarchyExtractor:
    """Factory function to get HierarchyExtractor instance"""
    return HierarchyExtractor()
