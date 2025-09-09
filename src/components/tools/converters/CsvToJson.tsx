import { useState, useEffect, useMemo, useCallback } from 'react';
import { processCsvToJson, type CsvToJsonConfig } from '../../../tools/converters/csv-to-json';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface CsvToJsonProps {
  className?: string;
}

const DEFAULT_CONFIG: CsvToJsonConfig = {
  delimiter: 'comma',
  customDelimiter: '',
  hasHeaders: true,
  skipEmptyLines: true,
  trimWhitespace: true,
  quoteChar: '"',
  escapeChar: '\\',
  outputFormat: 'records',
  parseNumbers: true,
  parseBooleans: true,
  parseDates: false,
  nullValues: ['', 'null', 'NULL', 'N/A'],
  customHeaders: '',
  encoding: 'utf-8',
  strictMode: false,
  includeLineNumbers: false,
  flattenArrays: false,
  maxRows: 0,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'delimiter',
    label: 'Delimiter',
    type: 'select' as const,
    default: 'comma',
    options: [
      { value: 'comma', label: 'Comma (,)' },
      { value: 'semicolon', label: 'Semicolon (;)' },
      { value: 'tab', label: 'Tab (\\t)' },
      { value: 'pipe', label: 'Pipe (|)' },
    ],
    description: 'CSV field separator',
  },
  {
    key: 'hasHeaders',
    label: 'Headers',
    type: 'boolean' as const,
    default: true,
    description: 'First row contains headers',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'records',
    options: [
      { value: 'records', label: 'Objects' },
      { value: 'array', label: 'Array' },
      { value: 'object', label: 'Columns' },
    ],
    description: 'JSON structure format',
  },
  {
    key: 'parseNumbers',
    label: 'Data Types',
    type: 'boolean' as const,
    default: true,
    description: 'Auto-detect numbers and booleans',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'quoteChar',
    label: 'Quote Character',
    type: 'text' as const,
    default: '"',
    description: 'Character used to quote CSV fields',
  },
  {
    key: 'escapeChar',
    label: 'Escape Character',
    type: 'text' as const,
    default: '\\',
    description: 'Character used to escape special characters',
  },
  {
    key: 'parseBooleans',
    label: 'Parse Booleans',
    type: 'boolean' as const,
    default: true,
    description: 'Convert boolean strings to boolean values',
  },
  {
    key: 'parseDates',
    label: 'Parse Dates',
    type: 'boolean' as const,
    default: false,
    description: 'Convert date strings to ISO format',
  },
  {
    key: 'trimWhitespace',
    label: 'Trim Whitespace',
    type: 'boolean' as const,
    default: true,
    description: 'Remove leading/trailing whitespace',
  },
  {
    key: 'skipEmptyLines',
    label: 'Skip Empty Lines',
    type: 'boolean' as const,
    default: true,
    description: 'Ignore completely empty rows',
  },
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Reject rows with parsing errors',
  },
  {
    key: 'includeLineNumbers',
    label: 'Line Numbers',
    type: 'boolean' as const,
    default: false,
    description: 'Add __line property to records',
  },
  {
    key: 'maxRows',
    label: 'Max Rows (0 = unlimited)',
    type: 'number' as const,
    default: 0,
    min: 0,
    max: 100000,
    description: 'Limit rows to process',
  },
];

const EXAMPLES = [
  {
    title: 'Simple CSV',
    value: `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`
  },
  {
    title: 'Semicolon Delimiter',
    value: `Product;Price;Stock;Available
Laptop;999.99;15;yes
Mouse;29.99;50;yes
Keyboard;79.99;0;no`
  },
  {
    title: 'No Headers',
    value: `John,30,New York,true
Jane,25,Los Angeles,false
Bob,35,Chicago,true`
  },
  {
    title: 'Quoted Fields',
    value: `"Name","Description","Price"
"John's Laptop","High-end gaming laptop with ""NVIDIA"" graphics",1299.99
"Jane's Mouse","Wireless optical mouse, ""ergonomic"" design",39.99`
  },
];

export function CsvToJson({ className = '' }: CsvToJsonProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CsvToJsonConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('csv-to-json') as Partial<CsvToJsonConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process CSV function
  const processCsv = useCallback((inputText: string = input, cfg: CsvToJsonConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const result = processCsvToJson(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'csv-to-json',
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
    () => debounce(processCsv, 500),
    [processCsv]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleConvert = useCallback(() => {
    processCsv(input, config);
  }, [input, config, processCsv]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...config, validateOnly: true };
    processCsv(input, validateConfig);
  }, [input, config, processCsv]);

  const handlePreview = useCallback(() => {
    const previewConfig = { ...config, hasHeaders: true };
    setConfig(previewConfig);
    processCsv(input, previewConfig);
  }, [input, config, processCsv]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processCsv(content, config);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid CSV file.');
    }
  }, [autoFormat, config, processCsv]);

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
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `converted-${timestamp}.json`;
    downloadFile(output, filename, 'application/json');
  }, [output]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: CsvToJsonConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('csv-to-json', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processCsv(input, { ...config, ...newConfig });
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
            onClick={handleConvert}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert CSV to JSON"
          >
            🔄 Convert
          </button>
          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Validate CSV format only"
          >
            ✓ Validate
          </button>
          <button
            onClick={handlePreview}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Preview with headers enabled"
          >
            👁️ Preview
          </button>
          {!autoFormat && (
            <button
              onClick={() => processCsv()}
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
            Auto-convert
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
              CSV Input
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                📁 Upload
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
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
              placeholder="Paste your CSV data here, or drag & drop a file..."
              className="w-full h-full p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-none focus:outline-none focus:ring-0"
              spellCheck={false}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 backdrop-blur-sm">
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                  Drop CSV file here
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
              JSON Output
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Converting...</span>}
              {!error && output && <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Success</span>}
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Conversion Error</h4>
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
                  placeholder="JSON output will appear here..."
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
                {metadata.rowCount && (
                  <span><strong>Rows:</strong> {metadata.rowCount.toLocaleString()}</span>
                )}
                {metadata.columnCount && (
                  <span><strong>Columns:</strong> {metadata.columnCount}</span>
                )}
                {metadata.outputSize && (
                  <span><strong>Size:</strong> {(metadata.outputSize / 1024).toFixed(1)} KB</span>
                )}
                {metadata.processingTime && (
                  <span><strong>Time:</strong> {metadata.processingTime}ms</span>
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
                      checked={!!config[option.key as keyof CsvToJsonConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof CsvToJsonConfig] ?? option.default)}
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
                          checked={!!config[option.key as keyof CsvToJsonConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof CsvToJsonConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {option.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : option.type === 'text' ? (
                      <input
                        type="text"
                        value={String(config[option.key as keyof CsvToJsonConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder={option.description}
                      />
                    ) : option.type === 'number' ? (
                      <input
                        type="number"
                        value={Number(config[option.key as keyof CsvToJsonConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, parseInt(e.target.value) || 0)}
                        min={option.min}
                        max={option.max}
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
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