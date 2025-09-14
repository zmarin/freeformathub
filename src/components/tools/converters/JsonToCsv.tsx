import { useState, useEffect, useMemo, useCallback } from 'react';
import { convertJsonToCsv, type JsonToCsvConfig } from '../../../tools/converters/json-to-csv';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import { FiPlay, FiCheck, FiEye, FiCopy, FiDownload, FiTrash2, FiUpload, FiSettings } from 'react-icons/fi';

interface JsonToCsvProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonToCsvConfig = {
  delimiter: ',',
  includeHeaders: true,
  flattenObjects: true,
  arrayHandling: 'stringify',
  nullHandling: 'empty',
  escapeQuotes: true,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'delimiter',
    label: 'Delimiter',
    type: 'select' as const,
    default: ',',
    options: [
      { value: ',', label: 'Comma (,)' },
      { value: ';', label: 'Semicolon (;)' },
      { value: '\t', label: 'Tab (\\t)' },
      { value: '|', label: 'Pipe (|)' },
    ],
    description: 'CSV field separator',
  },
  {
    key: 'includeHeaders',
    label: 'Headers',
    type: 'boolean' as const,
    default: true,
    description: 'Include column headers',
  },
  {
    key: 'flattenObjects',
    label: 'Flatten',
    type: 'boolean' as const,
    default: true,
    description: 'Flatten nested objects',
  },
  {
    key: 'arrayHandling',
    label: 'Arrays',
    type: 'select' as const,
    default: 'stringify',
    options: [
      { value: 'stringify', label: 'JSON' },
      { value: 'separate', label: 'Separate' },
      { value: 'ignore', label: 'Ignore' },
    ],
    description: 'How to handle arrays',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'nullHandling',
    label: 'Null Values',
    type: 'select' as const,
    default: 'empty',
    options: [
      { value: 'empty', label: 'Empty cells' },
      { value: 'null', label: 'Write "null"' },
      { value: 'skip', label: 'Skip field' },
    ],
    description: 'How to handle null/undefined values',
  },
  {
    key: 'escapeQuotes',
    label: 'Escape Quotes',
    type: 'boolean' as const,
    default: true,
    description: 'Auto-escape quotes and special chars',
  },
];

const EXAMPLES = [
  {
    title: 'Simple Array',
    value: '[{"name":"John","age":30,"city":"New York"},{"name":"Jane","age":25,"city":"Boston"}]'
  },
  {
    title: 'Nested Objects',
    value: '[{"user":{"name":"John","profile":{"age":30,"location":"NYC"}},"active":true}]'
  },
  {
    title: 'With Arrays',
    value: '[{"name":"John","skills":["JavaScript","Python"],"experience":5}]'
  },
  {
    title: 'Mixed Data',
    value: '[{"id":1,"user":{"name":"Alice","email":"alice@example.com"},"tags":["admin","active"],"metadata":null}]'
  },
];

export function JsonToCsv({ className = '' }: JsonToCsvProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsonToCsvConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('json-to-csv') as Partial<JsonToCsvConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process JSON function
  const processJson = useCallback((inputText: string = input, cfg: JsonToCsvConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual convert button
    const result = convertJsonToCsv(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'json-to-csv',
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
    () => debounce(processJson, 500),
    [processJson]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleConvert = useCallback(() => {
    processJson(input, config);
  }, [input, config, processJson]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...config, validateOnly: true };
    processJson(input, validateConfig);
  }, [input, config, processJson]);

  const handlePreview = useCallback(() => {
    const previewConfig = { ...config, includeHeaders: true };
    setConfig(previewConfig);
    processJson(input, previewConfig);
  }, [input, config, processJson]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processJson(content, config);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, config, processJson]);

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
    const filename = `converted-${timestamp}.csv`;
    downloadFile(output, filename, 'text/csv');
  }, [output]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JsonToCsvConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('json-to-csv', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processJson(input, { ...config, ...newConfig });
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
          <button className="btn btn-primary" onClick={handleConvert} title="Convert JSON to CSV (Ctrl+Enter)">
            <FiPlay size={14} />
            Convert
          </button>
          <button className="btn btn-outline" onClick={handleValidate} title="Validate JSON syntax">
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
          <label className="btn btn-outline cursor-pointer" title="Upload JSON file">
            <FiUpload size={14} />
            Upload
            <input
              type="file"
              accept=".json,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </label>

          {/* Stats */}
          {metadata && (
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {metadata.rows?.toLocaleString()} rows × {metadata.columns} cols
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
            <h3>JSON Input</h3>
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
              placeholder={'Paste your JSON array or object here, or drag & drop a file...\n\n{"name":"John","age":30,"city":"New York"}'}
              className="input-area"
              spellCheck={false}
            />
            {dragActive && (
              <div className="drag-overlay">
                <div>Drop JSON file here</div>
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
            <h3>CSV Output</h3>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button className="btn btn-sm" onClick={handleCopy} title="Copy to clipboard">
                    <FiCopy size={12} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="btn btn-sm" onClick={handleDownload} title="Download CSV file">
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
                placeholder="CSV output will appear here..."
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
                      checked={!!config[option.key as keyof JsonToCsvConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="checkbox"
                    />
                    <span className="option-description">{option.description}</span>
                  </label>
                ) : option.type === 'select' ? (
                  <>
                    <select
                      value={String(config[option.key as keyof JsonToCsvConfig] ?? option.default)}
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
                        checked={!!config[option.key as keyof JsonToCsvConfig]}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                        className="checkbox"
                      />
                      <span className="option-description">{option.description}</span>
                    </label>
                  ) : option.type === 'select' ? (
                    <>
                      <select
                        value={String(config[option.key as keyof JsonToCsvConfig] ?? option.default)}
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
          </details>
        </details>
      </div>
    </div>
  );
}