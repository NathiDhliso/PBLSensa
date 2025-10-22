import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { ConceptMap, Concept, Relationship } from '../../types/conceptMap';
import { Button } from '../ui/Button';

interface ConceptMapVisualizationProps {
  conceptMap: ConceptMap;
  onNodeClick?: (concept: Concept) => void;
  onNodeHover?: (concept: Concept | null) => void;
  highlightedNodes?: Set<string>;
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
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  // Extract nodes and links from concept map
  const nodes: D3Node[] = conceptMap.chapters.flatMap((chapter: any) =>
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

    // Create force simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

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

    // Add circles to nodes
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => {
        if (highlightedNodes?.has(d.id)) {
          return '#9333ea'; // purple-600
        }
        return '#a855f7'; // purple-500
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

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
        d3.select(event.currentTarget)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', 25);
      })
      .on('mouseleave', (event) => {
        onNodeHover?.(null);
        d3.select(event.currentTarget)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', 20);
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: D3Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: D3Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: D3Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [conceptMap, dimensions, highlightedNodes, onNodeClick, onNodeHover, nodes, links]);

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

      {/* Node count */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-400">
        {nodes.length} concepts
      </div>
    </div>
  );
};
