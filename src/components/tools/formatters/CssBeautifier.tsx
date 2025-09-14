import { useState, useEffect, useMemo, useCallback } from 'react';
import { processCssBeautifier, type CssBeautifierConfig, type ValidationError } from '../../../tools/formatters/css-beautifier';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface CssBeautifierProps {
  className?: string;
}

const DEFAULT_CONFIG: CssBeautifierConfig = {
  mode: 'beautify',
  indentSize: 2,
  indentType: 'spaces',
  insertNewLineBeforeOpeningBrace: false,
  insertNewLineAfterOpeningBrace: false,
  insertNewLineBeforeClosingBrace: false,
  insertNewLineAfterRule: true,
  insertNewLineAfterComma: false,
  preserveComments: true,
  removeEmptyRules: false,
  sortProperties: false,
  insertSpaceAfterColon: true,
  insertSpaceAfterComma: true,
  insertSpaceBeforeOpeningBrace: true,
  autoprefixer: false,
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
    description: 'Format or compress CSS',
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
    key: 'sortProperties',
    label: 'Sort Properties',
    type: 'boolean' as const,
    default: false,
    description: 'Sort properties alphabetically',
  },
  {
    key: 'preserveComments',
    label: 'Preserve Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Keep CSS comments',
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
    key: 'insertSpaceBeforeOpeningBrace',
    label: 'Space Before Opening Brace',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space before { in selectors',
  },
  {
    key: 'insertSpaceAfterColon',
    label: 'Space After Colon',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space after : in property declarations',
  },
  {
    key: 'insertNewLineAfterRule',
    label: 'New Line After Rule',
    type: 'boolean' as const,
    default: true,
    description: 'Insert empty line after each CSS rule',
  },
  {
    key: 'removeEmptyRules',
    label: 'Remove Empty Rules',
    type: 'boolean' as const,
    default: false,
    description: 'Remove CSS rules that have no properties',
  },
  {
    key: 'insertNewLineBeforeOpeningBrace',
    label: 'New Line Before Opening Brace',
    type: 'boolean' as const,
    default: false,
    description: 'Insert new line before opening brace',
  },
  {
    key: 'insertNewLineAfterOpeningBrace',
    label: 'New Line After Opening Brace',
    type: 'boolean' as const,
    default: false,
    description: 'Insert new line after opening brace',
  },
  {
    key: 'insertNewLineBeforeClosingBrace',
    label: 'New Line Before Closing Brace',
    type: 'boolean' as const,
    default: false,
    description: 'Insert new line before closing brace',
  },
  {
    key: 'insertSpaceAfterComma',
    label: 'Space After Comma',
    type: 'boolean' as const,
    default: true,
    description: 'Insert space after commas in selectors',
  },
];

const EXAMPLES = [
  {
    title: 'Minified CSS',
    value: `.container{width:100%;margin:0 auto;padding:20px}.header{background-color:#333;color:white;padding:10px}.header h1{margin:0;font-size:24px}@media (max-width:768px){.container{padding:10px}}`,
  },
  {
    title: 'Flexbox Layout',
    value: `.flex-container{display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-height:100vh}.flex-item{flex:1 0 auto;padding:1rem;border:1px solid #ccc}@media(min-width:768px){.flex-container{flex-direction:row}}`,
  },
  {
    title: 'CSS Grid with Variables',
    value: `:root{--grid-gap:1rem;--primary-color:#007bff;--secondary-color:#6c757d}.grid-container{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--grid-gap);padding:var(--grid-gap)}.grid-item{background:var(--primary-color);color:white;padding:1rem;border-radius:0.5rem}`,
  },
  {
    title: 'Bootstrap Components',
    value: `.btn{display:inline-block;padding:.375rem .75rem;margin-bottom:0;font-size:1rem;line-height:1.5;text-align:center;white-space:nowrap;vertical-align:middle;cursor:pointer;border:1px solid transparent;border-radius:.25rem}.btn-primary{color:#fff;background-color:#007bff;border-color:#007bff}.btn-primary:hover{color:#fff;background-color:#0069d9;border-color:#0062cc}`,
  },
  {
    title: 'Animations & Keyframes',
    value: `@keyframes slideIn{0%{opacity:0;transform:translateX(-100%)}100%{opacity:1;transform:translateX(0)}}.slide-animation{animation:slideIn 0.5s ease-in-out forwards}.fade-in{transition:opacity 0.3s ease-in-out;opacity:0}.fade-in.active{opacity:1}`,
  },
];

export function CssBeautifier({ className = '' }: CssBeautifierProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CssBeautifierConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('css-beautifier') as Partial<CssBeautifierConfig>) || {};
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

  // Process CSS function
  const processCssInput = useCallback((inputText: string = input, cfg: CssBeautifierConfig = processedConfig) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processCssBeautifier(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.stats);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'css-beautifier',
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
    () => debounce(processCssInput, 500),
    [processCssInput]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, processedConfig);
    }
  }, [input, processedConfig, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleBeautify = useCallback(() => {
    const beautifyConfig = { ...processedConfig, mode: 'beautify', indentSize: 2 };
    setConfig(beautifyConfig);
    processCssInput(input, beautifyConfig);
  }, [input, processedConfig, processCssInput]);

  const handleMinify = useCallback(() => {
    const minifyConfig = { ...processedConfig, mode: 'minify', indentSize: 0 };
    setConfig(minifyConfig);
    processCssInput(input, minifyConfig);
  }, [input, processedConfig, processCssInput]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processCssInput(content, processedConfig);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, processedConfig, processCssInput]);

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
    const filename = config.mode === 'minify' ? 'formatted.min.css' : 'formatted.css';
    downloadFile(output, filename, 'text/css');
  }, [output, config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: CssBeautifierConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('css-beautifier', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processCssInput(input, { ...processedConfig, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBeautify}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Format CSS with proper indentation"
          >
            ✨ Beautify
          </button>
          <button
            onClick={handleMinify}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Minimize CSS to single line"
          >
            🗜️ Minify
          </button>
          {!autoFormat && (
            <button
              onClick={() => processCssInput()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? '⏳' : '⚡'} Process
            </button>
          )}
        </div>

        {/* Auto-format toggle */}
        <div className="flex items-center gap-2 ml-auto">
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

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Input Section */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
          {/* Input Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              CSS Input
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                📁 Upload
                <input
                  type="file"
                  accept=".css,.scss,.sass,.less"
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
              placeholder="Paste your CSS here or drag & drop a file..."
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop CSS file here
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
              {config.mode === 'beautify' ? 'Formatted' : 'Minified'} CSS
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
                </>
              )}
            </div>
          </div>

          {/* Output Content */}
          <div className="flex-1 bg-white dark:bg-gray-800">
            {error ? (
              <div className="p-4 h-full">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">CSS Error</h4>
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
                  placeholder="Formatted CSS will appear here..."
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* CSS metadata */}
          {metadata && !error && output && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                {typeof metadata.originalSize === 'number' && (
                  <span><strong>Original:</strong> {metadata.originalSize.toLocaleString()}B</span>
                )}
                {typeof metadata.processedSize === 'number' && (
                  <span><strong>Processed:</strong> {metadata.processedSize.toLocaleString()}B</span>
                )}
                {typeof metadata.compressionRatio === 'number' && (
                  <span><strong>Ratio:</strong> {(metadata.compressionRatio * 100).toFixed(1)}%</span>
                )}
                {typeof metadata.ruleCount === 'number' && (
                  <span><strong>Rules:</strong> {metadata.ruleCount}</span>
                )}
                {typeof metadata.propertyCount === 'number' && (
                  <span><strong>Properties:</strong> {metadata.propertyCount}</span>
                )}
                {typeof metadata.lineCount === 'number' && (
                  <span><strong>Lines:</strong> {metadata.lineCount}</span>
                )}
                {metadata.errors && metadata.errors.length > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    <strong>⚠️ Errors:</strong> {metadata.errors.length}
                  </span>
                )}
                {metadata.warnings && metadata.warnings.length > 0 && (
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
                      checked={!!config[option.key as keyof CssBeautifierConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof CssBeautifierConfig] ?? option.default)}
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
                          checked={!!config[option.key as keyof CssBeautifierConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof CssBeautifierConfig] ?? option.default)}
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