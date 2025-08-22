import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processBinaryHexViewer, type BinaryHexViewerConfig } from '../../../tools/data/binary-hex-viewer';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface BinaryHexViewerProps {
  className?: string;
}

const DEFAULT_CONFIG: BinaryHexViewerConfig = {
  displayMode: 'combined',
  bytesPerLine: 16,
  showAddresses: true,
  showAscii: true,
  groupBytes: 4,
  upperCase: true,
  encoding: 'utf8',
  startOffset: 0,
  maxBytes: 2048,
  highlightPattern: '',
  colorize: true,
  showHeaders: true,
};

const DISPLAY_OPTIONS = [
  {
    key: 'displayMode',
    label: 'Display Mode',
    type: 'select' as const,
    default: 'combined',
    options: [
      { value: 'hex', label: '🔢 Hex Only - Hexadecimal display' },
      { value: 'binary', label: '🔵 Binary Only - Binary display' },
      { value: 'ascii', label: '📝 ASCII Only - Text display' },
      { value: 'combined', label: '📊 Combined - All formats' },
    ],
    description: 'How to display the binary data',
  },
  {
    key: 'encoding',
    label: 'Text Encoding',
    type: 'select' as const,
    default: 'utf8',
    options: [
      { value: 'utf8', label: 'UTF-8' },
      { value: 'utf16', label: 'UTF-16' },
      { value: 'ascii', label: 'ASCII' },
      { value: 'latin1', label: 'Latin-1' },
    ],
    description: 'Character encoding for text input',
  },
] as const;

const LAYOUT_OPTIONS = [
  {
    key: 'bytesPerLine',
    label: 'Bytes Per Line',
    type: 'number' as const,
    default: 16,
    min: 8,
    max: 64,
    description: 'Number of bytes to display per line',
  },
  {
    key: 'groupBytes',
    label: 'Group Bytes',
    type: 'number' as const,
    default: 4,
    min: 1,
    max: 16,
    description: 'Group bytes with spaces',
  },
  {
    key: 'maxBytes',
    label: 'Max Bytes',
    type: 'number' as const,
    default: 2048,
    min: 256,
    max: 65536,
    description: 'Maximum bytes to display',
  },
  {
    key: 'startOffset',
    label: 'Start Offset',
    type: 'number' as const,
    default: 0,
    min: 0,
    description: 'Byte offset to start viewing from',
  },
] as const;

const FORMAT_OPTIONS = [
  {
    key: 'showAddresses',
    label: 'Show Addresses',
    type: 'checkbox' as const,
    default: true,
    description: 'Display memory addresses in first column',
  },
  {
    key: 'showAscii',
    label: 'Show ASCII',
    type: 'checkbox' as const,
    default: true,
    description: 'Display ASCII representation',
  },
  {
    key: 'upperCase',
    label: 'Uppercase Hex',
    type: 'checkbox' as const,
    default: true,
    description: 'Display hex in uppercase letters',
  },
  {
    key: 'showHeaders',
    label: 'Show Column Headers',
    type: 'checkbox' as const,
    default: true,
    description: 'Display column headers and separators',
  },
  {
    key: 'colorize',
    label: 'Colorize Output',
    type: 'checkbox' as const,
    default: true,
    description: 'Use colors to highlight different data types',
  },
] as const;

