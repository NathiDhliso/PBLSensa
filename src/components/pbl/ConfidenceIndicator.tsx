import React from 'react';
import './ConfidenceIndicator.css';

interface ConfidenceIndicatorProps {
  confidence: number;
  methodsFound?: number;
  size?: 'small' | 'medium' | 'large';
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  methodsFound,
  size = 'medium'
}) => {
  const getColor = (conf: number): string => {
    if (conf > 0.7) return '#10b981'; // Green
    if (conf > 0.5) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };
  
  const getLabel = (conf: number): string => {
    if (conf > 0.7) return 'High';
    if (conf > 0.5) return 'Medium';
    return 'Low';
  };
  
  const sizeClasses = {
    small: 'confidence-small',
    medium: 'confidence-medium',
    large: 'confidence-large'
  };
  
  const color = getColor(confidence);
  const label = getLabel(confidence);
  
  return (
    <div className={`confidence-indicator ${sizeClasses[size]}`}>
      <div className="confidence-bar-container">
        <div 
          className="confidence-bar"
          style={{
            width: `${confidence * 100}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="confidence-label" style={{ color }}>
        <span className="label-text">{label}</span>
        {methodsFound && (
          <span className="methods-count">({methodsFound}/3 methods)</span>
        )}
      </div>

    </div>
  );
};
