import React, { useState, useCallback } from 'react';

interface RelatedTool {
  id: string;
  name: string;
  url: string;
  description: string;
  icon: string;
}

interface ToolHandoffProps {
  currentToolId: string;
  outputData: string;
  relatedTools: RelatedTool[];
  className?: string;
}

export function ToolHandoff({ currentToolId, outputData, relatedTools, className = '' }: ToolHandoffProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToolRedirect = useCallback((tool: RelatedTool) => {
    // Store the current output data for the next tool
    localStorage.setItem('tool-handoff-data', outputData);
    localStorage.setItem('tool-handoff-source', currentToolId);
    localStorage.setItem('tool-handoff-timestamp', Date.now().toString());

    // Navigate to the selected tool
    window.location.href = tool.url;
  }, [outputData, currentToolId]);

  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <div className={`tool-handoff ${className}`} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: 'var(--space-md) var(--space-lg)',
          fontSize: '0.875rem'
        }}
        title="Send output to related tools"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
        Send To
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--space-sm)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '280px',
              maxWidth: '320px',
              zIndex: 999,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: 'var(--space-lg) var(--space-lg) var(--space-md)' }}>
              <h3 style={{
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-md)'
              }}>
                Related Tools
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4
              }}>
                Continue working with your JSON data using these related tools:
              </p>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {relatedTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolRedirect(tool)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-md) var(--space-lg)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    borderBottom: '1px solid var(--color-border-light)'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'var(--color-surface-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                    <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>{tool.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--space-xs)'
                      }}>
                        {tool.name}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.3
                      }}>
                        {tool.description}
                      </div>
                    </div>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <div style={{
              padding: 'var(--space-md) var(--space-lg)',
              backgroundColor: 'var(--color-surface-secondary)',
              borderTop: '1px solid var(--color-border-light)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)'
              }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                Your data will be automatically loaded
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}