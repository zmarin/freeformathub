import { useState, useCallback } from 'react';
import { copyToClipboard, downloadFile } from '../../lib/utils';

interface OutputPanelProps {
  value: string;
  label?: string;
  error?: string;
  isLoading?: boolean;
  className?: string;
  syntax?: string;
  downloadFilename?: string;
  downloadContentType?: string;
  showLineNumbers?: boolean;
  onOpenInNewTab?: () => void;
  openButtonLabel?: string;
}

export function OutputPanel({
  value,
  label = 'Output',
  error,
  isLoading = false,
  className = '',
  syntax,
  downloadFilename = 'output.txt',
  downloadContentType = 'text/plain',
  showLineNumbers = false,
  onOpenInNewTab,
  openButtonLabel = 'Open in New Tab',
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  }, [value]);

  const handleDownload = useCallback(() => {
    downloadFile(value, downloadFilename, downloadContentType);
  }, [value, downloadFilename, downloadContentType]);

  const lines = showLineNumbers ? value.split('\n') : [];
  const panelClassName = ['tool-panel', className].filter(Boolean).join(' ');

  return (
    <div className={panelClassName}>
      <div className="tool-panel__header">
        <div className="tool-panel__title">
          <span>{label}</span>
          {value && !error && (
            <span className="tool-panel__meta">{value.length} characters</span>
          )}
          {error && (
            <span className="tool-panel__badge tool-panel__badge--danger">Error</span>
          )}
        </div>

        {value && !error && !isLoading && (
          <div className="tool-panel__actions">
            <button
              onClick={handleCopy}
              className="btn btn-primary btn-sm"
              type="button"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              className="btn btn-outline btn-sm"
              type="button"
            >
              Download
            </button>

            {onOpenInNewTab && (
              <button
                onClick={onOpenInNewTab}
                className="btn btn-outline btn-sm"
                type="button"
              >
                {openButtonLabel}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="tool-panel__body">
        {isLoading ? (
          <div className="tool-panel__loader">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Processing...</span>
          </div>
        ) : error ? (
          <div className="tool-panel__message tool-panel__message--error">
            <svg
              fill="currentColor"
              viewBox="0 0 20 20"
              style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.15rem' }}
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>Error</p>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{error}</p>
            </div>
          </div>
        ) : value ? (
          <div className="tool-panel__content-wrapper">
            {showLineNumbers && (
              <div className="tool-panel__line-numbers" aria-hidden="true">
                {lines.map((_, index) => (
                  <span key={index + 1}>{index + 1}</span>
                ))}
              </div>
            )}
            <pre className={`tool-panel__content${showLineNumbers ? ' tool-panel__content--with-lines' : ''}`}>
              <code>{value}</code>
            </pre>
          </div>
        ) : (
          <div className="tool-panel__empty">
            <div className="tool-panel__empty-icon" aria-hidden="true">📄</div>
            <p>Output will appear here</p>
          </div>
        )}
      </div>

      {(syntax || (value && !error)) && (
        <div className="tool-panel__status">
          <div className="tool-panel__status-group">
            {syntax && <span>Format: {syntax}</span>}
            {value && !error && <span>Ready</span>}
          </div>
          {value && !error && (
            <div className="tool-panel__status-group">
              <span>{value.split('\n').length} lines</span>
              <span>{value.split(' ').filter(w => w).length} words</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
