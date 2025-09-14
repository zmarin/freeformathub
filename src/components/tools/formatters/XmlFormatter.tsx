import { useState, useEffect, useMemo, useCallback } from 'react';
import { processXml, type XmlFormatterConfig } from '../../../tools/formatters/xml-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface XmlFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: XmlFormatterConfig = {
  mode: 'format',
  indent: 2,
  sortAttributes: false,
  removeComments: false,
  removeEmptyNodes: false,
  selfClosingTags: true,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'format',
    options: [
      { value: 'format', label: 'Format XML' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'minify', label: 'Minify XML' },
      { value: 'convert-to-json', label: 'XML → JSON' },
    ],
    description: 'Choose operation mode',
  },
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
    key: 'sortAttributes',
    label: 'Sort Attributes',
    type: 'boolean' as const,
    default: false,
    description: 'Sort attributes alphabetically',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'selfClosingTags',
    label: 'Self-Closing Tags',
    type: 'boolean' as const,
    default: true,
    description: 'Use self-closing syntax for empty elements',
  },
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'boolean' as const,
    default: false,
    description: 'Remove XML comments from output',
  },
  {
    key: 'removeEmptyNodes',
    label: 'Remove Empty Nodes',
    type: 'boolean' as const,
    default: false,
    description: 'Remove empty elements without attributes',
  },
];

const EXAMPLES = [
  {
    title: 'Configuration XML',
    value: '<config version="1.0"><database host="localhost" port="5432"><name>myapp</name><user>admin</user></database><logging level="info"><file>/var/log/app.log</file></logging></config>',
  },
  {
    title: 'RSS Feed',
    value: '<rss version="2.0"><channel><title>Example Feed</title><link>https://example.com</link><description>An example RSS feed</description><item><title>First Post</title><link>https://example.com/1</link><description>Content of first post</description></item></channel></rss>',
  },
  {
    title: 'SOAP Envelope',
    value: '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header/><soap:Body><GetUserRequest xmlns="http://example.com/user"><UserId>12345</UserId></GetUserRequest></soap:Body></soap:Envelope>',
  },
  {
    title: 'Maven POM',
    value: '<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>my-app</artifactId><version>1.0.0</version><dependencies><dependency><groupId>junit</groupId><artifactId>junit</artifactId><version>4.12</version></dependency></dependencies></project>',
  },
  {
    title: 'SVG Graphics',
    value: '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/><text x="50" y="55" text-anchor="middle" fill="white">SVG</text></svg>',
  },
  {
    title: 'Android Layout',
    value: '<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical"><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Hello World!"/></LinearLayout>',
  },
];

export function XmlFormatter({ className = '' }: XmlFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<XmlFormatterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('xml-formatter') as Partial<XmlFormatterConfig>) || {};
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

  // Process XML function
  const processXmlInput = useCallback((inputText: string = input, cfg: XmlFormatterConfig = processedConfig) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processXml(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'xml-formatter',
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
    () => debounce(processXmlInput, 500),
    [processXmlInput]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, processedConfig);
    }
  }, [input, processedConfig, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleBeautify = useCallback(() => {
    const beautifyConfig = { ...processedConfig, mode: 'format', indent: 2 };
    setConfig(beautifyConfig);
    processXmlInput(input, beautifyConfig);
  }, [input, processedConfig, processXmlInput]);

  const handleMinify = useCallback(() => {
    const minifyConfig = { ...processedConfig, mode: 'minify', indent: 0 };
    setConfig(minifyConfig);
    processXmlInput(input, minifyConfig);
  }, [input, processedConfig, processXmlInput]);

  const handleConvertToJson = useCallback(() => {
    const convertConfig = { ...processedConfig, mode: 'convert-to-json' };
    setConfig(convertConfig);
    processXmlInput(input, convertConfig);
  }, [input, processedConfig, processXmlInput]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processXmlInput(content, processedConfig);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, processedConfig, processXmlInput]);

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
    const filename = config.mode === 'convert-to-json' ? 'converted.json' : 
                    config.mode === 'minify' ? 'minified.xml' : 'formatted.xml';
    const contentType = config.mode === 'convert-to-json' ? 'application/json' : 'application/xml';
    downloadFile(output, filename, contentType);
  }, [output, config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: XmlFormatterConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('xml-formatter', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processXmlInput(input, { ...processedConfig, ...newConfig });
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  const getLabelsForMode = () => {
    switch (config.mode) {
      case 'convert-to-json':
        return {
          input: 'XML Input',
          output: 'JSON Output',
          placeholder: 'Paste XML to convert to JSON...',
        };
      case 'validate':
        return {
          input: 'XML Input',
          output: 'Validation Result',
          placeholder: 'Paste XML to validate...',
        };
      case 'minify':
        return {
          input: 'XML Input',
          output: 'Minified XML',
          placeholder: 'Paste XML to minify...',
        };
      default:
        return {
          input: 'XML Input',
          output: 'Formatted XML',
          placeholder: 'Paste XML to format...',
        };
    }
  };

  const labels = getLabelsForMode();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBeautify}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Format XML with proper indentation"
          >
            ✨ Beautify
          </button>
          <button
            onClick={handleMinify}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Minimize XML to single line"
          >
            🗜️ Minify
          </button>
          <button
            onClick={handleConvertToJson}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert XML to JSON format"
          >
            🔄 To JSON
          </button>
          {!autoFormat && (
            <button
              onClick={() => processXmlInput()}
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
              {labels.input}
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                📁 Upload
                <input
                  type="file"
                  accept=".xml,.svg,.pom,.rss,.atom"
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
              placeholder={labels.placeholder}
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop XML file here
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
              {labels.output}
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">XML Error</h4>
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
                  placeholder={`${labels.output.split(' ')[1]} output will appear here...`}
                  className="flex-1 p-4 resize-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* XML metadata */}
          {metadata && !error && output && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                {metadata.elements && (
                  <span><strong>Elements:</strong> {metadata.elements}</span>
                )}
                {metadata.attributes && (
                  <span><strong>Attributes:</strong> {metadata.attributes}</span>
                )}
                {metadata.comments && (
                  <span><strong>Comments:</strong> {metadata.comments}</span>
                )}
                {metadata.namespaces && (
                  <span><strong>Namespaces:</strong> {metadata.namespaces}</span>
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
                      checked={!!config[option.key as keyof XmlFormatterConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof XmlFormatterConfig] ?? option.default)}
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
                          checked={!!config[option.key as keyof XmlFormatterConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof XmlFormatterConfig] ?? option.default)}
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