"""
PBL Documents API Router

Endpoints for PBL document processing and management.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime
import os
import tempfile

from models.pbl_concept import (
    Concept,
    ConceptValidationRequest,
    ConceptUpdate
)
from models.pbl_relationship import Relationship, RelationshipCreate
from models.pbl_visualization import (
    PBLVisualization,
    NodeUpdate,
    EdgeCreate,
    LayoutChangeRequest
)
from services.pbl import (
    get_pbl_pipeline,
    get_concept_service,
    get_relationship_service,
    get_visualization_service,
    get_concept_deduplicator
)

router = APIRouter(prefix="/api/pbl", tags=["PBL"])

# Initialize services
pipeline = get_pbl_pipeline()
concept_service = get_concept_service()
relationship_service = get_relationship_service()
visualization_service = get_visualization_service()
deduplicator = get_concept_deduplicator()


# ============================================================================
# Document Processing Endpoints
# ============================================================================

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Query(..., description="User ID")
):
    """
    Upload and process a PDF document.
    
    Starts the PBL pipeline to extract concepts, detect relationships,
    and generate visualization.
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    # Validate file size (50MB limit)
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    max_size = 50 * 1024 * 1024  # 50MB
    
    # Save file temporarily
    document_id = str(uuid4())
    task_id = str(uuid4())
    
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_path = temp_file.name
            
            # Read and save file
            while chunk := await file.read(chunk_size):
                file_size += len(chunk)
                if file_size > max_size:
                    os.unlink(temp_path)
                    raise HTTPException(
                        status_code=413,
                        detail="File size exceeds 50MB limit"
                    )
                temp_file.write(chunk)
        
        # Start pipeline processing (async in background)
        # For now, we'll process synchronously
        result = await pipeline.process_document(
            pdf_path=temp_path,
            document_id=UUID(document_id),
            user_id=UUID(user_id) if user_id else None
        )
        
        # Clean up temp file
        os.unlink(temp_path)
        
        return {
            "task_id": task_id,
            "document_id": document_id,
            "status": "completed" if result['success'] else "failed",
            "message": "Document uploaded and processing started"
        }
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}"
        )


@router.get("/documents/{document_id}/status")
async def get_processing_status(document_id: str):
    """
    Get document processing status.
    
    Returns current progress, stage, and estimated time remaining.
    """
    try:
        status = await pipeline.get_progress(document_id)
        
        if not status:
            raise HTTPException(
                status_code=404,
                detail="Document not found or processing not started"
            )
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get status: {str(e)}"
        )


# ============================================================================
# Concept Management Endpoints
# ============================================================================

@router.get("/documents/{document_id}/concepts", response_model=List[ConceptResponse])
async def get_concepts(
    document_id: str,
    validated: Optional[bool] = Query(None, description="Filter by validation status"),
    structure_type: Optional[str] = Query(None, description="Filter by structure type")
):
    """
    Get all concepts for a document.
    
    Supports filtering by validation status and structure type.
    """
    try:
        concepts = await concept_service.get_by_document(
            document_id=UUID(document_id),
            validated=validated,
            structure_type=structure_type
        )
        
        return [
            ConceptResponse(
                id=str(c.id),
                document_id=str(c.document_id),
                term=c.term,
                definition=c.definition,
                source_sentences=c.source_sentences,
                page_number=c.page_number,
                surrounding_concepts=c.surrounding_concepts,
                structure_type=c.structure_type,
                importance_score=c.importance_score,
                validated=c.validated,
                created_at=c.created_at.isoformat()
            )
            for c in concepts
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get concepts: {str(e)}"
        )


@router.post("/documents/{document_id}/concepts/validate")
async def validate_concepts(
    document_id: str,
    validation: ConceptValidation
):
    """
    Bulk validate concepts.
    
    Accepts arrays of approved, rejected, and edited concept IDs.
    """
    try:
        result = await concept_service.validate_concepts(
            approved=[UUID(id) for id in validation.approved],
            rejected=[UUID(id) for id in validation.rejected],
            edited=validation.edited
        )
        
        return {
            "validated_count": result['validated_count'],
            "rejected_count": result['rejected_count'],
            "edited_count": result['edited_count'],
            "message": "Concepts validated successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate concepts: {str(e)}"
        )


@router.get("/concepts/{concept_id}", response_model=ConceptResponse)
async def get_concept(concept_id: str):
    """Get a specific concept by ID."""
    try:
        concept = await concept_service.get(UUID(concept_id))
        
        if not concept:
            raise HTTPException(status_code=404, detail="Concept not found")
        
        return ConceptResponse(
            id=str(concept.id),
            document_id=str(concept.document_id),
            term=concept.term,
            definition=concept.definition,
            source_sentences=concept.source_sentences,
            page_number=concept.page_number,
            surrounding_concepts=concept.surrounding_concepts,
            structure_type=concept.structure_type,
            importance_score=concept.importance_score,
            validated=concept.validated,
            created_at=concept.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get concept: {str(e)}"
        )


