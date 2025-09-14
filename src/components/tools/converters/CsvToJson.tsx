import { useState, useEffect, useMemo, useCallback } from 'react';
import { processCsvToJson, type CsvToJsonConfig } from '../../../tools/converters/csv-to-json';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import { FiPlay, FiCheck, FiEye, FiCopy, FiDownload, FiTrash2, FiUpload, FiSettings } from 'react-icons/fi';

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
      {/* Sticky Controls Bar */}
      <div className="sticky-top" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" onClick={handleConvert} title="Convert CSV to JSON (Ctrl+Enter)">
            <FiPlay size={14} />
            Convert
          </button>
          <button className="btn btn-outline" onClick={handleValidate} title="Validate CSV format">
            <FiCheck size={14} />
            Validate
          </button>
          <button className="btn btn-outline" onClick={handlePreview} title="Preview with headers">
            <FiEye size={14} />
            Preview
          </button>
          <button className="btn btn-outline" onClick={() => setInput('')} title="Clear input">
            <FiTrash2 size={14} />
            Clear
          </button>

          {/* Separator */}
          <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>

          {/* File Upload */}
          <label className="btn btn-outline cursor-pointer" title="Upload CSV file">
            <FiUpload size={14} />
            Upload
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </label>

          {/* Stats */}
          {metadata && (
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {metadata.rowCount?.toLocaleString()} rows × {metadata.columnCount} cols
              </span>
            </div>
          )}

          {/* Auto-convert Toggle */}
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
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
      </div>

      {/* Main Content Area - Side by Side Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '500px'
      }} className="md:grid-cols-1">
        {/* Input Panel */}
        <div className="card flex flex-col" style={{ borderRadius: 0 }}>
          <div className="card-header">
            <h3>CSV Input</h3>
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="status-indicator status-loading">Converting...</div>
              )}
              {!error && output && (
                <div className="status-indicator status-success">✓ Converted</div>
              )}
              {error && (
                <div className="status-indicator status-error">✗ Error</div>
              )}
            </div>
          </div>

          <div
            className={`flex-1 relative ${dragActive ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleConvert();
              }
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your CSV data here, or drag & drop a file...\n\nname,age,city\nJohn,30,New York\nJane,25,Boston"
              className="input-area"
              spellCheck={false}
            />
            {dragActive && (
              <div className="drag-overlay">
                <div>Drop CSV file here</div>
              </div>
            )}
          </div>

          {/* Examples */}
          <details className="examples-section" open>
            <summary>Quick Examples</summary>
            <div className="examples-grid">
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(example.value)}
                  className="example-button"
                  title={example.title}
                >
                  {example.title}
                </button>
              ))}
            </div>
          </details>
        </div>

        {/* Output Panel */}
        <div className="card flex flex-col" style={{ borderRadius: 0, borderLeft: '1px solid var(--color-border)' }}>
          <div className="card-header">
            <h3>JSON Output</h3>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button className="btn btn-sm" onClick={handleCopy} title="Copy to clipboard">
                    <FiCopy size={12} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="btn btn-sm" onClick={handleDownload} title="Download JSON file">
                    <FiDownload size={12} />
                    Download
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1">
            {error ? (
              <div className="error-display">
                <h4>Conversion Error</h4>
                <pre>{error}</pre>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="JSON output will appear here..."
                className="output-area"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Options Panel */}
      <div className="card options-panel">
        <details open>
          <summary className="flex items-center gap-2">
            <FiSettings size={16} />
            <span>Conversion Options</span>
          </summary>

          <div className="options-grid">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="option-group">
                <label className="option-label">{option.label}</label>
                {option.type === 'boolean' ? (
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof CsvToJsonConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="checkbox"
                    />
                    <span className="option-description">{option.description}</span>
                  </label>
                ) : option.type === 'select' ? (
                  <>
                    <select
                      value={String(config[option.key as keyof CsvToJsonConfig] ?? option.default)}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                      className="select-input"
                    >
                      {option.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="option-description">{option.description}</div>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          {/* Advanced Options */}
          <details className="advanced-options">
            <summary>Advanced Options</summary>
            <div className="options-grid">
              {ADVANCED_OPTIONS.map((option) => (
                <div key={option.key} className="option-group">
                  <label className="option-label">{option.label}</label>
                  {option.type === 'boolean' ? (
                    <label className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={!!config[option.key as keyof CsvToJsonConfig]}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                        className="checkbox"
                      />
                      <span className="option-description">{option.description}</span>
                    </label>
                  ) : option.type === 'select' ? (
                    <>
                      <select
                        value={String(config[option.key as keyof CsvToJsonConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        className="select-input"
                      >
                        {option.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="option-description">{option.description}</div>
                    </>
                  ) : option.type === 'text' ? (
                    <>
                      <input
                        type="text"
                        value={String(config[option.key as keyof CsvToJsonConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        className="text-input"
                        placeholder={option.description}
                      />
                      <div className="option-description">{option.description}</div>
                    </>
                  ) : option.type === 'number' ? (
                    <>
                      <input
                        type="number"
                        value={Number(config[option.key as keyof CsvToJsonConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, parseInt(e.target.value) || 0)}
                        min={option.min}
                        max={option.max}
                        className="text-input"
                      />
                      <div className="option-description">{option.description}</div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        </details>
      </div>
    </div>
  );
}