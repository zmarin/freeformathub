import { useState, useCallback, useRef } from 'react';
import { extractTextFromPDF, type PDFTextExtractorConfig, type PDFMetadata } from '../../../tools/converters/pdf-text-extractor';
import { useToolStore } from '../../../lib/store';
import { copyToClipboard, downloadFile } from '../../../lib/utils';

interface PdfTextExtractorProps {
  className?: string;
}

const DEFAULT_CONFIG: PDFTextExtractorConfig = {
  preserveLineBreaks: true,
  preserveWhitespace: false,
  extractMetadata: true,
  outputFormat: 'plain',
};

export function PdfTextExtractor({ className = '' }: PdfTextExtractorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<PDFTextExtractorConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<string>('');
  const [metadata, setMetadata] = useState<PDFMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addToHistory } = useToolStore();

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResult('');
      setMetadata(null);
    } else {
      alert('Please select a valid PDF file.');
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

  const handleExtractText = useCallback(async () => {
    if (!file) {
      alert('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await extractTextFromPDF(file, config);

      if (result.success) {
        setResult(result.output || '');
        setMetadata(result.metadata || null);

        addToHistory({
          tool: 'pdf-text-extractor',
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
      const extension = config.outputFormat === 'json' ? 'json' : 'txt';
      const filename = `${file.name.replace('.pdf', '')}_extracted.${extension}`;
      downloadFile(result, filename);
    }
  }, [result, file, config.outputFormat]);

  const handleClear = useCallback(() => {
    setFile(null);
    setResult('');
    setMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleConfigChange = useCallback((key: keyof PDFTextExtractorConfig, value: any) => {
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
    <div className={`pdf-text-extractor-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button
            onClick={handleExtractText}
            disabled={!file || isProcessing}
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            {isProcessing ? 'Extracting...' : 'Extract Text'}
          </button>

          <button
            onClick={handleClear}
            className="btn btn-outline"
            disabled={!file && !result}
          >
            Clear
          </button>

          {result && (
            <>
              <button onClick={handleCopy} className="btn btn-outline">
                📋 Copy Text
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
              PDF File Upload
            </h3>
            {metadata && (
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {metadata.pageCount} pages
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
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>📄</div>
                <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                  Drop PDF file here or click to browse
                </h4>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                  Supports PDF files up to 50MB
                </p>
                <button className="btn btn-outline">
                  Choose PDF File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
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
                    <span style={{ fontSize: '2rem' }}>📄</span>
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
                      color: 'var(--color-text-secondary)'
                    }}>
                      <div><strong>Pages:</strong> {metadata.pageCount}</div>
                      {metadata.title && <div><strong>Title:</strong> {metadata.title}</div>}
                      {metadata.author && <div><strong>Author:</strong> {metadata.author}</div>}
                      {metadata.version && <div><strong>Version:</strong> {metadata.version}</div>}
                    </div>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-sm btn-outline"
                    style={{ marginTop: 'var(--space-md)' }}
                  >
                    Choose Different File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Configuration Options */}
                <div style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface)'
                }}>
                  <h5 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                    Extraction Options
                  </h5>

                  <div style={{
                    display: 'grid',
                    gap: 'var(--space-md)'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <input
                        type="checkbox"
                        checked={config.preserveLineBreaks}
                        onChange={(e) => handleConfigChange('preserveLineBreaks', e.target.checked)}
                      />
                      Preserve line breaks
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <input
                        type="checkbox"
                        checked={config.extractMetadata}
                        onChange={(e) => handleConfigChange('extractMetadata', e.target.checked)}
                      />
                      Extract metadata
                    </label>

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
                        <option value="plain">Plain Text</option>
                        <option value="markdown">Markdown</option>
                        <option value="json">JSON (with metadata)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                        Page Range (optional):
                      </label>
                      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                        <input
                          type="number"
                          placeholder="Start"
                          min="1"
                          max={metadata?.pageCount || 999}
                          value={config.pageRange?.start || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined;
                            handleConfigChange('pageRange', {
                              ...config.pageRange,
                              start: value
                            });
                          }}
                          className="form-input"
                          style={{ width: '80px' }}
                        />
                        <span>to</span>
                        <input
                          type="number"
                          placeholder="End"
                          min={config.pageRange?.start || 1}
                          max={metadata?.pageCount || 999}
                          value={config.pageRange?.end || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined;
                            handleConfigChange('pageRange', {
                              ...config.pageRange,
                              end: value
                            });
                          }}
                          className="form-input"
                          style={{ width: '80px' }}
                        />
                      </div>
                      <p style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        marginTop: 'var(--space-xs)'
                      }}>
                        Leave empty to extract all pages
                      </p>
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
              Extracted Text
            </h3>
            {result && (
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
                fontFamily: config.outputFormat === 'json' ? 'var(--font-mono)' : 'inherit',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                height: '100%',
                overflow: 'auto',
                backgroundColor: 'var(--color-surface)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
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
                  <p>Upload a PDF file and click "Extract Text" to see the results.</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-md)' }}>
                    ✅ No file upload to servers<br />
                    ✅ Works completely offline<br />
                    ✅ Supports files up to 50MB
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

export default PdfTextExtractor;