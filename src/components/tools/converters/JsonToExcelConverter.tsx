import { useState, useCallback } from 'react';
import { convertJsonToExcel, type JsonToExcelConfig, type ExcelMetadata } from '../../../tools/converters/json-to-excel';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard } from '../../../lib/utils';

interface JsonToExcelConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonToExcelConfig = {
  outputFormat: 'xlsx',
  includeHeaders: true,
  sheetName: 'Sheet1',
  flattenObjects: true,
  maxDepth: 3,
  dateFormat: 'iso',
  handleArrays: 'join',
  arraySeparator: ', ',
  emptyValue: '',
};

export function JsonToExcelConverter({ className = '' }: JsonToExcelConverterProps) {
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<JsonToExcelConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<string>('');
  const [metadata, setMetadata] = useState<ExcelMetadata | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToHistory } = useToolStore();

  const handleConvert = useCallback(async () => {
    if (!input.trim()) {
      alert('Please enter JSON data first.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await convertJsonToExcel(input, config);

      if (result.success) {
        setResult(result.output || '');
        setMetadata(result.metadata || null);
        setDownloadUrl(result.downloadUrl || '');

        addToHistory({
          tool: 'json-to-excel',
          input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
          output: result.output || '',
          timestamp: Date.now()
        });
      } else {
        setResult(`Error: ${result.error}`);
        setMetadata(null);
        setDownloadUrl('');
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setMetadata(null);
      setDownloadUrl('');
    }
    setIsProcessing(false);
  }, [input, config, addToHistory]);

  const handleCopy = useCallback(() => {
    copyToClipboard(result);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (downloadUrl && metadata) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = metadata.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [downloadUrl, metadata]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult('');
    setMetadata(null);
    setDownloadUrl('');
  }, []);

  const handleConfigChange = useCallback((key: keyof JsonToExcelConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExampleLoad = useCallback((example: string) => {
    setInput(example);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`json-to-excel-tool ${className}`}>
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
            disabled={!input.trim() || isProcessing}
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            {isProcessing ? 'Converting...' : 'Convert to Excel'}
          </button>

          <button
            onClick={handleClear}
            className="btn btn-outline"
            disabled={!input && !result}
          >
            Clear
          </button>

          {result && !result.startsWith('Error:') && (
            <>
              <button onClick={handleCopy} className="btn btn-outline">
                📋 Copy Results
              </button>
              {downloadUrl && (
                <button onClick={handleDownload} className="btn btn-outline">
                  💾 Download {config.outputFormat.toUpperCase()}
                </button>
              )}
            </>
          )}

          {/* Quick examples */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExampleLoad(`[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  },
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "age": 25
  }
]`)}
              className="btn btn-sm btn-outline"
            >
              Simple Array
            </button>
            <button
              onClick={() => handleExampleLoad(`{
  "user": {
    "name": "Alice",
    "profile": {
      "age": 28,
      "location": "NYC"
    }
  },
  "tags": ["developer", "react"]
}`)}
              className="btn btn-sm btn-outline"
            >
              Nested Object
            </button>
          </div>
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
              JSON Input
            </h3>
            {input && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {input.length.toLocaleString()} characters
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your JSON data here..."
              className="form-textarea"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                resize: 'vertical',
                fontFamily: 'var(--font-mono)'
              }}
            />
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
              Conversion Results
            </h3>
            {metadata && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {metadata.rowCount} rows × {metadata.columnCount} columns
              </div>
            )}
          </div>

          {/* Output Area */}
          <div style={{ padding: 'var(--space-lg)', height: 'calc(100% - 60px)' }}>
            {result ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-lg)'
              }}>
                {/* Results Text */}
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  backgroundColor: 'var(--color-surface)',
                  padding: 'var(--space-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  color: result.startsWith('Error:') ? 'var(--color-error)' : 'inherit',
                  flex: result.startsWith('Error:') ? 1 : 0
                }}>
                  {result}
                </div>

                {/* File Details */}
                {metadata && !result.startsWith('Error:') && (
                  <div style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-lg)',
                    backgroundColor: 'var(--color-surface)',
                    flex: 1
                  }}>
                    <h5 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                      File Details
                    </h5>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 'var(--space-md)',
                      fontSize: 'var(--font-size-sm)',
                      marginBottom: 'var(--space-lg)'
                    }}>
                      <div>
                        <strong>Format:</strong> {config.outputFormat.toUpperCase()}
                      </div>
                      <div>
                        <strong>Rows:</strong> {metadata.rowCount.toLocaleString()}
                      </div>
                      <div>
                        <strong>Columns:</strong> {metadata.columnCount}
                      </div>
                      <div>
                        <strong>Size:</strong> {formatFileSize(metadata.fileSize)}
                      </div>
                      <div>
                        <strong>Sheet:</strong> {metadata.sheetNames[0]}
                      </div>
                    </div>

                    {downloadUrl && (
                      <div style={{
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--color-surface-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: 0, marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>
                          Your file is ready for download!
                        </p>
                        <button
                          onClick={handleDownload}
                          className="btn btn-primary"
                          style={{ minWidth: '140px' }}
                        >
                          💾 Download {metadata.fileName}
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                  <p>Enter JSON data above and click "Convert to Excel" to generate your file.</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-md)' }}>
                    ✅ No data upload to servers<br />
                    ✅ Works completely offline<br />
                    ✅ Supports nested objects and arrays
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-lg)'
      }}>
        <details open>
          <summary style={{
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: 'var(--space-md)',
            color: 'var(--color-text-primary)'
          }}>
            Conversion Options
          </summary>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {/* Basic Options */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Basic Options:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                    Output Format:
                  </label>
                  <select
                    value={config.outputFormat}
                    onChange={(e) => handleConfigChange('outputFormat', e.target.value)}
                    className="form-select"
                    style={{ width: '100%' }}
                  >
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                    Sheet Name:
                  </label>
                  <input
                    type="text"
                    value={config.sheetName}
                    onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="Sheet1"
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.includeHeaders}
                    onChange={(e) => handleConfigChange('includeHeaders', e.target.checked)}
                  />
                  Include column headers
                </label>
              </div>
            </div>

            {/* Object Flattening */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Object Handling:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <input
                    type="checkbox"
                    checked={config.flattenObjects}
                    onChange={(e) => handleConfigChange('flattenObjects', e.target.checked)}
                  />
                  Flatten nested objects
                </label>

                {config.flattenObjects && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                      Max Depth:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.maxDepth}
                      onChange={(e) => handleConfigChange('maxDepth', parseInt(e.target.value))}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                    Empty Value:
                  </label>
                  <input
                    type="text"
                    value={config.emptyValue}
                    onChange={(e) => handleConfigChange('emptyValue', e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="(empty)"
                  />
                </div>
              </div>
            </div>

            {/* Array and Date Handling */}
            <div>
              <h6 style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Data Formatting:</h6>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                    Array Handling:
                  </label>
                  <select
                    value={config.handleArrays}
                    onChange={(e) => handleConfigChange('handleArrays', e.target.value)}
                    className="form-select"
                    style={{ width: '100%' }}
                  >
                    <option value="join">Join with separator</option>
                    <option value="separate">Separate columns</option>
                    <option value="ignore">Show as description</option>
                  </select>
                </div>

                {config.handleArrays === 'join' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                      Array Separator:
                    </label>
                    <input
                      type="text"
                      value={config.arraySeparator}
                      onChange={(e) => handleConfigChange('arraySeparator', e.target.value)}
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder=", "
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>
                    Date Format:
                  </label>
                  <select
                    value={config.dateFormat}
                    onChange={(e) => handleConfigChange('dateFormat', e.target.value)}
                    className="form-select"
                    style={{ width: '100%' }}
                  >
                    <option value="iso">ISO (YYYY-MM-DD)</option>
                    <option value="locale">Locale format</option>
                    <option value="excel">Excel serial number</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default JsonToExcelConverter;