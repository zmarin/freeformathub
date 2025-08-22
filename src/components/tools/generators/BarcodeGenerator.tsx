import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processBarcodeGenerator, type BarcodeConfig } from '../../../tools/generators/barcode-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface BarcodeGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: BarcodeConfig = {
  format: 'code128',
  width: 300,
  height: 100,
  displayValue: true,
  fontSize: 14,
  fontFamily: 'Arial',
  textAlign: 'center',
  textPosition: 'bottom',
  textMargin: 2,
  background: '#ffffff',
  lineColor: '#000000',
  margin: 10,
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  flat: false,
  includeChecksum: true,
  outputFormat: 'svg',
};

const FORMAT_OPTIONS = [
  {
    key: 'format',
    label: 'Barcode Format',
    type: 'select' as const,
    default: 'code128',
    options: [
      { value: 'code128', label: 'Code 128 (Alphanumeric)' },
      { value: 'code39', label: 'Code 39 (Basic)' },
      { value: 'ean13', label: 'EAN-13 (Retail)' },
      { value: 'ean8', label: 'EAN-8 (Small Products)' },
      { value: 'upc', label: 'UPC-A (US Retail)' },
      { value: 'itf', label: 'ITF-14 (Shipping)' },
      { value: 'msi', label: 'MSI Plessey' },
      { value: 'pharmacode', label: 'Pharmacode' },
      { value: 'codabar', label: 'Codabar' },
    ],
    description: 'Choose the barcode format/standard',
  },
  {
    key: 'width',
    label: 'Width (px)',
    type: 'number' as const,
    default: 300,
    min: 100,
    max: 800,
    description: 'Barcode width in pixels',
  },
  {
    key: 'height',
    label: 'Height (px)',
    type: 'number' as const,
    default: 100,
    min: 30,
    max: 300,
    description: 'Barcode height in pixels',
  },
] as const;

const TEXT_OPTIONS = [
  {
    key: 'displayValue',
    label: 'Show Text',
    type: 'checkbox' as const,
    default: true,
    description: 'Display human-readable text',
  },
  {
    key: 'fontSize',
    label: 'Font Size',
    type: 'number' as const,
    default: 14,
    min: 8,
    max: 24,
    description: 'Text font size in pixels',
  },
  {
    key: 'fontFamily',
    label: 'Font Family',
    type: 'select' as const,
    default: 'Arial',
    options: [
      { value: 'Arial', label: 'Arial' },
      { value: 'Helvetica', label: 'Helvetica' },
      { value: 'Times', label: 'Times' },
      { value: 'Courier', label: 'Courier' },
      { value: 'monospace', label: 'Monospace' },
    ],
    description: 'Font family for text',
  },
  {
    key: 'textAlign',
    label: 'Text Align',
    type: 'select' as const,
    default: 'center',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
    description: 'Text alignment',
  },
  {
    key: 'textPosition',
    label: 'Text Position',
    type: 'select' as const,
    default: 'bottom',
    options: [
      { value: 'bottom', label: 'Below Barcode' },
      { value: 'top', label: 'Above Barcode' },
    ],
    description: 'Position of text relative to barcode',
  },
] as const;

const STYLE_OPTIONS = [
  {
    key: 'background',
    label: 'Background Color',
    type: 'color' as const,
    default: '#ffffff',
    description: 'Background color',
  },
  {
    key: 'lineColor',
    label: 'Bar Color',
    type: 'color' as const,
    default: '#000000',
    description: 'Color of barcode bars',
  },
  {
    key: 'margin',
    label: 'Margin (px)',
    type: 'number' as const,
    default: 10,
    min: 0,
    max: 50,
    description: 'Margin around barcode',
  },
  {
    key: 'includeChecksum',
    label: 'Include Checksum',
    type: 'checkbox' as const,
    default: true,
    description: 'Include checksum digits where applicable',
  },
] as const;

