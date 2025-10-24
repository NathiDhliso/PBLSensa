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
    NodeUpdateRequest,
    EdgeCreateRequest,
    LayoutChangeRequest
)
from services.pbl import (
    get_pbl_pipeline,
    get_concept_service,
    get_relationship_service,
    get_visualization_service,
    get_concept_deduplicator
)
from services.layer0.layer0_orchestrator import get_layer0_orchestrator

router = APIRouter(prefix="/api/pbl", tags=["PBL"])

# Initialize services
pipeline = get_pbl_pipeline()
concept_service = get_concept_service()
relationship_service = get_relationship_service()
visualization_service = get_visualization_service()
deduplicator = get_concept_deduplicator()
layer0_orchestrator = get_layer0_orchestrator()


# ============================================================================
# Document Processing Endpoints
# ============================================================================

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Query(..., description="User ID"),
    force_reprocess: bool = Query(False, description="Force reprocessing even if cached")
):
    """
    Upload and process a PDF document through Layer 0 optimization.
    
    Layer 0 provides:
    - PDF hash computation for duplicate detection
    - Cache lookup for instant results
    - Document type detection (digital/scanned/hybrid)
    - Cost estimation and tracking
    - Integration with PBL pipeline
    
    Args:
        file: PDF file to upload
        user_id: User ID
        force_reprocess: Skip cache lookup and reprocess document
    
    Returns:
        Processing results with cache status, timing, and cost information
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
        
        # Process through Layer 0 orchestrator
        result = await layer0_orchestrator.process_pdf(
            pdf_path=temp_path,
            document_id=UUID(document_id),
            user_id=UUID(user_id) if user_id else None,
            force_reprocess=force_reprocess
        )
        
        # Clean up temp file
        os.unlink(temp_path)
        
        return {
            "task_id": task_id,
            "document_id": document_id,
            "status": "completed" if result.success else "failed",
            "cached": result.cached,
            "processing_time_ms": result.processing_time_ms,
            "cost_usd": result.cost_usd,
            "document_type": result.document_type.classification if result.document_type else None,
            "pdf_hash": result.pdf_hash,
            "data": result.data,
            "error": result.error,
            "message": "Returned from cache" if result.cached else "Document processed successfully"
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

@router.get("/documents/{document_id}/concepts", response_model=List[Concept])
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
            validated_only=validated if validated is not None else False,
            structure_type=structure_type
        )
        
        return concepts
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get concepts: {str(e)}"
        )


@router.post("/documents/{document_id}/concepts/validate")
async def validate_concepts(
    document_id: str,
    validation: ConceptValidationRequest
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


@router.get("/concepts/{concept_id}", response_model=Concept)
async def get_concept(concept_id: str):
    """Get a specific concept by ID."""
    try:
        concept = await concept_service.get(UUID(concept_id))
        
        if not concept:
            raise HTTPException(status_code=404, detail="Concept not found")
        
        return concept
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get concept: {str(e)}"
        )


@router.put("/concepts/{concept_id}", response_model=Concept)
async def update_concept(
    concept_id: str,
    updates: ConceptUpdate
):
    """Update a concept."""
    try:
        concept = await concept_service.update(UUID(concept_id), updates)
        
        if not concept:
            raise HTTPException(status_code=404, detail="Concept not found")
        
        return concept
        
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


@router.post("/relationships", response_model=Relationship)
async def create_relationship(relationship: RelationshipCreate):
    """Create a new relationship between concepts."""
    try:
        created = await relationship_service.create(relationship)
        
        return created
        
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
            "nodes": [node.dict() for node in visualization.nodes],
            "edges": [edge.dict() for edge in visualization.edges],
            "layout_type": visualization.layout_type,
            "viewport": visualization.viewport.dict() if visualization.viewport else {"zoom": 1.0, "x": 0, "y": 0},
            "created_at": visualization.created_at.isoformat(),
            "updated_at": visualization.updated_at.isoformat() if visualization.updated_at else None
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
    updates: NodeUpdateRequest
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
    edge: EdgeCreateRequest
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


# ============================================================================
# Layer 0 Admin Endpoints
# ============================================================================

@router.get("/admin/layer0/stats")
async def get_layer0_stats():
    """
    Get comprehensive Layer 0 statistics.
    
    Returns cache statistics, cost breakdown, and health metrics.
    Admin only endpoint.
    """
    try:
        stats = layer0_orchestrator.get_stats()
        
        return {
            "cache_stats": stats.get('cache', {}),
            "cost_stats": stats.get('cost', {}),
            "cost_breakdown_7d": stats.get('cost_breakdown', {}),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get Layer 0 stats: {str(e)}"
        )


@router.post("/admin/layer0/cache/clear")
async def clear_cache(
    pdf_hash: Optional[str] = Query(None, description="Specific PDF hash to clear"),
    clear_expired: bool = Query(False, description="Clear only expired entries")
):
    """
    Clear cache entries.
    
    Can clear specific hash, expired entries, or all cache.
    Admin only endpoint.
    """
    try:
        cache_service = layer0_orchestrator.cache_service
        
        if pdf_hash:
            # Clear specific hash
            success = cache_service.invalidate_cache(pdf_hash)
            return {
                "message": f"Cache cleared for hash: {pdf_hash[:16]}...",
                "cleared": 1 if success else 0
            }
        elif clear_expired:
            # Clear expired entries
            cleared = cache_service.cleanup_expired()
            return {
                "message": f"Cleared {cleared} expired cache entries",
                "cleared": cleared
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Must specify pdf_hash or clear_expired=true"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get("/admin/layer0/costs")
async def get_cost_report(
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365)
):
    """
    Get detailed cost report.
    
    Returns cost breakdown, savings, and trends over specified period.
    Admin only endpoint.
    """
    try:
        cost_optimizer = layer0_orchestrator.cost_optimizer
        
        # Get cost breakdown
        breakdown = cost_optimizer.get_cost_breakdown(days=min(days, 30))
        
        # Get savings calculation
        savings = cost_optimizer.calculate_savings(period_days=days)
        
        # Get overall stats
        stats = cost_optimizer.get_cost_stats()
        
        return {
            "period_days": days,
            "cost_breakdown": breakdown,
            "savings": {
                "total_cost": savings.total_cost,
                "cost_saved": savings.cost_saved,
                "savings_percentage": savings.savings_percentage,
                "cache_hits": savings.cache_hits,
                "cache_misses": savings.cache_misses,
                "hit_rate": savings.hit_rate
            },
            "overall_stats": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cost report: {str(e)}"
        )
