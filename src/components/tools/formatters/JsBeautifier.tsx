import { useState, useEffect, useMemo, useCallback } from 'react';
import { processJsBeautifier, type JsBeautifierConfig, type ValidationError } from '../../../tools/formatters/js-beautifier';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import { openFormatterInNewWindow } from '../../../lib/utils/window-manager';

interface JsBeautifierProps {
  className?: string;
}

const DEFAULT_CONFIG: JsBeautifierConfig = {
  mode: 'beautify',
  indentSize: 2,
  indentType: 'spaces',
  maxLineLength: 80,
  insertSpaceAfterKeywords: true,
  insertSpaceBeforeFunctionParen: false,
  insertSpaceAfterFunctionParen: false,
  insertSpaceBeforeOpeningBrace: true,
  insertNewLineBeforeOpeningBrace: false,
  insertNewLineAfterOpeningBrace: true,
  insertNewLineBeforeClosingBrace: true,
  preserveComments: true,
  preserveEmptyLines: false,
  addSemicolons: false,
  quoteStyle: 'preserve',
  trailingCommas: false,
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
    description: 'Format or compress code',
  },
  {
    key: 'indentSize',
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
    key: 'preserveComments',
    label: 'Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Preserve comments in output',
  },
  {
    key: 'addSemicolons',
    label: 'Semicolons',
    type: 'boolean' as const,
    default: false,
    description: 'Add missing semicolons',
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
    description: 'Use spaces or tabs for indentation',
    showWhen: (cfg: any) => Number(cfg.indentSize ?? 2) > 0,
  },
  {
    key: 'quoteStyle',
    label: 'Quote Style',
    type: 'select' as const,
    default: 'preserve',
    options: [
      { value: 'preserve', label: 'Preserve Original' },
      { value: 'single', label: 'Single Quotes' },
      { value: 'double', label: 'Double Quotes' },
    ],
    description: 'Preferred quote style for strings',
  },
  {
    key: 'insertSpaceAfterKeywords',
    label: 'Space After Keywords',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space after keywords like if, while, for',
  },
  {
    key: 'insertSpaceBeforeOpeningBrace',
    label: 'Space Before Opening Brace',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space before { in functions and blocks',
  },
  {
    key: 'insertSpaceBeforeFunctionParen',
    label: 'Space Before Function Paren',
    type: 'boolean' as const,
    default: false,
    description: 'Insert space before function parentheses',
  },
  {
    key: 'trailingCommas',
    label: 'Trailing Commas',
    type: 'boolean' as const,
    default: false,
    description: 'Add trailing commas where valid',
  },
  {
    key: 'validateSyntax',
    label: 'Validate Syntax',
    type: 'boolean' as const,
    default: true,
    description: 'Check for syntax errors and warnings',
  },
];

const EXAMPLES = [
  {
    title: 'Minified JavaScript',
    value: `function calculate(a,b){if(a>b){return a+b;}else{return a-b;}}const users=[{name:"John",age:30},{name:"Jane",age:25}];users.forEach(user=>{console.log(\`\${user.name} is \${user.age} years old\`);});`,
  },
  {
    title: 'React Component',
    value: `const MyComponent=({data,loading})=>{const[state,setState]=useState(null);useEffect(()=>{if(data){setState(processData(data));}},data);if(loading)return <Spinner/>;return <div className="container">{state?<DataView data={state}/>:<EmptyState/>}</div>;};`,
  },
  {
    title: 'ES6 Functions',
    value: `const api={get:async(url)=>{const res=await fetch(url);return res.json();},post:async(url,data)=>{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return res.json();}};`,
  },
  {
    title: 'Complex Logic',
    value: `async function fetchUserData(id){try{const response=await fetch(\`/api/users/\${id}\`);if(!response.ok)throw new Error("Failed to fetch");const user=await response.json();return user;}catch(error){console.error("Error:",error);return null;}}`,
  },
];

