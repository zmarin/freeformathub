import { useState, useCallback } from 'react';
import { deduplicateLines, type LineDeduplicatorConfig, type DeduplicationStats } from '../../../tools/text/line-deduplicator';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard, downloadFile } from '../../../lib/utils';

interface LineDeduplicatorProps {
  className?: string;
}

const DEFAULT_CONFIG: LineDeduplicatorConfig = {
  caseSensitive: true,
  trimWhitespace: true,
  removeEmptyLines: true,
  sortOutput: false,
  sortOrder: 'original',
  preserveOrder: true,
  onlyDuplicates: false,
  onlyUnique: false,
  showStats: true,
};

export function LineDeduplicator({ className = '' }: LineDeduplicatorProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<LineDeduplicatorConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<string>('');
  const [stats, setStats] = useState<DeduplicationStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToHistory } = useToolStore();

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      alert('Please enter text to process.');
      return;
    }

    setIsProcessing(true);
    const result = deduplicateLines(input, config);

    if (result.success) {
      setResult(result.output || '');
      setStats(result.stats || null);

      addToHistory({
        tool: 'line-deduplicator',
        input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
        output: result.output || '',
        timestamp: Date.now()
      });
    } else {
      setResult(`Error: ${result.error}`);
      setStats(null);
    }
    setIsProcessing(false);
  }, [input, config, addToHistory]);

  const handleCopy = useCallback(() => {
    copyToClipboard(result);
  }, [result]);

  const handleDownload = useCallback(() => {
    downloadFile(result, 'deduplicated-lines.txt');
  }, [result]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult('');
    setStats(null);
  }, []);

  const handleConfigChange = useCallback((key: keyof LineDeduplicatorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExampleLoad = useCallback((example: string) => {
    setInput(example);
  }, []);

  return (
    <div className={`line-deduplicator-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button
            onClick={handleProcess}
            disabled={!input.trim() || isProcessing}
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            {isProcessing ? 'Processing...' : 'Remove Duplicates'}
          </button>

          <button
            onClick={handleClear}
            className="btn btn-outline"
            disabled={!input && !result}
          >
            Clear
          </button>

          {result && !result.startsWith('Error:') && (
            <>
              <button onClick={handleCopy} className="btn btn-outline">
                📋 Copy Results
              </button>
              <button onClick={handleDownload} className="btn btn-outline">
                💾 Download
              </button>
            </>
          )}

          {/* Quick stats display */}
          {stats && (
            <div style={{
              marginLeft: 'auto',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              gap: 'var(--space-md)',
              flexWrap: 'wrap'
            }}>
              <span><strong>{stats.totalLines}</strong> → <strong>{stats.totalLines - stats.removedLines}</strong> lines</span>
              <span><strong>{stats.removedLines}</strong> removed</span>
            </div>
          )}

          {/* Quick examples */}
          <div style={{ marginLeft: stats ? 'var(--space-md)' : 'auto', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExampleLoad(`apple
banana
apple
cherry
banana
date`)}
              className="btn btn-sm btn-outline"
            >
              Simple List
            </button>
            <button
              onClick={() => handleExampleLoad(`john@example.com
jane@example.com
JOHN@EXAMPLE.COM
bob@example.com
jane@example.com`)}
              className="btn btn-sm btn-outline"
            >
              Email List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid-responsive" style={{
        minHeight: '500px'
      }}>
        {/* Input Panel */}
        <div style={{ position: 'relative' }} className="grid-responsive-item"
             data-mobile-border="bottom"
             data-desktop-border="right">
          {/* Input Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              Text Input
            </h3>
            {input && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {input.split('\n').length.toLocaleString()} lines
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your text with duplicate lines here...

Example:
apple
banana
apple
cherry
banana"
              className="form-textarea"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                resize: 'vertical',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="grid-responsive-item">
          {/* Output Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              Deduplicated Results
            </h3>
            {stats && !result.startsWith('Error:') && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {(stats.totalLines - stats.removedLines).toLocaleString()} lines remaining
              </div>
            )}
          </div>

          {/* Output Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            {result ? (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                height: '100%',
                overflow: 'auto',
                backgroundColor: 'var(--color-surface)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                color: result.startsWith('Error:') ? 'var(--color-error)' : 'inherit'
              }}>
                {result}
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                <div>
                  <p>Enter text with duplicate lines and click "Remove Duplicates" to see the cleaned results.</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-md)' }}>
                    ✅ Preserves original order<br />
                    ✅ Case-sensitive or insensitive options<br />
                    ✅ Advanced filtering and sorting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-lg)'
      }}>
        <details open>
          <summary style={{
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: 'var(--space-md)',
            color: 'var(--color-text-primary)'
          }}>
            Deduplication Options
          </summary>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {/* Basic Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Basic Options:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.caseSensitive}
                    onChange={(e) => handleConfigChange('caseSensitive', e.target.checked)}
                  />
                  Case sensitive comparison
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.trimWhitespace}
                    onChange={(e) => handleConfigChange('trimWhitespace', e.target.checked)}
                  />
                  Trim whitespace from lines
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.removeEmptyLines}
                    onChange={(e) => handleConfigChange('removeEmptyLines', e.target.checked)}
                  />
                  Remove empty lines
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.showStats}
                    onChange={(e) => handleConfigChange('showStats', e.target.checked)}
                  />
                  Show processing statistics
                </label>
              </div>
            </div>

            {/* Filtering Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Output Filtering:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="radio"
                    name="filterMode"
                    checked={!config.onlyDuplicates && !config.onlyUnique}
                    onChange={() => {
                      handleConfigChange('onlyDuplicates', false);
                      handleConfigChange('onlyUnique', false);
                    }}
                  />
                  All lines (deduplicated)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="radio"
                    name="filterMode"
                    checked={config.onlyDuplicates}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleConfigChange('onlyDuplicates', true);
                        handleConfigChange('onlyUnique', false);
                      }
                    }}
                  />
                  Only duplicate lines
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="radio"
                    name="filterMode"
                    checked={config.onlyUnique}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleConfigChange('onlyUnique', true);
                        handleConfigChange('onlyDuplicates', false);
                      }
                    }}
                  />
                  Only unique lines
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.preserveOrder}
                    onChange={(e) => handleConfigChange('preserveOrder', e.target.checked)}
                  />
                  Preserve original order
                </label>
              </div>
            </div>

            {/* Sorting Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Sorting Options:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.sortOutput}
                    onChange={(e) => handleConfigChange('sortOutput', e.target.checked)}
                  />
                  Sort output lines
                </label>

                {config.sortOutput && (
                  <div style={{ marginLeft: 'var(--space-lg)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                      Sort Order:
                    </label>
                    <select
                      value={config.sortOrder}
                      onChange={(e) => handleConfigChange('sortOrder', e.target.value)}
                      className="form-select"
                      style={{ width: '100%' }}
                    >
                      <option value="ascending">Ascending (A-Z)</option>
                      <option value="descending">Descending (Z-A)</option>
                      <option value="original">Original order</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Quick Stats Display */}
      {stats && !result.startsWith('Error:') && (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          margin: 'var(--space-lg)',
          fontSize: 'var(--font-size-sm)'
        }}>
          <h6 style={{ margin: 0, marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Processing Summary:</h6>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            <div><strong>Original:</strong> {stats.totalLines.toLocaleString()} lines</div>
            <div><strong>Final:</strong> {(stats.totalLines - stats.removedLines).toLocaleString()} lines</div>
            <div><strong>Removed:</strong> {stats.removedLines.toLocaleString()} duplicates</div>
            <div><strong>Empty removed:</strong> {stats.emptyLinesRemoved.toLocaleString()}</div>
            <div><strong>Time:</strong> {stats.processingTime.toFixed(2)}ms</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LineDeduplicator;