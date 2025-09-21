import { useState, useCallback } from 'react';
import { sortList, type ListSorterConfig, type SortingStats } from '../../../tools/text/list-sorter';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard, downloadFile } from '../../../lib/utils';

interface ListSorterProps {
  className?: string;
}

const DEFAULT_CONFIG: ListSorterConfig = {
  sortOrder: 'ascending',
  caseSensitive: false,
  ignoreArticles: false,
  trimWhitespace: true,
  removeEmptyLines: true,
  removeDuplicates: false,
  sortBy: 'alphabetical',
  customSeparator: '\n',
  preserveCase: false,
  naturalSort: true,
  showStats: true,
};

export function ListSorter({ className = '' }: ListSorterProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<ListSorterConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<string>('');
  const [stats, setStats] = useState<SortingStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToHistory } = useToolStore();

  const handleSort = useCallback(() => {
    if (!input.trim()) {
      alert('Please enter a list to sort.');
      return;
    }

    setIsProcessing(true);
    const result = sortList(input, config);

    if (result.success) {
      setResult(result.output || '');
      setStats(result.stats || null);

      addToHistory({
        tool: 'list-sorter',
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
    downloadFile(result, 'sorted-list.txt');
  }, [result]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult('');
    setStats(null);
  }, []);

  const handleConfigChange = useCallback((key: keyof ListSorterConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExampleLoad = useCallback((example: string) => {
    setInput(example);
  }, []);

  return (
    <div className={`list-sorter-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button
            onClick={handleSort}
            disabled={!input.trim() || isProcessing}
            className="btn btn-primary"
            style={{ minWidth: '120px' }}
          >
            {isProcessing ? 'Sorting...' : 'Sort List'}
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
              <span><strong>{stats.totalLines}</strong> → <strong>{stats.sortedLines}</strong> items</span>
              <span>{stats.sortMethod}</span>
            </div>
          )}

          {/* Quick examples */}
          <div style={{ marginLeft: stats ? 'var(--space-md)' : 'auto', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExampleLoad(`apple\nbanana\ncherry\ndate\nelderberry`)}
              className="btn btn-sm btn-outline"
            >
              Simple List
            </button>
            <button
              onClick={() => handleExampleLoad(`The Matrix\nA Beautiful Mind\nBatman\nThe Godfather\nAn American Tale`)}
              className="btn btn-sm btn-outline"
            >
              Movie Titles
            </button>
            <button
              onClick={() => handleExampleLoad(`Item 10\nItem 2\nItem 1\nItem 20\nItem 3`)}
              className="btn btn-sm btn-outline"
            >
              Numbered Items
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
              List Items
            </h3>
            {input && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {input.split('\n').length.toLocaleString()} items
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your list items here, one per line...

Example:
apple
banana
cherry
date
elderberry"
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
              Sorted Results
            </h3>
            {stats && !result.startsWith('Error:') && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {stats.sortedLines.toLocaleString()} items sorted
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
                  <p>Enter your list items and click "Sort List" to see the organized results.</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-md)' }}>
                    ✅ Alphabetical, numerical, and custom sorting<br />
                    ✅ Natural sorting for mixed content<br />
                    ✅ Duplicate removal and advanced options
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
            Sorting Options
          </summary>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {/* Sort Method */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Sort Method:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                  Sort By:
                </label>
                <select
                  value={config.sortBy}
                  onChange={(e) => handleConfigChange('sortBy', e.target.value)}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="alphabetical">Alphabetical</option>
                  <option value="numerical">Numerical</option>
                  <option value="length">Text Length</option>
                  <option value="custom">Custom</option>
                </select>

                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                  Sort Order:
                </label>
                <select
                  value={config.sortOrder}
                  onChange={(e) => handleConfigChange('sortOrder', e.target.value)}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="ascending">Ascending (A-Z, 1-9)</option>
                  <option value="descending">Descending (Z-A, 9-1)</option>
                  <option value="random">Random Shuffle</option>
                  <option value="reverse">Reverse Order</option>
                </select>
              </div>
            </div>

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
                  Case sensitive sorting
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.naturalSort}
                    onChange={(e) => handleConfigChange('naturalSort', e.target.checked)}
                  />
                  Natural sorting (Item 2 before Item 10)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.ignoreArticles}
                    onChange={(e) => handleConfigChange('ignoreArticles', e.target.checked)}
                  />
                  Ignore articles (a, an, the)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.showStats}
                    onChange={(e) => handleConfigChange('showStats', e.target.checked)}
                  />
                  Show sorting statistics
                </label>
              </div>
            </div>

            {/* Cleanup Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Cleanup Options:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.trimWhitespace}
                    onChange={(e) => handleConfigChange('trimWhitespace', e.target.checked)}
                  />
                  Trim whitespace from items
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
                    checked={config.removeDuplicates}
                    onChange={(e) => handleConfigChange('removeDuplicates', e.target.checked)}
                  />
                  Remove duplicate items
                </label>

                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                    Item Separator:
                  </label>
                  <select
                    value={config.customSeparator}
                    onChange={(e) => handleConfigChange('customSeparator', e.target.value)}
                    className="form-select"
                    style={{ width: '100%' }}
                  >
                    <option value="\n">Line Break</option>
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab</option>
                    <option value=" ">Space</option>
                  </select>
                </div>
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
          <h6 style={{ margin: 0, marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Sorting Summary:</h6>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            <div><strong>Original:</strong> {stats.totalLines.toLocaleString()} items</div>
            <div><strong>Final:</strong> {stats.sortedLines.toLocaleString()} items</div>
            <div><strong>Method:</strong> {stats.sortMethod}</div>
            <div><strong>Removed:</strong> {stats.removedLines.toLocaleString()} items</div>
            <div><strong>Duplicates:</strong> {stats.duplicatesRemoved.toLocaleString()}</div>
            <div><strong>Time:</strong> {stats.processingTime.toFixed(2)}ms</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListSorter;