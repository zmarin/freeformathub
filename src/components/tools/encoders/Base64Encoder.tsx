import { useState, useEffect, useMemo, useCallback } from 'react';
import { processBase64, type Base64EncoderConfig } from '../../../tools/encoders/base64-encoder';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface Base64EncoderProps {
  className?: string;
}

const DEFAULT_CONFIG: Base64EncoderConfig = {
  mode: 'encode',
  lineBreaks: false,
  urlSafe: false,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'encode',
    options: [
      { value: 'encode', label: 'Encode (Text → Base64)' },
      { value: 'decode', label: 'Decode (Base64 → Text)' },
    ],
    description: 'Choose encoding or decoding operation',
  },
  {
    key: 'urlSafe',
    label: 'URL-Safe',
    type: 'boolean' as const,
    default: false,
    description: 'Use URL-safe Base64 (replaces +/= with -_)',
  },
  {
    key: 'lineBreaks',
    label: 'Line Breaks',
    type: 'boolean' as const,
    default: false,
    description: 'Add line breaks every 64 characters (encode only)',
  },
];

// Advanced options for power users (currently empty but structure ready)
const ADVANCED_OPTIONS: any[] = [];

const ENCODE_EXAMPLES = [
  {
    title: 'Simple Text',
    value: 'Hello, World!',
  },
  {
    title: 'Email Address',
    value: 'user@example.com',
  },
  {
    title: 'JSON Data',
    value: '{"name":"John","age":30,"email":"john@example.com"}',
  },
  {
    title: 'URL with Parameters',
    value: 'https://example.com/api?user=john&token=abc123',
  },
];

const DECODE_EXAMPLES = [
  {
    title: 'Simple Text',
    value: 'SGVsbG8sIFdvcmxkIQ==',
  },
  {
    title: 'Email Address',
    value: 'dXNlckBleGFtcGxlLmNvbQ==',
  },
  {
    title: 'JSON Data',
    value: 'eyJuYW1lIjoiSm9obiIsImFnZSI6MzAsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSJ9',
  },
  {
    title: 'URL-Safe Base64',
    value: 'aHR0cHM6Ly9leGFtcGxlLmNvbS9hcGk_dXNlcj1qb2huJnRva2VuPWFiYzEyMw',
  },
];

export function Base64Encoder({ className = '' }: Base64EncoderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<Base64EncoderConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('base64-encoder') as Partial<Base64EncoderConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Get appropriate examples based on mode
  const examples = useMemo(() => {
    return config.mode === 'encode' ? ENCODE_EXAMPLES : DECODE_EXAMPLES;
  }, [config.mode]);

  // Process Base64 function
  const processBase64Handler = useCallback((inputText: string = input, cfg: Base64EncoderConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processBase64(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'base64-encoder',
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
    () => debounce(processBase64Handler, 500),
    [processBase64Handler]
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
    processBase64Handler(input, encodeConfig);
  }, [input, config, processBase64Handler]);

  const handleDecode = useCallback(() => {
    const decodeConfig = { ...config, mode: 'decode' as const };
    setConfig(decodeConfig);
    processBase64Handler(input, decodeConfig);
  }, [input, config, processBase64Handler]);

  const handleValidate = useCallback(() => {
    if (config.mode === 'decode') {
      processBase64Handler(input, config);
    } else {
      // For encode mode, just show if input is valid text
      processBase64Handler(input, config);
    }
  }, [input, config, processBase64Handler]);

  // File upload handler (only for encode mode)
  const handleFileUpload = useCallback(async (file: File) => {
    if (config.mode !== 'encode') return;
    
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processBase64Handler(content, config);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [config, autoFormat, processBase64Handler]);

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
    const filename = config.mode === 'encode' ? 'encoded.txt' : 'decoded.txt';
    downloadFile(output, filename, 'text/plain');
  }, [output, config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: Base64EncoderConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('base64-encoder', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processBase64Handler(input, newConfig);
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
            title="Encode text to Base64"
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
            title="Decode Base64 to text"
          >
            🔓 Decode
          </button>
          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Validate current input"
          >
            ✓ Validate
          </button>
          {!autoFormat && (
            <button
              onClick={() => processBase64Handler()}
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
              {config.mode === 'encode' ? 'Text Input' : 'Base64 Input'}
            </h3>
            <div className="flex items-center gap-2">
              {config.mode === 'encode' && (
                <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                  📁 Upload
                  <input
                    type="file"
                    accept=".txt,.json"
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
                ? 'Enter text to encode as Base64...' 
                : 'Enter Base64 string to decode...'}
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
              {config.mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Base64 Error</h4>
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
                  placeholder={`${config.mode === 'encode' ? 'Base64 encoded' : 'Decoded'} text will appear here...`}
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
                {typeof metadata.inputSize === 'number' && (
                  <span><strong>Input:</strong> {metadata.inputSize} chars</span>
                )}
                {typeof metadata.outputSize === 'number' && (
                  <span><strong>Output:</strong> {metadata.outputSize} chars</span>
                )}
                {typeof metadata.encodingEfficiency === 'number' && (
                  <span><strong>Efficiency:</strong> {metadata.encodingEfficiency.toFixed(1)}%</span>
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
                      checked={!!config[option.key as keyof Base64EncoderConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof Base64EncoderConfig] ?? option.default)}
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

          {/* Advanced options - ready for future expansion */}
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
                          checked={!!config[option.key as keyof Base64EncoderConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof Base64EncoderConfig] ?? option.default)}
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