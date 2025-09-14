import { useState, useEffect, useMemo, useCallback } from 'react';
import { processSqlFormatter, type SqlFormatterConfig } from '../../../tools/formatters/sql-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import { openFormatterInNewWindow } from '../../../lib/utils/window-manager';

interface SqlFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: SqlFormatterConfig = {
  mode: 'beautify',
  indentSize: 2,
  indentType: 'spaces',
  keywordCase: 'upper',
  functionCase: 'upper',
  identifierCase: 'preserve',
  linesBetweenQueries: 1,
  alignCommas: false,
  alignColumns: false,
  breakBeforeComma: false,
  breakAfterJoin: true,
  maxLineLength: 120,
  validateSyntax: true,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'beautify',
    options: [
      { value: 'beautify', label: 'Beautify' },
      { value: 'minify', label: 'Minify' },
    ],
    description: 'Format mode',
  },
  {
    key: 'indentSize',
    label: 'Indent',
    type: 'select' as const,
    default: 2,
    options: [
      { value: '2', label: '2 spaces' },
      { value: '4', label: '4 spaces' },
      { value: '1', label: '1 tab' },
    ],
    description: 'Indentation style',
  },
  {
    key: 'keywordCase',
    label: 'Keywords',
    type: 'select' as const,
    default: 'upper',
    options: [
      { value: 'upper', label: 'UPPERCASE' },
      { value: 'lower', label: 'lowercase' },
      { value: 'preserve', label: 'Preserve' },
    ],
    description: 'Keyword case style',
  },
  {
    key: 'validateSyntax',
    label: 'Validate',
    type: 'boolean' as const,
    default: true,
    description: 'Syntax validation',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'indentType',
    label: 'Indent Type',
    type: 'select' as const,
    default: 'spaces',
    options: [
      { value: 'spaces', label: 'Spaces' },
      { value: 'tabs', label: 'Tabs' },
    ],
    description: 'Use spaces or tabs',
    showWhen: (cfg: any) => Number(cfg.indentSize ?? 2) > 0,
  },
  {
    key: 'functionCase',
    label: 'Function Case',
    type: 'select' as const,
    default: 'upper',
    options: [
      { value: 'upper', label: 'UPPERCASE' },
      { value: 'lower', label: 'lowercase' },
      { value: 'preserve', label: 'Preserve' },
    ],
    description: 'SQL function case style',
  },
  {
    key: 'identifierCase',
    label: 'Identifier Case',
    type: 'select' as const,
    default: 'preserve',
    options: [
      { value: 'upper', label: 'UPPERCASE' },
      { value: 'lower', label: 'lowercase' },
      { value: 'preserve', label: 'Preserve' },
    ],
    description: 'Table/column case style',
  },
  {
    key: 'breakAfterJoin',
    label: 'Break After JOIN',
    type: 'boolean' as const,
    default: true,
    description: 'Start JOIN clauses on new lines',
  },
  {
    key: 'breakBeforeComma',
    label: 'Break Before Comma',
    type: 'boolean' as const,
    default: false,
    description: 'Place commas at line start',
  },
  {
    key: 'linesBetweenQueries',
    label: 'Lines Between Queries',
    type: 'number' as const,
    default: 1,
    min: 0,
    max: 5,
    description: 'Empty lines between statements',
  },
];

const EXAMPLES = [
  {
    title: 'Basic SELECT',
    value: `select id, name, email from users where active = 1 order by name;`,
  },
  {
    title: 'JOIN Query',
    value: `select u.name, p.title, c.name as category from users u inner join posts p on u.id = p.user_id left join categories c on p.category_id = c.id where u.active = 1 and p.published = 1;`,
  },
  {
    title: 'Complex with Subquery',
    value: `SELECT customers.customer_name, orders.order_date, (SELECT COUNT(*) FROM order_items WHERE order_items.order_id = orders.order_id) as item_count FROM customers INNER JOIN orders ON customers.customer_id = orders.customer_id WHERE orders.order_date >= '2023-01-01' ORDER BY orders.order_date DESC;`,
  },
  {
    title: 'Multiple Statements',
    value: `CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE); INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com'), ('Jane Smith', 'jane@example.com');`,
  },
];

