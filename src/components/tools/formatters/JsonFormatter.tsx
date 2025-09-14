import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatJson, type JsonFormatterConfig } from '../../../tools/formatters/json-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface JsonFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonFormatterConfig = {
  indent: 2,
  sortKeys: false,
  removeComments: true,
  validateOnly: false,
  // Keep advanced options with sensible defaults
  useTabs: false,
  sortKeysCaseInsensitive: false,
  allowSingleQuotes: true,
  replaceSpecialNumbers: 'none',
  inlineShortArrays: true,
  inlineArrayMaxLength: 5,
  inlineArrayMaxLineLength: 80,
  escapeUnicode: false,
  ensureFinalNewline: false,
  detectDuplicateKeys: true,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'indent',
    label: 'Indent',
    type: 'select' as const,
    default: 2,
    options: [
      { value: '2', label: '2 spaces' },
      { value: '4', label: '4 spaces' },
      { value: '0', label: 'Minified' },
    ],
    description: 'Indentation style',
  },
  {
    key: 'sortKeys',
    label: 'Sort Keys',
    type: 'boolean' as const,
    default: false,
    description: 'Sort object keys alphabetically',
  },
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Strip comments from JSONC input',
  },
  {
    key: 'validateOnly',
    label: 'Validate Only',
    type: 'boolean' as const,
    default: false,
    description: 'Only validate without formatting',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'useTabs',
    label: 'Use Tabs',
    type: 'boolean' as const,
    default: false,
    description: 'Use tabs instead of spaces',
    showWhen: (cfg: any) => Number(cfg.indent ?? 2) > 0,
  },
  {
    key: 'sortKeysCaseInsensitive',
    label: 'Case-Insensitive Sort',
    type: 'boolean' as const,
    default: false,
    description: 'Ignore case when sorting keys',
    showWhen: (cfg: any) => !!cfg.sortKeys,
  },
  {
    key: 'allowSingleQuotes',
    label: 'Allow Single Quotes',
    type: 'boolean' as const,
    default: true,
    description: 'Convert single quotes to double quotes',
  },
  {
    key: 'replaceSpecialNumbers',
    label: 'Special Numbers',
    type: 'select' as const,
    default: 'none',
    options: [
      { value: 'none', label: 'Keep as-is' },
      { value: 'null', label: 'Convert to null' },
      { value: 'string', label: 'Convert to string' },
    ],
    description: 'How to handle NaN/Infinity',
  },
  {
    key: 'escapeUnicode',
    label: 'Escape Unicode',
    type: 'boolean' as const,
    default: false,
    description: 'Escape non-ASCII characters',
  },
];

