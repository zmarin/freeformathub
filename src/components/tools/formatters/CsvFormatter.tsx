import { useState, useEffect, useMemo, useCallback } from 'react';
import { processCsvFormatter, type CsvFormatterConfig } from '../../../tools/formatters/csv-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import { openFormatterInNewWindow } from '../../../lib/utils/window-manager';

interface CsvFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: CsvFormatterConfig = {
  mode: 'format',
  delimiter: ',',
  customDelimiter: '|',
  quoteChar: 'auto',
  escapeChar: 'auto',
  hasHeader: true,
  strictValidation: false,
  trimWhitespace: true,
  handleEmptyRows: 'remove',
  outputFormat: 'csv',
  sortBy: '',
  sortOrder: 'asc',
  filterColumn: '',
  filterValue: '',
  addRowNumbers: false,
  detectTypes: true,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'format',
    options: [
      { value: 'format', label: 'Format CSV' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'convert', label: 'Convert Format' },
    ],
    description: 'Processing mode',
  },
  {
    key: 'delimiter',
    label: 'Delimiter',
    type: 'select' as const,
    default: ',',
    options: [
      { value: ',', label: 'Comma (,)' },
      { value: ';', label: 'Semicolon (;)' },
      { value: '\t', label: 'Tab' },
      { value: '|', label: 'Pipe (|)' },
    ],
    description: 'Field delimiter',
  },
  {
    key: 'hasHeader',
    label: 'Has Headers',
    type: 'boolean' as const,
    default: true,
    description: 'First row contains headers',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'csv',
    options: [
      { value: 'csv', label: 'CSV' },
      { value: 'tsv', label: 'TSV' },
      { value: 'json', label: 'JSON' },
      { value: 'table', label: 'Table' },
    ],
    description: 'Output format',
    showWhen: (cfg: any) => cfg.mode !== 'validate',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'strictValidation',
    label: 'Strict Validation',
    type: 'boolean' as const,
    default: false,
    description: 'Enable strict validation rules',
  },
  {
    key: 'trimWhitespace',
    label: 'Trim Whitespace',
    type: 'boolean' as const,
    default: true,
    description: 'Remove leading/trailing spaces',
  },
  {
    key: 'detectTypes',
    label: 'Detect Data Types',
    type: 'boolean' as const,
    default: true,
    description: 'Automatically detect column types',
  },
  {
    key: 'handleEmptyRows',
    label: 'Empty Rows',
    type: 'select' as const,
    default: 'remove',
    options: [
      { value: 'keep', label: 'Keep' },
      { value: 'remove', label: 'Remove' },
      { value: 'error', label: 'Report as Error' },
    ],
    description: 'How to handle empty rows',
  },
  {
    key: 'sortBy',
    label: 'Sort By Column',
    type: 'text' as const,
    default: '',
    description: 'Column name to sort by',
    showWhen: (cfg: any) => cfg.mode !== 'validate',
  },
  {
    key: 'addRowNumbers',
    label: 'Add Row Numbers',
    type: 'boolean' as const,
    default: false,
    description: 'Add row number column',
    showWhen: (cfg: any) => cfg.mode !== 'validate',
  },
];

const EXAMPLES = [
  {
    title: 'Basic CSV',
    value: 'name,age,city,country\nJohn Doe,25,New York,USA\nJane Smith,30,London,UK\nBob Johnson,35,Paris,France',
  },
  {
    title: 'Semicolon Delimited',
    value: 'product;price;category;stock\n"Laptop, Gaming";999.99;Electronics;5\n"Book, Programming";29.99;Education;12',
  },
  {
    title: 'Tab Separated',
    value: 'Name\tDepartment\tSalary\tYears\nJohn Smith\tEngineering\t75000\t5\nJane Doe\tMarketing\t65000\t3',
  },
  {
    title: 'Validation Data',
    value: 'email,age,phone,date\njohn@example.com,25,555-1234,2023-01-01\ninvalid-email,thirty,invalid-phone,not-a-date',
  },
];

