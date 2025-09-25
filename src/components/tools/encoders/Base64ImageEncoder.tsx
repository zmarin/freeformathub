import { useState, useCallback, useMemo } from 'react';
import { OutputPanel, OptionsPanel } from '../../ui';
import { processImageToBase64, type Base64ImageEncoderConfig, type ImageProcessingResult } from '../../../tools/encoders/base64-image-encoder';
import { useToolStore } from '../../../lib/store';

interface Base64ImageEncoderProps {
  className?: string;
}

const DEFAULT_CONFIG: Base64ImageEncoderConfig = {
  outputFormat: 'data-uri',
  includeFileInfo: false,
  maxFileSizeWarning: 100 * 1024, // 100KB
};

const OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'data-uri',
    options: [
      { value: 'data-uri', label: 'Data URI (for HTML/JS)' },
      { value: 'raw', label: 'Raw Base64' },
      { value: 'css', label: 'CSS background-image' },
      { value: 'html', label: 'HTML img tag' },
    ],
    description: 'Choose the output format for the encoded image',
  },
  {
    key: 'includeFileInfo',
    label: 'Include File Info',
    type: 'boolean' as const,
    default: false,
    description: 'Add file information as comments in the output',
  },
  {
    key: 'maxFileSizeWarning',
    label: 'File Size Warning (KB)',
    type: 'select' as const,
    default: 100,
    options: [
      { value: '50', label: '50 KB' },
      { value: '100', label: '100 KB' },
      { value: '250', label: '250 KB' },
      { value: '500', label: '500 KB' },
      { value: '1000', label: '1 MB (not recommended)' },
    ],
    description: 'Warn when file size exceeds this limit',
  },
];

interface ImageInputPanelProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  className?: string;
}

function ImageInputPanel({ onFileSelect, selectedFile, className = '' }: ImageInputPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, SVG, WebP, etc.)');
      return;
    }

    onFileSelect(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], 'pasted-image.' + type.split('/')[1], { type });
            handleFileUpload(file);
            break;
          }
        }
      }
    } catch (error) {
      alert('Failed to read from clipboard. Please make sure you have granted clipboard permissions.');
    }
  }, [handleFileUpload]);

  const clear = useCallback(() => {
    onFileSelect(null);
    setPreview(null);
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div >
        <div className="flex items-center space-x-2">
          <h3 >
            Image Input
          </h3>
          {selectedFile && (
            <span >
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* File upload */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-xs bg-gray-100 hover:bg-gray-200 
                           px-3 py-1 rounded border transition-colors
                           text-gray-700">
              Upload
            </div>
          </label>

          {/* Paste button */}
          <button
            onClick={handlePaste}
            className="text-xs bg-gray-100 hover:bg-gray-200 
                      px-3 py-1 rounded border transition-colors
                      text-gray-700"
          >
            Paste
          </button>

          {/* Clear button */}
          {selectedFile && (
            <button
              onClick={clear}
              className="text-xs text-red-600 hover:text-red-700 
                        px-2 py-1 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Input area */}
      <div
        className={`relative min-h-[300px] ${
          dragActive 
            ? 'bg-blue-50/20 border-2 border-dashed border-blue-300' 
            : 'border-2 border-dashed border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
      >
        {preview ? (
          <div className="p-4">
            <div className="flex flex-col items-center">
              <img 
                src={preview} 
                alt="Preview" 
                
              />
              <div className="mt-4 text-center">
                <p >
                  {selectedFile?.name}
                </p>
                <p >
                  {selectedFile?.type} • {selectedFile ? formatFileSize(selectedFile.size) : ''}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p >
                Drop an image here, or click Upload
              </p>
              <p >
                Supports PNG, JPG, GIF, SVG, WebP, BMP, ICO
              </p>
            </div>
          </div>
        )}
        
        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">Drop image here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Base64ImageEncoder({ className = '' }: Base64ImageEncoderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<Base64ImageEncoderConfig>(DEFAULT_CONFIG);
  const [imageInfo, setImageInfo] = useState<ImageProcessingResult | undefined>();

  const { addToHistory } = useToolStore();

  // Convert string values from select to numbers for maxFileSizeWarning
  const processedConfig = useMemo(() => ({
    ...config,
    maxFileSizeWarning: parseInt(String(config.maxFileSizeWarning)) * 1024 || 100 * 1024,
  }), [config]);

  const processImage = useCallback(async (file: File) => {
    if (!file) {
      setOutput('');
      setError(undefined);
      setImageInfo(undefined);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const result = await processImageToBase64(file, processedConfig);
      
      if (result.success) {
        setOutput(result.output || '');
        setError(undefined);
        setImageInfo(result.imageInfo);
        
        // Add to history for successful operations
        addToHistory({
          toolId: 'base64-image-encoder',
          input: file.name,
          output: result.output || '',
          config: processedConfig,
          timestamp: Date.now(),
        });
      } else {
        setOutput('');
        setError(result.error);
        setImageInfo(undefined);
      }
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setImageInfo(undefined);
    }
    
    setIsLoading(false);
  }, [processedConfig, addToHistory]);

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    if (file) {
      processImage(file);
    } else {
      setOutput('');
      setError(undefined);
      setImageInfo(undefined);
    }
  }, [processImage]);

  const handleConfigChange = useCallback((newConfig: Base64ImageEncoderConfig) => {
    setConfig(newConfig);
    if (selectedFile) {
      processImage(selectedFile);
    }
  }, [selectedFile, processImage]);

  const outputLabel = useMemo(() => {
    switch (config.outputFormat) {
      case 'data-uri': return 'Base64 Data URI';
      case 'raw': return 'Raw Base64';
      case 'css': return 'CSS Background Image';
      case 'html': return 'HTML Image Tag';
      default: return 'Base64 Output';
    }
  }, [config.outputFormat]);

  const downloadFilename = useMemo(() => {
    const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'image';
    switch (config.outputFormat) {
      case 'css': return `${baseName}.css`;
      case 'html': return `${baseName}.html`;
      default: return `${baseName}.txt`;
    }
  }, [selectedFile, config.outputFormat]);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div >
        <ImageInputPanel
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
        
        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />

        {/* Image Info */}
        {imageInfo && (
          <div >
            <h4 >
              File Information
            </h4>
            <div >
              <div>Original: {(imageInfo.originalSize / 1024).toFixed(1)} KB</div>
              <div>Encoded: {(imageInfo.encodedSize / 1024).toFixed(1)} KB</div>
              <div>Size increase: {((imageInfo.compressionRatio - 1) * 100).toFixed(1)}%</div>
              <div>MIME type: {imageInfo.mimeType}</div>
            </div>
          </div>
        )}
      </div>

      {/* Output Panel */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label={outputLabel}
        syntax={config.outputFormat === 'css' ? 'css' : config.outputFormat === 'html' ? 'html' : 'text'}
        showLineNumbers={config.outputFormat === 'css' || config.outputFormat === 'html'}
        downloadFilename={downloadFilename}
        downloadContentType="text/plain"
      />
    </div>
  );
}

export default Base64ImageEncoder;