import { useState, useEffect, useMemo, useCallback } from 'react';
import { processUrl, type UrlEncoderConfig } from '../../../tools/encoders/url-encoder';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface UrlEncoderProps {
  className?: string;
}

const DEFAULT_CONFIG: UrlEncoderConfig = {
  mode: 'encode',
  encodeSpaces: 'percent',
  encodeReserved: false,
  component: false,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'encode',
    options: [
      { value: 'encode', label: 'Encode (Text → URL)' },
      { value: 'decode', label: 'Decode (URL → Text)' },
    ],
    description: 'Choose encoding or decoding operation',
  },
  {
    key: 'component',
    label: 'Component Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Use encodeURIComponent (for parameters) vs encodeURI (for full URLs)',
  },
  {
    key: 'encodeSpaces',
    label: 'Space Encoding',
    type: 'select' as const,
    default: 'percent',
    options: [
      { value: 'percent', label: 'Percent (%20)' },
      { value: 'plus', label: 'Plus (+)' },
    ],
    description: 'How to encode spaces in URLs',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'encodeReserved',
    label: 'Encode Reserved',
    type: 'boolean' as const,
    default: false,
    description: 'Encode additional reserved characters (encode mode only)',
  },
];

const ENCODE_EXAMPLES = [
  {
    title: 'URL with Spaces',
    value: 'https://example.com/hello world.html',
  },
  {
    title: 'Query Parameters',
    value: 'name=John Doe&email=john@example.com&message=Hello, World!',
  },
  {
    title: 'Path with Special Chars',
    value: '/api/users/search?q=user name & category',
  },
  {
    title: 'Unicode Characters',
    value: 'café résumé naïve',
  },
];

const DECODE_EXAMPLES = [
  {
    title: 'URL with Encoded Spaces',
    value: 'https%3A//example.com/hello%20world.html',
  },
  {
    title: 'Query Parameters',
    value: 'name%3DJohn%20Doe%26email%3Djohn%40example.com',
  },
  {
    title: 'Plus Encoded Spaces',
    value: 'name=John+Doe&message=Hello+World',
  },
  {
    title: 'Unicode Characters',
    value: 'caf%C3%A9%20r%C3%A9sum%C3%A9%20na%C3%AFve',
  },
];

export function UrlEncoder({ className = '' }: UrlEncoderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<UrlEncoderConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('url-encoder') as Partial<UrlEncoderConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Get appropriate examples based on mode
  const examples = useMemo(() => {
    return config.mode === 'encode' ? ENCODE_EXAMPLES : DECODE_EXAMPLES;
  }, [config.mode]);

  // Process URL function
  const processUrlHandler = useCallback((inputText: string = input, cfg: UrlEncoderConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processUrl(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'url-encoder',
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
  }, [input, config, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processUrlHandler, 500),
    [processUrlHandler]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // Clear input/output when mode changes
  useEffect(() => {
    setInput('');
    setOutput('');
    setError(undefined);
    setMetadata(undefined);
  }, [config.mode]);

  // Quick action handlers
  const handleEncode = useCallback(() => {
    const encodeConfig = { ...config, mode: 'encode' as const };
    setConfig(encodeConfig);
    processUrlHandler(input, encodeConfig);
  }, [input, config, processUrlHandler]);

  const handleDecode = useCallback(() => {
    const decodeConfig = { ...config, mode: 'decode' as const };
    setConfig(decodeConfig);
    processUrlHandler(input, decodeConfig);
  }, [input, config, processUrlHandler]);

  const handleComponent = useCallback(() => {
    const componentConfig = { ...config, component: true };
    setConfig(componentConfig);
    processUrlHandler(input, componentConfig);
  }, [input, config, processUrlHandler]);

  // File upload handler (only for encode mode)
  const handleFileUpload = useCallback(async (file: File) => {
    if (config.mode !== 'encode') return;
    
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processUrlHandler(content, config);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [config, autoFormat, processUrlHandler]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (config.mode === 'encode') {
      setDragActive(true);
    }
  }, [config.mode]);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (config.mode === 'encode') {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    }
  }, [config.mode, handleFileUpload]);

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
    const filename = config.mode === 'encode' ? 'encoded-url.txt' : 'decoded-text.txt';
    downloadFile(output, filename, 'text/plain');
  }, [output, config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: UrlEncoderConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('url-encoder', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processUrlHandler(input, newConfig);
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
            onClick={handleEncode}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
              config.mode === 'encode' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title="Encode text to URL-encoded format"
          >
            🔐 Encode
          </button>
          <button
            onClick={handleDecode}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
              config.mode === 'decode' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title="Decode URL-encoded text"
          >
            🔓 Decode
          </button>
          <button
            onClick={handleComponent}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
              config.component 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title="Encode as URL component (parameters)"
          >
            🧩 Component
          </button>
          {!autoFormat && (
            <button
              onClick={() => processUrlHandler()}
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
            Auto-process
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
              {config.mode === 'encode' ? 'Text/URL Input' : 'Encoded URL Input'}
            </h3>
            <div className="flex items-center gap-2">
              {config.mode === 'encode' && (
                <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                  📁 Upload
                  <input
                    type="file"
                    accept=".txt,.url,.html"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                </label>
              )}
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
              placeholder={config.mode === 'encode' 
                ? 'Enter text or URL to encode...' 
                : 'Enter URL encoded string to decode...'}
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && config.mode === 'encode' && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop text file here
                </div>
              </div>
            )}
          </div>

          {/* Example buttons */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Examples:</span>
              {examples.map((example, idx) => (
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
              {config.mode === 'encode' ? 'URL Encoded Output' : 'Decoded Text'}
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">URL Encoding Error</h4>
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
                  placeholder={`${config.mode === 'encode' ? 'URL encoded' : 'Decoded'} text will appear here...`}
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Metadata display */}
          {metadata && !error && output && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                {typeof metadata.inputLength === 'number' && (
                  <span><strong>Input:</strong> {metadata.inputLength} chars</span>
                )}
                {typeof metadata.outputLength === 'number' && (
                  <span><strong>Output:</strong> {metadata.outputLength} chars</span>
                )}
                {typeof metadata.isValidUrl === 'boolean' && (
                  <span><strong>Valid URL:</strong> {metadata.isValidUrl ? 'Yes' : 'No'}</span>
                )}
                {typeof metadata.encodingRatio === 'number' && (
                  <span><strong>Size Change:</strong> {metadata.encodingRatio > 1 ? '+' : ''}{((metadata.encodingRatio - 1) * 100).toFixed(1)}%</span>
                )}
                {typeof metadata.processingTimeMs === 'number' && (
                  <span><strong>Time:</strong> {Math.round(metadata.processingTimeMs)}ms</span>
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
            {ADVANCED_OPTIONS.length > 0 && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {showAdvanced ? '△ Less' : '▽ More'}
              </button>
            )}
          </div>
          
          {/* Essential options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
                {option.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof UrlEncoderConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof UrlEncoderConfig] ?? option.default)}
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
          {showAdvanced && ADVANCED_OPTIONS.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Advanced Options</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADVANCED_OPTIONS.map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof UrlEncoderConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof UrlEncoderConfig] ?? option.default)}
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