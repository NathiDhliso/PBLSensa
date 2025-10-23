import React, { useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { zoom as d3Zoom } from 'd3-zoom';
import { drag as d3Drag } from 'd3-drag';
import { interpolateWarm } from 'd3-scale-chromatic';
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { ConceptMap, Concept } from '../../types/conceptMap';

interface AnalogyNode {
  id: string;
  analogy_id: string;
  concept_id: string;
  experience_text: string;
  strength: number;
  tags: string[];
}

interface SensaLearnMapProps {
  conceptMap: ConceptMap;
  analogies: AnalogyNode[];
  onConceptClick?: (concept: Concept) => void;
  onAnalogyClick?: (analogy: AnalogyNode) => void;
  onConceptHover?: (concept: Concept | null) => void;
  onAnalogyHover?: (analogy: AnalogyNode | null) => void;
  mode?: 'split' | 'overlay' | 'tabbed';
}

interface D3ConceptNode extends SimulationNodeDatum {
  id: string;
  type: 'concept';
  concept: Concept;
  x?: number;
  y?: number;
}

interface D3AnalogyNode extends SimulationNodeDatum {
  id: string;
  type: 'analogy';
  analogy: AnalogyNode;
  x?: number;
  y?: number;
}

type D3Node = D3ConceptNode | D3AnalogyNode;

interface D3Link extends SimulationLinkDatum<D3Node> {
  source: D3Node | string;
  target: D3Node | string;
  strength: number;
}

const SensaLearnMapComponent = ({
  conceptMap,
  analogies,
  onConceptClick,
  onAnalogyClick,
  onConceptHover,
  onAnalogyHover,
  // mode = 'overlay', // Reserved for future implementation
}: SensaLearnMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Extract concept nodes (PBL nodes - read-only, blue)
  const conceptNodes: D3ConceptNode[] = conceptMap.chapters.flatMap((chapter: any) =>
    chapter.keywords.map((keyword: any) => ({
      id: `concept-${chapter.chapter_number}-${keyword.term}`,
      type: 'concept' as const,
      concept: {
        id: `${chapter.chapter_number}-${keyword.term}`,
        name: keyword.term,
        description: keyword.definition,
        source_chapter: chapter.title,
        is_primary: keyword.is_primary,
      } as Concept,
    }))
  );

  // Extract analogy nodes (warm colors, editable)
  const analogyNodes: D3AnalogyNode[] = analogies.map(analogy => ({
    id: `analogy-${analogy.analogy_id}`,
    type: 'analogy' as const,
    analogy,
  }));

  const allNodes: D3Node[] = [...conceptNodes, ...analogyNodes];

  // Create links between concepts and their analogies
  const links: D3Link[] = analogies.map(analogy => ({
    source: `concept-${analogy.concept_id}`,
    target: `analogy-${analogy.analogy_id}`,
    strength: analogy.strength,
  }));

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

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
    if (!svgRef.current || allNodes.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Create zoom behavior
    const zoom = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create main group
    const g = svg.append('g');

    // Create force simulation
    const simulation = forceSimulation<D3Node>(allNodes)
      .force('link', forceLink<D3Node, D3Link>(links)
        .id(d => d.id)
        .distance(150))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collision', forceCollide().radius(50));

    // Create connection lines (dashed)
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', d => 1 + (d.strength * 2))
      .attr('stroke-dasharray', '5,5');

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(allNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3Drag<SVGGElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circles/shapes to nodes
    node.each(function(d) {
      const nodeGroup = select(this);
      
      if (d.type === 'concept') {
        // PBL concept nodes - blue, read-only
        nodeGroup.append('circle')
          .attr('r', 20)
          .attr('fill', '#3b82f6') // blue-500
          .attr('stroke', '#1e40af') // blue-800
          .attr('stroke-width', 2)
          .attr('opacity', 0.7);
        
        nodeGroup.append('text')
          .text(d.concept.name)
          .attr('x', 0)
          .attr('y', 35)
          .attr('text-anchor', 'middle')
          .attr('fill', '#1f2937')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .style('pointer-events', 'none');
      } else {
        // Analogy nodes - warm colors based on strength
        const strength = d.analogy.strength;
        const warmColor = interpolateWarm(strength / 5); // 1-5 scale
        
        nodeGroup.append('circle')
          .attr('r', 25)
          .attr('fill', warmColor)
          .attr('stroke', '#dc2626') // red-600
          .attr('stroke-width', 2);
        
        // Add tag icon or first letter
        nodeGroup.append('text')
          .text(d.analogy.tags[0]?.charAt(0).toUpperCase() || 'A')
          .attr('x', 0)
          .attr('y', 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .style('pointer-events', 'none');
        
        // Add label below
        nodeGroup.append('text')
          .text(d.analogy.tags[0] || 'Analogy')
          .attr('x', 0)
          .attr('y', 40)
          .attr('text-anchor', 'middle')
          .attr('fill', '#1f2937')
          .attr('font-size', '10px')
          .style('pointer-events', 'none');
      }
    });

    // Add interactions
    node
      .on('click', (_event, d) => {
        _event.stopPropagation();
        if (d.type === 'concept') {
          onConceptClick?.(d.concept);
        } else {
          onAnalogyClick?.(d.analogy);
        }
      })
      .on('mouseenter', (_event, d) => {
        if (d.type === 'concept') {
          onConceptHover?.(d.concept);
        } else {
          onAnalogyHover?.(d.analogy);
        }
        
        // Highlight connected nodes
        const connectedIds = new Set<string>();
        links.forEach(l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          
          if (sourceId === d.id) connectedIds.add(targetId);
          if (targetId === d.id) connectedIds.add(sourceId);
        });
        
        // Dim non-connected nodes
        node.style('opacity', n => connectedIds.has(n.id) || n.id === d.id ? 1 : 0.3);
        link.style('opacity', l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          return sourceId === d.id || targetId === d.id ? 0.8 : 0.1;
        });
      })
      .on('mouseleave', () => {
        onConceptHover?.(null);
        onAnalogyHover?.(null);
        
        // Reset opacity
        node.style('opacity', 1);
        link.style('opacity', 0.4);
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
  }, [conceptMap, analogies, dimensions, onConceptClick, onAnalogyClick, onConceptHover, onAnalogyHover, allNodes, links]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Sensa Learn View
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 opacity-70" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Concepts (PBL)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Your Analogies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Connections</span>
          </div>
        </div>
      </div>

      {/* Node count */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-400">
        {conceptNodes.length} concepts • {analogyNodes.length} analogies
      </div>
    </div>
  );
};

export const SensaLearnMap = React.memo(
  SensaLearnMapComponent,
  (prevProps, nextProps) => {
    // Custom comparison for performance
    return (
      prevProps.conceptMap.course_id === nextProps.conceptMap.course_id &&
      prevProps.analogies.length === nextProps.analogies.length &&
      prevProps.conceptMap.chapters.length === nextProps.conceptMap.chapters.length
    );
  }
);
