import { useState, useEffect, useMemo, useCallback } from 'react';
import { countWords, type WordCounterConfig, type WordStats } from '../../../tools/text/word-counter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface WordCounterProps {
  className?: string;
}

const DEFAULT_CONFIG: WordCounterConfig = {
  showCharactersWithSpaces: true,
  showCharactersWithoutSpaces: true,
  showSentences: true,
  showParagraphs: true,
  showLines: false,
  showAvgWordsPerSentence: false,
  realTimeCount: true,
};

export function WordCounter({ className = '' }: WordCounterProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<WordCounterConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<string>('');
  const [stats, setStats] = useState<WordStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { history, addToHistory } = useToolStore();

  // Debounced counting for real-time updates
  const debouncedCount = useMemo(
    () => debounce((text: string, config: WordCounterConfig) => {
      setIsProcessing(true);
      const result = countWords(text, config);

      if (result.success) {
        setResult(result.output || '');
        setStats(result.stats || null);
      } else {
        setResult(result.error || 'An error occurred');
        setStats(null);
      }
      setIsProcessing(false);
    }, 300),
    []
  );

  // Count words when input or config changes (if real-time is enabled)
  useEffect(() => {
    if (config.realTimeCount) {
      debouncedCount(input, config);
    }
  }, [input, config, debouncedCount]);

  const handleCount = useCallback(() => {
    setIsProcessing(true);
    const result = countWords(input, config);

    if (result.success) {
      setResult(result.output || '');
      setStats(result.stats || null);

      addToHistory({
        tool: 'word-counter',
        input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
        output: result.output || '',
        timestamp: Date.now()
      });
    } else {
      setResult(result.error || 'An error occurred');
      setStats(null);
    }
    setIsProcessing(false);
  }, [input, config, addToHistory]);

  const handleCopy = useCallback(() => {
    copyToClipboard(result);
  }, [result]);

  const handleDownload = useCallback(() => {
    downloadFile(result, 'word-count-results.txt');
  }, [result]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult('');
    setStats(null);
  }, []);

  const handleConfigChange = useCallback((key: keyof WordCounterConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExampleLoad = useCallback((example: string) => {
    setInput(example);
  }, []);

  return (
    <div className={`word-counter-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button
            onClick={handleCount}
            disabled={isProcessing}
            className="btn btn-primary"
            style={{ minWidth: '120px' }}
          >
            {isProcessing ? 'Counting...' : 'Count Words'}
          </button>

          <button
            onClick={handleClear}
            className="btn btn-outline"
            disabled={!input && !result}
          >
            Clear
          </button>

          {result && (
            <>
              <button onClick={handleCopy} className="btn btn-outline">
                📋 Copy Results
              </button>
              <button onClick={handleDownload} className="btn btn-outline">
                💾 Download
              </button>
            </>
          )}

          {/* Quick examples */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExampleLoad('This is a simple sentence to test the word counter.')}
              className="btn btn-sm btn-outline"
            >
              Simple Text
            </button>
            <button
              onClick={() => handleExampleLoad('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.')}
              className="btn btn-sm btn-outline"
            >
              Lorem Ipsum
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
            {stats && config.realTimeCount && (
              <div style={{
                display: 'flex',
                gap: 'var(--space-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                <span>Words: <strong>{stats.words.toLocaleString()}</strong></span>
                <span>Characters: <strong>{stats.charactersWithSpaces.toLocaleString()}</strong></span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type your text here to count words and characters..."
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
              Word Count Results
            </h3>
            {stats && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {stats.estimatedReadingTime > 0 && (
                  <span>
                    Reading time: {stats.estimatedReadingTime < 1
                      ? `${Math.ceil(stats.estimatedReadingTime * 60)}s`
                      : `${stats.estimatedReadingTime.toFixed(1)}m`
                    }
                  </span>
                )}
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
                border: '1px solid var(--color-border)'
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
                  <p>Enter text above to see word count and character count results.</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-md)' }}>
                    {config.realTimeCount ? 'Real-time counting is enabled' : 'Click "Count Words" to analyze your text'}
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
            Display Options
          </summary>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-md)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={config.realTimeCount}
                onChange={(e) => handleConfigChange('realTimeCount', e.target.checked)}
              />
              Real-time counting
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={config.showCharactersWithSpaces}
                onChange={(e) => handleConfigChange('showCharactersWithSpaces', e.target.checked)}
              />
              Characters with spaces
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={config.showCharactersWithoutSpaces}
                onChange={(e) => handleConfigChange('showCharactersWithoutSpaces', e.target.checked)}
              />
              Characters without spaces
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={config.showSentences}
                onChange={(e) => handleConfigChange('showSentences', e.target.checked)}
              />
              Show sentences
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={config.showParagraphs}
                onChange={(e) => handleConfigChange('showParagraphs', e.target.checked)}
              />
              Show paragraphs
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={config.showLines}
                onChange={(e) => handleConfigChange('showLines', e.target.checked)}
              />
              Show lines
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={config.showAvgWordsPerSentence}
                onChange={(e) => handleConfigChange('showAvgWordsPerSentence', e.target.checked)}
              />
              Average words per sentence
            </label>
          </div>
        </details>
      </div>

      {/* Quick Stats Display (when real-time is enabled) */}
      {stats && config.realTimeCount && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-lg)',
          right: 'var(--space-lg)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: 'var(--font-size-sm)',
          zIndex: 1000,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-sm)',
          minWidth: '200px'
        }}>
          <div><strong>{stats.words.toLocaleString()}</strong> words</div>
          <div><strong>{stats.charactersWithSpaces.toLocaleString()}</strong> chars</div>
          <div><strong>{stats.sentences.toLocaleString()}</strong> sentences</div>
          <div><strong>{stats.paragraphs.toLocaleString()}</strong> paragraphs</div>
        </div>
      )}
    </div>
  );
}

export default WordCounter;