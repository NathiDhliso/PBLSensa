import React, { useState, useEffect } from 'react';
import './V7ProcessingStatus.css';

interface ProcessingStatus {
  status: string;
  message: string;
  progress: number;
  estimated_remaining: number;
  parse_method?: string;
}

interface V7ProcessingStatusProps {
  documentId: string;
  onComplete: () => void;
}

export const V7ProcessingStatus: React.FC<V7ProcessingStatusProps> = ({
  documentId,
  onComplete
}) => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  
  useEffect(() => {
    // Poll for status updates
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v7/documents/${documentId}/status`);
        const data = await response.json();
        setStatus(data);
        
        if (data.progress === 100) {
          clearInterval(interval);
          onComplete();
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [documentId, onComplete]);
  
  if (!status) {
    return (
      <div className="v7-processing-status loading">
        <div className="spinner"></div>
        <p>Initializing...</p>
      </div>
    );
  }
  
  const getMethodBadge = (method: string) => {
    const badges = {
      llamaparse: { icon: '🦙', label: 'LlamaParse', color: '#a855f7' },
      textract: { icon: '📄', label: 'Textract (OCR)', color: '#3b82f6' },
      pdfplumber: { icon: '📖', label: 'PDFPlumber', color: '#6b7280' }
    };
    
    return badges[method as keyof typeof badges] || badges.pdfplumber;
  };
  
  const badge = status.parse_method ? getMethodBadge(status.parse_method) : null;
  
  return (
    <div className="v7-processing-status">
      {/* Progress bar with Sensa gradient */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{
              width: `${status.progress}%`,
              background: 'linear-gradient(90deg, #a855f7, #ec4899)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        <div className="progress-text">{status.progress}%</div>
      </div>
      
      {/* Current step */}
      <div className="status-message">
        <span className="status-icon">
          {status.progress < 100 ? '⚙️' : '✅'}
        </span>
        <span className="status-text">{status.message}</span>
      </div>
      
      {/* Method badge */}
      {badge && (
        <div 
          className="method-badge"
          style={{ backgroundColor: badge.color }}
        >
          <span className="badge-icon">{badge.icon}</span>
          <span className="badge-label">{badge.label}</span>
        </div>
      )}
      
      {/* Estimated time */}
      {status.estimated_remaining > 0 && (
        <div className="estimated-time">
          <span className="time-icon">⏱️</span>
          <span>About {Math.ceil(status.estimated_remaining / 60)} minutes remaining</span>
        </div>
      )}
      

    </div>
  );
};
