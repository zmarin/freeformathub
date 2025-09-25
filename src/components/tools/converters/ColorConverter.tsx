import { useState, useEffect, useMemo, useCallback } from 'react';
import { processColor, type ColorConverterConfig } from '../../../tools/converters/color-converter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface ColorConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: ColorConverterConfig = {
  inputFormat: 'auto',
  outputFormats: [], // Empty array means show all formats
  includeAlpha: true,
  uppercaseHex: false,
  showColorPreview: true,
};

// Essential options only - simplified UX
const ESSENTIAL_OPTIONS = [
  {
    key: 'inputFormat',
    label: 'Input Format',
    type: 'select' as const,
    default: 'auto',
    options: [
      { value: 'auto', label: 'Auto-detect' },
      { value: 'hex', label: 'HEX' },
      { value: 'rgb', label: 'RGB' },
      { value: 'hsl', label: 'HSL' },
      { value: 'hsv', label: 'HSV' },
      { value: 'named', label: 'Named' },
    ],
    description: 'Input color format',
  },
  {
    key: 'outputFormats',
    label: 'Output Formats',
    type: 'multiselect' as const,
    default: [],
    options: [
      { value: 'hex', label: 'HEX' },
      { value: 'rgb', label: 'RGB' },
      { value: 'hsl', label: 'HSL' },
      { value: 'hsv', label: 'HSV' },
    ],
    description: 'Select output formats (empty = all)',
  },
  {
    key: 'includeAlpha',
    label: 'Include Alpha',
    type: 'boolean' as const,
    default: true,
    description: 'Include alpha channel in output',
  },
];

// Advanced options for power users
const ADVANCED_OPTIONS = [
  {
    key: 'uppercaseHex',
    label: 'Uppercase HEX',
    type: 'boolean' as const,
    default: false,
    description: 'Use uppercase letters in HEX output',
  },
  {
    key: 'showColorPreview',
    label: 'Show Preview',
    type: 'boolean' as const,
    default: true,
    description: 'Display color preview in output',
  },
];

const EXAMPLES = [
  {
    title: 'HEX Color',
    value: '#ff5733',
  },
  {
    title: 'RGB Color',
    value: 'rgb(64, 128, 255)',
  },
  {
    title: 'RGBA with Alpha',
    value: 'rgba(255, 87, 51, 0.8)',
  },
  {
    title: 'HSL Color',
    value: 'hsl(240, 100%, 50%)',
  },
  {
    title: 'Named Color',
    value: 'coral',
  },
  {
    title: 'HEX with Alpha',
    value: '#ff573380',
  },
];

