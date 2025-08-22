import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processImageMetadataExtractor, type ImageMetadataConfig } from '../../../tools/data/image-metadata-extractor';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface ImageMetadataExtractorProps {
  className?: string;
}

const DEFAULT_CONFIG: ImageMetadataConfig = {
  extractExif: true,
  extractIptc: true,
  extractXmp: true,
  extractIcc: true,
  extractThumbnail: true,
  showRawData: false,
  formatOutput: 'detailed',
  includeGeolocation: true,
  analyzeDimensions: true,
  extractColorProfile: true,
};

const EXTRACTION_OPTIONS = [
  {
    key: 'extractExif',
    label: 'Extract EXIF Data',
    type: 'checkbox' as const,
    default: true,
    description: 'Camera settings, technical metadata',
  },
  {
    key: 'extractIptc',
    label: 'Extract IPTC Data',
    type: 'checkbox' as const,
    default: true,
    description: 'Keywords, captions, copyright info',
  },
  {
    key: 'extractXmp',
    label: 'Extract XMP Data',
    type: 'checkbox' as const,
    default: true,
    description: 'Adobe metadata, ratings, labels',
  },
  {
    key: 'extractIcc',
    label: 'Extract ICC Profile',
    type: 'checkbox' as const,
    default: true,
    description: 'Color management profiles',
  },
  {
    key: 'extractThumbnail',
    label: 'Extract Thumbnail',
    type: 'checkbox' as const,
    default: true,
    description: 'Embedded thumbnail images',
  },
  {
    key: 'includeGeolocation',
    label: 'Include GPS Data',
    type: 'checkbox' as const,
    default: true,
    description: 'Location coordinates from EXIF',
  },
] as const;

const FORMAT_OPTIONS = [
  {
    key: 'formatOutput',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Report' },
      { value: 'summary', label: 'Summary' },
      { value: 'json', label: 'JSON Format' },
      { value: 'table', label: 'Table Format' },
    ],
    description: 'Choose the output format',
  },
  {
    key: 'showRawData',
    label: 'Show Raw Data',
    type: 'checkbox' as const,
    default: false,
    description: 'Include raw hexadecimal metadata',
  },
  {
    key: 'analyzeDimensions',
    label: 'Analyze Dimensions',
    type: 'checkbox' as const,
    default: true,
    description: 'Include detailed dimension analysis',
  },
  {
    key: 'extractColorProfile',
    label: 'Color Profile Analysis',
    type: 'checkbox' as const,
    default: true,
    description: 'Analyze color space and profiles',
  },
] as const;

