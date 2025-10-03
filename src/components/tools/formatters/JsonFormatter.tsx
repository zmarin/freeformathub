import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatJson, type JsonFormatterConfig } from '../../../tools/formatters/json-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import { openFormatterInNewWindow } from '../../../lib/utils/window-manager';
import { JsonTreeView, JsonPathBreadcrumb, JsonSearchBar, ResizablePanel, ResizablePanelGroup, ToolHandoff, ErrorHighlightTextarea } from '../../ui';

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
    category: 'basic'
  },
  {
    title: 'Nested Structure',
    value: '{"user":{"profile":{"name":"Jane","settings":{"theme":"dark","notifications":true}},"posts":[{"id":1,"title":"Hello World"},{"id":2,"title":"Getting Started"}]}}',
    category: 'basic'
  },
  {
    title: 'Array of Objects',
    value: '[{"id":1,"name":"Item 1","active":true},{"id":2,"name":"Item 2","active":false}]',
    category: 'basic'
  },
  {
    title: 'With Comments (JSONC)',
    value: `{
  // User information
  "name": "John",
  "age": 30, // Age in years
  "city": "New York"
}`,
    category: 'basic'
  },
  {
    title: 'API Response Example',
    value: '{"status":"success","data":{"users":[{"id":123,"email":"user@example.com","created_at":"2024-01-15T10:30:00Z","profile":{"name":"John Doe","avatar":"https://api.example.com/avatars/123.jpg"}}],"pagination":{"page":1,"limit":20,"total":156}},"meta":{"request_id":"req_abc123","timestamp":"2024-01-15T10:30:00Z"}}',
    category: 'advanced'
  },
  {
    title: 'Broken JSON - Missing Comma',
    value: '{"name": "John" "age": 30, "city": "New York"}',
    category: 'broken'
  },
  {
    title: 'Broken JSON - Single Quotes',
    value: "{'name': 'John', 'age': 30, 'city': 'New York'}",
    category: 'broken'
  },
  {
    title: 'Large Dataset Example',
    value: '{"products":[' + Array.from({length: 10}, (_, i) => `{"id":${i+1},"name":"Product ${i+1}","price":${(Math.random() * 100).toFixed(2)},"inStock":${Math.random() > 0.5},"categories":["${i % 2 === 0 ? 'electronics' : 'clothing'}","featured"]}`).join(',') + '],"metadata":{"total":10,"generated":"' + new Date().toISOString() + '"}}',
    category: 'advanced'
  }
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
  const [layoutMode, setLayoutMode] = useState<'resizable' | 'stacked' | 'tabs'>('resizable');
  const [selectedExampleCategory, setSelectedExampleCategory] = useState<'basic' | 'advanced' | 'broken'>('basic');
  const [panelSizes, setPanelSizes] = useState({ input: '50%', output: '50%' });

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Related tools for tool handoff
  const relatedTools = [
    {
      id: 'json-path-extractor',
      name: 'JSONPath Extractor',
      url: '/web/json-path-extractor',
      description: 'Extract specific data using JSONPath queries',
      icon: '🔍'
    },
    {
      id: 'json-to-csv',
      name: 'JSON to CSV',
      url: '/converters/json-to-csv',
      description: 'Convert JSON data to CSV format',
      icon: '📊'
    },
    {
      id: 'json-schema-validator',
      name: 'JSON Schema Validator',
      url: '/validators/json-schema-validator',
      description: 'Validate JSON against a schema',
      icon: '✅'
    },
    {
      id: 'json-to-xml-converter',
      name: 'JSON to XML',
      url: '/converters/json-to-xml-converter',
      description: 'Convert JSON to XML format',
      icon: '🔄'
    },
    {
      id: 'json-to-typescript',
      name: 'JSON to TypeScript',
      url: '/generators/json-to-typescript',
      description: 'Generate TypeScript interfaces from JSON',
      icon: '📝'
    }
  ];

  // Load saved config and check for tool handoff data on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('json-formatter') as Partial<JsonFormatterConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }

      // Check for tool handoff data
      const handoffData = localStorage.getItem('tool-handoff-data');
      const handoffSource = localStorage.getItem('tool-handoff-source');
      const handoffTimestamp = localStorage.getItem('tool-handoff-timestamp');

      if (handoffData && handoffTimestamp) {
        const timestamp = parseInt(handoffTimestamp);
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        // Only use handoff data if it's less than 5 minutes old
        if (timestamp > fiveMinutesAgo) {
          setInput(handoffData);
          // Note: processJson will be called automatically via the autoFormat effect

          // Clean up handoff data
          localStorage.removeItem('tool-handoff-data');
          localStorage.removeItem('tool-handoff-source');
          localStorage.removeItem('tool-handoff-timestamp');
        }
      }
    } catch {}
  }, [getSavedConfig]);

  // Load layout mode preference
  useEffect(() => {
    const savedLayoutMode = localStorage.getItem('json-formatter-layout-mode') as 'resizable' | 'stacked' | 'tabs';
    if (savedLayoutMode) {
      setLayoutMode(savedLayoutMode);
    }
  }, []);

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

  const handleLayoutModeChange = useCallback((mode: 'resizable' | 'stacked' | 'tabs') => {
    setLayoutMode(mode);
    localStorage.setItem('json-formatter-layout-mode', mode);
  }, []);

  const handlePanelResize = useCallback((size: number) => {
    setPanelSizes(prev => ({
      ...prev,
      input: `${size}px`,
      output: `calc(100% - ${size}px - 4px)` // Account for gap
    }));
  }, []);

  const handleQuickAction = useCallback((action: 'prettify' | 'minify' | 'validate') => {
    switch (action) {
      case 'prettify':
        handleFormat();
        break;
      case 'minify':
        handleMinify();
        break;
      case 'validate':
        handleValidate();
        break;
    }
  }, [handleFormat, handleMinify, handleValidate]);

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
    <div className={`json-formatter ${className}`}>
      {/* Enhanced Header with Layout Controls */}
      <div style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
          {/* Layout Mode Switcher */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginRight: 'var(--space-sm)' }}>
              Layout:
            </span>
            {(['resizable', 'stacked', 'tabs'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleLayoutModeChange(mode)}
                className={`btn ${layoutMode === mode ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  fontSize: '0.75rem',
                  padding: 'var(--space-sm) var(--space-md)',
                  textTransform: 'capitalize'
                }}
              >
                {mode === 'resizable' ? 'Side-by-Side' : mode}
              </button>
            ))}
          </div>

          {/* Stats Display */}
          <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <span>Size: <strong>{new Blob([input]).size.toLocaleString()} B</strong></span>
            <span>Lines: <strong>{input.split('\n').length}</strong></span>
            {metadata?.processingTimeMs && (
              <span>Time: <strong>{Math.round(metadata.processingTimeMs)}ms</strong></span>
            )}
            {error ? (
              <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>✗ Invalid JSON</span>
            ) : output ? (
              <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>✓ Valid JSON</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-md) var(--space-lg)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        alignItems: 'center'
      }}>
        {/* Primary Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleQuickAction('prettify')}
            className="btn btn-primary"
            title="Prettify JSON (Ctrl+Enter)"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
            </svg>
            Prettify
          </button>

          <button
            onClick={() => handleQuickAction('minify')}
            className="btn btn-secondary"
            title="Minify JSON (Ctrl+M)"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            </svg>
            Minify
          </button>

          <button
            onClick={() => handleQuickAction('validate')}
            className="btn btn-outline"
            title="Validate JSON only"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            Validate
          </button>

          <button onClick={handleClear} className="btn btn-outline" title="Clear all (Ctrl+L)">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/>
            </svg>
            Clear
          </button>

          <button onClick={handleToggleViewMode} className="btn btn-secondary" title={`Switch to ${viewMode === 'tree' ? 'text' : 'tree'} view (Ctrl+T)`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {viewMode === 'tree' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6"/>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
              )}
            </svg>
            {viewMode === 'tree' ? 'Text View' : 'Tree View'}
          </button>
        </div>

        {/* Auto-format Toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginLeft: 'auto'
        }}>
          <input
            type="checkbox"
            checked={autoFormat}
            onChange={(e) => setAutoFormat(e.target.checked)}
            style={{ accentColor: 'var(--color-primary)' }}
          />
          <span>Auto-format</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Automatically format JSON as you type">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </label>
      </div>

      {/* Main Editor Layout */}
      <div style={{ minHeight: '600px', position: 'relative' }}>
        {layoutMode === 'resizable' ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              initialWidth="50%"
              minWidth={300}
              onResize={handlePanelResize}
            >
              {/* Input Panel */}
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Input Header with Always-Visible Actions */}
                <div style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderBottom: '1px solid var(--color-border)',
                  padding: 'var(--space-md) var(--space-lg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Input JSON
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button onClick={handlePaste} className="btn btn-outline btn-sm">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                      </svg>
                      Paste
                    </button>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
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

                {/* Enhanced Input with Error Highlighting */}
                <div
                  style={{ flex: 1, position: 'relative' }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <ErrorHighlightTextarea
                    value={input}
                    onChange={setInput}
                    error={error}
                    placeholder="Paste your JSON here or drag & drop a file..."
                    style={{ height: '100%' }}
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
                      color: 'var(--color-primary)',
                      zIndex: 5
                    }}>
                      Drop JSON file here
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizablePanel initialWidth="50%" minWidth={300}>
              {/* Output Panel */}
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Output Header with Actions and Tool Handoff */}
                <div style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderBottom: '1px solid var(--color-border)',
                  padding: 'var(--space-md) var(--space-lg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {viewMode === 'tree' ? 'JSON Tree View' : 'Formatted Output'}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    {output && (
                      <>
                        <button
                          onClick={handleCopy}
                          className={`btn ${copied ? 'btn-secondary' : 'btn-outline'} btn-sm`}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={copied ? "M9 12l2 2 4-4" : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"}/>
                          </svg>
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={handleDownload} className="btn btn-outline btn-sm">
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3"/>
                          </svg>
                          Download
                        </button>
                        <ToolHandoff
                          currentToolId="json-formatter"
                          outputData={output}
                          relatedTools={relatedTools}
                        />
                      </>
                    )}
                  </div>
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
                <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
                  {error ? (
                    <div style={{
                      padding: 'var(--space-lg)',
                      backgroundColor: 'var(--color-danger-light)',
                      color: 'var(--color-danger)',
                      borderRadius: 'var(--radius-lg)',
                      margin: 'var(--space-lg)',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      border: '1px solid var(--color-danger)'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>JSON Error:</div>
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
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-primary)'
                      }}
                      spellCheck={false}
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Stacked/Tabs Layout for other modes */
          <div style={{ display: 'flex', flexDirection: layoutMode === 'stacked' ? 'column' : 'row', height: '100%' }}>
            {/* Input Section */}
            <div style={{ flex: 1, borderRight: layoutMode === 'tabs' ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{
                backgroundColor: 'var(--color-surface-secondary)',
                borderBottom: '1px solid var(--color-border)',
                padding: 'var(--space-md) var(--space-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 600 }}>Input JSON</span>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button onClick={handlePaste} className="btn btn-outline btn-sm">Paste</button>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    Upload
                    <input type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <ErrorHighlightTextarea
                value={input}
                onChange={setInput}
                error={error}
                placeholder="Paste your JSON here..."
                style={{ height: layoutMode === 'stacked' ? '300px' : 'calc(100vh - 400px)' }}
              />
            </div>

            {/* Output Section */}
            <div style={{ flex: 1 }}>
              <div style={{
                backgroundColor: 'var(--color-surface-secondary)',
                borderBottom: '1px solid var(--color-border)',
                padding: 'var(--space-md) var(--space-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 600 }}>
                  {viewMode === 'tree' ? 'JSON Tree View' : 'Formatted Output'}
                </span>
                {output && (
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button onClick={handleCopy} className={`btn ${copied ? 'btn-secondary' : 'btn-outline'} btn-sm`}>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <ToolHandoff currentToolId="json-formatter" outputData={output} relatedTools={relatedTools} />
                  </div>
                )}
              </div>
              <div style={{ height: layoutMode === 'stacked' ? '300px' : 'calc(100vh - 400px)', overflow: 'auto' }}>
                {error ? (
                  <div style={{ padding: 'var(--space-lg)', color: 'var(--color-danger)' }}>
                    <strong>JSON Error:</strong><br />{error}
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
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '14px',
                      padding: 'var(--space-lg)',
                      backgroundColor: 'transparent'
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Examples Section with Categories */}
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
            padding: 'var(--space-lg)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707"/>
              </svg>
              Quick Examples & Practice
            </div>
            <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div style={{ padding: 'var(--space-lg)' }}>
            {/* Category Tabs */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                {(['basic', 'advanced', 'broken'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedExampleCategory(category)}
                    className={`btn ${selectedExampleCategory === category ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {category === 'broken' ? '🐛 Fix These' : category === 'advanced' ? '🚀 Advanced' : '📝 Basic'}
                  </button>
                ))}
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                margin: 0
              }}>
                {selectedExampleCategory === 'broken'
                  ? 'Practice fixing common JSON syntax errors'
                  : selectedExampleCategory === 'advanced'
                  ? 'Real-world API responses and complex structures'
                  : 'Simple examples to get started with JSON formatting'
                }
              </p>
            </div>

            {/* Examples Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-lg)'
            }}>
              {EXAMPLES
                .filter(example => example.category === selectedExampleCategory)
                .map((example, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-lg)',
                  transition: 'box-shadow 0.2s'
                }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: 'var(--space-md)',
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)'
                  }}>
                    {example.category === 'broken' && '🔧'}
                    {example.title}
                  </div>
                  <div style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.75rem',
                    marginBottom: 'var(--space-md)',
                    maxHeight: '120px',
                    overflow: 'auto',
                    border: '1px solid var(--color-border-light)',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {example.value.substring(0, 200)}{example.value.length > 200 ? '...' : ''}
                  </div>
                  <button
                    onClick={() => {
                      setInput(example.value);
                      if (autoFormat) {
                        processJson(example.value, processedConfig);
                      }
                    }}
                    className={`btn ${example.category === 'broken' ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ width: '100%', fontSize: '0.875rem' }}
                  >
                    {example.category === 'broken' ? 'Try to Fix This' : 'Use This Example'}
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
