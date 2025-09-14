import { useState, useEffect, useMemo, useCallback } from 'react';
import { processUrlParser, type UrlParserConfig } from '../../../tools/web/url-parser';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface UrlParserProps {
  className?: string;
}

const DEFAULT_CONFIG: UrlParserConfig = {
  mode: 'parse',
  includeQueryParams: true,
  includeFragments: true,
  includeSecurity: true,
  includeEncoding: false,
  showValidation: true,
  outputFormat: 'detailed',
  decodeComponents: false,
};

// Essential options for simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Parse Mode',
    type: 'select' as const,
    default: 'parse',
    options: [
      { value: 'parse', label: 'Full Analysis' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'analyze', label: 'Security Analysis' },
    ],
    description: 'Choose parsing mode',
  },
  {
    key: 'includeQueryParams',
    label: 'Show Components',
    type: 'boolean' as const,
    default: true,
    description: 'Display URL components breakdown',
  },
  {
    key: 'decodeComponents',
    label: 'Decode Parameters',
    type: 'boolean' as const,
    default: false,
    description: 'URL-decode query parameters',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Report' },
      { value: 'json', label: 'JSON Format' },
      { value: 'table', label: 'Table Format' },
    ],
    description: 'Choose output format for URL analysis',
  },
  {
    key: 'includeFragments',
    label: 'URL Fragments',
    type: 'boolean' as const,
    default: true,
    description: 'Include URL fragments (hash) in analysis',
  },
  {
    key: 'showValidation',
    label: 'Validation Details',
    type: 'boolean' as const,
    default: true,
    description: 'Show detailed validation results and issues',
  },
  {
    key: 'includeSecurity',
    label: 'Security Analysis',
    type: 'boolean' as const,
    default: true,
    description: 'Analyze URL for security issues and patterns',
  },
  {
    key: 'includeEncoding',
    label: 'Encoding Analysis',
    type: 'boolean' as const,
    default: false,
    description: 'Analyze URL encoding and decode components',
  },
];

const EXAMPLES = [
  {
    title: 'Basic HTTPS URL',
    value: 'https://example.com/path?param=value',
  },
  {
    title: 'API with Port',
    value: 'https://api.example.com:8443/v1/users?active=true&sort=name#results',
  },
  {
    title: 'With Authentication',
    value: 'ftp://user:pass@files.example.com/docs/',
  },
  {
    title: 'Complex Query Parameters',
    value: 'https://search.example.com/api?q=hello%20world&filters[category]=tech&limit=10',
  },
  {
    title: 'Local Development',
    value: 'http://localhost:3000/app?debug=true&env=dev',
  },
];