export function BarcodeGenerator({ className = '' }: BarcodeGeneratorProps) {
  const [input, setInput] = useState('123456789012');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<BarcodeConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: BarcodeConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processBarcodeGenerator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setBarcode(result.barcode);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'barcode-generator',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.barcode ? `${result.barcode.barcodeFormat}` : 'Generated',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate barcode');
          setOutput('');
          setBarcode(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during barcode generation');
        setOutput('');
        setBarcode(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('barcode-generator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'product' | 'inventory' | 'shipping' | 'isbn' | 'pharmacy' | 'library' | 'serial' | 'custom') => {
    const examples = {
      product: {
        data: '1234567890123',
        config: { format: 'ean13', width: 300, height: 80, displayValue: true }
      },
      inventory: {
        data: 'INV-001-A',
        config: { format: 'code39', width: 400, height: 60, displayValue: true }
      },
      shipping: {
        data: '12345678901234',
        config: { format: 'itf', width: 500, height: 100, displayValue: true }
      },
      isbn: {
        data: '9781234567890',
        config: { format: 'ean13', width: 300, height: 80, displayValue: true }
      },
      pharmacy: {
        data: '12345',
        config: { format: 'pharmacode', width: 200, height: 50, displayValue: true }
      },
      library: {
        data: 'A1234567890',
        config: { format: 'codabar', width: 350, height: 70, displayValue: true }
      },
      serial: {
        data: 'SN-2024-001',
        config: { format: 'code128', width: 400, height: 60, displayValue: true }
      },
      custom: {
        data: 'HELLO WORLD',
        config: { format: 'code39', width: 450, height: 80, displayValue: true, background: '#f0f0f0', lineColor: '#333333' }
      }
    };
    
    const example = examples[type];
    setInput(example.data);
    
    // Apply configuration
    Object.entries(example.config).forEach(([key, value]) => {
      setConfig(prev => ({ ...prev, [key]: value }));
    });
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
    setConfig(DEFAULT_CONFIG);
  };

  const handleDownload = (format: string) => {
    if (!barcode) return;
    
    let dataUrl = '';
    let filename = '';
    let mimeType = '';
    
    switch (format) {
      case 'svg':
        dataUrl = `data:image/svg+xml;base64,${btoa(barcode.svgCode)}`;
        filename = `barcode-${Date.now()}.svg`;
        mimeType = 'image/svg+xml';
        break;
      case 'png':
        // Convert SVG to PNG (simplified - would need canvas conversion)
        dataUrl = barcode.dataUrl;
        filename = `barcode-${Date.now()}.png`;
        mimeType = 'image/png';
        break;
    }
    
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
    }
  };

  // Build conditional options
  const allOptions = [
    ...FORMAT_OPTIONS,
    ...TEXT_OPTIONS.filter(opt => 
      opt.key !== 'fontSize' && opt.key !== 'fontFamily' && opt.key !== 'textAlign' && opt.key !== 'textPosition' || config.displayValue
    ),
    ...STYLE_OPTIONS,
  ];

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'ean13':
      case 'ean8':
      case 'upc': return 'text-green-800 bg-green-100';
      case 'code128': return 'text-blue-800 bg-blue-100';
      case 'code39': return 'text-purple-800 bg-purple-100';
      case 'itf': return 'text-orange-800 bg-orange-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'high': return 'text-green-800 bg-green-100';
      case 'medium': return 'text-yellow-800 bg-yellow-100';
      case 'low': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Barcode Preview */}
        {barcode && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Barcode Preview</h3>
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg flex flex-col items-center">
              <div 
                className="border border-gray-300 rounded"
                dangerouslySetInnerHTML={{ __html: barcode.svgCode }}
              />
              <div className="mt-2 text-xs text-gray-600">
                {barcode.metadata.formatName} • {barcode.metadata.encodedLength} chars
              </div>
            </div>
          </div>
        )}

        {/* Barcode Information */}
        {barcode && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Barcode Info</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getFormatColor(config.format)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📊</div>
                  <div>
                    <div className="font-medium text-sm">
                      {barcode.metadata.formatName}
                    </div>
                    <div className="text-xs opacity-80">
                      {barcode.metadata.dimensions.totalWidth}×{config.height + config.marginTop + config.marginBottom}px
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-2 rounded text-xs ${getDensityColor(barcode.specifications.density)}`}>
                <div className="flex justify-between">
                  <span>Density:</span>
                  <span className="font-medium">{barcode.specifications.density}</span>
                </div>
              </div>
              
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-600">Pixel Density:</span>
                  <span className="text-blue-800 font-medium">{barcode.metadata.pixelDensity}px/char</span>
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
              onClick={() => handleQuickExample('product')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🛒 Product (EAN-13)
            </button>
            <button
              onClick={() => handleQuickExample('inventory')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📦 Inventory (Code 39)
            </button>
            <button
              onClick={() => handleQuickExample('shipping')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              🚚 Shipping (ITF-14)
            </button>
            <button
              onClick={() => handleQuickExample('isbn')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              📚 ISBN (EAN-13)
            </button>
            <button
              onClick={() => handleQuickExample('pharmacy')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              💊 Pharmacy (Pharmacode)
            </button>
            <button
              onClick={() => handleQuickExample('library')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              📖 Library (Codabar)
            </button>
            <button
              onClick={() => handleQuickExample('serial')}
              className="px-3 py-2 text-xs bg-pink-100 text-pink-800 rounded hover:bg-pink-200 transition-colors text-left"
            >
              🔧 Serial Number
            </button>
            <button
              onClick={() => handleQuickExample('custom')}
              className="px-3 py-2 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-left"
            >
              🎨 Custom Style
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Barcode Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Format Specifications */}
        {barcode && barcode.specifications && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Format Specs</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-blue-50 rounded">
                <span className="text-blue-600">Character Set:</span>
                <span className="text-blue-800 font-medium text-right">{barcode.specifications.characterSet}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-green-50 rounded">
                <span className="text-green-600">Length:</span>
                <span className="text-green-800 font-medium">
                  {barcode.specifications.fixedLength 
                    ? `Fixed (${barcode.specifications.minLength})`
                    : `${barcode.specifications.minLength}-${barcode.specifications.maxLength}`}
                </span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-purple-50 rounded">
                <span className="text-purple-600">Checksum:</span>
                <span className="text-purple-800 font-medium">
                  {barcode.specifications.hasChecksum ? 'Required' : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Structure Details */}
        {barcode && barcode.metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Structure Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                <span className="text-indigo-600">Bars:</span>
                <span className="text-indigo-800 font-medium">{barcode.metadata.bars}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                <span className="text-indigo-600">Spaces:</span>
                <span className="text-indigo-800 font-medium">{barcode.metadata.spaces}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                <span className="text-indigo-600">Aspect Ratio:</span>
                <span className="text-indigo-800 font-medium">{barcode.metadata.aspectRatio}:1</span>
              </div>
              {barcode.metadata.checksum && (
                <div className="flex justify-between text-xs p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-600">Checksum:</span>
                  <span className="text-yellow-800 font-medium">{barcode.metadata.checksum}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications */}
        {barcode && barcode.specifications && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Applications</h3>
            <div className="space-y-1">
              {barcode.specifications.applications.map((app: string, index: number) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                  • {app}
                </div>
              ))}
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

        {/* Download Options */}
        {barcode && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Download Barcode</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleDownload('svg')}
                className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-left"
              >
                📥 Download SVG
              </button>
              <button
                onClick={() => handleDownload('png')}
                className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-left"
              >
                📥 Download PNG
              </button>
            </div>
          </div>
        )}

        {/* Barcode Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">About Barcodes</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">📊 Barcode Types</div>
              <div className="space-y-1">
                <div>• EAN/UPC: Retail products</div>
                <div>• Code 128: General purpose</div>
                <div>• Code 39: Basic alphanumeric</div>
                <div>• ITF-14: Shipping containers</div>
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
          title="Data to Encode"
          value={input}
          onChange={setInput}
          placeholder="Enter data to encode in barcode..."
          language="text"
        />

        <OutputPanel
          title="Barcode Details"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="Barcode generation details will appear here..."
          processingMessage="Generating barcode..."
          customActions={
            output && barcode ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigator.clipboard?.writeText(barcode.svgCode)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy SVG
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(barcode.dataUrl)}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📄 Copy Data URL
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(barcode.encodedData)}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  📝 Copy Data
                </button>
                <button
                  onClick={() => {
                    const report = `Barcode Generation Report\nGenerated: ${new Date().toISOString()}\n\nBarcode Details:\n- Format: ${barcode.metadata.formatName} (${barcode.metadata.format})\n- Original Data: "${barcode.metadata.originalData}"\n- Encoded Data: "${barcode.metadata.encodedData}"\n- Data Length: ${barcode.metadata.dataLength} characters\n- Encoded Length: ${barcode.metadata.encodedLength} characters\n${barcode.metadata.checksum ? `- Checksum: ${barcode.metadata.checksum}\n` : ''}\nBarcode Structure:\n- Bars: ${barcode.metadata.bars}\n- Spaces: ${barcode.metadata.spaces}\n- Bar Width: ${barcode.metadata.dimensions.barWidth.toFixed(2)}px\n- Total Width: ${barcode.metadata.dimensions.totalWidth}px\n- Aspect Ratio: ${barcode.metadata.aspectRatio}:1\n- Pixel Density: ${barcode.metadata.pixelDensity}px per character\n\nFormat Specifications:\n- Character Set: ${barcode.specifications.characterSet}\n- Length: ${barcode.specifications.fixedLength ? `Fixed (${barcode.specifications.minLength})` : `${barcode.specifications.minLength}-${barcode.specifications.maxLength}`}\n- Checksum: ${barcode.specifications.hasChecksum ? 'Required' : 'None'}\n- Density: ${barcode.specifications.density}\n- Applications: ${barcode.specifications.applications.join(', ')}\n\n${warnings.length > 0 ? `Warnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getFormatColor(config.format)}`}>
                  {barcode.metadata.formatName}
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {barcode.metadata.encodedLength} chars
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}