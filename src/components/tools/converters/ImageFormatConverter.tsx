import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processImageFormatConverter, type ImageFormatConverterConfig } from '../../../tools/converters/image-format-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface ImageFormatConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: ImageFormatConverterConfig = {
  outputFormat: 'PNG',
  quality: 85,
  resizeWidth: undefined,
  resizeHeight: undefined,
  maintainAspectRatio: true,
  backgroundColor: '#FFFFFF',
  removeMetadata: false,
  compression: 'medium',
  enableProgressive: false,
};

const OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'PNG',
    options: [
      { value: 'PNG', label: 'PNG (Lossless)' },
      { value: 'JPEG', label: 'JPEG (Lossy)' },
      { value: 'WEBP', label: 'WebP (Modern)' },
      { value: 'BMP', label: 'BMP (Bitmap)' },
      { value: 'GIF', label: 'GIF (Legacy)' },
    ],
    description: 'Target image format for conversion',
  },
  {
    key: 'quality',
    label: 'Quality',
    type: 'range' as const,
    default: 85,
    min: 1,
    max: 100,
    step: 1,
    description: 'Compression quality (applies to JPEG and WebP)',
    showWhen: (config: ImageFormatConverterConfig) => 
      config.outputFormat === 'JPEG' || config.outputFormat === 'WEBP',
  },
  {
    key: 'resizeWidth',
    label: 'Resize Width (px)',
    type: 'number' as const,
    default: undefined,
    min: 1,
    max: 4000,
    description: 'New width in pixels (leave empty to keep original)',
  },
  {
    key: 'resizeHeight',
    label: 'Resize Height (px)',
    type: 'number' as const,
    default: undefined,
    min: 1,
    max: 4000,
    description: 'New height in pixels (leave empty to keep original)',
  },
  {
    key: 'maintainAspectRatio',
    label: 'Maintain Aspect Ratio',
    type: 'boolean' as const,
    default: true,
    description: 'Preserve original image proportions when resizing',
    showWhen: (config: ImageFormatConverterConfig) => 
      config.resizeWidth !== undefined || config.resizeHeight !== undefined,
  },
  {
    key: 'backgroundColor',
    label: 'Background Color',
    type: 'color' as const,
    default: '#FFFFFF',
    description: 'Background color for formats that don\'t support transparency',
    showWhen: (config: ImageFormatConverterConfig) => 
      config.outputFormat === 'JPEG' || config.outputFormat === 'BMP',
  },
  {
    key: 'compression',
    label: 'Compression Level',
    type: 'select' as const,
    default: 'medium',
    options: [
      { value: 'none', label: 'None (Fastest)' },
      { value: 'low', label: 'Low (Balanced)' },
      { value: 'medium', label: 'Medium (Good)' },
      { value: 'high', label: 'High (Best Quality)' },
    ],
    description: 'Processing compression level',
  },
  {
    key: 'removeMetadata',
    label: 'Remove Metadata',
    type: 'boolean' as const,
    default: false,
    description: 'Strip EXIF data, location info, and other metadata',
  },
  {
    key: 'enableProgressive',
    label: 'Progressive JPEG',
    type: 'boolean' as const,
    default: false,
    description: 'Enable progressive encoding for JPEG (loads incrementally)',
    showWhen: (config: ImageFormatConverterConfig) => config.outputFormat === 'JPEG',
  },
];

const IMAGE_FORMATS = [
  { name: 'PNG', ext: '.png', mime: 'image/png' },
  { name: 'JPEG', ext: '.jpg', mime: 'image/jpeg' },
  { name: 'WebP', ext: '.webp', mime: 'image/webp' },
  { name: 'BMP', ext: '.bmp', mime: 'image/bmp' },
  { name: 'GIF', ext: '.gif', mime: 'image/gif' },
];

