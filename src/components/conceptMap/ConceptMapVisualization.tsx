import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { ConceptMap, Concept, Relationship } from '../../types/conceptMap';
import { Button } from '../ui/Button';
import { getNodeStyle, getRelevanceFromScore, type ExamRelevance } from '../pbl/ExamRelevanceIndicator';

type LayoutType = 'force' | 'tree' | 'flowchart' | 'hybrid';

interface ConceptMapVisualizationProps {
  conceptMap: ConceptMap;
  onNodeClick?: (concept: Concept) => void;
  onNodeHover?: (concept: Concept | null) => void;
  highlightedNodes?: Set<string>;
  showExamRelevanceFilter?: boolean;
  layout?: LayoutType;
  onLayoutChange?: (layout: LayoutType) => void;
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  concept: Concept;
  x?: number;
  y?: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: D3Node | string;
  target: D3Node | string;
  relationship: Relationship;
}

export const ConceptMapVisualization: React.FC<ConceptMapVisualizationProps> = ({
  conceptMap,
  onNodeClick,
  onNodeHover,
  highlightedNodes,
  showExamRelevanceFilter = true,
  layout = 'force',
  onLayoutChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const [filterHighRelevance, setFilterHighRelevance] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>(layout);

  // Extract nodes and links from concept map
  const allNodes: D3Node[] = conceptMap.chapters.flatMap((chapter: any) =>
    chapter.keywords.map((keyword: any) => ({
      id: `${chapter.chapter_number}-${keyword.term}`,
      concept: {
        id: `${chapter.chapter_number}-${keyword.term}`,
        name: keyword.term,
        description: keyword.definition,
        source_chapter: chapter.title,
        is_primary: keyword.is_primary,
        exam_relevant: keyword.exam_relevant,
      } as Concept,
    }))
  );

  // Helper function to get relevance from concept data
  const getConceptRelevance = (examRelevant: any): ExamRelevance => {
    if (!examRelevant) return 'low';
    if (typeof examRelevant === 'string') return examRelevant as ExamRelevance;
    if (typeof examRelevant === 'boolean') return examRelevant ? 'high' : 'low';
    if (typeof examRelevant === 'number') return getRelevanceFromScore(examRelevant);
    return 'low';
  };

  // Filter nodes based on exam relevance if filter is active
  const nodes: D3Node[] = filterHighRelevance
    ? allNodes.filter(node => {
        const relevance = getConceptRelevance(node.concept.exam_relevant);
        return relevance === 'high';
      })
    : allNodes;

  const links: D3Link[] = conceptMap.chapters.flatMap((chapter: any) =>
    chapter.relationships.map((rel: any) => ({
      source: `${chapter.chapter_number}-${rel.source}`,
      target: `${chapter.chapter_number}-${rel.target}`,
      relationship: rel,
    }))
  );

  // Add global relationships
  conceptMap.global_relationships?.forEach((rel: any) => {
    // Try to find the source and target in nodes
    const sourceNode = nodes.find(n => n.concept.name === rel.source);
    const targetNode = nodes.find(n => n.concept.name === rel.target);
    
    if (sourceNode && targetNode) {
      links.push({
        source: sourceNode.id,
        target: targetNode.id,
        relationship: rel,
      });
    }
  });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Update dimensions
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Create main group
    const g = svg.append('g');

    // Add arrow marker definitions
    svg.append('defs').selectAll('marker')
      .data(['hierarchical', 'sequential', 'default'])
      .join('marker')
      .attr('id', d => `arrowhead-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => {
        if (d === 'hierarchical') return '#3b82f6';
        if (d === 'sequential') return '#10b981';
        return '#94a3b8';
      });

    // Apply layout based on selected type
    let simulation: d3.Simulation<D3Node, D3Link> | null = null;
    
    if (currentLayout === 'force' || currentLayout === 'hybrid') {
      // Force-directed layout
      simulation = d3.forceSimulation<D3Node>(nodes)
        .force('link', d3.forceLink<D3Node, D3Link>(links)
          .id(d => d.id)
          .distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(40));
    } else if (currentLayout === 'tree') {
      // Tree layout for hierarchical structures
      const hierarchy = d3.stratify<D3Node>()
        .id(d => d.id)
        .parentId(d => {
          // Find parent from links
          const parentLink = links.find(l => (l.target as any).id === d.id || l.target === d.id);
          return parentLink ? (typeof parentLink.source === 'string' ? parentLink.source : (parentLink.source as D3Node).id) : null;
        })(nodes);
      
      const treeLayout = d3.tree<D3Node>()
        .size([width - 100, height - 100]);
      
      const root = treeLayout(hierarchy as any);
      
      root.each((d: any) => {
        const node = nodes.find(n => n.id === d.id);
        if (node) {
          node.x = d.x + 50;
          node.y = d.y + 50;
          node.fx = node.x;
          node.fy = node.y;
        }
      });
    } else if (currentLayout === 'flowchart') {
      // Flowchart layout for sequential structures
      const levels: Map<string, number> = new Map();
      const visited = new Set<string>();
      
      // Topological sort to determine levels
      const assignLevel = (nodeId: string, level: number) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        levels.set(nodeId, Math.max(levels.get(nodeId) || 0, level));
        
        const outgoingLinks = links.filter(l => 
          (typeof l.source === 'string' ? l.source : (l.source as D3Node).id) === nodeId
        );
        
        outgoingLinks.forEach(link => {
          const targetId = typeof link.target === 'string' ? link.target : (link.target as D3Node).id;
          assignLevel(targetId, level + 1);
        });
      };
      
      // Start from nodes with no incoming edges
      nodes.forEach(node => {
        const hasIncoming = links.some(l => 
          (typeof l.target === 'string' ? l.target : (l.target as D3Node).id) === node.id
        );
        if (!hasIncoming) {
          assignLevel(node.id, 0);
        }
      });
      
      // Position nodes based on levels
      const maxLevel = Math.max(...Array.from(levels.values()));
      const levelWidth = width / (maxLevel + 1);
      const levelCounts = new Map<number, number>();
      
      nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        const count = levelCounts.get(level) || 0;
        levelCounts.set(level, count + 1);
        
        const nodesAtLevel = nodes.filter(n => levels.get(n.id) === level).length;
        const levelHeight = height / (nodesAtLevel + 1);
        
        node.x = levelWidth * (level + 0.5);
        node.y = levelHeight * (count + 1);
        node.fx = node.x;
        node.fy = node.y;
      });
    }

    // Create links with relationship-aware styling
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => {
        const structureCategory = (d.relationship as any).structure_category;
        
        // Color by structure category
        if (structureCategory === 'hierarchical') {
          return '#3b82f6'; // blue-500
        } else if (structureCategory === 'sequential') {
          return '#10b981'; // green-500
        }
        
        return '#94a3b8'; // gray-400
      })
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => {
        const strength = d.relationship.strength || 0.5;
        return 1 + (strength * 3); // 1-4px based on strength
      })
      .attr('stroke-dasharray', d => {
        const structureCategory = (d.relationship as any).structure_category;
        // Solid for hierarchical, dashed for sequential
        return structureCategory === 'sequential' ? '5,5' : 'none';
      })
      .attr('marker-end', d => {
        const structureCategory = (d.relationship as any).structure_category;
        if (structureCategory === 'hierarchical') return 'url(#arrowhead-hierarchical)';
        if (structureCategory === 'sequential') return 'url(#arrowhead-sequential)';
        return 'url(#arrowhead-default)';
      });

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circles to nodes with structure-aware and exam relevance styling
    node.append('circle')
      .attr('r', d => {
        const relevance = getConceptRelevance(d.concept.exam_relevant);
        const style = getNodeStyle(relevance);
        return 20 * style.scale;
      })
      .attr('fill', d => {
        if (highlightedNodes?.has(d.id)) {
          return '#9333ea'; // purple-600
        }
        return '#a855f7'; // purple-500
      })
      .attr('stroke', d => {
        const relevance = getConceptRelevance(d.concept.exam_relevant);
        const structureType = (d.concept as any).structure_type;
        
        // Priority: exam relevance > structure type
        if (relevance === 'high') {
          return '#f97316'; // orange-500
        } else if (relevance === 'medium') {
          return '#eab308'; // yellow-500
        }
        
        // Structure-aware styling
        if (structureType === 'hierarchical') {
          return '#3b82f6'; // blue-500
        } else if (structureType === 'sequential') {
          return '#10b981'; // green-500
        }
        
        return '#fff';
      })
      .attr('stroke-width', d => {
        const relevance = getConceptRelevance(d.concept.exam_relevant);
        const structureType = (d.concept as any).structure_type;
        
        if (relevance === 'high') return 3;
        if (structureType === 'hierarchical' || structureType === 'sequential') return 3;
        return 2;
      })
      .style('filter', d => {
        const relevance = getConceptRelevance(d.concept.exam_relevant);
        const style = getNodeStyle(relevance);
        
        if (style.shouldGlow) {
          return 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))';
        }
        return 'none';
      })
      .attr('rx', d => {
        // Rectangular for hierarchical, rounded for sequential
        const structureType = (d.concept as any).structure_type;
        return structureType === 'sequential' ? 10 : 0;
      });

    // Add labels to nodes
    node.append('text')
      .text(d => d.concept.name)
      .attr('x', 0)
      .attr('y', 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1f2937')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none');

    // Add interactions
    node
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d.concept);
      })
      .on('mouseenter', (event, d) => {
        onNodeHover?.(d.concept);
        const circle = d3.select(event.currentTarget).select('circle');
        const relevance = getConceptRelevance(d.concept.exam_relevant);
        const style = getNodeStyle(relevance);
        const baseRadius = 20 * style.scale;
        
        circle
          .transition()
          .duration(200)
          .attr('r', baseRadius * 1.25);
        
        // Intensify glow on hover for high relevance
        if (style.shouldGlow) {
          circle.style('filter', 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.9))');
        }
      })
      .on('mouseleave', (event, d) => {
        onNodeHover?.(null);
        const circle = d3.select(event.currentTarget).select('circle');
        const relevance = getConceptRelevance(d.concept.exam_relevant);
        const style = getNodeStyle(relevance);
        const baseRadius = 20 * style.scale;
        
        circle
          .transition()
          .duration(200)
          .attr('r', baseRadius);
        
        // Reset glow
        if (style.shouldGlow) {
          circle.style('filter', 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))');
        }
      });

    // Update positions on simulation tick or immediately for fixed layouts
    const updatePositions = () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    };
    
    if (simulation) {
      simulation.on('tick', updatePositions);
    } else {
      // For fixed layouts, update immediately
      updatePositions();
    }

    // Drag functions
    function dragstarted(event: any, d: D3Node) {
      if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: D3Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: D3Node) {
      if (!event.active && simulation) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation?.stop();
    };
  }, [conceptMap, dimensions, highlightedNodes, onNodeClick, onNodeHover, nodes, links, filterHighRelevance, currentLayout]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleResetView = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Layout Switcher */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 px-1">
            Layout
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant={currentLayout === 'force' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setCurrentLayout('force');
                onLayoutChange?.('force');
              }}
              className="justify-start text-xs"
            >
              Force
            </Button>
            <Button
              variant={currentLayout === 'tree' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setCurrentLayout('tree');
                onLayoutChange?.('tree');
              }}
              className="justify-start text-xs"
            >
              Tree
            </Button>
            <Button
              variant={currentLayout === 'flowchart' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setCurrentLayout('flowchart');
                onLayoutChange?.('flowchart');
              }}
              className="justify-start text-xs"
            >
              Flowchart
            </Button>
            <Button
              variant={currentLayout === 'hybrid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setCurrentLayout('hybrid');
                onLayoutChange?.('hybrid');
              }}
              className="justify-start text-xs"
            >
              Hybrid
            </Button>
          </div>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="bg-white dark:bg-gray-800 shadow-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="bg-white dark:bg-gray-800 shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetView}
            className="bg-white dark:bg-gray-800 shadow-lg"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Exam Relevance Filter */}
      {showExamRelevanceFilter && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterHighRelevance}
              onChange={(e) => setFilterHighRelevance(e.target.checked)}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show High Relevance Only
            </span>
          </label>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg max-w-xs">
        {showExamRelevanceFilter && (
          <>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Exam Relevance
            </h4>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 exam-relevant-glow" />
                <span className="text-xs text-gray-600 dark:text-gray-400">High (Glowing)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-yellow-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-gray-700" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Low</span>
              </div>
            </div>
          </>
        )}
        
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Structure Types
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-purple-500 border-2 border-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Hierarchical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Sequential</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-gray-700" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Unclassified</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Relationships
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Hierarchical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-green-500 border-dashed" style={{borderTop: '2px dashed #10b981', height: 0}} />
              <span className="text-xs text-gray-600 dark:text-gray-400">Sequential</span>
            </div>
          </div>
        </div>
      </div>

      {/* Node count */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-400">
        {nodes.length} concepts
        {filterHighRelevance && ` (${allNodes.length} total)`}
      </div>
    </div>
  );
};
