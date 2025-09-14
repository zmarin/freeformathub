import { useState, useEffect, useMemo, useCallback } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processBase64ImageDecoding, type Base64ImageDecoderConfig } from '../../../tools/encoders/base64-image-decoder';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface Base64ImageDecoderProps {
  className?: string;
}

const DEFAULT_CONFIG: Base64ImageDecoderConfig = {
  outputFormat: 'preview',
  showMetadata: true,
  validateImage: true,
  autoDetectFormat: true,
  resizePreview: true,
  maxPreviewSize: 400,
  extractEmbedded: true,
};

const OPTIONS = [
  {
    key: 'validateImage',
    label: 'Validate Image Data',
    type: 'checkbox' as const,
    default: true,
    description: 'Verify that decoded data is a valid image',
  },
  {
    key: 'autoDetectFormat',
    label: 'Auto-detect Format',
    type: 'checkbox' as const,
    default: true,
    description: 'Automatically detect image format from data',
  },
  {
    key: 'showMetadata',
    label: 'Show Metadata',
    type: 'checkbox' as const,
    default: true,
    description: 'Display detailed information about the decoded image',
  },
  {
    key: 'resizePreview',
    label: 'Resize Preview',
    type: 'checkbox' as const,
    default: true,
    description: 'Resize large images for preview (doesn\'t affect original)',
  },
  {
    key: 'extractEmbedded',
    label: 'Extract from HTML/CSS',
    type: 'checkbox' as const,
    default: true,
    description: 'Automatically extract base64 from HTML img tags or CSS',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'maxPreviewSize',
    label: 'Max Preview Size',
    type: 'range' as const,
    default: 400,
    min: 200,
    max: 800,
    step: 50,
    description: 'Maximum size for image preview in pixels',
  },
] as const;

export function Base64ImageDecoder({ className = '' }: Base64ImageDecoderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [imageData, setImageData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<Base64ImageDecoderConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: Base64ImageDecoderConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setImageData(null);
        setMetadata(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await processBase64ImageDecoding(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setImageData(result.imageData);
          setMetadata(result.metadata);
          
          // Add to history
          addToHistory({
            toolId: 'base64-image-decoder',
            input: inputValue.substring(0, 100) + (inputValue.length > 100 ? '...' : ''),
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to decode base64 image');
          setOutput('');
          setImageData(null);
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during base64 decoding');
        setOutput('');
        setImageData(null);
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('base64-image-decoder');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const downloadImage = useCallback(() => {
    if (!imageData) return;

    // Create a downloadable blob
    const byteCharacters = atob(imageData.dataUrl.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${imageData.format}` });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `decoded-image.${imageData.format === 'jpeg' ? 'jpg' : imageData.format}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [imageData]);

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  // Example base64 data
  const examples = [
    {
      label: 'Small PNG (Data URL)',
      value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    },
    {
      label: 'Small JPEG (Raw Base64)',
      value: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    },
    {
      label: 'HTML img tag',
      value: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" alt="test">',
    },
    {
      label: 'CSS Background',
      value: 'background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==");',
    },
  ];

  // Build all options
  const allOptions = [
    ...OPTIONS,
    ...(config.resizePreview ? [ADVANCED_OPTIONS[0]] : []),
  ];

  return (
    <div className={`base64-image-decoder-tool ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky-top" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-xl)',
        zIndex: 10
      }}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <span className="icon">🖼️</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Base64 to Image Decoder
            </span>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {config.validateImage && <span>✓ Validate</span>}
              {config.autoDetectFormat && <span>🔍 Auto-detect</span>}
            </div>
          </div>

          {/* Real-time Stats */}
          {imageData && imageData.dimensions && (
            <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span><strong>Format:</strong> {imageData.format?.toUpperCase()}</span>
              <span><strong>Size:</strong> {imageData.dimensions.width}×{imageData.dimensions.height}</span>
              <span><strong>File:</strong> {(imageData.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {imageData && (
              <>
                <button
                  onClick={() => navigator.clipboard?.writeText(imageData.dataUrl)}
                  className="btn btn-outline text-xs"
                  title="Copy data URL to clipboard"
                >
                  📋 Copy URL
                </button>
                <button
                  onClick={downloadImage}
                  className="btn btn-primary text-xs"
                  title="Download decoded image"
                >
                  💾 Download
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '500px'
      }} className="md:grid-cols-1">
        {/* Input Panel */}
        <div className="card border-r md:border-r-0 md:border-b">
          <InputPanel
            value={input}
            onChange={setInput}
            placeholder="data:image/png;base64,... or raw base64 data, HTML img tag, CSS background-image"
            label="Base64 Image Data"
            language="text"
            examples={examples}
            onSelectExample={(example) => setInput(example.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                processInput(input, config);
              }
            }}
            showLineNumbers={false}
            className="h-full"
          />
        </div>

        {/* Output Panel with Image Preview */}
        <div className="card">
          {imageData ? (
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Image Preview</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                    ✓ Valid Image
                  </span>
                </div>
              </div>

              <div className="flex-1 flex justify-center items-center p-4 rounded"
                   style={{ backgroundColor: 'var(--color-surface)' }}>
                <img
                  src={imageData.dataUrl}
                  alt="Decoded image preview"
                  className="max-w-full h-auto border rounded shadow-sm object-contain"
                  style={{
                    borderColor: 'var(--color-border)',
                    maxWidth: config.resizePreview ? `${config.maxPreviewSize}px` : 'none',
                    maxHeight: config.resizePreview ? `${config.maxPreviewSize}px` : '400px'
                  }}
                />
              </div>

              {/* Image Info */}
              {imageData.dimensions && (
                <div className="mt-4 p-3 rounded text-center"
                     style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {imageData.dimensions.width} × {imageData.dimensions.height}px
                    {imageData.format && ` | ${imageData.format.toUpperCase()}`}
                    {` | ${(imageData.size / 1024).toFixed(1)} KB`}
                  </div>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-4 block">❌</span>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-error)' }}>Decoding Failed</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="loading-spinner mx-auto mb-4" />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Processing image data...</p>
              </div>
            </div>
          ) : (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-4 block">🖼️</span>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Paste base64 image data to decode</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Options Panel */}
      <OptionsPanel
        options={allOptions}
        config={config}
        onChange={setConfig}
        className="card"
      />

      {/* Metadata Panel (when available) */}
      {metadata && config.showMetadata && (
        <div className="card mt-4">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Decoding Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ color: 'var(--color-text-secondary)' }} className="mb-1">Original Length</div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {metadata.originalLength.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ color: 'var(--color-text-secondary)' }} className="mb-1">Decoded Size</div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {(metadata.decodedSize / 1024).toFixed(1)} KB
                </div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ color: 'var(--color-text-secondary)' }} className="mb-1">Efficiency</div>
                <div className="font-medium" style={{ color: 'var(--color-primary)' }}>
                  {metadata.compressionRatio}%
                </div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ color: 'var(--color-text-secondary)' }} className="mb-1">Processing</div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {metadata.processingTime}ms
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">MIME Type:</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-primary)' }}>{metadata.mimeType}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Base64ImageDecoder;