import { useState, useCallback, useRef } from 'react';
import { convertExcelToJson, type ExcelToJsonConfig, type ExcelMetadata } from '../../../tools/converters/excel-to-json';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard, downloadFile } from '../../../lib/utils';

interface ExcelToJsonConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: ExcelToJsonConfig = {
  includeEmptyRows: false,
  includeEmptyColumns: false,
  trimWhitespace: true,
  firstRowAsHeader: true,
  sheetSelection: 'first',
  outputFormat: 'object',
  dateFormat: 'iso',
};

export function ExcelToJsonConverter({ className = '' }: ExcelToJsonConverterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<ExcelToJsonConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<string>('');
  const [metadata, setMetadata] = useState<ExcelMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addToHistory } = useToolStore();

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];

    if (validTypes.includes(selectedFile.type) || selectedFile.name.match(/\.(xlsx|xls|ods)$/i)) {
      setFile(selectedFile);
      setResult('');
      setMetadata(null);
    } else {
      alert('Please select a valid Excel file (.xlsx, .xls, .ods).');
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) {
      alert('Please select an Excel file first.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await convertExcelToJson(file, config);

      if (result.success) {
        setResult(result.output || '');
        setMetadata(result.metadata || null);

        addToHistory({
          tool: 'excel-to-json',
          input: `${file.name} (${Math.round(file.size / 1024)} KB)`,
          output: result.output || '',
          timestamp: Date.now()
        });
      } else {
        setResult(`Error: ${result.error}`);
        setMetadata(null);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setMetadata(null);
    }
    setIsProcessing(false);
  }, [file, config, addToHistory]);

  const handleCopy = useCallback(() => {
    copyToClipboard(result);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (file && result) {
      const filename = `${file.name.replace(/\.(xlsx|xls|ods)$/i, '')}_converted.json`;
      downloadFile(result, filename);
    }
  }, [result, file]);

  const handleClear = useCallback(() => {
    setFile(null);
    setResult('');
    setMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleConfigChange = useCallback((key: keyof ExcelToJsonConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`excel-to-json-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button
            onClick={handleConvert}
            disabled={!file || isProcessing}
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            {isProcessing ? 'Converting...' : 'Convert to JSON'}
          </button>

          <button
            onClick={handleClear}
            className="btn btn-outline"
            disabled={!file && !result}
          >
            Clear
          </button>

          {result && !(result.startsWith('Error:')) && (
            <>
              <button onClick={handleCopy} className="btn btn-outline">
                📋 Copy JSON
              </button>
              <button onClick={handleDownload} className="btn btn-outline">
                💾 Download
              </button>
            </>
          )}

          {/* File info */}
          {file && (
            <div style={{
              marginLeft: 'auto',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)'
            }}>
              {file.name} ({formatFileSize(file.size)})
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid-responsive" style={{
        minHeight: '500px'
      }}>
        {/* Input Panel */}
        <div style={{ position: 'relative' }} className="grid-responsive-item"
             data-mobile-border="bottom"
             data-desktop-border="right">
          {/* Input Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              Excel File Upload
            </h3>
            {metadata && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {metadata.sheetNames.length} sheet{metadata.sheetNames.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  height: '100%',
                  minHeight: '300px',
                  border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: dragOver ? 'var(--color-surface-secondary)' : 'var(--color-surface)',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>📊</div>
                <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                  Drop Excel file here or click to browse
                </h4>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                  Supports .xlsx, .xls, and .ods files up to 25MB
                </p>
                <button className="btn btn-outline">
                  Choose Excel File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-lg)'
              }}>
                {/* File info card */}
                <div style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-md)'
                  }}>
                    <span style={{ fontSize: '2rem' }}>📊</span>
                    <div>
                      <h5 style={{ margin: 0, color: 'var(--color-text-primary)' }}>{file.name}</h5>
                      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  {metadata && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 'var(--space-sm)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--space-md)'
                    }}>
                      <div><strong>Sheets:</strong> {metadata.sheetNames.length}</div>
                      <div><strong>Rows:</strong> {metadata.rowCount}</div>
                      <div><strong>Columns:</strong> {metadata.columnCount}</div>
                    </div>
                  )}

                  {metadata && metadata.sheetNames.length > 0 && (
                    <details style={{ marginBottom: 'var(--space-md)' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                        Sheet Names ({metadata.sheetNames.length})
                      </summary>
                      <div style={{
                        marginTop: 'var(--space-sm)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        {metadata.sheetNames.map((name, index) => (
                          <div key={index} style={{ padding: 'var(--space-xs) 0' }}>
                            {index + 1}. {name}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-sm btn-outline"
                  >
                    Choose Different File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Configuration Options */}
                <div style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface)',
                  flex: 1
                }}>
                  <h5 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                    Conversion Options
                  </h5>

                  <div style={{
                    display: 'grid',
                    gap: 'var(--space-md)'
                  }}>
                    {/* Row and Column Options */}
                    <div>
                      <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Data Options:</h6>
                      <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <input
                            type="checkbox"
                            checked={config.firstRowAsHeader}
                            onChange={(e) => handleConfigChange('firstRowAsHeader', e.target.checked)}
                          />
                          Use first row as headers
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <input
                            type="checkbox"
                            checked={config.includeEmptyRows}
                            onChange={(e) => handleConfigChange('includeEmptyRows', e.target.checked)}
                          />
                          Include empty rows
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <input
                            type="checkbox"
                            checked={config.includeEmptyColumns}
                            onChange={(e) => handleConfigChange('includeEmptyColumns', e.target.checked)}
                          />
                          Include empty columns
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <input
                            type="checkbox"
                            checked={config.trimWhitespace}
                            onChange={(e) => handleConfigChange('trimWhitespace', e.target.checked)}
                          />
                          Trim whitespace
                        </label>
                      </div>
                    </div>

                    {/* Sheet Selection */}
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                        Sheet Selection:
                      </label>
                      <select
                        value={config.sheetSelection}
                        onChange={(e) => handleConfigChange('sheetSelection', e.target.value)}
                        className="form-select"
                        style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                      >
                        <option value="first">First sheet only</option>
                        <option value="all">All sheets</option>
                        <option value="specific">Specific sheet</option>
                      </select>

                      {config.sheetSelection === 'specific' && metadata && (
                        <select
                          value={config.specificSheetName || ''}
                          onChange={(e) => handleConfigChange('specificSheetName', e.target.value)}
                          className="form-select"
                          style={{ width: '100%' }}
                        >
                          <option value="">Select a sheet</option>
                          {metadata.sheetNames.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Output Format */}
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                        Output Format:
                      </label>
                      <select
                        value={config.outputFormat}
                        onChange={(e) => handleConfigChange('outputFormat', e.target.value)}
                        className="form-select"
                        style={{ width: '100%' }}
                      >
                        <option value="object">Object (with headers)</option>
                        <option value="array">Array (simple)</option>
                        <option value="nested">Nested (with metadata)</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                        Date Format:
                      </label>
                      <select
                        value={config.dateFormat}
                        onChange={(e) => handleConfigChange('dateFormat', e.target.value)}
                        className="form-select"
                        style={{ width: '100%' }}
                      >
                        <option value="iso">ISO format (YYYY-MM-DD)</option>
                        <option value="original">Original format</option>
                        <option value="timestamp">Unix timestamp</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="grid-responsive-item">
          {/* Output Header */}
          <div style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              JSON Output
            </h3>
            {result && !result.startsWith('Error:') && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {result.length.toLocaleString()} characters
              </div>
            )}
          </div>

          {/* Output Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            {result ? (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                height: '100%',
                overflow: 'auto',
                backgroundColor: 'var(--color-surface)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                color: result.startsWith('Error:') ? 'var(--color-error)' : 'inherit'
              }}>
                {result}
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                <div>
                  <p>Upload an Excel file and click "Convert to JSON" to see the results.</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-md)' }}>
                    ✅ No file upload to servers<br />
                    ✅ Works completely offline<br />
                    ✅ Supports files up to 25MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExcelToJsonConverter;