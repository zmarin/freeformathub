import { useState, useEffect, useMemo, useCallback } from 'react';
import { processCsvSplitter, type CsvSplitterConfig, type CsvSplitResult } from '../../../tools/data/csv-splitter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';
import JSZip from 'jszip';

interface CsvSplitterProps {
  className?: string;
}

const DEFAULT_CONFIG: CsvSplitterConfig = {
  splitMode: 'rows',
  rowsPerFile: 1000,
  maxFileSize: 1024,
  fileSizeUnit: 'KB',
  splitColumn: '',
  uniqueValues: true,
  keepHeaders: true,
  delimiter: ',',
  customDelimiter: '|',
  outputFormat: 'csv',
  filenamePattern: 'part_{n}',
  zipOutput: true,
  previewSplits: true,
  maxPreviewRows: 3,
};

const EXAMPLES = [
  {
    title: 'Sales Data by Region',
    value: `name,region,sales,quarter
John,North,15000,Q1
Jane,South,18000,Q1
Bob,North,22000,Q1
Alice,South,19000,Q1
Charlie,East,16000,Q1
David,West,21000,Q1
Emma,North,19000,Q1
Frank,South,17000,Q1`,
  },
  {
    title: 'Large Product Catalog',
    value: `id,name,category,price,stock,supplier
1,"Gaming Laptop","Electronics",1299.99,25,"TechCorp Inc"
2,"Office Chair","Furniture",249.99,150,"FurnishPro"
3,"Programming Book","Education",49.99,75,"BookWorld"
4,"Wireless Mouse","Electronics",29.99,200,"TechCorp Inc"
5,"Standing Desk","Furniture",599.99,50,"FurnishPro"
6,"Python Course","Education",199.99,0,"EduTech"`,
  },
  {
    title: 'Employee Records',
    value: `employee_id,name,department,hire_date,salary,status
1001,"John Smith","Engineering","2020-01-15",75000,"Active"
1002,"Jane Doe","Marketing","2019-05-20",65000,"Active"
1003,"Bob Johnson","Sales","2021-03-10",55000,"Active"
1004,"Alice Brown","Engineering","2018-11-05",80000,"Active"
1005,"Charlie Davis","Marketing","2020-09-15",60000,"On Leave"`,
  },
];

