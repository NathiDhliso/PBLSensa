import React from 'react';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  strength: number;
  label?: string;
  highlighted?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  strength,
  label,
  highlighted = false,
}) => {
  // Calculate midpoint for label
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Calculate line thickness based on strength (1-5 scale)
  const strokeWidth = 1 + (strength * 1.5); // 1-8.5px
  
  // Calculate opacity
  const opacity = highlighted ? 0.9 : 0.4;
  
  // Determine color based on strength
  const getStrokeColor = () => {
    if (strength >= 4) return '#f97316'; // orange-500
    if (strength >= 3) return '#eab308'; // yellow-500
    return '#94a3b8'; // gray-400
  };

  return (
    <g className="connection-line">
      {/* Main line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={getStrokeColor()}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        strokeDasharray="5,5"
        className="transition-all duration-200"
      />
      
      {/* Hover target (invisible, wider) */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
      />
      
      {/* Label */}
      {label && (
        <g>
          {/* Background for label */}
          <rect
            x={midX - 30}
            y={midY - 10}
            width={60}
            height={20}
            fill="white"
            fillOpacity={0.9}
            rx={4}
            className="dark:fill-gray-800"
          />
          
          {/* Label text */}
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="500"
            fill="#6b7280"
            className="dark:fill-gray-400 pointer-events-none"
          >
            {label}
          </text>
        </g>
      )}
      
      {/* Strength indicator tooltip on hover */}
      <title>
        Connection strength: {strength.toFixed(1)}/5.0
        {label && ` • ${label}`}
      </title>
    </g>
  );
};

// SVG-based ConnectionLine for use in D3 visualizations
export const createConnectionLinePath = (
  from: { x: number; y: number },
  to: { x: number; y: number }
): string => {
  // Create a curved path for more organic look
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Control point for curve
  const controlX = from.x + dx / 2 + dy * 0.2;
  const controlY = from.y + dy / 2 - dx * 0.2;
  
  return `M ${from.x},${from.y} Q ${controlX},${controlY} ${to.x},${to.y}`;
};