export function ImageFormatConverter({ className = '' }: ImageFormatConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ImageFormatConverterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<{
    originalFormat: string;
    originalSize: { width: number; height: number };
    newSize: { width: number; height: number };
    fileSizeReduction: number;
    processingTime: number;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce(async (text: string, cfg: ImageFormatConverterConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setMetadata(null);
        return;
      }

      setIsLoading(true);
      
      try {
        const result = await processImageFormatConverter(text, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          setMetadata(result.metadata || null);
          
          addToHistory({
            toolId: 'image-format-converter',
            input: text,
            output: result.output || '',
            config: cfg,
            timestamp: Date.now(),
          });
        } else {
          setOutput('');
          setError(result.error);
          setMetadata(null);
        }
      } catch (err) {
        setOutput('');
        setError(err instanceof Error ? err.message : 'Failed to convert image format');
        setMetadata(null);
      }
      
      setIsLoading(false);
    }, 800),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: ImageFormatConverterConfig) => {
    setConfig(newConfig);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setInput(result);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const generateSampleImage = (format: string) => {
    // Create a simple colored square for demonstration
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 100, 100);
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(0.5, '#4ECDC4');
      gradient.addColorStop(1, '#45B7D1');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 100, 100);
      
      // Add some text
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(format, 50, 55);
      
      const dataUrl = canvas.toDataURL('image/png');
      setInput(dataUrl);
    }
  };

  const clearInput = () => {
    setInput('');
    setConfig(DEFAULT_CONFIG);
  };

  const downloadImage = () => {
    if (!output) return;
    
    const link = document.createElement('a');
    link.download = `converted-image.${config.outputFormat.toLowerCase()}`;
    link.href = output;
    link.click();
  };

  const getFileSizeString = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="Image Data (Data URL or Base64)"
          placeholder={`Paste image data URL or upload a file:

data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==

Supported formats:
- PNG (with transparency)
- JPEG (compressed photos)
- WebP (modern format)
- BMP (bitmap)
- GIF (animated/static)`}
          syntax="text"
          examples={[
            {
              title: 'PNG Data URL',
              value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            },
            {
              title: 'JPEG Data URL',
              value: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            },
          ]}
        />

        {/* File Upload Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Image File:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900/20 dark:file:text-blue-400
                dark:hover:file:bg-blue-900/30"
            />
          </div>

          {/* Quick Sample Generation */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Generate Sample Images:
            </label>
            <div className="flex flex-wrap gap-2">
              {IMAGE_FORMATS.map((format) => (
                <button
                  key={format.name}
                  onClick={() => generateSampleImage(format.name)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                >
                  {format.name} Sample
                </button>
              ))}
              <button
                onClick={clearInput}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Current Configuration */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conversion Settings:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Output: {config.outputFormat}</div>
              {(config.outputFormat === 'JPEG' || config.outputFormat === 'WEBP') && (
                <div>Quality: {config.quality}%</div>
              )}
              {(config.resizeWidth || config.resizeHeight) && (
                <div>
                  Resize: {config.resizeWidth || 'auto'} × {config.resizeHeight || 'auto'}
                  {config.maintainAspectRatio && ' (aspect ratio maintained)'}
                </div>
              )}
              <div>
                Options: {[
                  config.removeMetadata && 'Remove Metadata',
                  config.enableProgressive && config.outputFormat === 'JPEG' && 'Progressive',
                  `${config.compression} compression`,
                ].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>

          {/* Processing Statistics */}
          {metadata && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conversion Results:
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Format:</span>
                  <span className="font-mono">{metadata.originalFormat} → {config.outputFormat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                  <span className="font-mono">
                    {metadata.originalSize.width}×{metadata.originalSize.height} → {metadata.newSize.width}×{metadata.newSize.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Size Change:</span>
                  <span className={`font-mono ${
                    metadata.fileSizeReduction > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metadata.fileSizeReduction > 0 ? '-' : '+'}{Math.abs(metadata.fileSizeReduction).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Processing Time:</span>
                  <span className="font-mono">{metadata.processingTime}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Output Panel */}
      <div className="flex flex-col">
        <OutputPanel
          value={output}
          error={error}
          isLoading={isLoading}
          label="Converted Image (Data URL)"
          syntax="text"
          downloadFilename={`converted-image.${config.outputFormat.toLowerCase()}`}
          downloadContentType={`image/${config.outputFormat.toLowerCase()}`}
        />
        
        {/* Image Preview */}
        {output && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview:
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
              <img
                src={output}
                alt="Converted image"
                className="max-w-full max-h-64 mx-auto rounded shadow-sm"
                onError={() => setError('Failed to display converted image')}
              />
              <div className="mt-2">
                <button
                  onClick={downloadImage}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                >
                  Download Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}