export function JsBeautifier({ className = '' }: JsBeautifierProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsBeautifierConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('js-beautifier') as Partial<JsBeautifierConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Convert string values from select to numbers for indentSize
  const processedConfig = useMemo(() => ({
    ...config,
    indentSize: parseInt(String(config.indentSize)) || 2,
  }), [config]);

  // Process JavaScript function
  const processJs = useCallback((inputText: string = input, cfg: JsBeautifierConfig = processedConfig) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processJsBeautifier(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata({
        originalSize: result.stats?.originalSize,
        processedSize: result.stats?.processedSize,
        compressionRatio: result.stats?.compressionRatio,
        lineCount: result.stats?.lineCount,
        functionCount: result.stats?.functionCount,
        variableCount: result.stats?.variableCount,
        errors: result.stats?.errors || [],
        warnings: result.stats?.warnings || [],
      });
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'js-beautifier',
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
    () => debounce(processJs, 500),
    [processJs]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, processedConfig);
    }
  }, [input, processedConfig, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleBeautify = useCallback(() => {
    const beautifyConfig: JsBeautifierConfig = { ...processedConfig, mode: 'beautify' as const, indentSize: 2 };
    setConfig(beautifyConfig);
    processJs(input, beautifyConfig);
  }, [input, processedConfig, processJs]);

  const handleMinify = useCallback(() => {
    const minifyConfig: JsBeautifierConfig = { ...processedConfig, mode: 'minify' as const };
    setConfig(minifyConfig);
    processJs(input, minifyConfig);
  }, [input, processedConfig, processJs]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...processedConfig, validateSyntax: true };
    setConfig(validateConfig);
    processJs(input, validateConfig);
  }, [input, processedConfig, processJs]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processJs(content, processedConfig);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, processedConfig, processJs]);

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
    const filename = config.mode === 'minify' ? 'formatted.min.js' : 'formatted.js';
    downloadFile(output, filename, 'application/javascript');
  }, [output, config.mode]);

  // Open in new window handler
  const handleOpenInNewWindow = useCallback(() => {
    const filename = config.mode === 'minify' ? 'formatted.min.js' : 'formatted.js';
    openFormatterInNewWindow(output, 'javascript', 'JavaScript Beautifier', filename);
  }, [output, config.mode]);

  // Paste handler
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      if (autoFormat) {
        processJs(text, processedConfig);
      }
    } catch (error) {
      console.warn('Failed to paste from clipboard');
    }
  }, [autoFormat, processedConfig, processJs]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(undefined);
    setMetadata(undefined);
  }, []);

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
            handleBeautify();
            break;
          case 'm':
            e.preventDefault();
            handleMinify();
            break;
          case 'l':
            e.preventDefault();
            handleClear();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleBeautify, handleMinify, handleClear]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JsBeautifierConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('js-beautifier', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processJs(input, { ...processedConfig, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

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
            <button onClick={handleBeautify} className="btn btn-primary" title="Beautify JavaScript (Ctrl+Enter)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z"/>
              </svg>
              Beautify JS
            </button>

            <button onClick={handleValidate} className="btn btn-secondary" title="Validate JavaScript">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
              </svg>
              Validate
            </button>

            <button onClick={handleMinify} className="btn btn-outline" title="Minify JavaScript (Ctrl+M)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 712-2h2a2 2 0 012 2"/>
              </svg>
              Minify
            </button>

            <button onClick={handleClear} className="btn btn-outline" title="Clear all (Ctrl+L)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear
            </button>
          </div>

          {/* Stats & Settings */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <span>Size: <strong>{new Blob([input]).size.toLocaleString()} B</strong></span>
              <span>Lines: <strong>{input.split('\n').length}</strong></span>
              {metadata && (
                <>
                  <span>Functions: <strong>{metadata.functionCount || 0}</strong></span>
                  {metadata.compressionRatio && (
                    <span>Ratio: <strong>{(metadata.compressionRatio * 100).toFixed(1)}%</strong></span>
                  )}
                </>
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

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Input Section */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
          {/* Input Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              JavaScript Input
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                📁 Upload
                <input
                  type="file"
                  accept=".js,.ts,.jsx,.tsx,.mjs"
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
              placeholder="Paste your JavaScript code here or drag & drop a file..."
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop JavaScript file here
                </div>
              </div>
            )}
          </div>

          {/* Example buttons */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Examples:</span>
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(example.value)}
                  className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  title={example.title}
                >
                  {example.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Output Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {config.mode === 'beautify' ? 'Formatted' : 'Minified'} JavaScript
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Processing...</span>}
              {!error && output && <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Valid</span>}
              {error && <span className="ml-2 text-xs text-red-600 dark:text-red-400">✗ Invalid</span>}
            </h3>
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
                  <button
                    onClick={handleOpenInNewWindow}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    🔗 Open in New Window
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">JavaScript Error</h4>
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
                  placeholder="Formatted JavaScript will appear here..."
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Simplified metadata */}
          {metadata && !error && output && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                {typeof metadata.originalSize === 'number' && (
                  <span><strong>Original:</strong> {metadata.originalSize} chars</span>
                )}
                {typeof metadata.processedSize === 'number' && (
                  <span><strong>Processed:</strong> {metadata.processedSize} chars</span>
                )}
                {typeof metadata.compressionRatio === 'number' && (
                  <span><strong>Ratio:</strong> {(metadata.compressionRatio * 100).toFixed(1)}%</span>
                )}
                {typeof metadata.lineCount === 'number' && (
                  <span><strong>Lines:</strong> {metadata.lineCount}</span>
                )}
                {typeof metadata.functionCount === 'number' && (
                  <span><strong>Functions:</strong> {metadata.functionCount}</span>
                )}
                {typeof metadata.variableCount === 'number' && (
                  <span><strong>Variables:</strong> {metadata.variableCount}</span>
                )}
                {Array.isArray(metadata.errors) && metadata.errors.length > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    <strong>⚠️ Errors:</strong> {metadata.errors.length}
                  </span>
                )}
                {Array.isArray(metadata.warnings) && metadata.warnings.length > 0 && (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    <strong>⚠️ Warnings:</strong> {metadata.warnings.length}
                  </span>
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
                      checked={!!config[option.key as keyof JsBeautifierConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof JsBeautifierConfig] ?? option.default)}
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
                          checked={!!config[option.key as keyof JsBeautifierConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof JsBeautifierConfig] ?? option.default)}
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