export function SqlFormatter({ className = '' }: SqlFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<SqlFormatterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('sql-formatter') as Partial<SqlFormatterConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Convert string values from select to numbers for indent
  const processedConfig = useMemo(() => ({
    ...config,
    indentSize: parseInt(String(config.indentSize)) || 2,
    indentType: String(config.indentSize) === '1' && config.indentSize ? 'tabs' : 'spaces',
  }), [config]);

  // Process SQL function
  const processSql = useCallback((inputText: string = input, cfg: SqlFormatterConfig = processedConfig) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processSqlFormatter(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.stats);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'sql-formatter',
        input: inputText,
        output: result.output || '',
        config: cfg,
        timestamp: Date.now(),
      });
    } else {
      setOutput('');
      setError(result.error);
      setMetadata(undefined);
    }
    
    setIsLoading(false);
  }, [input, processedConfig, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processSql, 500),
    [processSql]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, processedConfig);
    }
  }, [input, processedConfig, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleFormat = useCallback(() => {
    const formatConfig = { ...processedConfig, mode: 'beautify' as const };
    setConfig(formatConfig);
    processSql(input, formatConfig);
  }, [input, processedConfig, processSql]);

  const handleMinify = useCallback(() => {
    const minifyConfig = { ...processedConfig, mode: 'minify' as const };
    setConfig(minifyConfig);
    processSql(input, minifyConfig);
  }, [input, processedConfig, processSql]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...processedConfig, validateSyntax: true };
    setConfig(validateConfig);
    processSql(input, validateConfig);
  }, [input, processedConfig, processSql]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processSql(content, processedConfig);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, processedConfig, processSql]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [output]);

  // Download handler
  const handleDownload = useCallback(() => {
    const filename = config.mode === 'minify' ? 'formatted.min.sql' : 'formatted.sql';
    downloadFile(output, filename, 'text/plain');
  }, [output, config.mode]);

  // Open in new window handler
  const handleOpenInNewWindow = useCallback(() => {
    const filename = config.mode === 'minify' ? 'formatted.min.sql' : 'formatted.sql';
    openFormatterInNewWindow(output, 'sql', 'SQL Formatter', filename);
  }, [output, config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: SqlFormatterConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('sql-formatter', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processSql(input, { ...processedConfig, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  // Paste handler
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      if (autoFormat) {
        processSql(text, processedConfig);
      }
    } catch (error) {
      console.warn('Failed to paste from clipboard');
    }
  }, [autoFormat, processedConfig, processSql]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            handleFormat();
            break;
          case 'm':
            e.preventDefault();
            handleMinify();
            break;
          case 'l':
            e.preventDefault();
            setInput('');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleFormat, handleMinify]);

  return (
    <div className={`${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)', alignItems: 'center' }}>
          {/* Primary Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <button onClick={handleFormat} className="btn btn-primary" title="Format SQL (Ctrl+Enter)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              Format
            </button>

            <button onClick={handleMinify} className="btn btn-secondary" title="Minify SQL (Ctrl+M)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Minify
            </button>

            <button onClick={handleValidate} className="btn btn-outline" title="Validate SQL">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
              </svg>
              Validate
            </button>

            {!autoFormat && (
              <button
                onClick={() => processSql()}
                disabled={!input.trim() || isLoading}
                className="btn btn-outline"
                title="Process SQL"
              >
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                )}
                Process
              </button>
            )}
          </div>

          {/* Stats & Settings */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <span>Size: <strong>{new Blob([input]).size.toLocaleString()} B</strong></span>
              <span>Lines: <strong>{input.split('\n').length}</strong></span>
              {metadata?.processingTimeMs && (
                <span>Time: <strong>{Math.round(metadata.processingTimeMs)}ms</strong></span>
              )}
              {error ? (
                <span className="status-indicator status-invalid">✗ Invalid</span>
              ) : output ? (
                <span className="status-indicator status-valid">✓ Valid</span>
              ) : null}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={autoFormat}
                onChange={(e) => setAutoFormat(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Auto-format
            </label>
          </div>
        </div>
      </div>

      {/* Editor Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '500px'
      }} className="md:grid-cols-1">
        {/* Input Panel */}
        <div style={{ position: 'relative', borderRight: '1px solid var(--color-border)' }} className="md:border-r-0 md:border-b md:border-b-gray-200">
          {/* Input Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              SQL Input
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button onClick={handlePaste} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Paste
              </button>
              <label className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                Upload
                <input
                  type="file"
                  accept=".sql,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Input Textarea */}
          <div
            style={{ position: 'relative', height: '500px' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your SQL here or drag & drop a file..."
              className="form-textarea"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 0,
                fontFamily: 'var(--font-family-mono)',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'none',
                padding: 'var(--space-lg)'
              }}
              spellCheck={false}
            />
            {dragActive && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--color-primary)'
              }}>
                Drop SQL file here
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div style={{ position: 'relative' }}>
          {/* Output Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {config.mode === 'beautify' ? 'Formatted SQL' : 'Minified SQL'}
            </span>
            {output && (
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  onClick={handleCopy}
                  className={copied ? 'btn btn-secondary' : 'btn btn-outline'}
                  style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={copied ? "M9 12l2 2 4-4" : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"}/>
                  </svg>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleDownload} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Download
                </button>
                <button onClick={handleOpenInNewWindow} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Open in New Window
                </button>
              </div>
            )}
          </div>

          {/* Output Content */}
          <div style={{ height: '500px', position: 'relative' }}>
            {error ? (
              <div style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-lg)',
                margin: 'var(--space-lg)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap'
              }}>
                <strong>SQL Error:</strong><br />
                {error}
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="Formatted SQL will appear here..."
                className="form-textarea"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 0,
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'none',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface)'
                }}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Examples - Collapsible */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)'
      }}>
        <details className="group">
          <summary style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: 'var(--space-xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Quick Examples
            </div>
            <svg className="w-5 h-5 group-open:rotate-180 transition-transform" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
              {EXAMPLES.map((example, idx) => (
                <div key={idx} className="card" style={{ padding: 'var(--space-lg)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                    {example.title}
                  </div>
                  <div style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.75rem',
                    marginBottom: 'var(--space-md)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {example.value.substring(0, 50)}...
                  </div>
                  <button
                    onClick={() => setInput(example.value)}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.875rem' }}
                  >
                    Try This Example
                  </button>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>

  );
}