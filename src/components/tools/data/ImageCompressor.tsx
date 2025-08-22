import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processImageCompression, type ImageCompressorConfig } from '../../../tools/data/image-compressor';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface ImageCompressorProps {
  className?: string;
}

const DEFAULT_CONFIG: ImageCompressorConfig = {
  compressionLevel: 'medium',
  quality: 80,
  maxWidth: undefined,
  maxHeight: undefined,
  maintainAspectRatio: true,
  format: 'auto',
  removeMetadata: true,
  enableProgressive: true,
  targetFileSize: undefined,
  autoOptimize: true,
};

const OPTIONS = [
  {
    key: 'compressionLevel',
    label: 'Compression Level',
    type: 'select' as const,
    default: 'medium',
    options: [
      { value: 'low', label: '🔷 Low - Minimal compression' },
      { value: 'medium', label: '🔶 Medium - Balanced' },
      { value: 'high', label: '🔴 High - Maximum compression' },
      { value: 'custom', label: '⚙️ Custom - Full control' },
    ],
    description: 'Choose compression intensity vs quality balance',
  },
  {
    key: 'format',
    label: 'Output Format',
    type: 'select' as const,
    default: 'auto',
    options: [
      { value: 'auto', label: '🤖 Auto - Best format' },
      { value: 'jpeg', label: '📷 JPEG - Photos' },
      { value: 'webp', label: '🌐 WebP - Modern web' },
      { value: 'png', label: '🖼️ PNG - Lossless' },
    ],
    description: 'Select output image format or let auto-detection choose',
  },
  {
    key: 'autoOptimize',
    label: 'Auto Optimize',
    type: 'checkbox' as const,
    default: true,
    description: 'Automatically adjust settings based on image characteristics',
  },
  {
    key: 'removeMetadata',
    label: 'Remove Metadata',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove EXIF data to reduce file size and protect privacy',
  },
] as const;

const CUSTOM_OPTIONS = [
  {
    key: 'quality',
    label: 'Quality',
    type: 'range' as const,
    default: 80,
    min: 1,
    max: 100,
    step: 1,
    description: 'Image quality (higher = better quality, larger file)',
  },
  {
    key: 'maxWidth',
    label: 'Max Width (px)',
    type: 'number' as const,
    default: undefined,
    min: 1,
    max: 8192,
    description: 'Maximum width in pixels (leave empty for no limit)',
  },
  {
    key: 'maxHeight',
    label: 'Max Height (px)',
    type: 'number' as const,
    default: undefined,
    min: 1,
    max: 8192,
    description: 'Maximum height in pixels (leave empty for no limit)',
  },
  {
    key: 'targetFileSize',
    label: 'Target Size (KB)',
    type: 'number' as const,
    default: undefined,
    min: 1,
    max: 10000,
    description: 'Target file size in KB (experimental)',
  },
  {
    key: 'maintainAspectRatio',
    label: 'Maintain Aspect Ratio',
    type: 'checkbox' as const,
    default: true,
    description: 'Keep original proportions when resizing',
  },
  {
    key: 'enableProgressive',
    label: 'Progressive JPEG',
    type: 'checkbox' as const,
    default: true,
    description: 'Enable progressive loading for JPEG files',
  },
] as const;

