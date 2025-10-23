"""
PBL Visualization Data Models

Pydantic models for PBL concept map visualizations.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from uuid import UUID
from enum import Enum


class LayoutType(str, Enum):
    """Available layout algorithms"""
    TREE = "tree"
    MINDMAP = "mindmap"
    FLOWCHART = "flowchart"
    HYBRID = "hybrid"


class Point(BaseModel):
    """2D coordinate point"""
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")
    
    class Config:
        schema_extra = {
            "example": {
                "x": 100.5,
                "y": 250.0
            }
        }


class NodeStyle(BaseModel):
    """Styling for a diagram node"""
    shape: str = Field(default="rectangle", description="Node shape: rectangle, rounded-rectangle, ellipse")
    border_color: str = Field(default="#3B82F6", description="Border color (hex)")
    border_width: int = Field(default=2, ge=1, le=10, description="Border width in pixels")
    background_color: str = Field(default="#EFF6FF", description="Background color (hex)")
    text_color: str = Field(default="#1F2937", description="Text color (hex)")
    font_size: int = Field(default=14, ge=8, le=24, description="Font size in pixels")
    width: Optional[int] = Field(None, ge=50, le=500, description="Node width in pixels")
    height: Optional[int] = Field(None, ge=30, le=300, description="Node height in pixels")
    
    @validator('shape')
    def validate_shape(cls, v):
        valid_shapes = ['rectangle', 'rounded-rectangle', 'ellipse', 'circle', 'diamond']
        if v not in valid_shapes:
            raise ValueError(f'shape must be one of {valid_shapes}')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "shape": "rectangle",
                "border_color": "#3B82F6",
                "border_width": 2,
                "background_color": "#EFF6FF",
                "text_color": "#1F2937",
                "font_size": 14
            }
        }


class EdgeStyle(BaseModel):
    """Styling for a diagram edge"""
    line_type: str = Field(default="solid", description="Line type: solid, dashed, dotted")
    color: str = Field(default="#3B82F6", description="Line color (hex)")
    width: int = Field(default=2, ge=1, le=10, description="Line width in pixels")
    arrow: bool = Field(default=False, description="Whether to show arrow at target")
    arrow_size: int = Field(default=10, ge=5, le=20, description="Arrow size in pixels")
    label_background: str = Field(default="#FFFFFF", description="Label background color (hex)")
    label_color: str = Field(default="#1F2937", description="Label text color (hex)")
    
    @validator('line_type')
    def validate_line_type(cls, v):
        valid_types = ['solid', 'dashed', 'dotted']
        if v not in valid_types:
            raise ValueError(f'line_type must be one of {valid_types}')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "line_type": "solid",
                "color": "#3B82F6",
                "width": 2,
                "arrow": True,
                "arrow_size": 10
            }
        }


class DiagramNode(BaseModel):
    """A node in the concept map diagram"""
    id: str = Field(..., description="Unique node ID")
    concept_id: UUID = Field(..., description="ID of the concept this node represents")
    label: str = Field(..., min_length=1, max_length=500, description="Display label")
    position: Point = Field(..., description="Node position on canvas")
    structure_type: str = Field(..., description="hierarchical, sequential, or unclassified")
    style: NodeStyle = Field(default_factory=NodeStyle, description="Node styling")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional node data")
    
    @validator('structure_type')
    def validate_structure_type(cls, v):
        if v not in ['hierarchical', 'sequential', 'unclassified']:
            raise ValueError('structure_type must be hierarchical, sequential, or unclassified')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "id": "node-1",
                "concept_id": "123e4567-e89b-12d3-a456-426614174000",
                "label": "Virtual Machine",
                "position": {"x": 100, "y": 200},
                "structure_type": "hierarchical",
                "style": {
                    "shape": "rectangle",
                    "border_color": "#3B82F6",
                    "background_color": "#EFF6FF"
                }
            }
        }


class DiagramEdge(BaseModel):
    """An edge connecting two nodes in the diagram"""
    id: str = Field(..., description="Unique edge ID")
    source_node_id: str = Field(..., description="ID of source node")
    target_node_id: str = Field(..., description="ID of target node")
    relationship_type: str = Field(..., description="Type of relationship")
    label: str = Field(default="", max_length=100, description="Edge label")
    style: EdgeStyle = Field(default_factory=EdgeStyle, description="Edge styling")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional edge data")
    
    @validator('source_node_id', 'target_node_id')
    def validate_not_same(cls, v, values):
        if 'source_node_id' in values and v == values['source_node_id']:
            raise ValueError('source_node_id and target_node_id cannot be the same')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "id": "edge-1",
                "source_node_id": "node-1",
                "target_node_id": "node-2",
                "relationship_type": "is_a",
                "label": "is a",
                "style": {
                    "line_type": "solid",
                    "color": "#3B82F6",
                    "arrow": True
                }
            }
        }


class Viewport(BaseModel):
    """Viewport state (zoom and pan)"""
    zoom: float = Field(default=1.0, ge=0.1, le=5.0, description="Zoom level")
    x: float = Field(default=0.0, description="Pan X offset")
    y: float = Field(default=0.0, description="Pan Y offset")
    
    class Config:
        schema_extra = {
            "example": {
                "zoom": 1.0,
                "x": 0.0,
                "y": 0.0
            }
        }


class PBLVisualizationBase(BaseModel):
    """Base visualization model"""
    nodes: List[DiagramNode] = Field(default_factory=list, description="List of diagram nodes")
    edges: List[DiagramEdge] = Field(default_factory=list, description="List of diagram edges")
    layout_type: LayoutType = Field(default=LayoutType.HYBRID, description="Layout algorithm")
    viewport: Viewport = Field(default_factory=Viewport, description="Viewport state")
    
    @validator('nodes')
    def validate_nodes_unique(cls, v):
        node_ids = [node.id for node in v]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError('Node IDs must be unique')
        return v
    
    @validator('edges')
    def validate_edges_unique(cls, v):
        edge_ids = [edge.id for edge in v]
        if len(edge_ids) != len(set(edge_ids)):
            raise ValueError('Edge IDs must be unique')
        return v


class PBLVisualizationCreate(PBLVisualizationBase):
    """Model for creating a new visualization"""
    document_id: UUID = Field(..., description="ID of the document")
    user_id: UUID = Field(..., description="ID of the user")
    
    class Config:
        schema_extra = {
            "example": {
                "document_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "nodes": [],
                "edges": [],
                "layout_type": "hybrid",
                "viewport": {"zoom": 1.0, "x": 0, "y": 0}
            }
        }


class PBLVisualizationUpdate(BaseModel):
    """Model for updating a visualization"""
    nodes: Optional[List[DiagramNode]] = None
    edges: Optional[List[DiagramEdge]] = None
    layout_type: Optional[LayoutType] = None
    viewport: Optional[Viewport] = None
    
    class Config:
        schema_extra = {
            "example": {
                "layout_type": "tree",
                "viewport": {"zoom": 1.5, "x": 100, "y": 50}
            }
        }


class PBLVisualization(PBLVisualizationBase):
    """Complete visualization model"""
    id: UUID
    document_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174002",
                "document_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "nodes": [],
                "edges": [],
                "layout_type": "hybrid",
                "viewport": {"zoom": 1.0, "x": 0, "y": 0},
                "created_at": "2025-01-24T10:00:00Z",
                "updated_at": "2025-01-24T10:30:00Z"
            }
        }


class NodeUpdateRequest(BaseModel):
    """Request to update a single node"""
    label: Optional[str] = Field(None, min_length=1, max_length=500)
    position: Optional[Point] = None
    style: Optional[NodeStyle] = None
    data: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "label": "Updated Label",
                "position": {"x": 150, "y": 250}
            }
        }


class EdgeCreateRequest(BaseModel):
    """Request to create a new edge"""
    source_node_id: str = Field(..., description="ID of source node")
    target_node_id: str = Field(..., description="ID of target node")
    relationship_type: str = Field(..., description="Type of relationship")
    label: Optional[str] = Field(None, max_length=100)
    
    class Config:
        schema_extra = {
            "example": {
                "source_node_id": "node-1",
                "target_node_id": "node-2",
                "relationship_type": "is_a",
                "label": "is a"
            }
        }


class LayoutChangeRequest(BaseModel):
    """Request to change layout algorithm"""
    layout_type: LayoutType = Field(..., description="New layout type")
    preserve_positions: bool = Field(default=False, description="Try to preserve user-customized positions")
    
    class Config:
        schema_extra = {
            "example": {
                "layout_type": "tree",
                "preserve_positions": False
            }
        }


class ExportFormat(str, Enum):
    """Available export formats"""
    PNG = "png"
    PDF = "pdf"
    JSON = "json"
    SVG = "svg"


class ExportRequest(BaseModel):
    """Request to export visualization"""
    format: ExportFormat = Field(..., description="Export format")
    include_viewport: bool = Field(default=True, description="Include current viewport in export")
    width: Optional[int] = Field(None, ge=100, le=5000, description="Export width in pixels (for images)")
    height: Optional[int] = Field(None, ge=100, le=5000, description="Export height in pixels (for images)")
    
    class Config:
        schema_extra = {
            "example": {
                "format": "png",
                "include_viewport": True,
                "width": 1920,
                "height": 1080
            }
        }


def get_default_node_style(structure_type: str) -> NodeStyle:
    """Get default styling for a node based on its structure type"""
    styles = {
        "hierarchical": NodeStyle(
            shape="rectangle",
            border_color="#3B82F6",  # Blue
            border_width=2,
            background_color="#EFF6FF",
            text_color="#1F2937"
        ),
        "sequential": NodeStyle(
            shape="rounded-rectangle",
            border_color="#10B981",  # Green
            border_width=2,
            background_color="#ECFDF5",
            text_color="#1F2937"
        ),
        "unclassified": NodeStyle(
            shape="ellipse",
            border_color="#6B7280",  # Gray
            border_width=1,
            background_color="#F9FAFB",
            text_color="#1F2937"
        )
    }
    return styles.get(structure_type, styles["unclassified"])


def get_default_edge_style(structure_category: str) -> EdgeStyle:
    """Get default styling for an edge based on structure category"""
    styles = {
        "hierarchical": EdgeStyle(
            line_type="solid",
            color="#3B82F6",  # Blue
            width=2,
            arrow=False
        ),
        "sequential": EdgeStyle(
            line_type="solid",
            color="#10B981",  # Green
            width=2,
            arrow=True,
            arrow_size=10
        ),
        "cross_type": EdgeStyle(
            line_type="dashed",
            color="#6B7280",  # Gray
            width=1,
            arrow=True,
            arrow_size=8
        )
    }
    return styles.get(structure_category, styles["cross_type"])
