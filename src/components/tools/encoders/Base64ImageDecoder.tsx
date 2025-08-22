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
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="Base64 Image Data"
          value={input}
          onChange={setInput}
          placeholder="data:image/png;base64,... or raw base64 data, HTML img tag, CSS background-image"
          description="Paste base64 data, data URL, HTML img tag, or CSS background-image"
          examples={examples}
          onExampleClick={handleExample}
          rows={8}
        />
        
        <OptionsPanel
          title="Decoder Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Image Preview */}
        {imageData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Image Preview</h3>
              <button
                onClick={downloadImage}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                💾 Download
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg flex justify-center">
              <img
                src={imageData.dataUrl}
                alt="Decoded image preview"
                className="max-w-full h-auto border border-gray-200 rounded shadow-sm"
                style={{ 
                  maxWidth: config.resizePreview ? `${config.maxPreviewSize}px` : 'none',
                  maxHeight: config.resizePreview ? `${config.maxPreviewSize}px` : 'none'
                }}
              />
            </div>
            {imageData.dimensions && (
              <div className="text-xs text-gray-600 text-center">
                Original: {imageData.dimensions.width} × {imageData.dimensions.height}px
                {imageData.format && ` | ${imageData.format.toUpperCase()}`}
                {` | ${(imageData.size / 1024).toFixed(1)} KB`}
              </div>
            )}
          </div>
        )}

        {/* Metadata Display */}
        {metadata && config.showMetadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Decoding Details</h3>
            <div className="p-3 bg-gray-50 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">Original Length:</span>
                  <div className="font-medium">{metadata.originalLength.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Decoded Size:</span>
                  <div className="font-medium">{(metadata.decodedSize / 1024).toFixed(1)} KB</div>
                </div>
                <div>
                  <span className="text-gray-600">Efficiency:</span>
                  <div className="font-medium text-blue-600">{metadata.compressionRatio}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Processing:</span>
                  <div className="font-medium">{metadata.processingTime}ms</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600">MIME Type:</span>
                <div className="text-xs text-gray-500 mt-1">{metadata.mimeType}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (imageData) {
                  navigator.clipboard?.writeText(imageData.dataUrl);
                }
              }}
              disabled={!imageData}
              className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              📋 Copy Data URL
            </button>
            <button
              onClick={downloadImage}
              disabled={!imageData}
              className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              💾 Download Image
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Decoding Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Paste base64 image data, data URL, or HTML/CSS code to decode..."
          processingMessage="Decoding base64 image data..."
          customActions={
            imageData ? (
              <div className="flex gap-2">
                <button
                  onClick={downloadImage}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download Image
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(imageData.dataUrl)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Data URL
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}