export function BinaryHexViewer({ className = '' }: BinaryHexViewerProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<BinaryHexViewerConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: BinaryHexViewerConfig) => {
      if (!currentInput.trim()) {
        setOutput('');
        setAnalysis(null);
        setError(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processBinaryHexViewer(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setAnalysis(result.analysis);
          
          // Add to history
          addToHistory({
            toolId: 'binary-hex-viewer',
            input: currentInput.substring(0, 100) + (currentInput.length > 100 ? '...' : ''),
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process binary/hex data');
          setOutput('');
          setAnalysis(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during processing');
        setOutput('');
        setAnalysis(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('binary-hex-viewer');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'png' | 'jpeg' | 'text' | 'executable' | 'custom') => {
    const examples = {
      png: '89504E470D0A1A0A0000000D49484452000001000000010008060000005C72A866',
      jpeg: 'FFD8FFE000104A46494600010101006000600000FFE1001645786966000049492A00',
      text: 'Hello, World! This is a sample text for hex analysis.',
      executable: '4D5A90000300000004000000FFFF0000B800000000000000400000000000000000',
      custom: '48656C6C6F20576F726C642100'
    };
    
    setInput(examples[type]);
  };

  const handleLoadSampleData = () => {
    const sampleData = `PNG Header Example
89 50 4E 47 0D 0A 1A 0A  - PNG Signature
00 00 00 0D 49 48 44 52  - IHDR chunk header
00 00 01 00 00 00 01 00  - Width and height
08 06 00 00 00 5C 72 A8  - Bit depth, color type, etc.
66                        - CRC checksum start`;
    
    setInput(sampleData.replace(/\s*-.*$/gm, '').replace(/\s+/g, ''));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        setError('File too large. Maximum size is 1MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        const hexString = Array.from(uint8Array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        setInput(hexString);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Build conditional options
  const allOptions = [
    ...DISPLAY_OPTIONS,
    ...LAYOUT_OPTIONS,
    ...FORMAT_OPTIONS,
  ];

  const inputPlaceholder = `Enter hex data (e.g., 48656C6C6F) or text to analyze:

Examples:
• Hex: 89504E470D0A1A0A (PNG header)
• Text: Hello World!
• Mixed: 48 65 6C 6C 6F 20 57 6F 72 6C 64`;

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('png')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              🖼️ PNG Header
            </button>
            <button
              onClick={() => handleQuickExample('jpeg')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              📷 JPEG Header
            </button>
            <button
              onClick={() => handleQuickExample('text')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              📝 Text Data
            </button>
            <button
              onClick={() => handleQuickExample('executable')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              ⚙️ Executable
            </button>
          </div>
          <button
            onClick={handleLoadSampleData}
            className="w-full px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            📄 Load Sample Data
          </button>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">File Upload</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".png,.jpg,.jpeg,.gif,.pdf,.exe,.zip,.bin,*"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <span className="text-2xl mb-2">📁</span>
              <span className="text-sm text-gray-600">Click to upload file</span>
              <span className="text-xs text-gray-500 mt-1">Max 1MB</span>
            </label>
          </div>
        </div>

        <OptionsPanel
          title="Display Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* File Analysis Results */}
        {analysis && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">File Analysis</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="grid gap-2">
                <div>
                  <span className="text-blue-600">Format:</span>
                  <span className="ml-1 font-medium text-blue-800">
                    {analysis.fileFormat.name} ({analysis.fileFormat.confidence * 100}%)
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Size:</span>
                  <span className="ml-1 font-medium text-blue-800">{analysis.size} bytes</span>
                </div>
                <div>
                  <span className="text-blue-600">Magic Number:</span>
                  <span className="ml-1 font-mono text-blue-800">{analysis.magicNumber}</span>
                </div>
                <div>
                  <span className="text-blue-600">Entropy:</span>
                  <span className="ml-1 font-medium text-blue-800">{analysis.entropy} bits</span>
                </div>
                <div>
                  <span className="text-blue-600">Printable:</span>
                  <span className="ml-1 font-medium text-blue-800">
                    {Math.round((analysis.printableChars / analysis.size) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Null Bytes:</span>
                  <span className="ml-1 font-medium text-blue-800">{analysis.nullBytes}</span>
                </div>
              </div>
              
              {analysis.fileFormat.description && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="text-blue-700">{analysis.fileFormat.description}</div>
                  {analysis.fileFormat.mimeType && (
                    <div className="text-blue-600 font-mono text-xs">{analysis.fileFormat.mimeType}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* File Structure */}
        {analysis && analysis.structure.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">File Structure</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {analysis.structure.map((struct: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-1 rounded text-xs ${
                      struct.type === 'header' ? 'bg-green-100 text-green-800' :
                      struct.type === 'footer' ? 'bg-red-100 text-red-800' :
                      struct.type === 'metadata' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {struct.type}
                    </span>
                    <span className="font-medium text-gray-800">{struct.name}</span>
                  </div>
                  <div className="text-gray-600 mt-1">{struct.description}</div>
                  <div className="text-gray-500 font-mono">
                    @{struct.offset.toString(16).toUpperCase().padStart(8, '0')} 
                    ({struct.length} bytes)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Display Info</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800">Current View</div>
              <div className="text-gray-600">
                Offset: {config.startOffset} | 
                Max: {config.maxBytes} bytes | 
                Line: {config.bytesPerLine} bytes
              </div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="font-medium text-green-800">Format Features</div>
              <div className="text-green-700">
                {config.showAddresses && '📍 Addresses '}
                {config.showAscii && '📝 ASCII '}
                {config.upperCase && '🔤 Uppercase '}
                {config.colorize && '🎨 Colors'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="Binary/Hex Data Input"
          value={input}
          onChange={setInput}
          placeholder={inputPlaceholder}
          language="text"
        />

        <OutputPanel
          title="Hex Dump Output"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="Enter binary data or hex to view formatted dump..."
          processingMessage="Processing binary data..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Dump
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'hexdump.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download Dump
                </button>
                {analysis && (
                  <button
                    onClick={() => {
                      const analysisText = `File Analysis Report
                      
Format: ${analysis.fileFormat.name}
MIME Type: ${analysis.fileFormat.mimeType}
Description: ${analysis.fileFormat.description}
Confidence: ${(analysis.fileFormat.confidence * 100).toFixed(1)}%

Statistics:
- Size: ${analysis.size} bytes
- Entropy: ${analysis.entropy} bits
- Magic Number: ${analysis.magicNumber}
- Printable Characters: ${analysis.printableChars} (${Math.round((analysis.printableChars / analysis.size) * 100)}%)
- Null Bytes: ${analysis.nullBytes}

${analysis.structure.length > 0 ? `
File Structure:
${analysis.structure.map((s: any) => `- ${s.name}: @${s.offset.toString(16).toUpperCase()} (${s.length} bytes)`).join('\n')}
` : ''}`;
                      
                      navigator.clipboard?.writeText(analysisText);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    📊 Copy Analysis
                  </button>
                )}
                <button
                  onClick={() => {
                    // Extract hex data from input
                    const hexOnly = input.replace(/[^0-9A-Fa-f]/g, '');
                    navigator.clipboard?.writeText(hexOnly);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📋 Copy Hex Only
                </button>
                {analysis && analysis.fileFormat.name !== 'Unknown' && (
                  <button
                    onClick={() => {
                      const signature = `File Signature: ${analysis.fileFormat.name}
Magic Number: ${analysis.magicNumber}
MIME Type: ${analysis.fileFormat.mimeType}
Extension: ${analysis.fileFormat.extension}
Hex Pattern: ${analysis.signature.substring(0, 16)}...`;
                      
                      navigator.clipboard?.writeText(signature);
                    }}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    🏷️ Copy Signature
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