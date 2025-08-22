import { useState, useEffect, useMemo, useRef } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processImageToBase64Converter, type ImageToBase64Config } from '../../../tools/converters/image-to-base64-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface ImageToBase64ConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: ImageToBase64Config = {
  outputFormat: 'data-url',
  includeMetadata: true,
  compressImage: false,
  compressionQuality: 0.8,
  maxWidth: 0,
  maxHeight: 0,
  maintainAspectRatio: true,
  validateImage: true,
  allowedFormats: [],
  maxFileSize: 0,
};

const FORMAT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'data-url',
    options: [
      { value: 'data-url', label: 'Data URL' },
      { value: 'base64-only', label: 'Base64 Only' },
      { value: 'html', label: 'HTML Img Tag' },
      { value: 'css', label: 'CSS Background' },
      { value: 'json', label: 'JSON Object' },
    ],
    description: 'Choose the output format for the converted image',
  },
] as const;

const COMPRESSION_OPTIONS = [
  {
    key: 'compressImage',
    label: 'Enable Compression',
    type: 'checkbox' as const,
    default: false,
    description: 'Apply compression to reduce file size',
  },
  {
    key: 'compressionQuality',
    label: 'Compression Quality',
    type: 'number' as const,
    default: 0.8,
    min: 0.1,
    max: 1.0,
    step: 0.1,
    description: 'Quality level for compression (0.1-1.0)',
  },
  {
    key: 'maxWidth',
    label: 'Max Width (px)',
    type: 'number' as const,
    default: 0,
    min: 0,
    max: 4000,
    description: 'Maximum width (0 = no limit)',
  },
  {
    key: 'maxHeight',
    label: 'Max Height (px)',
    type: 'number' as const,
    default: 0,
    min: 0,
    max: 4000,
    description: 'Maximum height (0 = no limit)',
  },
  {
    key: 'maintainAspectRatio',
    label: 'Maintain Aspect Ratio',
    type: 'checkbox' as const,
    default: true,
    description: 'Keep original proportions when resizing',
  },
] as const;

const VALIDATION_OPTIONS = [
  {
    key: 'validateImage',
    label: 'Validate Image',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate image format and integrity',
  },
  {
    key: 'includeMetadata',
    label: 'Include Metadata',
    type: 'checkbox' as const,
    default: true,
    description: 'Include file information in output',
  },
  {
    key: 'maxFileSize',
    label: 'Max File Size (MB)',
    type: 'number' as const,
    default: 0,
    min: 0,
    max: 50,
    description: 'Maximum file size in MB (0 = no limit)',
  },
] as const;

