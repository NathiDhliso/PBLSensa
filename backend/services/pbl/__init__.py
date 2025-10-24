"""
PBL (Problem-Based Learning) Services

Services for concept extraction, structure classification, and visualization.
"""

from services.pbl.pdf_parser import PDFParser, get_pdf_parser
from services.pbl.structure_classifier import StructureClassifier, get_structure_classifier
from services.pbl.v7_relationship_service import RelationshipService, get_relationship_service
from services.pbl.concept_deduplicator import ConceptDeduplicator, get_concept_deduplicator
from services.pbl.concept_service import ConceptService, get_concept_service
from services.pbl.visualization_service import VisualizationService, get_visualization_service
from services.pbl.v7_pipeline import V7Pipeline, get_v7_pipeline

# Backward compatibility aliases - get_pbl_pipeline now returns V7Pipeline
get_pbl_pipeline = get_v7_pipeline
PBLPipeline = V7Pipeline

__all__ = [
    'PDFParser',
    'get_pdf_parser',
    'StructureClassifier',
    'get_structure_classifier',
    'RelationshipService',
    'get_relationship_service',
    'ConceptDeduplicator',
    'get_concept_deduplicator',
    'ConceptService',
    'get_concept_service',
    'VisualizationService',
    'get_visualization_service',
    'V7Pipeline',
    'get_v7_pipeline',
    'PBLPipeline',  # Backward compat alias to V7Pipeline
    'get_pbl_pipeline',  # Backward compat alias to get_v7_pipeline
]