export function ImageMetadataExtractor({ className = '' }: ImageMetadataExtractorProps) {
  const [input, setInput] = useState('sample-image.jpg');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<ImageMetadataConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (currentInput: string, currentConfig: ImageMetadataConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = await processImageMetadataExtractor(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setMetadata(result.metadata);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'image-metadata-extractor',
            input: currentInput.length > 50 ? currentInput.substring(0, 50) + '...' : currentInput,
            output: result.metadata ? `${result.metadata.processing.extractedSections.length} sections` : 'Processed',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to extract metadata');
          setOutput('');
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during metadata extraction');
        setOutput('');
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('image-metadata-extractor');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'photo' | 'portrait' | 'landscape' | 'macro' | 'street' | 'product' | 'architecture' | 'wildlife') => {
    const examples = {
      photo: {
        data: 'vacation-photo.jpg',
        config: { extractExif: true, extractIptc: true, includeGeolocation: true, formatOutput: 'detailed' }
      },
      portrait: {
        data: 'portrait-session.jpg',
        config: { extractExif: true, extractColorProfile: true, extractIcc: true, formatOutput: 'detailed' }
      },
      landscape: {
        data: 'mountain-landscape.jpg',
        config: { extractExif: true, includeGeolocation: true, extractIptc: true, formatOutput: 'detailed' }
      },
      macro: {
        data: 'macro-flower.jpg',
        config: { extractExif: true, extractColorProfile: true, analyzeDimensions: true, formatOutput: 'detailed' }
      },
      street: {
        data: 'street-photography.jpg',
        config: { extractExif: true, extractIptc: true, includeGeolocation: false, formatOutput: 'summary' }
      },
      product: {
        data: 'product-shot.jpg',
        config: { extractExif: true, extractColorProfile: true, extractIcc: true, formatOutput: 'detailed' }
      },
      architecture: {
        data: 'building-exterior.jpg',
        config: { extractExif: true, includeGeolocation: true, analyzeDimensions: true, formatOutput: 'detailed' }
      },
      wildlife: {
        data: 'wildlife-capture.jpg',
        config: { extractExif: true, includeGeolocation: true, extractIptc: true, formatOutput: 'detailed' }
      }
    };
    
    const example = examples[type];
    setInput(example.data);
    
    // Apply configuration changes
    Object.entries(example.config).forEach(([key, value]) => {
      setConfig(prev => ({ ...prev, [key]: value }));
    });
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
    setConfig(DEFAULT_CONFIG);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInput(file.name);
    }
  };

  // Build all options
  const allOptions = [
    ...EXTRACTION_OPTIONS,
    ...FORMAT_OPTIONS,
  ];

  const getMetadataTypeColor = (type: string) => {
    switch (type) {
      case 'EXIF': return 'text-blue-800 bg-blue-100';
      case 'IPTC': return 'text-green-800 bg-green-100';
      case 'XMP': return 'text-purple-800 bg-purple-100';
      case 'ICC': return 'text-orange-800 bg-orange-100';
      case 'Thumbnail': return 'text-pink-800 bg-pink-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'jpeg':
      case 'jpg': return 'text-green-800 bg-green-100';
      case 'png': return 'text-blue-800 bg-blue-100';
      case 'tiff':
      case 'tif': return 'text-purple-800 bg-purple-100';
      case 'gif': return 'text-yellow-800 bg-yellow-100';
      case 'bmp': return 'text-red-800 bg-red-100';
      case 'webp': return 'text-indigo-800 bg-indigo-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* File Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">File Upload</h3>
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="mt-2 text-xs text-gray-600">
              Supports JPEG, PNG, TIFF, GIF, BMP, WebP
            </div>
          </div>
        </div>

        {/* Metadata Summary */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Metadata Summary</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getFileTypeColor(metadata.fileType)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">🖼️</div>
                  <div>
                    <div className="font-medium text-sm">
                      {metadata.filename}
                    </div>
                    <div className="text-xs opacity-80">
                      {metadata.dimensions.width} × {metadata.dimensions.height} • {metadata.fileType.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Size:</span>
                    <span className="text-blue-800 font-medium">{(metadata.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <div className="p-2 bg-green-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-600">Ratio:</span>
                    <span className="text-green-800 font-medium">{metadata.dimensions.aspectRatio}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extracted Sections */}
        {metadata && metadata.processing.extractedSections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Extracted Data</h3>
            <div className="space-y-1">
              {metadata.processing.extractedSections.map((section: string, index: number) => (
                <div key={index} className={`p-2 rounded text-xs ${getMetadataTypeColor(section)}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{section}</span>
                    {section === 'EXIF' && metadata.exifData && (
                      <span className="text-xs opacity-80">• {metadata.exifData.make} {metadata.exifData.model}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Camera Information */}
        {metadata && metadata.camera && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Camera Info</h3>
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs">
                <div className="font-medium text-purple-800 mb-1">
                  📷 {metadata.camera.make} {metadata.camera.model}
                </div>
                <div className="space-y-1 text-purple-700">
                  {metadata.camera.lens && <div>🔍 {metadata.camera.lens}</div>}
                  {metadata.camera.settings.aperture && (
                    <div>⚪ {metadata.camera.settings.aperture} • {metadata.camera.settings.shutterSpeed} • ISO {metadata.camera.settings.iso}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geolocation */}
        {metadata && metadata.geolocation && config.includeGeolocation && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Location</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded text-xs">
              <div className="font-medium text-green-800 mb-1">
                🌍 {metadata.geolocation.locationName}
              </div>
              <div className="space-y-1 text-green-700">
                <div>📍 {metadata.geolocation.latitude}°, {metadata.geolocation.longitude}°</div>
                {metadata.geolocation.altitude && (
                  <div>⛰️ {metadata.geolocation.altitude}m altitude</div>
                )}
                {metadata.geolocation.mapUrl && (
                  <a href={metadata.geolocation.mapUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 underline">
                    🗺️ View on map
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('photo')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              📸 Vacation Photo
            </button>
            <button
              onClick={() => handleQuickExample('portrait')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              👤 Portrait Session
            </button>
            <button
              onClick={() => handleQuickExample('landscape')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              🏔️ Landscape Photo
            </button>
            <button
              onClick={() => handleQuickExample('macro')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              🔍 Macro Photography
            </button>
            <button
              onClick={() => handleQuickExample('street')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              🏙️ Street Photography
            </button>
            <button
              onClick={() => handleQuickExample('product')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              📦 Product Shot
            </button>
            <button
              onClick={() => handleQuickExample('architecture')}
              className="px-3 py-2 text-xs bg-pink-100 text-pink-800 rounded hover:bg-pink-200 transition-colors text-left"
            >
              🏛️ Architecture
            </button>
            <button
              onClick={() => handleQuickExample('wildlife')}
              className="px-3 py-2 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-left"
            >
              🦎 Wildlife Photo
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Extraction Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Color Profile Info */}
        {metadata && metadata.colorProfile && config.extractColorProfile && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Color Profile</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                <span className="text-indigo-600">Color Space:</span>
                <span className="text-indigo-800 font-medium">{metadata.colorProfile.colorSpace}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                <span className="text-indigo-600">Has Profile:</span>
                <span className="text-indigo-800 font-medium">{metadata.colorProfile.hasProfile ? 'Yes' : 'No'}</span>
              </div>
              {metadata.colorProfile.gamma && (
                <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                  <span className="text-indigo-600">Gamma:</span>
                  <span className="text-indigo-800 font-medium">{metadata.colorProfile.gamma}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Stats */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Processing</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Processing Time:</span>
                <span className="text-gray-800 font-medium">{metadata.processing.processingTime}ms</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Valid Image:</span>
                <span className="text-gray-800 font-medium">{metadata.processing.fileAnalysis.isValidImage ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Has Metadata:</span>
                <span className="text-gray-800 font-medium">{metadata.processing.fileAnalysis.hasMetadata ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}

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

        {/* Tool Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">About Metadata</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🏷️ Metadata Types</div>
              <div className="space-y-1">
                <div>• EXIF: Camera technical data</div>
                <div>• IPTC: Descriptive keywords, captions</div>
                <div>• XMP: Adobe extended metadata</div>
                <div>• ICC: Color management profiles</div>
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
        <InputPanel
          title="Image File"
          value={input}
          onChange={setInput}
          placeholder="Enter image filename or upload a file..."
          language="text"
        />

        <OutputPanel
          title="Metadata Report"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.formatOutput === 'json' ? 'json' : 'text'}
          placeholder="Image metadata will appear here..."
          processingMessage="Extracting metadata..."
          customActions={
            output && metadata ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Report
                </button>
                <button
                  onClick={() => {
                    const jsonData = JSON.stringify(metadata, null, 2);
                    navigator.clipboard?.writeText(jsonData);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📄 Copy JSON
                </button>
                {metadata.exifData && (
                  <button
                    onClick={() => {
                      const exifOnly = JSON.stringify(metadata.exifData, null, 2);
                      navigator.clipboard?.writeText(exifOnly);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    📷 Copy EXIF
                  </button>
                )}
                {metadata.geolocation && (
                  <button
                    onClick={() => {
                      const locationText = `${metadata.geolocation.latitude}, ${metadata.geolocation.longitude}`;
                      navigator.clipboard?.writeText(locationText);
                    }}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    🌍 Copy GPS
                  </button>
                )}
                <div className={`px-3 py-1 text-xs font-medium rounded ${getFileTypeColor(metadata.fileType)}`}>
                  {metadata.fileType.toUpperCase()}
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {metadata.processing.extractedSections.length} sections
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}