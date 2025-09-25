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
  const [showAdvanced, setShowAdvanced] = useState(false);

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

    const result = processCsvFormatter(inputText, cfg);

    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.stats);

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

  const handleConfigChange = (newConfig: CsvFormatterConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('csv-formatter', newConfig); } catch {}

    if (!autoFormat) return;
    processCsv(input, newConfig);
  };

  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  return (
    <div className={`${className}`}>
      {/* Controls */}
      <div >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => processCsv()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Process CSV
            </button>
            <button
              onClick={() => setInput('')}
              
            >
              Clear
            </button>
          </div>

          {/* Auto-format toggle */}
          <div className="flex items-center gap-2">
            <label >
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
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Input Section */}
        <div >
          {/* Input Header */}
          <div >
            <h3 >
              CSV Input
            </h3>
            <div className="flex items-center gap-2">
              <label >
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
                  
                  title="Clear input"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div
            className={`flex-1 relative ${dragActive ? 'bg-blue-50/20' : ''}`}
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
              
              spellCheck={false}
            />
            {dragActive && (
              <div >
                <div >
                  Drop CSV file here
                </div>
              </div>
            )}
          </div>

          {/* Example buttons */}
          <div >
            <div className="flex flex-wrap gap-2">
              <span >Examples:</span>
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(example.value)}
                  
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
          <div >
            <h3 >
              {config.mode === 'validate' ? 'Validation Results' :
               config.outputFormat === 'json' ? 'JSON Output' :
               config.outputFormat === 'table' ? 'Table Format' :
               `${config.outputFormat.toUpperCase()} Output`}
              {isLoading && <span >Processing...</span>}
              {!error && output && <span >✓ Processed</span>}
              {error && <span >✗ Error</span>}
            </h3>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button
                    onClick={handleCopy}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      copied
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    
                  >
                    📥 Download
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Output Content */}
          <div >
            {error ? (
              <div className="p-4 h-full">
                <div >
                  <h4 >CSV Error</h4>
                  <pre >
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
                  
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Simplified metadata */}
          {metadata && !error && output && (
            <div >
              <div >
                {typeof metadata.rowCount === 'number' && (
                  <span><strong>Rows:</strong> {metadata.rowCount}</span>
                )}
                {typeof metadata.columnCount === 'number' && (
                  <span><strong>Columns:</strong> {metadata.columnCount}</span>
                )}
                {typeof metadata.totalCells === 'number' && (
                  <span><strong>Cells:</strong> {metadata.totalCells}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Essential Options Panel */}
      <div >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 >Options</h4>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              
            >
              {showAdvanced ? '△ Less' : '▽ More'}
            </button>
          </div>

          {/* Essential options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label >
                Mode
              </label>
              <select
                value={config.mode}
                onChange={(e) => handleEssentialConfigChange('mode', e.target.value)}
                
              >
                <option value="format">Format CSV</option>
                <option value="validate">Validate Only</option>
                <option value="convert">Convert Format</option>
              </select>
            </div>

            <div className="space-y-1">
              <label >
                Delimiter
              </label>
              <select
                value={config.delimiter}
                onChange={(e) => handleEssentialConfigChange('delimiter', e.target.value)}
                
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="	">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.hasHeader}
                  onChange={(e) => handleEssentialConfigChange('hasHeader', e.target.checked)}
                  className="rounded"
                />
                <span >Has Headers</span>
              </label>
            </div>

            {config.mode !== 'validate' && (
              <div className="space-y-1">
                <label >
                  Output Format
                </label>
                <select
                  value={config.outputFormat}
                  onChange={(e) => handleEssentialConfigChange('outputFormat', e.target.value)}
                  
                >
                  <option value="csv">CSV</option>
                  <option value="tsv">TSV</option>
                  <option value="json">JSON</option>
                  <option value="table">Table</option>
                </select>
              </div>
            )}
          </div>

          {/* Advanced options */}
          {showAdvanced && (
            <div >
              <h5 >Advanced Options</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.strictValidation}
                      onChange={(e) => handleEssentialConfigChange('strictValidation', e.target.checked)}
                      className="rounded"
                    />
                    <span >Strict Validation</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.trimWhitespace}
                      onChange={(e) => handleEssentialConfigChange('trimWhitespace', e.target.checked)}
                      className="rounded"
                    />
                    <span >Trim Whitespace</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.detectTypes}
                      onChange={(e) => handleEssentialConfigChange('detectTypes', e.target.checked)}
                      className="rounded"
                    />
                    <span >Detect Data Types</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}