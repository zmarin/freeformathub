import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processDataUriConverter, type DataUriConverterConfig, COMMON_MIME_TYPES, CHARSET_OPTIONS } from '../../../tools/converters/data-uri-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface DataUriConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: DataUriConverterConfig = {
  mode: 'encode',
  mimeType: 'text/plain',
  encoding: 'base64',
  includeCharset: true,
  charset: 'UTF-8',
  validateInput: true,
  preserveLineBreaks: true,
  autoDetectMime: true,
};

const MODE_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'encode',
    options: [
      { value: 'encode', label: '📤 Encode - Convert content to Data URI' },
      { value: 'decode', label: '📥 Decode - Extract content from Data URI' },
    ],
    description: 'Choose conversion direction',
  },
] as const;

const ENCODING_OPTIONS = [
  {
    key: 'encoding',
    label: 'Encoding Method',
    type: 'select' as const,
    default: 'base64',
    options: [
      { value: 'base64', label: 'Base64 - Compact binary encoding' },
      { value: 'percent', label: 'Percent - URL-safe text encoding' },
    ],
    description: 'How to encode the content data',
  },
  {
    key: 'mimeType',
    label: 'MIME Type',
    type: 'select' as const,
    default: 'text/plain',
    options: COMMON_MIME_TYPES.map(mime => ({
      value: mime.value,
      label: `${mime.label} (${mime.value})`
    })),
    description: 'Content type for the Data URI',
  },
  {
    key: 'charset',
    label: 'Character Set',
    type: 'select' as const,
    default: 'UTF-8',
    options: CHARSET_OPTIONS.map(charset => ({
      value: charset,
      label: charset
    })),
    description: 'Character encoding for text content',
  },
] as const;

const FORMAT_OPTIONS = [
  {
    key: 'autoDetectMime',
    label: 'Auto-detect MIME Type',
    type: 'checkbox' as const,
    default: true,
    description: 'Automatically detect content type from input',
  },
  {
    key: 'includeCharset',
    label: 'Include Charset',
    type: 'checkbox' as const,
    default: true,
    description: 'Add character set parameter to Data URI',
  },
  {
    key: 'preserveLineBreaks',
    label: 'Preserve Line Breaks',
    type: 'checkbox' as const,
    default: true,
    description: 'Maintain original line breaks in encoded content',
  },
  {
    key: 'validateInput',
    label: 'Validate Input',
    type: 'checkbox' as const,
    default: true,
    description: 'Check Data URI format when decoding',
  },
] as const;