export function ImageCompressor({ className = '' }: ImageCompressorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<ImageCompressorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: ImageCompressorConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setCompressedImage(null);
        setMetadata(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await processImageCompression(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setCompressedImage(result.output);
          setMetadata(result.metadata);
          
          let displayOutput = `# Image Compression Complete\n\n`;
          if (result.metadata) {
            displayOutput += `## 📊 Compression Results\n\n`;
            displayOutput += `**Original Size:** ${(result.metadata.originalSize / 1024).toFixed(1)} KB\n`;
            displayOutput += `**Compressed Size:** ${(result.metadata.compressedSize / 1024).toFixed(1)} KB\n`;
            displayOutput += `**Size Reduction:** ${result.metadata.compressionRatio.toFixed(1)}% smaller\n`;
            displayOutput += `**Quality Used:** ${result.metadata.qualityUsed}%\n`;
            displayOutput += `**Processing Time:** ${result.metadata.processingTime}ms\n\n`;
            
            displayOutput += `## 📐 Dimensions\n\n`;
            displayOutput += `**Original:** ${result.metadata.originalDimensions.width} × ${result.metadata.originalDimensions.height}px\n`;
            displayOutput += `**New:** ${result.metadata.newDimensions.width} × ${result.metadata.newDimensions.height}px\n\n`;
            
            displayOutput += `## 🎯 Optimization Details\n\n`;
            displayOutput += `**Output Format:** ${result.metadata.format.toUpperCase()}\n`;
            displayOutput += `**Compression Level:** ${currentConfig.compressionLevel}\n`;
            if (currentConfig.removeMetadata) {
              displayOutput += `**Metadata:** Removed for privacy and size reduction\n`;
            }
          }
          
          setOutput(displayOutput);
          
          // Add to history
          addToHistory({
            toolId: 'image-compressor',
            input: `[Image compression - ${result.metadata?.originalSize ? (result.metadata.originalSize / 1024).toFixed(1) : '?'} KB]`,
            output: displayOutput,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to compress image');
          setOutput('');
          setCompressedImage(null);
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during image compression');
        setOutput('');
        setCompressedImage(null);
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 1000),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('image-compressor');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setInput(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const downloadCompressed = () => {
    if (!compressedImage || !metadata) return;

    const link = document.createElement('a');
    link.download = `compressed-image.${metadata.format}`;
    link.href = compressedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  // Sample images for testing
  const examples = [
    {
      label: 'Small Test Image',
      value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    },
    {
      label: 'Upload Custom Image',
      value: '',
    },
  ];

  // Build options based on compression level
  const allOptions = config.compressionLevel === 'custom' 
    ? [...OPTIONS, ...CUSTOM_OPTIONS]
    : OPTIONS;

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* File Upload Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Upload Image</h3>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500">
              Supported formats: PNG, JPEG, WebP, GIF, BMP
            </p>
          </div>
        </div>

        <InputPanel
          title="Image Data URL"
          value={input}
          onChange={setInput}
          placeholder="data:image/png;base64,... or upload an image above"
          description="Paste a data URL or use the file upload above"
          examples={examples}
          onExampleClick={handleExample}
          rows={4}
        />
        
        <OptionsPanel
          title="Compression Settings"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Compression Preview */}
        {compressedImage && metadata && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Compressed Preview</h3>
              <button
                onClick={downloadCompressed}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                💾 Download
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <img
                src={compressedImage}
                alt="Compressed result"
                className="max-w-full h-auto border border-gray-200 rounded"
                style={{ maxHeight: '200px' }}
              />
              <div className="mt-2 text-xs text-gray-600">
                <div>Size: {(metadata.compressedSize / 1024).toFixed(1)} KB</div>
                <div>Reduction: {metadata.compressionRatio.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfig(prev => ({ ...prev, compressionLevel: 'medium', quality: 85, format: 'auto' }))}
              className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              🌐 Web Optimized
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, compressionLevel: 'high', quality: 60, maxWidth: 800 }))}
              className="px-3 py-2 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
            >
              📧 Email Friendly
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, compressionLevel: 'custom', quality: 95, format: 'jpeg' }))}
              className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              📸 Photo Quality
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, compressionLevel: 'high', quality: 50, maxWidth: 400 }))}
              className="px-3 py-2 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            >
              🗜️ Maximum Compression
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Compression Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Upload an image or paste a data URL to start compression..."
          processingMessage="Compressing image..."
          customActions={
            compressedImage ? (
              <div className="flex gap-2">
                <button
                  onClick={downloadCompressed}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download Compressed
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(compressedImage)}
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