export function ImageToBase64Converter({ className = '' }: ImageToBase64ConverterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversion, setConversion] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<ImageToBase64Config>(DEFAULT_CONFIG);

  const processFile = useMemo(
    () => debounce(async (file: File | null, currentConfig: ImageToBase64Config) => {
      if (!file) {
        setOutput('');
        setConversion(null);
        setError(null);
        setWarnings([]);
        return;
      }

      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        // Create a FileReader to get base64 data
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1]; // Remove data URL prefix

          const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            content: base64Data
          };

          const processResult = processImageToBase64Converter(fileData, currentConfig);
          
          if (processResult.success && processResult.output !== undefined) {
            setOutput(processResult.output);
            setConversion(processResult.conversion);
            setWarnings(processResult.warnings || []);
            
            // Add to history
            addToHistory({
              toolId: 'image-to-base64-converter',
              input: `${file.name} (${formatFileSize(file.size)})`,
              output: `${currentConfig.outputFormat} format`,
              config: currentConfig,
              timestamp: Date.now(),
            });
          } else {
            setError(processResult.error || 'Failed to convert image');
            setOutput('');
            setConversion(null);
          }
          
          setIsProcessing(false);
        };

        reader.onerror = () => {
          setError('Failed to read file');
          setIsProcessing(false);
        };

        reader.readAsDataURL(file);
      } catch (err) {
        setError('An unexpected error occurred during conversion');
        setOutput('');
        setConversion(null);
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('image-to-base64-converter');
  }, [setCurrentTool]);

  useEffect(() => {
    processFile(selectedFile, config);
  }, [selectedFile, config, processFile]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ 
      ...prev, 
      [key]: key === 'maxFileSize' ? value * 1024 * 1024 : value // Convert MB to bytes
    }));
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      setError('Please drop a valid image file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleQuickExample = (type: 'small-icon' | 'medium-photo' | 'large-image' | 'svg-icon' | 'animated-gif') => {
    // Create mock file data for examples
    const examples = {
      'small-icon': {
        name: 'icon.png',
        type: 'image/png',
        size: 2048,
        content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      },
      'medium-photo': {
        name: 'photo.jpg',
        type: 'image/jpeg',
        size: 45000,
        content: '/9j/4AAQSkZJRgABAQEAYABgAAD//gA+Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBkZWZhdWx0IHF1YWxpdHkK/9sAQwAIBgYHBgUIBwcHCQkICgwUDQwLCwwZEhMPFB0aHx4dGhwcICQuJyAiLCMcHCg3KSwwMTQ0NB8nOT04MjwuMzQy/9sAQwEJCQkMCwwYDQ0YMiEcITIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIoGRMqGxwRTwQs/9oADAMBAAIRAxEAwA/9k='
      },
      'large-image': {
        name: 'large-photo.png',
        type: 'image/png',
        size: 1200000,
        content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      },
      'svg-icon': {
        name: 'icon.svg',
        type: 'image/svg+xml',
        size: 512,
        content: 'PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzQzOTlmZiIvPgo8L3N2Zz4K'
      },
      'animated-gif': {
        name: 'animation.gif',
        type: 'image/gif',
        size: 25600,
        content: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      }
    };

    const mockFile = new File([examples[type].content], examples[type].name, {
      type: examples[type].type,
      lastModified: Date.now()
    });

    Object.defineProperty(mockFile, 'size', {
      value: examples[type].size,
      writable: false
    });

    handleFileSelect(mockFile);
  };

  const handleClearData = () => {
    setSelectedFile(null);
    setOutput('');
    setConversion(null);
    setError(null);
    setWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  };

  // Build conditional options
  const allOptions = [
    ...FORMAT_OPTIONS,
    ...COMPRESSION_OPTIONS.filter(opt => 
      opt.key !== 'compressionQuality' || config.compressImage
    ),
    ...VALIDATION_OPTIONS,
  ];

  const getCompressionColor = (applied: boolean) => {
    return applied ? 'text-green-800 bg-green-100' : 'text-gray-800 bg-gray-100';
  };

  const getSizeColor = (increase: number) => {
    if (increase > 50) return 'text-red-800 bg-red-100';
    if (increase > 25) return 'text-yellow-800 bg-yellow-100';
    return 'text-green-800 bg-green-100';
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* File Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Upload Image</h3>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <div className="text-2xl">🖼️</div>
                <div className="text-sm font-medium text-gray-900">{selectedFile.name}</div>
                <div className="text-xs text-gray-600">
                  {selectedFile.type} • {formatFileSize(selectedFile.size)}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl text-gray-400">📁</div>
                <div className="text-sm text-gray-600">
                  Drag & drop an image here
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Browse Files
                </button>
                <div className="text-xs text-gray-500">
                  Supports: JPEG, PNG, GIF, WebP, SVG, BMP
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversion Statistics */}
        {conversion && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Conversion Stats</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getSizeColor(conversion.conversionStats.sizeIncrease)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📊</div>
                  <div>
                    <div className="font-medium text-sm">
                      Size: {formatFileSize(conversion.conversionStats.base64Size)}
                    </div>
                    <div className="text-xs opacity-80">
                      {conversion.conversionStats.sizeIncrease > 0 ? '+' : ''}
                      {conversion.conversionStats.sizeIncrease}% increase
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-2 rounded text-xs ${getCompressionColor(conversion.compressionApplied)}`}>
                <div className="flex justify-between">
                  <span>Compression:</span>
                  <span className="font-medium">
                    {conversion.compressionApplied ? 'Applied' : 'None'}
                  </span>
                </div>
              </div>
              
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-600">Processing:</span>
                  <span className="text-blue-800 font-medium">
                    {conversion.conversionStats.processingTime}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('small-icon')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🎯 Small Icon (2KB PNG)
            </button>
            <button
              onClick={() => handleQuickExample('medium-photo')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📷 Medium Photo (45KB JPEG)
            </button>
            <button
              onClick={() => handleQuickExample('large-image')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              🖼️ Large Image (1.2MB PNG)
            </button>
            <button
              onClick={() => handleQuickExample('svg-icon')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              🎨 SVG Icon (512B SVG)
            </button>
            <button
              onClick={() => handleQuickExample('animated-gif')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              🎬 Animated GIF (25KB GIF)
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Conversion Options"
          options={allOptions}
          values={{
            ...config,
            maxFileSize: config.maxFileSize / (1024 * 1024) // Convert bytes to MB for display
          }}
          onChange={handleConfigChange}
        />

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Warnings</h3>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-800">{warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Base64 Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Base64 Info</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">📊 About Base64 Images</div>
              <div className="space-y-1">
                <div>• ~33% larger than original file</div>
                <div>• Best for small images (&lt;10KB)</div>
                <div>• No additional HTTP requests</div>
                <div>• Can be embedded in HTML/CSS/JSON</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🗑️ Clear Data
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Image Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4 min-h-[200px] flex items-center justify-center bg-gray-50">
            {selectedFile ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="max-w-full max-h-48 object-contain rounded"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
              />
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-sm">No image selected</div>
              </div>
            )}
          </div>
        </div>

        <OutputPanel
          title="Base64 Output"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 
                   config.outputFormat === 'html' ? 'html' :
                   config.outputFormat === 'css' ? 'css' : 'text'}
          placeholder="Base64 encoded image will appear here..."
          processingMessage="Converting image to Base64..."
          customActions={
            output && conversion ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigator.clipboard?.writeText(conversion.outputFormats.dataUrl)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Data URL
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(conversion.outputFormats.base64Only)}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📝 Copy Base64
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(conversion.outputFormats.html)}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  🏷️ Copy HTML
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(conversion.outputFormats.css)}
                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  🎨 Copy CSS
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getSizeColor(conversion.conversionStats.sizeIncrease)}`}>
                  {formatFileSize(conversion.conversionStats.base64Size)}
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {conversion.conversionStats.sizeIncrease > 0 ? '+' : ''}{conversion.conversionStats.sizeIncrease}%
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}