export function UrlParser({ className = '' }: UrlParserProps) {
  const [input, setInput] = useState('https://api.example.com:8443/v1/users?active=true&sort=name#results');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<UrlParserConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('url-parser') as Partial<UrlParserConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process URL function
  const processUrl = useCallback((inputText: string = input, cfg: UrlParserConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = processUrlParser(inputText, cfg);
      
      if (result.success) {
        setOutput(result.output || '');
        setError(undefined);
        setMetadata(result.metadata);
        
        // Add to history for successful operations
        addToHistory({
          toolId: 'url-parser',
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
    } catch (err) {
      setOutput('');
      setError('An unexpected error occurred during URL parsing');
      setMetadata(undefined);
    }
    
    setIsLoading(false);
  }, [input, config, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processUrl, 500),
    [processUrl]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleParse = useCallback(() => {
    const parseConfig = { ...config, mode: 'parse' as const };
    setConfig(parseConfig);
    processUrl(input, parseConfig);
  }, [input, config, processUrl]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...config, mode: 'validate' as const };
    setConfig(validateConfig);
    processUrl(input, validateConfig);
  }, [input, config, processUrl]);

  const handleAnalyze = useCallback(() => {
    const analyzeConfig = { ...config, mode: 'analyze' as const };
    setConfig(analyzeConfig);
    processUrl(input, analyzeConfig);
  }, [input, config, processUrl]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      // Extract URLs from file content (split by lines, filter URLs)
      const urls = content.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed && (trimmed.startsWith('http') || trimmed.includes('://'));
      });
      
      if (urls.length > 0) {
        // Use first URL or join multiple URLs with newlines
        const urlInput = urls.length === 1 ? urls[0] : urls.slice(0, 10).join('\n'); // Limit to 10 URLs
        setInput(urlInput);
        if (autoFormat) {
          processUrl(urlInput, config);
        }
      } else {
        setError('No valid URLs found in the file.');
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, config, processUrl]);

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
    const filename = config.outputFormat === 'json' ? 'url-analysis.json' : 'url-analysis.txt';
    const mimeType = config.outputFormat === 'json' ? 'application/json' : 'text/plain';
    downloadFile(output, filename, mimeType);
  }, [output, config.outputFormat]);

  const handleConfigChange = (newConfig: UrlParserConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('url-parser', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processUrl(input, newConfig);
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  // Extract URL components for display
  const urlComponents = useMemo(() => {
    if (!input.trim()) return null;
    
    try {
      const url = new URL(input.trim());
      const queryParams = Array.from(url.searchParams.entries());
      
      return {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? '443' : url.protocol === 'http:' ? '80' : ''),
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        queryParams,
      };
    } catch {
      return null;
    }
  }, [input]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Parse URL with full analysis"
          >
            🔍 Parse
          </button>
          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Validate URL format only"
          >
            ✅ Validate
          </button>
          <button
            onClick={handleAnalyze}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Security analysis of URL"
          >
            🛡️ Analyze
          </button>
          {!autoFormat && (
            <button
              onClick={() => processUrl()}
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
            Auto-parse
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
              URL Input
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                📁 Upload
                <input
                  type="file"
                  accept=".txt,.csv"
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
              placeholder="Paste URLs here or drag & drop a file...\n\nSupported formats:\n- Single URL: https://example.com/path?param=value\n- Multiple URLs (one per line)\n- Text files with URLs (.txt, .csv)"
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop URL file here
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
          {/* Components Display (if URL is valid) */}
          {urlComponents && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">URL Components</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><span className="font-medium text-gray-600 dark:text-gray-400">Protocol:</span> <span className="text-blue-600 dark:text-blue-400">{urlComponents.protocol}</span></div>
                <div><span className="font-medium text-gray-600 dark:text-gray-400">Domain:</span> <span className="text-green-600 dark:text-green-400">{urlComponents.hostname}</span></div>
                {urlComponents.port && (
                  <div><span className="font-medium text-gray-600 dark:text-gray-400">Port:</span> <span className="text-purple-600 dark:text-purple-400">{urlComponents.port}</span></div>
                )}
                <div><span className="font-medium text-gray-600 dark:text-gray-400">Path:</span> <span className="text-orange-600 dark:text-orange-400">{urlComponents.pathname || '/'}</span></div>
                {urlComponents.queryParams.length > 0 && (
                  <div className="col-span-full">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Parameters ({urlComponents.queryParams.length}):</span>
                    <div className="mt-1 space-y-1">
                      {urlComponents.queryParams.slice(0, 5).map(([key, value], idx) => (
                        <div key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                      {urlComponents.queryParams.length > 5 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ... and {urlComponents.queryParams.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {urlComponents.hash && (
                  <div><span className="font-medium text-gray-600 dark:text-gray-400">Fragment:</span> <span className="text-red-600 dark:text-red-400">{urlComponents.hash}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Output Header */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              URL Analysis
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Processing...</span>}
              {!error && output && <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Parsed</span>}
              {error && <span className="ml-2 text-xs text-red-600 dark:text-red-400">✗ Error</span>}
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">URL Parsing Error</h4>
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
                  placeholder="URL analysis results will appear here...\n\nEnter a URL above to see:\n• URL validation\n• Component breakdown\n• Security analysis\n• Query parameter details"
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Metadata */}
          {metadata && !error && output && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                {metadata.domain && (
                  <span><strong>Domain:</strong> {metadata.domain}</span>
                )}
                {typeof metadata.paramCount === 'number' && (
                  <span><strong>Parameters:</strong> {metadata.paramCount}</span>
                )}
                {metadata.protocol && (
                  <span><strong>Protocol:</strong> {metadata.protocol}</span>
                )}
                {metadata.isSecure !== undefined && (
                  <span className={metadata.isSecure ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    <strong>{metadata.isSecure ? '🔒 Secure' : '⚠️ Insecure'}</strong>
                  </span>
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
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {showAdvanced ? '△ Less' : '▽ More'}
            </button>
          </div>
          
          {/* Essential options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
                {option.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof UrlParserConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof UrlParserConfig] ?? option.default)}
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
                {ADVANCED_OPTIONS.map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof UrlParserConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof UrlParserConfig] ?? option.default)}
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