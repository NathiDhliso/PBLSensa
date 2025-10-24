import React, { useEffect, useState } from 'react';

interface V7Metrics {
    parse_method: string;
    parse_duration_ms: number;
    concepts_extracted: number;
    high_confidence_concepts: number;
    confidence_distribution: {
        high: number;
        medium: number;
        low: number;
    };
    relationships_detected: number;
    cache_hit: boolean;
    total_cost: number;
    accuracy_improvement: string;
}

interface V7MetricsDashboardProps {
    documentId: string;
}

export const V7MetricsDashboard: React.FC<V7MetricsDashboardProps> = ({
    documentId
}) => {
    const [metrics, setMetrics] = useState<V7Metrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch(`/api/v7/documents/${documentId}/metrics`);
                if (!response.ok) throw new Error('Failed to fetch metrics');
                const data = await response.json();
                setMetrics(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, [documentId]);

    if (isLoading) {
        return (
            <div className="metrics-loading">
                <div className="spinner"></div>
                <p>Loading metrics...</p>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="metrics-error">
                <p>Failed to load metrics</p>
            </div>
        );
    }

    const getMethodDisplay = (method: string) => {
        const displays = {
            llamaparse: { icon: '🦙', label: 'LlamaParse', color: '#a855f7' },
            textract: { icon: '📄', label: 'Textract', color: '#3b82f6' },
            pdfplumber: { icon: '📖', label: 'PDFPlumber', color: '#6b7280' }
        };

        return displays[method as keyof typeof displays] || displays.pdfplumber;
    };

    const methodDisplay = getMethodDisplay(metrics.parse_method);

    return (
        <div className="v7-metrics-dashboard">
            <h3 className="dashboard-title">Processing Metrics</h3>

            <div className="metrics-grid">
                {/* Parse method */}
                <div className="metric-card">
                    <div className="metric-label">Parse Method</div>
                    <div
                        className="metric-value method-badge"
                        style={{ backgroundColor: methodDisplay.color }}
                    >
                        <span className="method-icon">{methodDisplay.icon}</span>
                        <span>{methodDisplay.label}</span>
                    </div>
                </div>

                {/* Concepts found */}
                <div className="metric-card">
                    <div className="metric-label">Concepts Extracted</div>
                    <div className="metric-value">{metrics.concepts_extracted}</div>
                    <div className="metric-breakdown">
                        <span className="breakdown-item high">
                            <span className="dot"></span>
                            {metrics.confidence_distribution.high} high confidence
                        </span>
                        <span className="breakdown-item medium">
                            <span className="dot"></span>
                            {metrics.confidence_distribution.medium} medium
                        </span>
                        <span className="breakdown-item low">
                            <span className="dot"></span>
                            {metrics.confidence_distribution.low} low
                        </span>
                    </div>
                </div>

                {/* Relationships */}
                <div className="metric-card">
                    <div className="metric-label">Relationships Detected</div>
                    <div className="metric-value">{metrics.relationships_detected}</div>
                </div>

                {/* Accuracy improvement */}
                <div className="metric-card highlight">
                    <div className="metric-label">Accuracy Improvement</div>
                    <div className="metric-value success">
                        {metrics.accuracy_improvement}
                    </div>
                    <div className="metric-note">vs. baseline</div>
                </div>

                {/* Processing time */}
                <div className="metric-card">
                    <div className="metric-label">Processing Time</div>
                    <div className="metric-value">
                        {(metrics.parse_duration_ms / 1000).toFixed(1)}s
                    </div>
                </div>

                {/* Cost */}
                <div className="metric-card">
                    <div className="metric-label">Processing Cost</div>
                    <div className="metric-value">${metrics.total_cost.toFixed(2)}</div>
                    {metrics.cache_hit && (
                        <div className="cache-badge">
                            <span className="cache-icon">⚡</span>
                            Loaded from cache
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .v7-metrics-dashboard {
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .dashboard-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 1.5rem;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .metric-card {
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .metric-card.highlight {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-color: #fbbf24;
        }
        
        .metric-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
        }
        
        .metric-value.success {
          color: #10b981;
        }
        
        .metric-value.method-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: white;
          font-size: 1rem;
        }
        
        .method-icon {
          font-size: 1.5rem;
        }
        
        .metric-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.75rem;
        }
        
        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }
        
        .breakdown-item .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .breakdown-item.high {
          color: #10b981;
        }
        
        .breakdown-item.high .dot {
          background: #10b981;
        }
        
        .breakdown-item.medium {
          color: #f59e0b;
        }
        
        .breakdown-item.medium .dot {
          background: #f59e0b;
        }
        
        .breakdown-item.low {
          color: #ef4444;
        }
        
        .breakdown-item.low .dot {
          background: #ef4444;
        }
        
        .metric-note {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        
        .cache-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: #10b981;
          color: white;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .cache-icon {
          font-size: 1rem;
        }
        
        .metrics-loading,
        .metrics-error {
          text-align: center;
          padding: 2rem;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #a855f7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};
