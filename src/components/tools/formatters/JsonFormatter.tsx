import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatJson, type JsonFormatterConfig } from '../../../tools/formatters/json-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import { openFormatterInNewWindow } from '../../../lib/utils/window-manager';
import { JsonTreeView, JsonPathBreadcrumb, JsonSearchBar } from '../../ui';

interface JsonFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonFormatterConfig = {
  indent: 2,
  sortKeys: false,
  removeComments: true,
  validateOnly: false,
  useTabs: false,
  sortKeysCaseInsensitive: false,
  allowSingleQuotes: true,
  quoteUnquotedKeys: true,
  replaceSpecialNumbers: 'none',
  inlineShortArrays: true,
  inlineArrayMaxLength: 5,
  inlineArrayMaxLineLength: 80,
  escapeUnicode: false,
  ensureFinalNewline: false,
  detectDuplicateKeys: true,
};

const EXAMPLES = [
  {
    title: 'Simple Object',
    value: '{"name": "John", "age": 30, "city": "New York"}',
  },
  {
    title: 'Nested Structure',
    value: '{"user":{"profile":{"name":"Jane","settings":{"theme":"dark","notifications":true}},"posts":[{"id":1,"title":"Hello World"},{"id":2,"title":"Getting Started"}]}}',
  },
  {
    title: 'Array of Objects',
    value: '[{"id":1,"name":"Item 1","active":true},{"id":2,"name":"Item 2","active":false}]',
  },
  {
    title: 'With Comments (JSONC)',
    value: `{
  // User information
  "name": "John",
  "age": 30, // Age in years
  "city": "New York"
}`,
  },
];