@router.put("/concepts/{concept_id}", response_model=ConceptResponse)
async def update_concept(
    concept_id: str,
    updates: ConceptUpdate
):
    """Update a concept."""
    try:
        concept = await concept_service.update(UUID(concept_id), updates)
        
        if not concept:
            raise HTTPException(status_code=404, detail="Concept not found")
        
        return ConceptResponse(
            id=str(concept.id),
            document_id=str(concept.document_id),
            term=concept.term,
            definition=concept.definition,
            source_sentences=concept.source_sentences,
            page_number=concept.page_number,
            surrounding_concepts=concept.surrounding_concepts,
            structure_type=concept.structure_type,
            importance_score=concept.importance_score,
            validated=concept.validated,
            created_at=concept.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update concept: {str(e)}"
        )


@router.delete("/concepts/{concept_id}")
async def delete_concept(concept_id: str):
    """Delete a concept and its relationships."""
    try:
        deleted = await concept_service.delete(UUID(concept_id))
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Concept not found")
        
        return {
            "message": "Concept deleted successfully",
            "concept_id": concept_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete concept: {str(e)}"
        )


# ============================================================================
# Relationship Endpoints
# ============================================================================

@router.get("/documents/{document_id}/structures")
async def get_structures(
    document_id: str,
    category: Optional[str] = Query(None, description="Filter by category (hierarchical/sequential)")
):
    """
    Get detected relationships for a document.
    
    Returns hierarchical and sequential relationships separately.
    """
    try:
        relationships = await relationship_service.get_by_document(
            document_id=UUID(document_id),
            category=category
        )
        
        # Separate by category
        hierarchical = [r for r in relationships if r.structure_category == 'hierarchical']
        sequential = [r for r in relationships if r.structure_category == 'sequential']
        unclassified = [r for r in relationships if r.structure_category == 'unclassified']
        
        return {
            "hierarchical": [
                {
                    "id": str(r.id),
                    "source_concept_id": str(r.source_concept_id),
                    "target_concept_id": str(r.target_concept_id),
                    "relationship_type": r.relationship_type,
                    "strength": r.strength,
                    "validated_by_user": r.validated_by_user
                }
                for r in hierarchical
            ],
            "sequential": [
                {
                    "id": str(r.id),
                    "source_concept_id": str(r.source_concept_id),
                    "target_concept_id": str(r.target_concept_id),
                    "relationship_type": r.relationship_type,
                    "strength": r.strength,
                    "validated_by_user": r.validated_by_user
                }
                for r in sequential
            ],
            "unclassified": [
                {
                    "id": str(r.id),
                    "source_concept_id": str(r.source_concept_id),
                    "target_concept_id": str(r.target_concept_id),
                    "relationship_type": r.relationship_type,
                    "strength": r.strength,
                    "validated_by_user": r.validated_by_user
                }
                for r in unclassified
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get structures: {str(e)}"
        )


@router.post("/relationships", response_model=RelationshipResponse)
async def create_relationship(relationship: RelationshipCreate):
    """Create a new relationship between concepts."""
    try:
        created = await relationship_service.create(relationship)
        
        return RelationshipResponse(
            id=str(created.id),
            source_concept_id=str(created.source_concept_id),
            target_concept_id=str(created.target_concept_id),
            relationship_type=created.relationship_type,
            structure_category=created.structure_category,
            strength=created.strength,
            validated_by_user=created.validated_by_user,
            created_at=created.created_at.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create relationship: {str(e)}"
        )


@router.delete("/relationships/{relationship_id}")
async def delete_relationship(relationship_id: str):
    """Delete a relationship."""
    try:
        deleted = await relationship_service.delete(UUID(relationship_id))
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Relationship not found")
        
        return {
            "message": "Relationship deleted successfully",
            "relationship_id": relationship_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete relationship: {str(e)}"
        )


# ============================================================================
# Deduplication Endpoints
# ============================================================================

@router.get("/documents/{document_id}/duplicates")
async def get_duplicates(document_id: str):
    """
    Get potential duplicate concepts for a document.
    
    Returns pairs of similar concepts with similarity scores.
    """
    try:
        duplicates = await deduplicator.find_duplicates(
            document_id=UUID(document_id),
            similarity_threshold=0.95
        )
        
        return {
            "duplicates": [
                {
                    "primary_id": str(d.primary_concept.id),
                    "primary_term": d.primary_concept.term,
                    "duplicate_id": str(d.duplicate_concept.id),
                    "duplicate_term": d.duplicate_concept.term,
                    "similarity_score": d.similarity_score,
                    "reason": d.reason
                }
                for d in duplicates
            ],
            "count": len(duplicates)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to find duplicates: {str(e)}"
        )


@router.post("/concepts/merge")
async def merge_concepts(
    primary_id: str = Query(..., description="Primary concept ID to keep"),
    duplicate_id: str = Query(..., description="Duplicate concept ID to merge")
):
    """
    Merge duplicate concepts.
    
    Consolidates all data from duplicate into primary concept.
    """
    try:
        merged = await deduplicator.merge_concepts(
            primary_id=UUID(primary_id),
            duplicate_id=UUID(duplicate_id)
        )
        
        return {
            "message": "Concepts merged successfully",
            "merged_concept": {
                "id": str(merged.id),
                "term": merged.term,
                "definition": merged.definition
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to merge concepts: {str(e)}"
        )


# ============================================================================
# Visualization Endpoints
# ============================================================================

@router.get("/visualizations/{document_id}")
async def get_visualization(
    document_id: str,
    user_id: Optional[str] = Query(None, description="User ID for personalized visualization")
):
    """
    Get or create visualization for a document.
    
    Returns the complete visualization with nodes and edges.
    """
    try:
        user_uuid = UUID(user_id) if user_id else None
        visualization = await visualization_service.get_or_create(
            document_id=UUID(document_id),
            user_id=user_uuid
        )
        
        return {
            "id": str(visualization.id),
            "document_id": str(visualization.document_id),
            "user_id": str(visualization.user_id) if visualization.user_id else None,
            "nodes": visualization.nodes_json,
            "edges": visualization.edges_json,
            "layout_type": visualization.layout_type,
            "viewport": visualization.viewport_json,
            "created_at": visualization.created_at.isoformat(),
            "updated_at": visualization.updated_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get visualization: {str(e)}"
        )


@router.put("/visualizations/{visualization_id}")
async def update_visualization(
    visualization_id: str,
    nodes: List[dict],
    edges: List[dict],
    viewport: Optional[dict] = None
):
    """Update entire visualization."""
    try:
        updated = await visualization_service.update(
            visualization_id=UUID(visualization_id),
            nodes_json=nodes,
            edges_json=edges,
            viewport_json=viewport
        )
        
        if not updated:
            raise HTTPException(status_code=404, detail="Visualization not found")
        
        return {
            "message": "Visualization updated successfully",
            "visualization_id": visualization_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update visualization: {str(e)}"
        )


@router.put("/visualizations/{visualization_id}/nodes/{node_id}")
async def update_node(
    visualization_id: str,
    node_id: str,
    updates: NodeUpdate
):
    """Update a single node in the visualization."""
    try:
        updated = await visualization_service.update_node(
            visualization_id=UUID(visualization_id),
            node_id=node_id,
            updates=updates.dict(exclude_unset=True)
        )
        
        if not updated:
            raise HTTPException(status_code=404, detail="Node not found")
        
        return {
            "message": "Node updated successfully",
            "node_id": node_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update node: {str(e)}"
        )


@router.post("/visualizations/{visualization_id}/edges")
async def create_edge(
    visualization_id: str,
    edge: EdgeCreate
):
    """Create a new edge in the visualization."""
    try:
        created = await visualization_service.create_edge(
            visualization_id=UUID(visualization_id),
            source_node_id=edge.source_node_id,
            target_node_id=edge.target_node_id,
            edge_type=edge.edge_type,
            label=edge.label
        )
        
        return {
            "message": "Edge created successfully",
            "edge_id": created['id']
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create edge: {str(e)}"
        )


@router.delete("/visualizations/{visualization_id}/edges/{edge_id}")
async def delete_edge(
    visualization_id: str,
    edge_id: str
):
    """Delete an edge from the visualization."""
    try:
        deleted = await visualization_service.delete_edge(
            visualization_id=UUID(visualization_id),
            edge_id=edge_id
        )
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Edge not found")
        
        return {
            "message": "Edge deleted successfully",
            "edge_id": edge_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete edge: {str(e)}"
        )


@router.post("/visualizations/{visualization_id}/layout")
async def change_layout(
    visualization_id: str,
    layout_request: LayoutChangeRequest
):
    """
    Change the layout algorithm for a visualization.
    
    Recalculates node positions using the specified layout.
    """
    try:
        updated = await visualization_service.change_layout(
            visualization_id=UUID(visualization_id),
            layout_type=layout_request.layout_type
        )
        
        if not updated:
            raise HTTPException(status_code=404, detail="Visualization not found")
        
        return {
            "message": "Layout changed successfully",
            "layout_type": layout_request.layout_type,
            "nodes": updated['nodes'],
            "edges": updated['edges']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to change layout: {str(e)}"
        )


@router.get("/visualizations/{visualization_id}/export")
async def export_visualization(
    visualization_id: str,
    format: str = Query("json", description="Export format: json, png, pdf")
):
    """
    Export visualization in specified format.
    
    Supports JSON, PNG, and PDF formats.
    """
    try:
        if format not in ['json', 'png', 'pdf']:
            raise HTTPException(
                status_code=400,
                detail="Invalid format. Supported: json, png, pdf"
            )
        
        export_data = await visualization_service.export(
            visualization_id=UUID(visualization_id),
            format=format
        )
        
        return {
            "format": format,
            "data": export_data,
            "message": f"Visualization exported as {format.upper()}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export visualization: {str(e)}"
        )
