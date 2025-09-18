import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Play,
  Trash2,
  Code2,
  Eye,
  Copy,
  Download,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  Clock,
  FileText
} from 'lucide-react';
import { processHtmlVisualizer, HTML_TEMPLATES, type HtmlVisualizerOptions, type HtmlVisualizerResult } from '../../../tools/web/html-visualizer';

interface HtmlVisualizerProps {
  className?: string;
}

export const HtmlVisualizer: React.FC<HtmlVisualizerProps> = ({ className = '' }) => {
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [javascript, setJavascript] = useState('');
  const [options, setOptions] = useState<HtmlVisualizerOptions>({
    autoRun: true,
    theme: 'light',
    layout: 'horizontal',
    showLineNumbers: true,
    wrapLines: false
  });

  const [result, setResult] = useState<HtmlVisualizerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showExamples, setShowExamples] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Process HTML with debouncing
  const processHtml = useCallback(() => {
    if (!html && !css && !javascript) {
      setResult(null);
      return;
    }

    setIsLoading(true);

    const processedResult = processHtmlVisualizer({
      html,
      css,
      javascript,
      options
    });

    setResult(processedResult);
    setIsLoading(false);
  }, [html, css, javascript, options]);

  // Auto-run with debouncing
  useEffect(() => {
    if (options.autoRun) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(processHtml, 300);
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [html, css, javascript, options.autoRun, processHtml]);

  const handleRunPreview = useCallback(() => {
    processHtml();
  }, [processHtml]);

  const handleClearAll = useCallback(() => {
    setHtml('');
    setCss('');
    setJavascript('');
    setResult(null);
  }, []);

  const handleLoadTemplate = useCallback((templateKey: keyof typeof HTML_TEMPLATES) => {
    const template = HTML_TEMPLATES[templateKey];
    setHtml(template.html);
    setCss(template.css);
    setJavascript(template.javascript);
    setShowExamples(false);
  }, []);

  const handleCopyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (result?.previewHtml) {
      const blob = new Blob([result.previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'html-preview.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [result]);

  const handleOpenInNewWindow = useCallback(() => {
    if (result?.previewHtml) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(result.previewHtml);
        newWindow.document.close();
      }
    }
  }, [result]);

  const getPreviewWidth = useMemo(() => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  }, [previewMode]);

  return (
    <div className={`html-visualizer-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-lg)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <button
              onClick={handleRunPreview}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
            >
              <Play size={14} />
              Run Preview
            </button>

            <button
              onClick={handleClearAll}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
            >
              <Trash2 size={14} />
              Clear All
            </button>

            <button
              onClick={() => setShowExamples(!showExamples)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
            >
              <Code2 size={14} />
              Templates
            </button>
          </div>

          {/* Preview Mode Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Preview:
            </span>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`btn ${previewMode === 'desktop' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.5rem' }}
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`btn ${previewMode === 'tablet' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.5rem' }}
            >
              <Tablet size={14} />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`btn ${previewMode === 'mobile' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.5rem' }}
            >
              <Smartphone size={14} />
            </button>
          </div>

          {/* Stats Display */}
          {result?.stats && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-lg)',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              marginLeft: 'auto'
            }}>
              <span>HTML: {result.stats.htmlLines} lines</span>
              <span>CSS: {result.stats.cssLines} lines</span>
              <span>JS: {result.stats.jsLines} lines</span>
              <span>Size: {(result.stats.totalSize / 1024).toFixed(1)}KB</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <Clock size={12} />
                {result.stats.processingTime}ms
              </span>
            </div>
          )}

          {/* Auto-run toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={options.autoRun}
              onChange={(e) => setOptions(prev => ({ ...prev, autoRun: e.target.checked }))}
            />
            Auto-run
          </label>
        </div>
      </div>

      {/* Templates Section */}
      {showExamples && (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-xl)'
        }}>
          <h3 style={{
            margin: '0 0 var(--space-lg) 0',
            fontSize: '1rem',
            color: 'var(--color-text-primary)'
          }}>
            Quick Start Templates
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {Object.entries(HTML_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => handleLoadTemplate(key as keyof typeof HTML_TEMPLATES)}
                className="card"
                style={{
                  padding: 'var(--space-lg)',
                  textAlign: 'left',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h4 style={{
                  margin: '0 0 var(--space-sm) 0',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem'
                }}>
                  {template.name}
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.4'
                }}>
                  Click to load this example
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: options.layout === 'horizontal' ? '1fr 1fr' : '1fr',
        minHeight: '600px'
      }} className="md:grid-cols-1">

        {/* Code Editors Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: options.layout === 'horizontal' ? '1px solid var(--color-border)' : 'none',
          borderBottom: options.layout === 'vertical' ? '1px solid var(--color-border)' : 'none'
        }}>

          {/* HTML Editor */}
          <div style={{ flex: 1, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-md) var(--space-lg)',
              backgroundColor: 'var(--color-surface-secondary)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}>
                HTML
              </span>
              <button
                onClick={() => handleCopyToClipboard(html)}
                className="btn btn-outline"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                <Copy size={12} />
              </button>
            </div>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Enter HTML code here..."
              style={{
                width: '100%',
                height: '200px',
                border: 'none',
                padding: 'var(--space-lg)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>

          {/* CSS Editor */}
          <div style={{ flex: 1, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-md) var(--space-lg)',
              backgroundColor: 'var(--color-surface-secondary)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}>
                CSS
              </span>
              <button
                onClick={() => handleCopyToClipboard(css)}
                className="btn btn-outline"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                <Copy size={12} />
              </button>
            </div>
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              placeholder="Enter CSS styles here..."
              style={{
                width: '100%',
                height: '200px',
                border: 'none',
                padding: 'var(--space-lg)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>

          {/* JavaScript Editor */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-md) var(--space-lg)',
              backgroundColor: 'var(--color-surface-secondary)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}>
                JavaScript
              </span>
              <button
                onClick={() => handleCopyToClipboard(javascript)}
                className="btn btn-outline"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                <Copy size={12} />
              </button>
            </div>
            <textarea
              value={javascript}
              onChange={(e) => setJavascript(e.target.value)}
              placeholder="Enter JavaScript code here..."
              style={{
                width: '100%',
                height: '200px',
                border: 'none',
                padding: 'var(--space-lg)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-md) var(--space-lg)',
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <Eye size={14} />
              Live Preview ({previewMode})
            </span>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {result?.previewHtml && (
                <>
                  <button
                    onClick={handleDownload}
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    <Download size={12} />
                  </button>
                  <button
                    onClick={handleOpenInNewWindow}
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    <ExternalLink size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Errors and Warnings */}
          {result?.errors && result.errors.length > 0 && (
            <div style={{
              padding: 'var(--space-lg)',
              backgroundColor: 'var(--color-danger-light)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              {result.errors.map((error, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-sm)',
                  color: 'var(--color-danger)',
                  fontSize: '0.875rem'
                }}>
                  <AlertTriangle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  {error}
                </div>
              ))}
            </div>
          )}

          {result?.warnings && result.warnings.length > 0 && (
            <div style={{
              padding: 'var(--space-lg)',
              backgroundColor: 'var(--color-warning-light)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              {result.warnings.map((warning, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-sm)',
                  color: 'var(--color-warning)',
                  fontSize: '0.875rem'
                }}>
                  <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Preview Iframe */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: previewMode !== 'desktop' ? 'var(--space-xl)' : '0',
            backgroundColor: previewMode !== 'desktop' ? '#f0f0f0' : 'transparent'
          }}>
            {isLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: 'var(--color-text-secondary)'
              }}>
                <div className="loading-spinner" style={{ marginRight: 'var(--space-sm)' }} />
                Processing...
              </div>
            ) : result?.previewHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={result.previewHtml}
                title="HTML Preview"
                sandbox="allow-scripts allow-forms allow-modals"
                style={{
                  width: getPreviewWidth,
                  height: '100%',
                  minHeight: '400px',
                  border: previewMode !== 'desktop' ? '1px solid var(--color-border)' : 'none',
                  borderRadius: previewMode !== 'desktop' ? 'var(--radius-lg)' : '0',
                  backgroundColor: 'var(--color-surface)'
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                <div>
                  <FileText size={48} style={{ marginBottom: 'var(--space-lg)', opacity: 0.5 }} />
                  <p>Start typing HTML, CSS, or JavaScript to see the live preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Examples and Help */}
      <details className="group" style={{ marginTop: 'var(--space-xl)' }}>
        <summary style={{
          cursor: 'pointer',
          padding: 'var(--space-lg)',
          backgroundColor: 'var(--color-surface-secondary)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
          <span style={{ fontWeight: 600 }}>Usage Examples & Tips</span>
        </summary>

        <div style={{ padding: 'var(--space-xl)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-xl)'
          }}>
            <div>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-md)' }}>
                Getting Started
              </h4>
              <ul style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <li>Use the template buttons for quick examples</li>
                <li>Enable auto-run for real-time updates</li>
                <li>Try different preview modes for responsive testing</li>
                <li>Click the external link icon to open in a new window</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-md)' }}>
                Security Features
              </h4>
              <ul style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <li>All code runs in a sandboxed iframe</li>
                <li>No external network requests allowed</li>
                <li>Safe for testing untrusted code snippets</li>
                <li>Everything processes locally in your browser</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-md)' }}>
                Tips & Tricks
              </h4>
              <ul style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <li>Use console.log() to debug JavaScript</li>
                <li>Include external libraries via CDN links</li>
                <li>Test responsive design with device presets</li>
                <li>Download complete HTML files for sharing</li>
              </ul>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};