export function DataUriConverter({ className = '' }: DataUriConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<DataUriConverterConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: DataUriConverterConfig) => {
      if (!currentInput.trim()) {
        setOutput('');
        setInfo(null);
        setError(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processDataUriConverter(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setInfo(result.info);
          
          // Add to history
          addToHistory({
            toolId: 'data-uri-converter',
            input: currentInput.substring(0, 100) + (currentInput.length > 100 ? '...' : ''),
            output: result.output.substring(0, 100) + (result.output.length > 100 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process Data URI');
          setOutput('');
          setInfo(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while processing');
        setOutput('');
        setInfo(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('data-uri-converter');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'text' | 'json' | 'svg' | 'datauri') => {
    const examples = {
      text: 'Hello, World!\nThis is a sample text for Data URI encoding.',
      json: JSON.stringify({ name: 'Sample', type: 'demo', values: [1, 2, 3] }, null, 2),
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>',
      datauri: 'data:text/plain;charset=UTF-8;base64,SGVsbG8sIFdvcmxkIQ=='
    };
    
    setInput(examples[type]);
    
    if (type === 'datauri') {
      setConfig(prev => ({ ...prev, mode: 'decode' }));
    } else {
      setConfig(prev => ({ ...prev, mode: 'encode' }));
    }
  };

  const handleModeSwap = () => {
    if (config.mode === 'encode' && output) {
      // Switch to decode mode and use output as input
      setInput(output);
      setConfig(prev => ({ ...prev, mode: 'decode' }));
    } else if (config.mode === 'decode' && output) {
      // Switch to encode mode and use output as input
      setInput(output);
      setConfig(prev => ({ ...prev, mode: 'encode' }));
    }
  };

  // Group MIME types by category
  const mimeByCategory = useMemo(() => {
    const groups: Record<string, typeof COMMON_MIME_TYPES> = {};
    COMMON_MIME_TYPES.forEach(mime => {
      if (!groups[mime.category]) {
        groups[mime.category] = [];
      }
      groups[mime.category].push(mime);
    });
    return groups;
  }, []);

  // Build conditional options based on mode
  const allOptions = [
    ...MODE_OPTIONS,
    ...(config.mode === 'encode' ? ENCODING_OPTIONS.filter(opt => {
      // Show charset only for text-like MIME types and when includeCharset is true
      if (opt.key === 'charset') {
        return config.includeCharset && config.mimeType.startsWith('text/');
      }
      return true;
    }) : []),
    ...FORMAT_OPTIONS.filter(opt => {
      // Show validation only in decode mode
      if (opt.key === 'validateInput') return config.mode === 'decode';
      // Show MIME detection only in encode mode
      if (opt.key === 'autoDetectMime') return config.mode === 'encode';
      // Show charset inclusion only in encode mode
      if (opt.key === 'includeCharset') return config.mode === 'encode';
      // Show line break preservation only in encode mode
      if (opt.key === 'preserveLineBreaks') return config.mode === 'encode';
      return true;
    }),
  ];

  const inputPlaceholder = config.mode === 'encode' 
    ? 'Enter text, JSON, HTML, SVG, or other content to convert to Data URI...'
    : 'Paste a Data URI (data:text/plain;base64,SGVsbG8=) to decode...';

  const outputPlaceholder = config.mode === 'encode'
    ? 'Data URI will appear here...'
    : 'Decoded content will appear here...';

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('text')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              📝 Plain Text
            </button>
            <button
              onClick={() => handleQuickExample('json')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              📊 JSON Data
            </button>
            <button
              onClick={() => handleQuickExample('svg')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              🎨 SVG Image
            </button>
            <button
              onClick={() => handleQuickExample('datauri')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              🔗 Data URI
            </button>
          </div>
        </div>

        {/* Mode Switch */}
        {(output || input) && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>
            <button
              onClick={handleModeSwap}
              className="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              🔄 Switch to {config.mode === 'encode' ? 'Decode' : 'Encode'} Mode
            </button>
          </div>
        )}

        <OptionsPanel
          title="Conversion Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* MIME Type Categories */}
        {config.mode === 'encode' && !config.autoDetectMime && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">MIME Type Categories</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(mimeByCategory).map(([category, mimes]) => (
                <div key={category} className="space-y-1">
                  <h4 className="text-xs font-medium text-gray-600 border-b border-gray-200 pb-1">
                    {category}
                  </h4>
                  <div className="grid gap-1">
                    {mimes.map(mime => (
                      <button
                        key={mime.value}
                        onClick={() => handleConfigChange('mimeType', mime.value)}
                        className={`px-2 py-1 text-xs rounded text-left transition-colors ${
                          config.mimeType === mime.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {mime.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data URI Information */}
        {info && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Conversion Info</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-green-600">MIME Type:</span>
                  <div className="font-medium text-green-800">{info.mimeType}</div>
                </div>
                <div>
                  <span className="text-green-600">Encoding:</span>
                  <div className="font-medium text-green-800">{info.encoding}</div>
                </div>
                <div>
                  <span className="text-green-600">Original Size:</span>
                  <div className="font-medium text-green-800">{info.originalSize} bytes</div>
                </div>
                <div>
                  <span className="text-green-600">Encoded Size:</span>
                  <div className="font-medium text-green-800">{info.encodedSize} bytes</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="text-green-700">
                  <div>Size Ratio: {info.compressionRatio}x</div>
                  {info.charset && <div>Charset: {info.charset}</div>}
                  <div>Status: {info.isValid ? '✅ Valid' : '❌ Invalid'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Usage Tips</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">Small Files Only</div>
              <div className="text-blue-700">Keep Data URIs under 10KB for best performance</div>
            </div>
            <div className="p-2 bg-yellow-50 rounded">
              <div className="font-medium text-yellow-800">Base64 vs Percent</div>
              <div className="text-yellow-700">Use base64 for binary data, percent for readable text</div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="font-medium text-green-800">Browser Support</div>
              <div className="text-green-700">All modern browsers support Data URIs up to 32MB</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title={config.mode === 'encode' ? 'Content to Encode' : 'Data URI to Decode'}
          value={input}
          onChange={setInput}
          placeholder={inputPlaceholder}
          language={config.mode === 'encode' ? 'text' : 'uri'}
        />

        <OutputPanel
          title={config.mode === 'encode' ? 'Generated Data URI' : 'Decoded Content'}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.mode === 'encode' ? 'uri' : (info?.mimeType?.includes('json') ? 'json' : 'text')}
          placeholder={outputPlaceholder}
          processingMessage={`${config.mode === 'encode' ? 'Encoding' : 'Decoding'} Data URI...`}
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Result
                </button>
                {config.mode === 'encode' && (
                  <button
                    onClick={() => {
                      const blob = new Blob([output], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'data-uri.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    💾 Download URI
                  </button>
                )}
                {config.mode === 'decode' && info && (
                  <button
                    onClick={() => {
                      const extension = info.mimeType.includes('json') ? 'json' :
                                      info.mimeType.includes('html') ? 'html' :
                                      info.mimeType.includes('css') ? 'css' :
                                      info.mimeType.includes('javascript') ? 'js' : 'txt';
                      const blob = new Blob([output], { type: info.mimeType });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `decoded-content.${extension}`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    💾 Download Content
                  </button>
                )}
                {config.mode === 'encode' && info && (
                  <button
                    onClick={() => {
                      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Data URI Preview</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .preview { border: 1px solid #ccc; padding: 20px; margin: 20px 0; }
    code { background: #f4f4f4; padding: 2px 4px; }
  </style>
</head>
<body>
  <h1>Data URI Preview</h1>
  <div class="info">
    <p><strong>MIME Type:</strong> ${info.mimeType}</p>
    <p><strong>Size:</strong> ${info.originalSize} → ${info.encodedSize} bytes</p>
  </div>
  <div class="preview">
    ${info.mimeType.startsWith('text/html') ? output.replace(/^data:[^,]+,/, '').replace(/data:[^,]+,/, '') :
      info.mimeType.startsWith('image/') ? `<img src="${output}" alt="Data URI Image">` :
      `<pre><code>${output}</code></pre>`}
  </div>
</body>
</html>`;
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'data-uri-preview.html';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    👁️ Preview HTML
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}