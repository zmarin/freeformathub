import { useMemo } from 'react';
import type { EscapeStatistics } from '../../lib/syntax/escape-highlighter';

interface EscapeStatisticsPanelProps {
  stats: EscapeStatistics | null;
  originalLength: number;
  processedLength: number;
  processingTime?: number;
  className?: string;
}

export function EscapeStatisticsPanel({
  stats,
  originalLength,
  processedLength,
  processingTime,
  className = '',
}: EscapeStatisticsPanelProps) {
  const sizeChange = useMemo(() => {
    if (originalLength === 0) return 0;
    return ((processedLength - originalLength) / originalLength) * 100;
  }, [originalLength, processedLength]);

  const charactersPerSecond = useMemo(() => {
    if (!processingTime || processingTime === 0) return 0;
    return Math.round((originalLength / processingTime) * 1000);
  }, [originalLength, processingTime]);

  if (!stats && originalLength === 0) {
    return null;
  }

  return (
    <div className={`escape-stats-panel ${className}`}>
      <div className="escape-stats-panel__header">
        <h3 className="escape-stats-panel__title">Statistics & Analysis</h3>
      </div>

      <div className="escape-stats-panel__content">
        {/* Overview Metrics */}
        <div className="escape-stats-panel__section">
          <div className="escape-stats-panel__metric-grid">
            <div className="escape-stats-panel__metric">
              <div className="escape-stats-panel__metric-label">Original Size</div>
              <div className="escape-stats-panel__metric-value">{originalLength.toLocaleString()}</div>
              <div className="escape-stats-panel__metric-unit">characters</div>
            </div>

            <div className="escape-stats-panel__metric">
              <div className="escape-stats-panel__metric-label">Processed Size</div>
              <div className="escape-stats-panel__metric-value">{processedLength.toLocaleString()}</div>
              <div className="escape-stats-panel__metric-unit">characters</div>
            </div>

            <div className="escape-stats-panel__metric">
              <div className="escape-stats-panel__metric-label">Size Change</div>
              <div className={`escape-stats-panel__metric-value ${sizeChange > 0 ? 'text-warning' : 'text-success'}`}>
                {sizeChange > 0 ? '+' : ''}{sizeChange.toFixed(1)}%
              </div>
              <div className="escape-stats-panel__metric-unit">
                {Math.abs(processedLength - originalLength)} chars
              </div>
            </div>

            {processingTime !== undefined && (
              <div className="escape-stats-panel__metric">
                <div className="escape-stats-panel__metric-label">Processing Speed</div>
                <div className="escape-stats-panel__metric-value">{charactersPerSecond.toLocaleString()}</div>
                <div className="escape-stats-panel__metric-unit">chars/sec</div>
              </div>
            )}
          </div>
        </div>

        {/* Escape Sequence Breakdown */}
        {stats && stats.totalEscapes > 0 && (
          <>
            <div className="escape-stats-panel__divider" />

            <div className="escape-stats-panel__section">
              <h4 className="escape-stats-panel__section-title">Escape Sequences</h4>

              <div className="escape-stats-panel__metric-grid">
                <div className="escape-stats-panel__metric">
                  <div className="escape-stats-panel__metric-label">Total Escapes</div>
                  <div className="escape-stats-panel__metric-value">{stats.totalEscapes}</div>
                </div>

                <div className="escape-stats-panel__metric">
                  <div className="escape-stats-panel__metric-label">Simple Escapes</div>
                  <div className="escape-stats-panel__metric-value">{stats.simpleEscapes}</div>
                  <div className="escape-stats-panel__metric-unit">quotes, newlines</div>
                </div>

                <div className="escape-stats-panel__metric">
                  <div className="escape-stats-panel__metric-label">Complex Escapes</div>
                  <div className="escape-stats-panel__metric-value">{stats.complexEscapes}</div>
                  <div className="escape-stats-panel__metric-unit">unicode, hex</div>
                </div>
              </div>

              {/* Type Distribution */}
              {Object.keys(stats.byType).length > 0 && (
                <div className="escape-stats-panel__type-dist">
                  <div className="escape-stats-panel__type-dist-label">Distribution by Type:</div>
                  <div className="escape-stats-panel__tags">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="escape-stats-panel__tag">
                        <span className="escape-stats-panel__tag-name">{type}</span>
                        <span className="escape-stats-panel__tag-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Sequences */}
              {stats.commonEscapes.length > 0 && (
                <div className="escape-stats-panel__common-escapes">
                  <div className="escape-stats-panel__common-escapes-label">Most Common:</div>
                  <div className="escape-stats-panel__escape-list">
                    {stats.commonEscapes.slice(0, 5).map((escape, index) => (
                      <div key={index} className="escape-stats-panel__escape-item">
                        <code className="escape-stats-panel__escape-code">{escape.sequence}</code>
                        <span className="escape-stats-panel__escape-description">{escape.description}</span>
                        <span className="escape-stats-panel__escape-count">×{escape.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
