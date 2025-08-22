import React, { useState, useCallback } from 'react';
import { Upload, Download, Image, Info, Settings, Zap, FileImage, Gauge } from 'lucide-react';
import { processWebPConverter, type WebPConverterConfig } from '../../../tools/converters/webp-converter';

const WebPConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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
    try {
      const conversionResult = await processWebPConverter(file, config);
      setResult(conversionResult);
    } catch (error) {
      setResult({
        data: null,
        error: error instanceof Error ? error.message : 'Conversion failed'
      });
    } finally {
      setLoading(false);
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <FileImage className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            WebP Image Converter
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Convert images to/from WebP format with advanced compression options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Image
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Operation Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Operation Mode
                </label>
                <select
                  value={config.operation}
                  onChange={(e) => setConfig({...config, operation: e.target.value as 'toWebP' | 'fromWebP'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="toWebP">Convert to WebP</option>
                  <option value="fromWebP">Convert from WebP</option>
                </select>
              </div>

              {/* File Upload */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept={config.operation === 'toWebP' ? 'image/*' : 'image/webp'}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <Image className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {dragActive ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Drop image here</span>
                    ) : (
                      <span>Click to select or drag & drop image</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {config.operation === 'toWebP' 
                      ? 'Supports: JPEG, PNG, GIF, BMP' 
                      : 'Supports: WebP only'
                    }
                  </div>
                </div>
              </div>

              {file && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                </div>
              )}

              {/* Convert Button */}
              <button
                onClick={convertImage}
                disabled={!file || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {loading ? 'Converting...' : 'Convert Image'}
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Conversion Settings
              </h2>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {config.operation === 'toWebP' ? (
                <>
                  {/* Lossless Mode */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.lossless}
                        onChange={(e) => setConfig({...config, lossless: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Lossless Mode
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Perfect quality preservation, larger file size
                    </p>
                  </div>

                  {!config.lossless && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quality: {config.quality}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.quality}
                        onChange={(e) => setConfig({...config, quality: parseInt(e.target.value)})}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Smaller file</span>
                        <span>Better quality</span>
                      </div>
                    </div>
                  )}

                  {/* Compression Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Compression Method: {config.method}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={config.method}
                      onChange={(e) => setConfig({...config, method: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Fast</span>
                      <span>Best compression</span>
                    </div>
                  </div>

                  {/* Alpha Options */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.alphaCompression}
                        onChange={(e) => setConfig({...config, alphaCompression: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Compress Alpha Channel
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alpha Quality: {config.alphaQuality}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.alphaQuality}
                      onChange={(e) => setConfig({...config, alphaQuality: parseInt(e.target.value)})}
                      className="w-full"
                      disabled={!config.alphaCompression}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Output Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Output Format
                    </label>
                    <select
                      value={config.outputFormat}
                      onChange={(e) => setConfig({...config, outputFormat: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="png">PNG (with transparency)</option>
                      <option value="jpeg">JPEG (no transparency)</option>
                      <option value="bmp">BMP</option>
                      <option value="gif">GIF</option>
                    </select>
                  </div>

                  {config.outputFormat === 'jpeg' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        JPEG Quality: {config.jpegQuality}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={config.jpegQuality}
                        onChange={(e) => setConfig({...config, jpegQuality: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Metadata Preservation */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.preserveMetadata}
                    onChange={(e) => setConfig({...config, preserveMetadata: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preserve Metadata
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Keep EXIF data and other image metadata
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Conversion Results
              </h2>
            </div>
            
            <div className="p-4">
              {result?.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
                </div>
              )}
              
              {result?.data && (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="text-center">
                    <img
                      src={result.data.outputDataUrl}
                      alt="Converted"
                      className="max-w-full h-auto max-h-48 mx-auto rounded-md border border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <div className="font-medium text-gray-900 dark:text-white">Original</div>
                      <div className="text-gray-600 dark:text-gray-300">
                        {result.data.originalFormat.toUpperCase()}<br />
                        {formatFileSize(result.data.originalSize)}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <div className="font-medium text-gray-900 dark:text-white">Converted</div>
                      <div className="text-gray-600 dark:text-gray-300">
                        {result.data.outputFormat.toUpperCase()}<br />
                        {formatFileSize(result.data.convertedSize)}
                      </div>
                    </div>
                  </div>

                  {/* Compression Stats */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Size Reduction
                      </span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {((1 - result.data.compressionRatio) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.abs((1 - result.data.compressionRatio) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  {result.data.qualityMetrics && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Quality Metrics</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <div className="flex justify-between">
                          <span>Quality Score:</span>
                          <span className="font-medium">{result.data.qualityMetrics.qualityScore.toFixed(1)}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Compression Efficiency:</span>
                          <span className="font-medium">{result.data.qualityMetrics.compressionEfficiency.toFixed(1)}%</span>
                        </div>
                        {result.data.qualityMetrics.estimatedPSNR !== Infinity && (
                          <div className="flex justify-between">
                            <span>Est. PSNR:</span>
                            <span className="font-medium">{result.data.qualityMetrics.estimatedPSNR.toFixed(1)} dB</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {result.data.metadata && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Image Info</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <div className="flex justify-between">
                          <span>Dimensions:</span>
                          <span>{result.data.metadata.width}×{result.data.metadata.height}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alpha Channel:</span>
                          <span>{result.data.metadata.hasAlpha ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span>{(result.data.processingTime / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Download Button */}
                  <button
                    onClick={downloadResult}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Converted Image
                  </button>
                </div>
              )}

              {!result && !loading && (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Upload an image and click convert to see results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              WebP Conversion Tips
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>• <strong>For photos:</strong> Use lossy mode with 75-85% quality for optimal compression</p>
              <p>• <strong>For graphics:</strong> Use lossless mode to preserve sharp edges and text</p>
              <p>• <strong>For web use:</strong> WebP reduces file sizes by 25-35% compared to JPEG/PNG</p>
              <p>• <strong>Alpha channels:</strong> WebP supports transparency with better compression than PNG</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebPConverter;