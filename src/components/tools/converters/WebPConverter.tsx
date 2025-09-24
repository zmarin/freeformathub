import React, { useState, useCallback, useEffect } from 'react';
import { processWebPConverter, type WebPConverterConfig } from '../../../tools/converters/webp-converter';
import { useToolStore } from '../../../lib/store';
import { FiPlay, FiUpload, FiDownload, FiTrash2, FiSettings, FiInfo } from 'react-icons/fi';

interface WebPConverterProps {
  className?: string;
}

export function WebPConverter({ className = '' }: WebPConverterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addToHistory } = useToolStore();
  const [config, setConfig] = useState<WebPConverterConfig>({
    operation: 'toWebP',
    quality: 80,
    lossless: false,
    method: 4,
    targetSize: 0,
    pass: 1,
    preprocessing: false,
    segments: 4,
    snsStrength: 50,
    filterStrength: 60,
    filterSharpness: 0,
    filterType: 'simple',
    autoFilter: false,
    alphaCompression: true,
    alphaFiltering: 'fast',
    alphaQuality: 100,
    outputFormat: 'png',
    jpegQuality: 90,
    preserveMetadata: false
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const convertImage = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const conversionResult = await processWebPConverter(file, config);
      setResult(conversionResult);

      // Add to history for successful conversions
      if (conversionResult?.data) {
        addToHistory({
          toolId: 'webp-converter',
          input: `${file.name} (${formatFileSize(file.size)})`,
          output: `${conversionResult.data.outputFormat.toUpperCase()} (${formatFileSize(conversionResult.data.convertedSize)})`,
          config: config,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.data?.outputDataUrl) return;

    try {
      await navigator.clipboard.writeText(result.data.outputDataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadResult = () => {
    if (!result?.data?.outputDataUrl) return;
    
    const link = document.createElement('a');
    link.href = result.data.outputDataUrl;
    
    const extension = config.operation === 'toWebP' ? 'webp' : config.outputFormat;
    const baseName = file?.name.split('.')[0] || 'converted';
    link.download = `${baseName}_converted.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn btn-primary"
            onClick={convertImage}
            disabled={!file || loading}
            title="Convert image (Ctrl+Enter)"
          >
            <FiPlay size={14} />
            {loading ? 'Converting...' : 'Convert'}
          </button>

          <label className="btn btn-outline cursor-pointer" title="Upload image file">
            <FiUpload size={14} />
            Upload
            <input
              type="file"
              accept={config.operation === 'toWebP' ? 'image/*' : 'image/webp'}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button className="btn btn-outline" onClick={() => { setFile(null); setResult(null); setError(null); }} title="Clear data">
            <FiTrash2 size={14} />
            Clear
          </button>

          {/* Separator */}
          <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>

          {/* Stats */}
          {result?.data && (
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {((1 - result.data.compressionRatio) * 100).toFixed(1)}% reduction
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {formatFileSize(result.data.convertedSize)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Side by Side Grid */}
      <div className="grid-responsive md:grid-cols-1" style={{
        // Responsive grid handled by CSS class

        minHeight: '500px'
      }}>
        {/* Input Panel */}
        <div className="card flex flex-col" style={{ borderRadius: 0 }}>
          <div className="card-header">
            <h3>Upload & Configure</h3>
            <div className="flex items-center gap-2">
              {loading && (
                <div className="status-indicator status-loading">Processing...</div>
              )}
              {result?.data && (
                <div className="status-indicator status-success">✓ Converted</div>
              )}
              {error && (
                <div className="status-indicator status-error">✗ Error</div>
              )}
            </div>
          </div>

          <div className="flex-1 p-6">
            {/* Operation Mode */}
            <div className="mb-4">
              <label className="option-label">Operation Mode</label>
              <select
                value={config.operation}
                onChange={(e) => setConfig({...config, operation: e.target.value as 'toWebP' | 'fromWebP'})}
                className="select-input w-full"
              >
                <option value="toWebP">Convert to WebP</option>
                <option value="fromWebP">Convert from WebP</option>
              </select>
            </div>

            {/* File Upload */}
            <div
              className={`flex-1 relative ${dragActive ? 'drag-active' : ''} border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-6`}
              style={{ borderColor: dragActive ? 'var(--color-primary)' : 'var(--color-border)' }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  convertImage();
                }
              }}
            >
              <input
                type="file"
                accept={config.operation === 'toWebP' ? 'image/*' : 'image/webp'}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <div className="text-4xl">📷</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {dragActive ? (
                    <span style={{ color: 'var(--color-primary)' }}>Drop image here</span>
                  ) : (
                    <span>Click to select or drag & drop image</span>
                  )}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {config.operation === 'toWebP'
                    ? 'Supports: JPEG, PNG, GIF, BMP'
                    : 'Supports: WebP only'
                  }
                </div>
              </div>
              {dragActive && (
                <div className="drag-overlay">
                  <div>Drop image here</div>
                </div>
              )}
            </div>

            {file && (
              <div className="p-3 rounded-md mb-4" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatFileSize(file.size)}
                </div>
              </div>
            )}

            {/* Preview */}
            {file && (
              <div className="mb-4">
                <label className="option-label">Preview</label>
                <div className="border rounded-lg p-4 text-center" style={{ borderColor: 'var(--color-border)' }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="max-w-full max-h-32 object-contain rounded mx-auto"
                    onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="card flex flex-col" style={{ borderRadius: 0, borderLeft: '1px solid var(--color-border)' }}>
          <div className="card-header">
            <h3>Results & Settings</h3>
            <div className="flex items-center gap-2">
              {result?.data && (
                <>
                  <button className="btn btn-sm" onClick={handleCopy} title="Copy data URL">
                    <FiInfo size={12} />
                    {copied ? 'Copied!' : 'Copy URL'}
                  </button>
                  <button className="btn btn-sm" onClick={downloadResult} title="Download converted image">
                    <FiDownload size={12} />
                    Download
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Display */}
            {error && (
              <div className="error-display mb-4">
                <h4>Conversion Error</h4>
                <pre>{error}</pre>
              </div>
            )}

            {/* Results Display */}
            {result?.data && (
              <div className="mb-6 space-y-4">
                {/* Preview */}
                <div className="text-center">
                  <img
                    src={result.data.outputDataUrl}
                    alt="Converted"
                    className="max-w-full h-auto max-h-48 mx-auto rounded-md border"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <div className="font-medium">Original</div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>
                      {result.data.originalFormat.toUpperCase()}<br />
                      {formatFileSize(result.data.originalSize)}
                    </div>
                  </div>
                  <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <div className="font-medium">Converted</div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>
                      {result.data.outputFormat.toUpperCase()}<br />
                      {formatFileSize(result.data.convertedSize)}
                    </div>
                  </div>
                </div>

                {/* Compression Stats */}
                <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--color-success-bg)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-success-text)' }}>Size Reduction</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>
                      {((1 - result.data.compressionRatio) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Quality Metrics */}
                {result.data.qualityMetrics && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Quality Metrics</div>
                    <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="flex justify-between">
                        <span>Quality Score:</span>
                        <span className="font-medium">{result.data.qualityMetrics.qualityScore.toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compression Efficiency:</span>
                        <span className="font-medium">{result.data.qualityMetrics.compressionEfficiency.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Configuration Panel */}
            <details className="mb-4" open>
              <summary className="flex items-center gap-2 mb-4">
                <FiSettings size={16} />
                <span>Conversion Settings</span>
              </summary>

              <div className="space-y-4">
                {config.operation === 'toWebP' ? (
                  <>
                    {/* Lossless Mode */}
                    <div className="option-group">
                      <label className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={config.lossless}
                          onChange={(e) => setConfig({...config, lossless: e.target.checked})}
                          className="checkbox"
                        />
                        <span className="option-label">Lossless Mode</span>
                      </label>
                      <div className="option-description">Perfect quality preservation, larger file size</div>
                    </div>

                    {!config.lossless && (
                      <div className="option-group">
                        <label className="option-label">Quality: {config.quality}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.quality}
                          onChange={(e) => setConfig({...config, quality: parseInt(e.target.value)})}
                          className="range-input w-full"
                        />
                        <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span>Smaller file</span>
                          <span>Better quality</span>
                        </div>
                      </div>
                    )}

                    {/* Compression Method */}
                    <div className="option-group">
                      <label className="option-label">Compression Method: {config.method}</label>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        value={config.method}
                        onChange={(e) => setConfig({...config, method: parseInt(e.target.value)})}
                        className="range-input w-full"
                      />
                      <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>Fast</span>
                        <span>Best compression</span>
                      </div>
                    </div>

                    {/* Alpha Options */}
                    <div className="option-group">
                      <label className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={config.alphaCompression}
                          onChange={(e) => setConfig({...config, alphaCompression: e.target.checked})}
                          className="checkbox"
                        />
                        <span className="option-label">Compress Alpha Channel</span>
                      </label>
                    </div>

                    <div className="option-group">
                      <label className="option-label">Alpha Quality: {config.alphaQuality}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.alphaQuality}
                        onChange={(e) => setConfig({...config, alphaQuality: parseInt(e.target.value)})}
                        className="range-input w-full"
                        disabled={!config.alphaCompression}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Output Format */}
                    <div className="option-group">
                      <label className="option-label">Output Format</label>
                      <select
                        value={config.outputFormat}
                        onChange={(e) => setConfig({...config, outputFormat: e.target.value as any})}
                        className="select-input w-full"
                      >
                        <option value="png">PNG (with transparency)</option>
                        <option value="jpeg">JPEG (no transparency)</option>
                        <option value="bmp">BMP</option>
                        <option value="gif">GIF</option>
                      </select>
                    </div>

                    {config.outputFormat === 'jpeg' && (
                      <div className="option-group">
                        <label className="option-label">JPEG Quality: {config.jpegQuality}%</label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={config.jpegQuality}
                          onChange={(e) => setConfig({...config, jpegQuality: parseInt(e.target.value)})}
                          className="range-input w-full"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Metadata Preservation */}
                <div className="option-group">
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={config.preserveMetadata}
                      onChange={(e) => setConfig({...config, preserveMetadata: e.target.checked})}
                      className="checkbox"
                    />
                    <span className="option-label">Preserve Metadata</span>
                  </label>
                  <div className="option-description">Keep EXIF data and other image metadata</div>
                </div>
              </div>
            </details>

            {!result && !loading && !file && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📷</div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Upload an image and click convert to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Info Panel */}
      <div className="card" style={{ backgroundColor: 'var(--color-info-bg)', borderColor: 'var(--color-info-border)' }}>
        <details>
          <summary className="flex items-center gap-2">
            <FiInfo size={16} style={{ color: 'var(--color-info)' }} />
            <span>WebP Conversion Tips</span>
          </summary>
          <div className="text-sm space-y-2 mt-4" style={{ color: 'var(--color-info-text)' }}>
            <p>• <strong>For photos:</strong> Use lossy mode with 75-85% quality for optimal compression</p>
            <p>• <strong>For graphics:</strong> Use lossless mode to preserve sharp edges and text</p>
            <p>• <strong>For web use:</strong> WebP reduces file sizes by 25-35% compared to JPEG/PNG</p>
            <p>• <strong>Alpha channels:</strong> WebP supports transparency with better compression than PNG</p>
          </div>
        </details>
      </div>
    </div>
  );
}