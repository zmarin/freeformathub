import { useState, useCallback } from 'react';
import { findAndReplace, type FindReplaceConfig, type FindReplaceStats, type MatchInfo } from '../../../tools/text/text-find-replace';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard, downloadFile } from '../../../lib/utils';

interface TextFindReplaceProps {
  className?: string;
}

const DEFAULT_CONFIG: FindReplaceConfig = {
  caseSensitive: false,
  wholeWords: false,
  useRegex: false,
  replaceAll: true,
  preserveCase: false,
  multiline: false,
  globalSearch: true,
  showStats: true,
  highlightMatches: false,
};

export function TextFindReplace({ className = '' }: TextFindReplaceProps) {
  const [input, setInput] = useState('');
  const [findPattern, setFindPattern] = useState('');
  const [replacePattern, setReplacePattern] = useState('');
  const [config, setConfig] = useState<FindReplaceConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<string>('');
  const [stats, setStats] = useState<FindReplaceStats | null>(null);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToHistory } = useToolStore();

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      alert('Please enter text to process.');
      return;
    }

    if (!findPattern.trim()) {
      alert('Please enter a search pattern.');
      return;
    }

    setIsProcessing(true);
    const result = findAndReplace(input, findPattern, replacePattern, config);

    if (result.success) {
      setResult(result.output || '');
      setStats(result.stats || null);
      setMatches(result.matches || []);

      addToHistory({
        tool: 'text-find-replace',
        input: `Find: "${findPattern}" | Replace: "${replacePattern}" | ${input.substring(0, 50)}...`,
        output: result.output || '',
        timestamp: Date.now()
      });
    } else {
      setResult(`Error: ${result.error}`);
      setStats(null);
      setMatches([]);
    }
    setIsProcessing(false);
  }, [input, findPattern, replacePattern, config, addToHistory]);

  const handleCopy = useCallback(() => {
    copyToClipboard(result);
  }, [result]);

  const handleDownload = useCallback(() => {
    downloadFile(result, 'find-replace-results.txt');
  }, [result]);

  const handleClear = useCallback(() => {
    setInput('');
    setFindPattern('');
    setReplacePattern('');
    setResult('');
    setStats(null);
    setMatches([]);
  }, []);

  const handleConfigChange = useCallback((key: keyof FindReplaceConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExampleLoad = useCallback((inputText: string, findText: string, replaceText: string) => {
    setInput(inputText);
    setFindPattern(findText);
    setReplacePattern(replaceText);
  }, []);

  return (
    <div className={`text-find-replace-tool ${className}`}>
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
            disabled={!input.trim() || !findPattern.trim() || isProcessing}
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            {isProcessing ? 'Processing...' : 'Find & Replace'}
          </button>

          <button
            onClick={handleClear}
            className="btn btn-outline"
            disabled={!input && !result}
          >
            Clear All
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
              <span><strong>{stats.totalMatches}</strong> matches</span>
              <span><strong>{stats.replacements}</strong> replaced</span>
            </div>
          )}

          {/* Quick examples */}
          <div style={{ marginLeft: stats ? 'var(--space-md)' : 'auto', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExampleLoad(
                'The quick brown fox jumps over the lazy dog.\nThe quick brown fox is very quick.',
                'quick',
                'fast'
              )}
              className="btn btn-sm btn-outline"
            >
              Simple Replace
            </button>
            <button
              onClick={() => handleExampleLoad(
                'Phone: (555) 123-4567\nPhone: (555) 987-6543',
                '\\((\\d{3})\\)',
                '$1-'
              )}
              className="btn btn-sm btn-outline"
            >
              Regex Example
            </button>
          </div>
        </div>
      </div>

      {/* Search Patterns */}
      <div style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-lg)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-md)',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
              Find Pattern:
            </label>
            <input
              type="text"
              value={findPattern}
              onChange={(e) => setFindPattern(e.target.value)}
              placeholder="Enter text or regex pattern to find..."
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
              Replace With:
            </label>
            <input
              type="text"
              value={replacePattern}
              onChange={(e) => setReplacePattern(e.target.value)}
              placeholder="Enter replacement text..."
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <input
                type="checkbox"
                checked={config.caseSensitive}
                onChange={(e) => handleConfigChange('caseSensitive', e.target.checked)}
              />
              Case sensitive
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <input
                type="checkbox"
                checked={config.useRegex}
                onChange={(e) => handleConfigChange('useRegex', e.target.checked)}
              />
              Use regex
            </label>
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
              placeholder="Paste your text here for find and replace operations...

Example:
The quick brown fox jumps over the lazy dog.
The quick brown fox is very quick.
Quick thinking leads to quick solutions."
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
              Processed Results
            </h3>
            {stats && !result.startsWith('Error:') && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {stats.replacements} of {stats.totalMatches} replaced
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
                  <p>Enter text and search patterns, then click "Find & Replace" to see the results.</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-md)' }}>
                    ✅ Supports regular expressions<br />
                    ✅ Case sensitive and whole word options<br />
                    ✅ Detailed match statistics
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
        <details>
          <summary style={{
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: 'var(--space-md)',
            color: 'var(--color-text-primary)'
          }}>
            Advanced Options
          </summary>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {/* Search Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Search Options:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.wholeWords}
                    onChange={(e) => handleConfigChange('wholeWords', e.target.checked)}
                  />
                  Match whole words only
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.multiline}
                    onChange={(e) => handleConfigChange('multiline', e.target.checked)}
                  />
                  Multiline mode (^ and $ match line breaks)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.globalSearch}
                    onChange={(e) => handleConfigChange('globalSearch', e.target.checked)}
                  />
                  Global search (find all matches)
                </label>
              </div>
            </div>

            {/* Replace Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Replace Options:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.replaceAll}
                    onChange={(e) => handleConfigChange('replaceAll', e.target.checked)}
                  />
                  Replace all occurrences
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.preserveCase}
                    onChange={(e) => handleConfigChange('preserveCase', e.target.checked)}
                    disabled={config.useRegex}
                  />
                  Preserve original case
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

            {/* Regex Help */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Regex Quick Reference:</h6>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                <div><code>.</code> - Any character</div>
                <div><code>\d</code> - Any digit</div>
                <div><code>\w</code> - Any word character</div>
                <div><code>+</code> - One or more</div>
                <div><code>*</code> - Zero or more</div>
                <div><code>?</code> - Zero or one</div>
                <div><code>()</code> - Capture group</div>
                <div><code>$1, $2</code> - Reference captured groups</div>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Matches Display */}
      {matches.length > 0 && !result.startsWith('Error:') && (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          margin: 'var(--space-lg)',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <h6 style={{ margin: 0, marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
            Matches Found ({matches.length}):
          </h6>
          <div style={{ fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-mono)' }}>
            {matches.slice(0, 10).map((match, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--space-xs)',
                  marginBottom: 'var(--space-xs)',
                  backgroundColor: match.replaced ? 'var(--color-success-light)' : 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  Line {match.line}, Column {match.column} {match.replaced && '(replaced)'}
                </div>
                <div style={{ color: 'var(--color-text-primary)' }}>
                  {match.context}
                </div>
              </div>
            ))}
            {matches.length > 10 && (
              <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-sm)' }}>
                ... and {matches.length - 10} more matches
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TextFindReplace;