export function CsvFormatter({ className = '' }: CsvFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CsvFormatterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('csv-formatter') as Partial<CsvFormatterConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process CSV function
  const processCsv = useCallback((inputText: string = input, cfg: CsvFormatterConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processCsvFormatter(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.stats);
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'csv-formatter',
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
  const handleFormat = useCallback(() => {
    const formatConfig = { ...config, mode: 'format' as const };
    setConfig(formatConfig);
    processCsv(input, formatConfig);
  }, [input, config, processCsv]);

  const handleValidate = useCallback(() => {
    const validateConfig = { ...config, mode: 'validate' as const };
    setConfig(validateConfig);
    processCsv(input, validateConfig);
  }, [input, config, processCsv]);

  const handleConvert = useCallback(() => {
    const convertConfig = { ...config, mode: 'convert' as const, outputFormat: 'json' as const };
    setConfig(convertConfig);
    processCsv(input, convertConfig);
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
    const extension = config.outputFormat === 'json' ? 'json' :
                     config.outputFormat === 'tsv' ? 'tsv' :
                     config.outputFormat === 'table' ? 'txt' : 'csv';
    const filename = `processed.${extension}`;
    const contentType = config.outputFormat === 'json' ? 'application/json' : 'text/plain';
    downloadFile(output, filename, contentType);
  }, [output, config.outputFormat]);

  // Open in new window handler
  const handleOpenInNewWindow = useCallback(() => {
    const extension = config.outputFormat === 'json' ? 'json' :
                     config.outputFormat === 'tsv' ? 'tsv' :
                     config.outputFormat === 'table' ? 'txt' : 'csv';
    const filename = `processed.${extension}`;
    const language = config.outputFormat === 'json' ? 'json' : 'text';
    openFormatterInNewWindow(output, language, 'CSV Formatter', filename);
  }, [output, config.outputFormat]);

  // Paste handler
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      if (autoFormat) {
        processCsv(text, config);
      }
    } catch (error) {
      console.warn('Failed to paste from clipboard');
    }
  }, [autoFormat, config, processCsv]);

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
            handleFormat();
            break;
          case 'j':
            e.preventDefault();
            handleConvert();
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
  }, [handleFormat, handleConvert, handleClear]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: CsvFormatterConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('csv-formatter', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processCsv(input, newConfig);
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
            <button onClick={handleFormat} className="btn btn-primary" title="Format CSV (Ctrl+Enter)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 713.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              Format CSV
            </button>

            <button onClick={handleValidate} className="btn btn-secondary" title="Validate CSV">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
              </svg>
              Validate
            </button>

            <button onClick={handleConvert} className="btn btn-outline" title="Convert to JSON (Ctrl+J)">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 712-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>
              </svg>
              Convert
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
                  <span>Rows: <strong>{metadata.totalRows || 0}</strong></span>
                  <span>Columns: <strong>{metadata.totalColumns || 0}</strong></span>
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

      {/* Editor Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '500px'
      }} className="md:grid-cols-1">
        {/* Input Panel */}
        <div style={{ position: 'relative', borderRight: '1px solid var(--color-border)' }} className="md:border-r-0 md:border-b md:border-b-gray-200">
          {/* Input Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              CSV Input
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button onClick={handlePaste} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 712 2"/>
                </svg>
                Paste
              </button>
              <label className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                Upload
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Input Textarea */}
          <div
            style={{ position: 'relative', height: '500px' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your CSV data here or drag & drop a file..."
              className="form-textarea"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 0,
                fontFamily: 'var(--font-family-mono)',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'none',
                padding: 'var(--space-lg)'
              }}
              spellCheck={false}
            />
            {dragActive && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--color-primary)'
              }}>
                Drop CSV file here
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div style={{ position: 'relative' }}>
          {/* Output Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {config.outputFormat === 'json' ? 'JSON Output' :
               config.outputFormat === 'tsv' ? 'TSV Output' :
               config.outputFormat === 'table' ? 'Table Output' : 'CSV Output'}
            </span>
            {output && (
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  onClick={handleCopy}
                  className={copied ? 'btn btn-secondary' : 'btn btn-outline'}
                  style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={copied ? "M9 12l2 2 4-4" : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 712 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"}/>
                  </svg>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleDownload} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 712 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Download
                </button>
                <button onClick={handleOpenInNewWindow} className="btn btn-outline" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Open in New Window
                </button>
              </div>
            )}
          </div>

          {/* Output Content */}
          <div style={{ height: '500px', position: 'relative' }}>
            {error ? (
              <div style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-lg)',
                margin: 'var(--space-lg)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap'
              }}>
                <strong>CSV Error:</strong><br />
                {error}
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="Processed CSV data will appear here..."
                className="form-textarea"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 0,
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'none',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface)'
                }}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Examples & Options - Collapsible */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)'
      }}>
        <details className="group">
          <summary style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: 'var(--space-xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Quick Examples & Options
            </div>
            <svg className="w-5 h-5 group-open:rotate-180 transition-transform" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div style={{ padding: 'var(--space-xl)' }}>
            {/* Examples */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-lg)', color: 'var(--color-text-primary)' }}>Examples</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                {EXAMPLES.map((example, idx) => (
                  <div key={idx} className="card" style={{ padding: 'var(--space-lg)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                      {example.title}
                    </div>
                    <div style={{
                      backgroundColor: 'var(--color-surface-secondary)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.75rem',
                      marginBottom: 'var(--space-md)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {example.value.substring(0, 50)}...
                    </div>
                    <button
                      onClick={() => setInput(example.value)}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.875rem' }}
                    >
                      Try This Example
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-lg)', color: 'var(--color-text-primary)' }}>Configuration Options</h4>

              {/* Essential options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                {ESSENTIAL_OPTIONS.filter(option => !option.showWhen || option.showWhen(config)).map((option) => (
                  <div key={option.key} className="card" style={{ padding: 'var(--space-lg)' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof CsvFormatterConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <>
                        <select
                          value={String(config[option.key as keyof CsvFormatterConfig] ?? option.default)}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                          className="form-select"
                          style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                        >
                          {option.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                          {option.description}
                        </p>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Advanced options toggle */}
              <details className="group" style={{ marginTop: 'var(--space-lg)' }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)'
                }}>
                  Advanced Options
                  <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
                  {ADVANCED_OPTIONS.filter(option => !option.showWhen || option.showWhen(config)).map((option) => (
                    <div key={option.key} className="card" style={{ padding: 'var(--space-lg)' }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                        {option.label}
                      </label>
                      {option.type === 'boolean' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!config[option.key as keyof CsvFormatterConfig]}
                            onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                            style={{ accentColor: 'var(--color-primary)' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {option.description}
                          </span>
                        </label>
                      ) : option.type === 'select' ? (
                        <>
                          <select
                            value={String(config[option.key as keyof CsvFormatterConfig] ?? option.default)}
                            onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                            className="form-select"
                            style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                          >
                            {option.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                            {option.description}
                          </p>
                        </>
                      ) : option.type === 'text' ? (
                        <>
                          <input
                            type="text"
                            value={String(config[option.key as keyof CsvFormatterConfig] ?? option.default)}
                            onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                            className="form-input"
                            style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                            placeholder={option.description}
                          />
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                            {option.description}
                          </p>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </details>
      </div>
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
              CSV Input
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border transition-colors">
                Upload
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
                  Clear
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
              placeholder="Paste your CSV data here or drag & drop a file...

name,age,city,country
John Doe,25,New York,USA
Jane Smith,30,London,UK

Supports various delimiters:
- Comma separated values (CSV)
- Semicolon separated values
- Tab separated values (TSV)
- Custom delimiters"
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
              {config.mode === 'validate' ? 'Validation Results' : 
               config.outputFormat === 'json' ? 'JSON Output' :
               config.outputFormat === 'table' ? 'Table Format' :
               `${config.outputFormat.toUpperCase()} Output`}
              {isLoading && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Processing...</span>}
              {!error && output && <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Processed</span>}
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
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={handleOpenInNewWindow}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    🚀 Open in New Window
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
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">CSV Error</h4>
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
                  placeholder="Processed CSV will appear here..."
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
                {typeof metadata.rowCount === 'number' && (
                  <span><strong>Rows:</strong> {metadata.rowCount}</span>
                )}
                {typeof metadata.columnCount === 'number' && (
                  <span><strong>Columns:</strong> {metadata.columnCount}</span>
                )}
                {typeof metadata.totalCells === 'number' && (
                  <span><strong>Cells:</strong> {metadata.totalCells}</span>
                )}
                {typeof metadata.invalidCells === 'number' && metadata.invalidCells > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    <strong>⚠️ Invalid:</strong> {metadata.invalidCells}
                  </span>
                )}
                {typeof metadata.duplicateRows === 'number' && metadata.duplicateRows > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    <strong>Duplicates:</strong> {metadata.duplicateRows}
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
            {ESSENTIAL_OPTIONS.map((option) => {
              if (option.showWhen && !option.showWhen(config)) return null;
              
              return (
                <div key={option.key} className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    {option.label}
                  </label>
                  {option.type === 'boolean' ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!config[option.key as keyof CsvFormatterConfig]}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {option.description}
                      </span>
                    </label>
                  ) : option.type === 'select' ? (
                    <select
                      value={String(config[option.key as keyof CsvFormatterConfig] ?? option.default)}
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
              );
            })}
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
                          checked={!!config[option.key as keyof CsvFormatterConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {option.description}
                        </span>
                      </label>
                    ) : option.type === 'select' ? (
                      <select
                        value={String(config[option.key as keyof CsvFormatterConfig] ?? option.default)}
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
                        value={String(config[option.key as keyof CsvFormatterConfig] ?? option.default)}
                        onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                        placeholder={option.description}
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