const EXAMPLES = [
  {
    title: 'Basic Object',
    value: '{"name":"John","age":30,"city":"New York"}',
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
    title: 'With Comments (Invalid JSON)',
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

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
    
    // Process immediately for manual format button
    const result = formatJson(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
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
    }
    
    setIsLoading(false);
  }, [input, processedConfig, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processJson, 500),
    [processJson]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, processedConfig);
    }
  }, [input, processedConfig, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleBeautify = useCallback(() => {
    const beautifyConfig = { ...processedConfig, indent: 2, sortKeys: false };
    setConfig(beautifyConfig);
    processJson(input, beautifyConfig);
  }, [input, processedConfig, processJson]);

  const handleMinify = useCallback(() => {
    const minifyConfig = { ...processedConfig, indent: 0 };
    setConfig(minifyConfig);
    processJson(input, minifyConfig);
  }, [input, processedConfig, processJson]);

  const handleSortKeys = useCallback(() => {
    const sortConfig = { ...processedConfig, sortKeys: true };
    setConfig(sortConfig);
    processJson(input, sortConfig);
  }, [input, processedConfig, processJson]);

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

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JsonFormatterConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('json-formatter', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processJson(input, { ...processedConfig, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            processJson();
            break;
          case 'm':
            e.preventDefault();
            handleMinify();
            break;
          case 's':
            if (e.shiftKey) {
              e.preventDefault();
              handleSortKeys();
            }
            break;
          case 'k':
            e.preventDefault();
            setShowKeyboardHelp(!showKeyboardHelp);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [processJson, handleMinify, handleSortKeys, showKeyboardHelp]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Sticky Tool Header with Quick Actions */}
      <div className="sticky top-0 z-10 flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Quick Actions with Mobile-First Design */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBeautify}
            className="px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-auto"
            title="Format JSON with 2-space indentation"
          >
            <span className="flex items-center gap-1">
              ✨ <span className="hidden sm:inline">Beautify</span><span className="sm:hidden">Format</span>
            </span>
          </button>
          <button
            onClick={handleMinify}
            className="px-4 py-3 sm:py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-auto"
            title="Minimize JSON to single line (Ctrl+M)"
          >
            <span className="flex items-center gap-1">
              🗜️ <span className="hidden sm:inline">Minify</span><span className="sm:hidden">Min</span>
            </span>
          </button>
          <button
            onClick={handleSortKeys}
            className="px-4 py-3 sm:py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-auto"
            title="Sort object keys alphabetically (Ctrl+Shift+S)"
          >
            <span className="flex items-center gap-1">
              🔤 <span className="hidden sm:inline">Sort</span>
            </span>
          </button>
          {!autoFormat && (
            <button
              onClick={() => processJson()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 sm:py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-auto"
              title="Process JSON (Ctrl+Enter)"
            >
              {isLoading ? '⏳' : '⚡'} <span className="hidden sm:inline">Format</span>
            </button>
          )}
          <button
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            className="hidden sm:flex px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors items-center"
            title="Keyboard shortcuts (Ctrl+K)"
          >
            ⌨️
          </button>
        </div>

        {/* Settings and Auto-format */}
        <div className="flex items-center gap-4 ml-auto">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="rounded"
            />
            Auto-format
          </label>
        </div>
      </div>

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Format JSON</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Minify</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+M</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Sort Keys</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Shift+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Show/Hide Help</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+K</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Mobile-Optimized Interface */}
      <div className="flex flex-col md:flex-row flex-1 min-h-[600px] md:min-h-[700px]">
        {/* Input Section */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          {/* Input Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                JSON Input
              </h3>
              {input && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {input.length.toLocaleString()} characters
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                📁 Upload
                <input
                  type="file"
                  accept=".json,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
              {input && (
                <button
                  onClick={() => setInput('')}
                  className="text-xs px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  title="Clear input"
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div 
            className={`flex-1 relative ${dragActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your JSON here or drag & drop a file..."
              className="w-full h-full min-h-[300px] md:min-h-[400px] p-4 resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm md:text-base border-none focus:outline-none focus:ring-0 touch-manipulation"
              spellCheck={false}
              style={{
                lineHeight: '1.5',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'text'
              }}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop JSON file here
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Examples */}
          <details className="group bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Quick Examples</span>
              <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-3 pb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLES.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(example.value)}
                    className="text-left p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                    title={`Click to try: ${example.title}`}
                  >
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {example.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                      {example.value.substring(0, 50)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </details>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Output Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Formatted JSON
              </h3>
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Processing...</span>}
              {!error && output && (
                <>
                  <span className="text-xs text-green-600 dark:text-green-400">✓ Valid</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {output.length.toLocaleString()} characters
                  </span>
                </>
              )}
              {error && <span className="text-xs text-red-600 dark:text-red-400">✗ Invalid</span>}
            </div>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button
                    onClick={handleCopy}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      copied 
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    💾 Download
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Output Content */}
          <div className="flex-1 bg-white dark:bg-gray-800">
            {error ? (
              <div className="p-4 h-full">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">JSON Error</h4>
                  <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                    {error}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <textarea
                  value={output}
                  readOnly
                  placeholder="Formatted JSON will appear here..."
                  className="flex-1 min-h-[300px] md:min-h-[400px] p-4 resize-y bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm md:text-base border-none focus:outline-none touch-manipulation"
                  spellCheck={false}
                  style={{
                    lineHeight: '1.5',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'text'
                  }}
                />
              </div>
            )}
          </div>

          {/* Enhanced metadata */}
          {metadata && !error && output && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {metadata.type && (
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Type</div>
                    <div className="text-gray-600 dark:text-gray-400 capitalize">{metadata.type}</div>
                  </div>
                )}
                {typeof metadata.formattedSize === 'number' && (
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Size</div>
                    <div className="text-gray-600 dark:text-gray-400">{metadata.formattedSize.toLocaleString()} chars</div>
                  </div>
                )}
                {typeof metadata.processingTimeMs === 'number' && (
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Processing</div>
                    <div className="text-gray-600 dark:text-gray-400">{Math.round(metadata.processingTimeMs)}ms</div>
                  </div>
                )}
                {typeof metadata.duplicateCount === 'number' && metadata.duplicateCount > 0 && (
                  <div className="text-center">
                    <div className="font-medium text-amber-600 dark:text-amber-400">⚠️ Duplicates</div>
                    <div className="text-amber-600 dark:text-amber-400">{metadata.duplicateCount} keys</div>
                  </div>
                )}
                {/* Memory usage indicator for large files */}
                {input.length > 100000 && (
                  <div className="text-center">
                    <div className="font-medium text-orange-600 dark:text-orange-400">Memory</div>
                    <div className="text-orange-600 dark:text-orange-400">
                      {input.length > 1000000 ? 'High' : 'Moderate'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Essential Options Panel */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Options</h4>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {showAdvanced ? '△ Less' : '▽ More'}
            </button>
          </div>
          
          {/* Essential options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
                {option.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof JsonFormatterConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof JsonFormatterConfig] ?? option.default)}
                    onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                    className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {option.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ))}
          </div>

          {/* Advanced options */}
          {showAdvanced && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Advanced Options</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADVANCED_OPTIONS.filter(option => !option.showWhen || option.showWhen(config)).map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof JsonFormatterConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof JsonFormatterConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {option.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}