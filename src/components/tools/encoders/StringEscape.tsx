import { useState, useEffect, useMemo, useCallback } from 'react';
import { InputPanel, OutputPanel, SplitPanelLayout, DevToolbar, EscapeStatisticsPanel } from '../../ui';
import { processStringEscape, type StringEscapeConfig } from '../../../tools/encoders/string-escape';
import { getEscapeStatistics, highlightEscapeSequences } from '../../../lib/syntax/escape-highlighter';
import { useKeyboardShortcuts, createShortcut } from '../../../lib/keyboard/shortcuts';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface StringEscapeProps {
  className?: string;
}

const DEFAULT_CONFIG: StringEscapeConfig = {
  mode: 'escape',
  type: 'javascript',
  preserveLineBreaks: true,
  escapeUnicode: false,
};

// Quick presets for common scenarios
const PRESETS = [
  {
    id: 'json-api',
    name: 'JSON API Response',
    icon: '{}',
    config: { ...DEFAULT_CONFIG, type: 'javascript', mode: 'escape' },
    example: '{"message": "Hello \'World\'", "status": "success"}',
  },
  {
    id: 'sql-query',
    name: 'SQL Query',
    icon: 'SQL',
    config: { ...DEFAULT_CONFIG, type: 'sql', mode: 'escape' },
    example: "SELECT * FROM users WHERE name = 'O'Reilly';",
  },
  {
    id: 'html-template',
    name: 'HTML Template',
    icon: '</>',
    config: { ...DEFAULT_CONFIG, type: 'html', mode: 'escape' },
    example: '<div class="message">Hello & welcome to "our" site!</div>',
  },
  {
    id: 'url-param',
    name: 'URL Parameter',
    icon: 'URL',
    config: { ...DEFAULT_CONFIG, type: 'url', mode: 'escape' },
    example: 'Hello World & Special Characters!',
  },
];

const ESCAPE_TYPES = [
  { value: 'javascript', label: 'JavaScript/JSON' },
  { value: 'html', label: 'HTML Entities' },
  { value: 'xml', label: 'XML Entities' },
  { value: 'css', label: 'CSS Escaping' },
  { value: 'sql', label: 'SQL Escaping' },
  { value: 'regex', label: 'RegEx Escaping' },
  { value: 'url', label: 'URL Encoding' },
  { value: 'csv', label: 'CSV Escaping' },
  { value: 'python', label: 'Python String' },
];

export function StringEscape({ className = '' }: StringEscapeProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<StringEscapeConfig>(DEFAULT_CONFIG);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [showStats, setShowStats] = useState(true);

  const { addToHistory } = useToolStore();

  // Calculate statistics
  const escapeStats = useMemo(() => {
    if (!output || !input || error) return null;
    return getEscapeStatistics(config.mode === 'escape' ? output : input, config.type);
  }, [output, input, config.mode, config.type, error]);

  // Debounced processing function
  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: StringEscapeConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setProcessingTime(0);
        return;
      }

      setIsLoading(true);
      const startTime = performance.now();

      setTimeout(() => {
        try {
          const result = processStringEscape(text, cfg);
          const endTime = performance.now();
          setProcessingTime(endTime - startTime);

          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);

            addToHistory({
              toolId: 'string-escape',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to process string');
        }

        setIsLoading(false);
      }, 10);
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  // Keyboard shortcuts
  const handleCopyOutput = useCallback(async () => {
    if (output) {
      try {
        await navigator.clipboard.writeText(output);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [output]);

  const handleToggleMode = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      mode: prev.mode === 'escape' ? 'unescape' : 'escape'
    }));
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(undefined);
  }, []);

  useKeyboardShortcuts([
    createShortcut('e', handleToggleMode, {
      description: 'Toggle Escape/Unescape',
      useMeta: true,
    }),
    createShortcut('c', handleCopyOutput, {
      description: 'Copy Output',
      useMeta: true,
      shift: true,
    }),
    {
      key: 'Escape',
      description: 'Clear All',
      action: handleClear,
    },
  ]);

  const handlePresetClick = useCallback((preset: typeof PRESETS[0]) => {
    setInput(preset.example);
    setConfig(preset.config as StringEscapeConfig);
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    setConfig(prev => ({ ...prev, type: type as StringEscapeConfig['type'] }));
  }, []);

  // Left panel: Input + controls
  const leftPanel = (
    <div className="flex flex-col h-full">
      {/* Developer Toolbar */}
      <DevToolbar sticky>
        <DevToolbar.Group>
          <DevToolbar.Button
            label={config.mode === 'escape' ? 'Escape' : 'Unescape'}
            onClick={handleToggleMode}
            variant={config.mode === 'escape' ? 'primary' : 'secondary'}
            title="Toggle between Escape and Unescape mode"
            shortcut="⌘E"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                {config.mode === 'escape' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4v8m4-4H4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h8" />
                )}
              </svg>
            }
          />
        </DevToolbar.Group>

        <DevToolbar.Divider />

        <DevToolbar.Group label="Type">
          <DevToolbar.Select
            value={config.type}
            options={ESCAPE_TYPES}
            onChange={handleTypeChange}
          />
        </DevToolbar.Group>

        <DevToolbar.Divider />

        <DevToolbar.Group>
          <DevToolbar.Toggle
            checked={config.escapeUnicode}
            onChange={(checked) => setConfig(prev => ({ ...prev, escapeUnicode: checked }))}
            label="Unicode"
          />
          <DevToolbar.Toggle
            checked={config.preserveLineBreaks}
            onChange={(checked) => setConfig(prev => ({ ...prev, preserveLineBreaks: checked }))}
            label="Keep \\n"
          />
        </DevToolbar.Group>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-xs)' }}>
          <DevToolbar.Button
            label="Stats"
            onClick={() => setShowStats(!showStats)}
            variant="ghost"
            active={showStats}
          />
          <DevToolbar.Button
            label="Clear"
            onClick={handleClear}
            variant="ghost"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l4 4m0-4l-4 4" />
              </svg>
            }
          />
        </div>
      </DevToolbar>

      {/* Quick Presets */}
      <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Presets
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className="dev-toolbar__button dev-toolbar__button--secondary"
              style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)' }}
            >
              <span style={{ fontWeight: 700 }}>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Panel */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <InputPanel
          value={input}
          onChange={setInput}
          label={`Input Text (${config.mode === 'escape' ? 'Original' : 'Escaped'})`}
          placeholder={`Enter text to ${config.mode}...

Examples:
- JavaScript: "Hello 'World'"
- HTML: <div>Content & more</div>
- SQL: Robert's Database
- URL: Hello World & More!`}
          syntax="text"
        />
      </div>

      {/* Statistics Panel */}
      {showStats && escapeStats && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          <EscapeStatisticsPanel
            stats={escapeStats}
            originalLength={input.length}
            processedLength={output.length}
            processingTime={processingTime}
          />
        </div>
      )}
    </div>
  );

  // Right panel: Output
  const rightPanel = (
    <div className="flex flex-col h-full">
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label={`${config.mode === 'escape' ? 'Escaped' : 'Unescaped'} Result`}
        syntax="text"
        downloadFilename={`${config.mode}-${config.type}.txt`}
        downloadContentType="text/plain"
        showLineNumbers={true}
      />
    </div>
  );

  return (
    <div className={`string-escape-dev ${className}`} style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      <SplitPanelLayout
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        defaultSplitPosition={50}
        minPanelWidth={350}
      />
    </div>
  );
}