export function JsonFormatter({ className = '' }: JsonFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsonFormatterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('$');
  const [currentMatchPath, setCurrentMatchPath] = useState<string | undefined>();
  const [searchMatches, setSearchMatches] = useState<Array<{ path: string; key: string; value: any; type: 'key' | 'value' }>>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'text'>('tree');
  const [parsedData, setParsedData] = useState<any>(null);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('json-formatter') as Partial<JsonFormatterConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Convert string values from select to numbers for indent
  const processedConfig = useMemo(() => ({
    ...config,
    indent: parseInt(String(config.indent)) || 2,
  }), [config]);

  // Process JSON function
  const processJson = useCallback((inputText: string = input, cfg: JsonFormatterConfig = processedConfig) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const result = formatJson(inputText, cfg);

    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);

      // Try to parse the formatted output for tree view (handles JSONC inputs)
      try {
        const parsed = JSON.parse(result.output || '');
        setParsedData(parsed);
      } catch (e) {
        setParsedData(null);
      }

      addToHistory({
        toolId: 'json-formatter',
        input: inputText,
        output: result.output || '',
        config: cfg,
        timestamp: Date.now(),
      });
    } else {
      setOutput('');
      setError(result.error);
      setMetadata(undefined);
      setParsedData(null);
    }

    setIsLoading(false);
  }, [input, processedConfig, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processJson, 300),
    [processJson]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, processedConfig);
    }
  }, [input, processedConfig, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleFormat = useCallback(() => {
    const formatConfig = { ...processedConfig, indent: 2, sortKeys: false };
    setConfig(formatConfig);
    processJson(input, formatConfig);
  }, [input, processedConfig, processJson]);

  const handleMinify = useCallback(() => {
    const minifyConfig = { ...processedConfig, indent: 0 };
    setConfig(minifyConfig);
    processJson(input, minifyConfig);
  }, [input, processedConfig, processJson]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...processedConfig, validateOnly: true };
    processJson(input, validateConfig);
  }, [input, processedConfig, processJson]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(undefined);
    setMetadata(undefined);
    setParsedData(null);
    setSearchTerm('');
    setCurrentPath('$');
  }, []);

  // New handlers for enhanced features
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentMatchPath(undefined);

    // Find all matches when search term changes
    if (term && parsedData) {
      const matches: Array<{ path: string; key: string; value: any; type: 'key' | 'value' }> = [];
      const searchLower = term.toLowerCase();

      const searchInData = (obj: any, currentPath: string) => {
        if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            const newPath = Array.isArray(obj) ? `${currentPath}[${key}]` : `${currentPath}.${key}`;

            // Search in keys
            if (key.toLowerCase().includes(searchLower)) {
              matches.push({ path: newPath, key, value, type: 'key' });
            }

            // Search in string values
            if (typeof value === 'string' && value.toLowerCase().includes(searchLower)) {
              matches.push({ path: newPath, key, value, type: 'value' });
            }

            // Recursively search nested objects/arrays
            searchInData(value, newPath);
          });
        }
      };

      searchInData(parsedData, '$');
      setSearchMatches(matches);
    } else {
      setSearchMatches([]);
    }
  }, [parsedData]);

  const handlePathClick = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const handleValueCopy = useCallback((value: any, path: string) => {
    // Already handled in JsonTreeView component
  }, []);

  const handleNavigateToMatch = useCallback((matchIndex: number) => {
    if (searchMatches.length > 0 && matchIndex >= 0 && matchIndex < searchMatches.length) {
      const match = searchMatches[matchIndex];
      setCurrentMatchPath(match.path);
      setCurrentPath(match.path);
    }
  }, [searchMatches]);

  const handleToggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'tree' ? 'text' : 'tree');
  }, []);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processJson(content, processedConfig);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, processedConfig, processJson]);

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
    const filename = config.indent === 0 ? 'formatted.min.json' : 'formatted.json';
    downloadFile(output, filename, 'application/json');
  }, [output, config.indent]);

  // Open in new window handler
  const handleOpenInNewWindow = useCallback(() => {
    const filename = config.indent === 0 ? 'formatted.min.json' : 'formatted.json';
    openFormatterInNewWindow(output, 'json', 'JSON Formatter', filename);
  }, [output, config.indent]);

  // Paste handler
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      if (autoFormat) {
        processJson(text, processedConfig);
      }
    } catch (error) {
      console.warn('Failed to paste from clipboard');
    }
  }, [autoFormat, processedConfig, processJson]);

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
            handleClear();
            break;
          case 't':
            e.preventDefault();
            handleToggleViewMode();
            break;
          case 'f':
            if (viewMode === 'tree') {
              e.preventDefault();
              // Focus search input when in tree mode
              const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              }
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleFormat, handleMinify, handleClear, handleToggleViewMode, viewMode]);

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
            <button onClick={handleFormat} className="btn btn-primary" title="Format JSON (Ctrl+Enter)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              Format JSON
            </button>

            <button onClick={handleValidate} className="btn btn-secondary" title="Validate JSON">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
              </svg>
              Validate
            </button>

            <button onClick={handleMinify} className="btn btn-outline" title="Minify JSON (Ctrl+M)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Minify
            </button>

            <button onClick={handleClear} className="btn btn-outline" title="Clear all (Ctrl+L)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear
            </button>

            <button onClick={handleToggleViewMode} className="btn btn-secondary" title={`Switch to ${viewMode === 'tree' ? 'text' : 'tree'} view`}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {viewMode === 'tree' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l9 6 9-6"/>
                )}
              </svg>
              {viewMode === 'tree' ? 'Text View' : 'Tree View'}
            </button>
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
      }}>
        {/* Input Panel */}
        <div style={{ position: 'relative', borderRight: '1px solid var(--color-border)' }}>
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
              Input JSON
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
                  accept=".json,.txt"
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
              placeholder="Paste your JSON here or drag & drop a file..."
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
                Drop JSON file here
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
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
              {viewMode === 'tree' ? 'JSON Tree View' : 'Formatted Output'}
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

          {/* Search Bar (Tree View Only) */}
          {viewMode === 'tree' && parsedData && (
            <JsonSearchBar
              data={parsedData}
              onSearch={handleSearch}
              onNavigateToMatch={handleNavigateToMatch}
              style={{ borderBottom: '1px solid var(--color-border)' }}
            />
          )}

          {/* Path Breadcrumb (Tree View Only) */}
          {viewMode === 'tree' && currentPath && currentPath !== '$' && (
            <JsonPathBreadcrumb
              path={currentPath}
              onPathClick={handlePathClick}
              style={{ borderBottom: '1px solid var(--color-border)' }}
            />
          )}

          {/* Output Content */}
          <div style={{ flex: 1, minHeight: '400px', position: 'relative' }}>
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
                <strong>JSON Error:</strong><br />
                {error}
              </div>
            ) : viewMode === 'tree' && parsedData ? (
              <JsonTreeView
                data={parsedData}
                searchTerm={searchTerm}
                currentMatchPath={currentMatchPath}
                onPathClick={handlePathClick}
                onValueCopy={handleValueCopy}
                maxDepth={3}
                style={{ height: '100%' }}
              />
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="Formatted JSON will appear here..."
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