export function CsvSplitter({ className = '' }: CsvSplitterProps) {
  const [input, setInput] = useState('');
  const [splits, setSplits] = useState<CsvSplitResult[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CsvSplitterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<string | undefined>();

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('csv-splitter') as Partial<CsvSplitterConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process CSV function
  const processCsv = useCallback((inputText: string = input, cfg: CsvSplitterConfig = config) => {
    if (!inputText.trim()) {
      setSplits([]);
      setError(undefined);
      setMetadata(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const result = processCsvSplitter(inputText, cfg);

    if (result.success && result.splits) {
      setSplits(result.splits);
      setError(undefined);
      setMetadata({
        totalFiles: result.totalFiles,
        totalRows: result.totalRows,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        processingTime: result.processingTime,
      });

      addToHistory({
        toolId: 'csv-splitter',
        input: inputText,
        output: `Split into ${result.totalFiles} files`,
        config: cfg,
        timestamp: Date.now(),
      });
    } else {
      setSplits([]);
      setError(result.error);
      setMetadata(undefined);
    }

    setIsLoading(false);
  }, [input, config, addToHistory]);

  // Debounced processing
  const debouncedProcess = useMemo(
    () => debounce(processCsv, 1000),
    [processCsv]
  );

  // Process input when it changes
  useEffect(() => {
    if (input.trim()) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid CSV file.');
    }
  }, []);

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
    if (files.length > 0 && files[0].type === 'text/csv') {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Copy to clipboard handler
  const handleCopy = useCallback(async (content: string, filename: string) => {
    try {
      await copyToClipboard(content);
      setCopied({ ...copied, [filename]: true });
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [filename]: false }));
      }, 2000);
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  }, [copied]);

  // Download single file
  const handleDownloadFile = useCallback((split: CsvSplitResult) => {
    downloadFile(split.content, split.filename, 'text/csv');
  }, []);

  // Download all files as ZIP
  const handleDownloadZip = useCallback(async () => {
    if (splits.length === 0) return;

    try {
      setDownloadProgress('Creating ZIP file...');
      const zip = new JSZip();

      splits.forEach((split) => {
        zip.file(split.filename, split.content);
      });

      setDownloadProgress('Generating download...');
      const content = await zip.generateAsync({ type: 'blob' });

      setDownloadProgress('Starting download...');
      downloadFile(content, 'csv_splits.zip', 'application/zip');

      setDownloadProgress(undefined);
    } catch (error) {
      setError('Failed to create ZIP file');
      setDownloadProgress(undefined);
    }
  }, [splits]);

  // Handle config changes
  const handleConfigChange = useCallback((key: keyof CsvSplitterConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateSavedConfig?.('csv-splitter', newConfig);
  }, [config, updateSavedConfig]);

  // Manual process trigger
  const handleManualProcess = useCallback(() => {
    processCsv(input, config);
  }, [input, config, processCsv]);

  // Load example
  const handleLoadExample = useCallback((example: { title: string; value: string }) => {
    setInput(example.value);
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  return (
    <div className={`csv-splitter-tool ${className}`}>
      {/* Input Section */}
      <div className="tool-section">
        <div className="section-header">
          <h3>📁 CSV Input</h3>
          <div className="section-actions">
            <select
              value=""
              onChange={(e) => {
                const example = EXAMPLES.find(ex => ex.title === e.target.value);
                if (example) handleLoadExample(example);
              }}
              className="example-select"
            >
              <option value="">Load Example...</option>
              {EXAMPLES.map((example) => (
                <option key={example.title} value={example.title}>
                  {example.title}
                </option>
              ))}
            </select>
            <label className="file-upload-btn">
              📤 Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div
          className={`input-area ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your CSV data here or drag and drop a CSV file..."
            className="input-textarea"
            rows={12}
          />
          {dragActive && (
            <div className="drag-overlay">
              <div className="drag-message">
                📁 Drop CSV file to upload
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="tool-section">
        <div className="section-header">
          <h3>⚙️ Split Configuration</h3>
        </div>

        <div className="config-grid">
          <div className="config-group">
            <label>Split Mode</label>
            <select
              value={config.splitMode}
              onChange={(e) => handleConfigChange('splitMode', e.target.value)}
            >
              <option value="rows">By Row Count</option>
              <option value="size">By File Size</option>
              <option value="column">By Column Values</option>
            </select>
          </div>

          {config.splitMode === 'rows' && (
            <div className="config-group">
              <label>Rows Per File</label>
              <input
                type="number"
                min="1"
                max="1000000"
                value={config.rowsPerFile}
                onChange={(e) => handleConfigChange('rowsPerFile', parseInt(e.target.value) || 1000)}
              />
            </div>
          )}

          {config.splitMode === 'size' && (
            <>
              <div className="config-group">
                <label>Max File Size</label>
                <input
                  type="number"
                  min="1"
                  value={config.maxFileSize}
                  onChange={(e) => handleConfigChange('maxFileSize', parseInt(e.target.value) || 1024)}
                />
              </div>
              <div className="config-group">
                <label>Size Unit</label>
                <select
                  value={config.fileSizeUnit}
                  onChange={(e) => handleConfigChange('fileSizeUnit', e.target.value)}
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
            </>
          )}

          {config.splitMode === 'column' && (
            <div className="config-group">
              <label>Split Column</label>
              <input
                type="text"
                value={config.splitColumn}
                onChange={(e) => handleConfigChange('splitColumn', e.target.value)}
                placeholder="Column name (e.g., region, category)"
              />
            </div>
          )}

          <div className="config-group">
            <label>Delimiter</label>
            <select
              value={config.delimiter}
              onChange={(e) => handleConfigChange('delimiter', e.target.value)}
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {config.delimiter === 'custom' && (
            <div className="config-group">
              <label>Custom Delimiter</label>
              <input
                type="text"
                value={config.customDelimiter}
                onChange={(e) => handleConfigChange('customDelimiter', e.target.value)}
                placeholder="Enter delimiter"
                maxLength={1}
              />
            </div>
          )}

          <div className="config-group">
            <label>Filename Pattern</label>
            <input
              type="text"
              value={config.filenamePattern}
              onChange={(e) => handleConfigChange('filenamePattern', e.target.value)}
              placeholder="part_{n} (use {n} for number)"
            />
          </div>
        </div>

        <div className="config-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.keepHeaders}
              onChange={(e) => handleConfigChange('keepHeaders', e.target.checked)}
            />
            Keep headers in each file
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.zipOutput}
              onChange={(e) => handleConfigChange('zipOutput', e.target.checked)}
            />
            Download as ZIP
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
            />
            Show file previews
          </label>
        </div>

        <button
          className="process-btn primary"
          onClick={handleManualProcess}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? '⏳ Splitting...' : '✂️ Split CSV'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="tool-section error-section">
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
          </div>
        </div>
      )}

      {/* Results Section */}
      {splits.length > 0 && (
        <div className="tool-section">
          <div className="section-header">
            <h3>📊 Split Results</h3>
            <div className="section-actions">
              {config.zipOutput && (
                <button
                  className="download-all-btn"
                  onClick={handleDownloadZip}
                  disabled={!!downloadProgress}
                >
                  {downloadProgress || '📦 Download All as ZIP'}
                </button>
              )}
            </div>
          </div>

          {metadata && (
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Files Created</span>
                <span className="stat-value">{metadata.totalFiles}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Rows</span>
                <span className="stat-value">{metadata.totalRows?.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Original Size</span>
                <span className="stat-value">{formatFileSize(metadata.originalSize)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Processing Time</span>
                <span className="stat-value">{metadata.processingTime}ms</span>
              </div>
            </div>
          )}

          <div className="splits-list">
            {splits.map((split, index) => (
              <div key={index} className="split-item">
                <div className="split-header">
                  <div className="split-info">
                    <h4 className="split-filename">📄 {split.filename}</h4>
                    <div className="split-stats">
                      <span>{split.rowCount} rows</span>
                      <span>{formatFileSize(split.size)}</span>
                    </div>
                  </div>
                  <div className="split-actions">
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(split.content, split.filename)}
                      title="Copy to clipboard"
                    >
                      {copied[split.filename] ? '✅' : '📋'}
                    </button>
                    <button
                      className="download-btn"
                      onClick={() => handleDownloadFile(split)}
                      title="Download file"
                    >
                      💾
                    </button>
                  </div>
                </div>

                {showPreview && split.preview && split.preview.length > 0 && (
                  <div className="split-preview">
                    <div className="preview-header">Preview (first {split.preview.length} rows):</div>
                    <div className="preview-content">
                      {split.preview.map((row, rowIndex) => (
                        <div key={rowIndex} className="preview-row">
                          {row}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}