export function ColorConverter({ className = '' }: ColorConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ColorConverterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [colorPreview, setColorPreview] = useState<string>('#ffffff');

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  // Load saved config once on mount
  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('color-converter') as Partial<ColorConverterConfig>) || {};
      if (saved && Object.keys(saved).length > 0) {
        setConfig((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
  }, [getSavedConfig]);

  // Process color function
  const processColorData = useCallback((inputText: string = input, cfg: ColorConverterConfig = config) => {
    if (!inputText.trim()) {
      setOutput('');
      setError(undefined);
      setMetadata(undefined);
      setColorPreview('#ffffff');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Process immediately for manual format button
    const result = processColor(inputText, cfg);
    
    if (result.success) {
      setOutput(result.output || '');
      setError(undefined);
      setMetadata(result.metadata);
      
      // Extract color for preview
      if (result.metadata?.colorPreview) {
        setColorPreview(result.metadata.colorPreview as string);
      }
      
      // Add to history for successful operations
      addToHistory({
        toolId: 'color-converter',
        input: inputText,
        output: result.output || '',
        config: cfg,
        timestamp: Date.now(),
      });
    } else {
      setOutput('');
      setError(result.error);
      setMetadata(undefined);
      setColorPreview('#ffffff');
    }
    
    setIsLoading(false);
  }, [input, config, addToHistory]);

  // Debounced processing for auto-format
  const debouncedProcess = useMemo(
    () => debounce(processColorData, 500),
    [processColorData]
  );

  // Process input when it changes (only if auto-format is enabled)
  useEffect(() => {
    if (autoFormat) {
      debouncedProcess(input, config);
    }
  }, [input, config, debouncedProcess, autoFormat]);

  // Quick action handlers
  const handleHexConvert = useCallback(() => {
    const hexConfig = { ...config, outputFormats: ['hex'] };
    setConfig(hexConfig);
    processColorData(input, hexConfig);
  }, [input, config, processColorData]);

  const handleRgbConvert = useCallback(() => {
    const rgbConfig = { ...config, outputFormats: ['rgb'] };
    setConfig(rgbConfig);
    processColorData(input, rgbConfig);
  }, [input, config, processColorData]);

  const handleHslConvert = useCallback(() => {
    const hslConfig = { ...config, outputFormats: ['hsl'] };
    setConfig(hslConfig);
    processColorData(input, hslConfig);
  }, [input, config, processColorData]);

  const handleHslaConvert = useCallback(() => {
    const hslaConfig = { ...config, outputFormats: ['hsl'], includeAlpha: true };
    setConfig(hslaConfig);
    processColorData(input, hslaConfig);
  }, [input, config, processColorData]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setInput(content);
      if (autoFormat) {
        processColorData(content, config);
      }
    } catch (error) {
      setError('Failed to read file. Please make sure it\'s a valid text file.');
    }
  }, [autoFormat, config, processColorData]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [output]);

  // Download handler
  const handleDownload = useCallback(() => {
    downloadFile(output, 'color-formats.txt', 'text/plain');
  }, [output]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: ColorConverterConfig) => {
    setConfig(newConfig);
    try { updateSavedConfig?.('color-converter', newConfig); } catch {}
    
    // If not auto-formatting, don't process automatically
    if (!autoFormat) return;
    processColorData(input, newConfig);
  };

  // Essential config options handler
  const handleEssentialConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleConfigChange(newConfig);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tool Header with Quick Actions */}
      <div >
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleHexConvert}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert to HEX format"
          >
            # HEX
          </button>
          <button
            onClick={handleRgbConvert}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert to RGB format"
          >
            🎨 RGB
          </button>
          <button
            onClick={handleHslConvert}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert to HSL format"
          >
            🌈 HSL
          </button>
          <button
            onClick={handleHslaConvert}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Convert to HSLA format with alpha"
          >
            🎭 HSLA
          </button>
          {!autoFormat && (
            <button
              onClick={() => processColorData()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? '⏳' : '⚡'} Convert
            </button>
          )}
        </div>

        {/* Auto-format toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <label >
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="rounded"
            />
            Auto-convert
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[600px]">
        {/* Input Section */}
        <div >
          {/* Input Header */}
          <div >
            <h3 >
              Color Input
            </h3>
            <div className="flex items-center gap-2">
              <label >
                📁 Upload
                <input
                  type="file"
                  accept=".txt,.css,.scss,.json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
              {input && (
                <button
                  onClick={() => setInput('')}
                  
                  title="Clear input"
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div 
            className={`flex-1 relative ${dragActive ? 'bg-blue-50/20' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter color in any format (HEX, RGB, HSL, HSV, Named)..."
              
              spellCheck={false}
            />
            {dragActive && (
              <div >
                <div >
                  Drop color file here
                </div>
              </div>
            )}
          </div>

          {/* Color Preview */}
          {input && !error && (
            <div >
              <div className="flex items-center gap-4 mb-3">
                <div 
                  
                  style={{ backgroundColor: colorPreview }}
                  title={`Click to copy: ${colorPreview}`}
                  onClick={() => copyToClipboard(colorPreview)}
                />
                <div >
                  <div className="font-mono text-lg">{colorPreview}</div>
                  <div className="text-xs mt-1">Click preview to copy</div>
                </div>
              </div>
              
              {/* Quick Color Picker */}
              <div className="grid grid-cols-8 gap-1">
                {[
                  '#ff0000', '#00ff00', '#0000ff', '#ffff00',
                  '#ff00ff', '#00ffff', '#ffa500', '#800080',
                  '#ffc0cb', '#8b4513', '#000000', '#ffffff',
                  '#808080', '#ff6347', '#32cd32', '#4169e1'
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => setInput(color)}
                    
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Example buttons */}
          <div >
            <div className="flex flex-wrap gap-2">
              <span >Examples:</span>
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(example.value)}
                  
                  title={example.title}
                >
                  {example.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col">
          {/* Output Header */}
          <div >
            <h3 >
              Color Formats
              {isLoading && <span >Processing...</span>}
              {!error && output && <span >✓ Converted</span>}
              {error && <span >✗ Invalid</span>}
            </h3>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button
                    onClick={handleCopy}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      copied 
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    
                  >
                    💾 Download
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Output Content */}
          <div >
            {error ? (
              <div className="p-4 h-full">
                <div >
                  <h4 >Color Error</h4>
                  <pre >
                    {error}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <textarea
                  value={output}
                  readOnly
                  placeholder="Converted color formats will appear here..."
                  
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Metadata display */}
          {metadata && !error && output && (
            <div >
              <div >
                {metadata.inputFormat && (
                  <span><strong>Input:</strong> {metadata.inputFormat.toUpperCase()}</span>
                )}
                {metadata.outputFormatCount && (
                  <span><strong>Formats:</strong> {metadata.outputFormatCount}</span>
                )}
                {typeof metadata.processingTimeMs === 'number' && (
                  <span><strong>Time:</strong> {Math.round(metadata.processingTimeMs)}ms</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Essential Options Panel */}
      <div >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 >Options</h4>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              
            >
              {showAdvanced ? '△ Less' : '▽ More'}
            </button>
          </div>
          
          {/* Essential options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESSENTIAL_OPTIONS.map((option) => (
              <div key={option.key} className="space-y-1">
                <label >
                  {option.label}
                </label>
                {option.type === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!config[option.key as keyof ColorConverterConfig]}
                      onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                      className="rounded"
                    />
                    <span >
                      {option.description}
                    </span>
                  </label>
                ) : option.type === 'select' ? (
                  <select
                    value={String(config[option.key as keyof ColorConverterConfig] ?? option.default)}
                    onChange={(e) => handleEssentialConfigChange(option.key, e.target.value)}
                    
                  >
                    {option.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : option.type === 'multiselect' ? (
                  <div >
                    <div className="flex flex-wrap gap-1 mt-1">
                      {option.options?.map((opt) => {
                        const isSelected = (config.outputFormats as string[])?.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              const currentFormats = config.outputFormats as string[] || [];
                              const newFormats = isSelected
                                ? currentFormats.filter(f => f !== opt.value)
                                : [...currentFormats, opt.value];
                              handleEssentialConfigChange('outputFormats', newFormats);
                            }}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              isSelected
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <div >
                      {option.description}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Advanced options */}
          {showAdvanced && (
            <div >
              <h5 >Advanced Options</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADVANCED_OPTIONS.map((option) => (
                  <div key={option.key} className="space-y-1">
                    <label >
                      {option.label}
                    </label>
                    {option.type === 'boolean' ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!config[option.key as keyof ColorConverterConfig]}
                          onChange={(e) => handleEssentialConfigChange(option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span >
                          {option.description}
                        </span>
                      </label>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}