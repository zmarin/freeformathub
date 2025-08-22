import React, { useState, useCallback, useMemo } from 'react';
import { Edit3, CheckCircle, Minimize, Code, Info, Download, Eye, Palette, AlertTriangle, FileText } from 'lucide-react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processSVGEditor } from '../../../tools/web/svg-editor';
import type { SVGEditorOptions, SVGEditorResult } from '../../../tools/web/svg-editor';

const SvgEditor: React.FC = () => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<SVGEditorOptions>({
    operation: 'validate',
    quality: 85,
    precision: 2,
    maintainAspectRatio: true,
    removeComments: true,
    removeMetadata: true,
    removeUnusedDefs: false,
    convertShapesToPath: false
  });
  const [result, setResult] = useState<SVGEditorResult | null>(null);

  const processedResult = useMemo(() => {
    if (!input.trim()) return null;
    
    try {
      return processSVGEditor({ content: input, options });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }, [input, options]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setResult(null);
  }, []);

  const handleOptionsChange = useCallback((newOptions: Partial<SVGEditorOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const getOperationIcon = () => {
    switch (options.operation) {
      case 'validate': return <CheckCircle className="w-4 h-4" />;
      case 'optimize': return <Minimize className="w-4 h-4" />;
      case 'minify': return <Minimize className="w-4 h-4" />;
      case 'prettify': return <Code className="w-4 h-4" />;
      case 'extract': return <Info className="w-4 h-4" />;
      case 'edit': return <Edit3 className="w-4 h-4" />;
      case 'convert': return <Download className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getOperationDescription = () => {
    switch (options.operation) {
      case 'validate': return 'Check SVG syntax and structure for errors';
      case 'optimize': return 'Remove metadata, optimize paths, and reduce file size';
      case 'minify': return 'Remove whitespace and comments for smallest size';
      case 'prettify': return 'Format SVG with proper indentation for readability';
      case 'extract': return 'Extract SVG information, elements, and statistics';
      case 'edit': return 'Modify SVG dimensions and basic properties';
      case 'convert': return 'Convert SVG to other image formats (requires libraries)';
      default: return '';
    }
  };

  const renderPreview = () => {
    if (!input.includes('<svg')) return null;

    try {
      return (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">SVG Preview</h3>
          <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-auto">
            <div 
              dangerouslySetInnerHTML={{ __html: input }}
              className="max-w-full max-h-full"
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">Preview not available - SVG may contain invalid syntax</p>
        </div>
      );
    }
  };

  const renderElementStats = (elements: SVGEditorResult['elements']) => {
    if (!elements) return null;

    const totalElements = Object.values(elements).reduce((sum, count) => sum + count, 0);
    if (totalElements === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">SVG Elements</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {Object.entries(elements).map(([type, count]) => (
            count > 0 && (
              <div key={type} className="flex justify-between">
                <span className="capitalize text-gray-600">{type}:</span>
                <span className="font-mono text-gray-900">{count}</span>
              </div>
            )
          ))}
        </div>
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between text-sm font-medium">
            <span>Total Elements:</span>
            <span>{totalElements}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderViewBoxInfo = (viewBox: SVGEditorResult['viewBox']) => {
    if (!viewBox) return null;

    return (
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">ViewBox</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">X:</span>
            <span className="font-mono text-gray-900">{viewBox.x}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Y:</span>
            <span className="font-mono text-gray-900">{viewBox.y}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Width:</span>
            <span className="font-mono text-gray-900">{viewBox.width}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Height:</span>
            <span className="font-mono text-gray-900">{viewBox.height}</span>
          </div>
        </div>
      </div>
    );
  };

  const inputStats = input ? {
    characters: input.length,
    lines: input.split('\n').length,
    size: new Blob([input]).size
  } : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
          <Palette className="w-8 h-8 text-pink-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SVG Editor</h1>
        <p className="text-lg text-gray-600">
          Edit, optimize, validate, and manipulate SVG files with comprehensive tools
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <InputPanel
            title="SVG Content"
            subtitle="Paste your SVG code here"
          >
            <div className="space-y-4">
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;>&#10;  <circle cx=&quot;50&quot; cy=&quot;50&quot; r=&quot;40&quot; fill=&quot;blue&quot; />&#10;</svg>"
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
              />

              {/* Input Statistics */}
              {inputStats && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Input Statistics</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.characters}</div>
                      <div>Characters</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.lines}</div>
                      <div>Lines</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inputStats.size}B</div>
                      <div>Size</div>
                    </div>
                  </div>
                </div>
              )}

              {renderPreview()}
            </div>
          </InputPanel>
        </div>

        {/* Options Panel */}
        <div className="lg:col-span-1">
          <OptionsPanel title="SVG Processing Options">
            <div className="space-y-4">
              {/* Operation Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operation
                </label>
                <select
                  value={options.operation}
                  onChange={(e) => handleOptionsChange({ operation: e.target.value as SVGEditorOptions['operation'] })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="validate">Validate SVG</option>
                  <option value="optimize">Optimize SVG</option>
                  <option value="minify">Minify SVG</option>
                  <option value="prettify">Prettify SVG</option>
                  <option value="extract">Extract Information</option>
                  <option value="edit">Edit Properties</option>
                  <option value="convert">Convert Format</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getOperationDescription()}
                </p>
              </div>

              {/* Precision Control */}
              {['optimize', 'minify'].includes(options.operation) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precision: {options.precision} decimals
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={options.precision || 2}
                    onChange={(e) => handleOptionsChange({ precision: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 (integers)</span>
                    <span>6 (high precision)</span>
                  </div>
                </div>
              )}

              {/* Optimization Options */}
              {['optimize', 'minify'].includes(options.operation) && (
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.removeComments}
                      onChange={(e) => handleOptionsChange({ removeComments: e.target.checked })}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remove comments</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.removeMetadata}
                      onChange={(e) => handleOptionsChange({ removeMetadata: e.target.checked })}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remove metadata</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.removeUnusedDefs}
                      onChange={(e) => handleOptionsChange({ removeUnusedDefs: e.target.checked })}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remove unused definitions</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.convertShapesToPath}
                      onChange={(e) => handleOptionsChange({ convertShapesToPath: e.target.checked })}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Convert shapes to paths</span>
                  </label>
                </div>
              )}

              {/* Edit Options */}
              {options.operation === 'edit' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Width
                      </label>
                      <input
                        type="number"
                        value={options.width || ''}
                        onChange={(e) => handleOptionsChange({ width: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Auto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height
                      </label>
                      <input
                        type="number"
                        value={options.height || ''}
                        onChange={(e) => handleOptionsChange({ height: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Auto"
                      />
                    </div>
                  </div>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.maintainAspectRatio}
                      onChange={(e) => handleOptionsChange({ maintainAspectRatio: e.target.checked })}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Maintain aspect ratio</span>
                  </label>
                </div>
              )}

              {/* Convert Options */}
              {options.operation === 'convert' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Output Format
                    </label>
                    <select
                      value={options.outputFormat || 'png'}
                      onChange={(e) => handleOptionsChange({ outputFormat: e.target.value as SVGEditorOptions['outputFormat'] })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="png">PNG</option>
                      <option value="jpg">JPEG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality: {options.quality}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={options.quality || 85}
                      onChange={(e) => handleOptionsChange({ quality: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </OptionsPanel>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-1">
          <OutputPanel title="Processing Results">
            {!processedResult ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Enter SVG content to see results</p>
              </div>
            ) : processedResult.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Processing completed successfully!</span>
                </div>

                {/* File Size Info */}
                {processedResult.originalSize !== undefined && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">File Size</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Original:</span>
                        <span className="font-mono text-green-900">{processedResult.originalSize} bytes</span>
                      </div>
                      {processedResult.optimizedSize !== undefined && processedResult.optimizedSize !== processedResult.originalSize && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-green-700">Optimized:</span>
                            <span className="font-mono text-green-900">{processedResult.optimizedSize} bytes</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-green-700">Saved:</span>
                            <span className="text-green-900">{processedResult.compressionRatio}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Element Statistics */}
                {processedResult.elements && renderElementStats(processedResult.elements)}

                {/* ViewBox Information */}
                {processedResult.viewBox && renderViewBoxInfo(processedResult.viewBox)}

                {/* Warnings */}
                {processedResult.warnings && processedResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Warnings</span>
                    </div>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      {processedResult.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Output Content */}
                {processedResult.output && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Processed SVG</h3>
                      <button
                        onClick={() => navigator.clipboard.writeText(processedResult.output || '')}
                        className="text-sm text-pink-600 hover:text-pink-800"
                      >
                        Copy to clipboard
                      </button>
                    </div>
                    <textarea
                      value={processedResult.output}
                      readOnly
                      className="w-full h-48 p-3 border border-gray-300 rounded font-mono text-xs bg-gray-50 resize-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Processing failed</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 text-sm">{processedResult.error}</p>
                </div>
              </div>
            )}
          </OutputPanel>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">SVG Editing Tips</h3>
            <div className="text-blue-800 text-sm mt-1 space-y-1">
              <p>• Use validation to check for common SVG issues before optimization</p>
              <p>• Minification is best for production use, prettification for development</p>
              <p>• Lower precision reduces file size but may affect visual quality</p>
              <p>• Converting shapes to paths improves compatibility but reduces editability</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SvgEditor;