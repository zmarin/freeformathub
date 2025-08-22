import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processQrCodeGenerator, type QrCodeConfig } from '../../../tools/generators/qr-code-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface QrCodeGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: QrCodeConfig = {
  errorCorrectionLevel: 'M',
  size: 300,
  margin: 20,
  darkColor: '#000000',
  lightColor: '#ffffff',
  format: 'png',
  logoSize: 15,
  roundedCorners: false,
  dotStyle: 'square',
  gradientEnabled: false,
  gradientStartColor: '#000000',
  gradientEndColor: '#333333',
  gradientDirection: 'diagonal',
  frameStyle: 'none',
  frameColor: '#000000',
  frameWidth: 2,
  textBelow: '',
  textColor: '#000000',
  textSize: 16,
};

const BASIC_OPTIONS = [
  {
    key: 'errorCorrectionLevel',
    label: 'Error Correction',
    type: 'select' as const,
    default: 'M',
    options: [
      { value: 'L', label: 'Low (~7%)' },
      { value: 'M', label: 'Medium (~15%)' },
      { value: 'Q', label: 'Quartile (~25%)' },
      { value: 'H', label: 'High (~30%)' },
    ],
    description: 'Higher levels provide better damage resistance',
  },
  {
    key: 'size',
    label: 'Size (px)',
    type: 'number' as const,
    default: 300,
    min: 100,
    max: 1000,
    description: 'QR code size in pixels',
  },
  {
    key: 'margin',
    label: 'Margin (px)',
    type: 'number' as const,
    default: 20,
    min: 0,
    max: 50,
    description: 'Quiet zone around QR code',
  },
  {
    key: 'format',
    label: 'Output Format',
    type: 'select' as const,
    default: 'png',
    options: [
      { value: 'png', label: 'PNG Image' },
      { value: 'svg', label: 'SVG Vector' },
      { value: 'dataurl', label: 'Data URL' },
    ],
    description: 'Download format for the QR code',
  },
] as const;

const STYLE_OPTIONS = [
  {
    key: 'darkColor',
    label: 'Dark Color',
    type: 'color' as const,
    default: '#000000',
    description: 'Color for QR code modules',
  },
  {
    key: 'lightColor',
    label: 'Light Color',
    type: 'color' as const,
    default: '#ffffff',
    description: 'Background color',
  },
  {
    key: 'dotStyle',
    label: 'Dot Style',
    type: 'select' as const,
    default: 'square',
    options: [
      { value: 'square', label: 'Square' },
      { value: 'circle', label: 'Circle' },
      { value: 'rounded', label: 'Rounded' },
    ],
    description: 'Shape of individual QR code modules',
  },
  {
    key: 'roundedCorners',
    label: 'Rounded Corners',
    type: 'checkbox' as const,
    default: false,
    description: 'Apply rounded corners to the QR code',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'gradientEnabled',
    label: 'Enable Gradient',
    type: 'checkbox' as const,
    default: false,
    description: 'Apply gradient colors to QR code',
  },
  {
    key: 'gradientStartColor',
    label: 'Gradient Start',
    type: 'color' as const,
    default: '#000000',
    description: 'Starting color for gradient',
  },
  {
    key: 'gradientEndColor',
    label: 'Gradient End',
    type: 'color' as const,
    default: '#333333',
    description: 'Ending color for gradient',
  },
  {
    key: 'gradientDirection',
    label: 'Gradient Direction',
    type: 'select' as const,
    default: 'diagonal',
    options: [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' },
      { value: 'diagonal', label: 'Diagonal' },
    ],
    description: 'Direction of the gradient',
  },
  {
    key: 'logoSize',
    label: 'Logo Size (%)',
    type: 'number' as const,
    default: 15,
    min: 5,
    max: 30,
    description: 'Logo size as percentage of QR code',
  },
  {
    key: 'textBelow',
    label: 'Text Below QR Code',
    type: 'text' as const,
    default: '',
    description: 'Optional text to display below QR code',
  },
  {
    key: 'textSize',
    label: 'Text Size',
    type: 'number' as const,
    default: 16,
    min: 8,
    max: 32,
    description: 'Size of text below QR code',
  },
  {
    key: 'textColor',
    label: 'Text Color',
    type: 'color' as const,
    default: '#000000',
    description: 'Color of text below QR code',
  },
] as const;

export function QrCodeGenerator({ className = '' }: QrCodeGeneratorProps) {
  const [input, setInput] = useState('https://www.example.com');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<QrCodeConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: QrCodeConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processQrCodeGenerator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setQrCode(result.qrCode);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'qr-code-generator',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.qrCode ? `${result.qrCode.metadata.moduleCount}×${result.qrCode.metadata.moduleCount}` : 'Generated',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate QR code');
          setOutput('');
          setQrCode(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during QR code generation');
        setOutput('');
        setQrCode(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('qr-code-generator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'url' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard' | 'location' | 'text') => {
    const examples = {
      url: 'https://www.example.com/product/12345',
      email: 'mailto:contact@example.com?subject=Hello&body=I%20would%20like%20to%20know%20more',
      phone: 'tel:+1-555-123-4567',
      sms: 'smsto:+1-555-123-4567:Hello, this is a test message',
      wifi: 'WIFI:T:WPA;S:MyNetwork;P:SecurePassword123;H:false;;',
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:John Smith
ORG:Tech Company Inc.
TITLE:Software Engineer
TEL;TYPE=CELL:+1-555-123-4567
EMAIL;TYPE=WORK:john.smith@techcompany.com
URL:https://www.techcompany.com
ADR;TYPE=WORK:;;123 Tech Street;San Francisco;CA;94102;USA
NOTE:Full-stack developer specializing in React and Node.js
END:VCARD`,
      location: 'geo:37.7749,-122.4194?q=Golden+Gate+Bridge,San+Francisco,CA',
      text: `Welcome to our restaurant!

Menu: https://menu.example.com
WiFi: GuestNetwork / password123
Hours: Mon-Sun 11AM-10PM
Phone: (555) 123-FOOD

Follow us on social media for daily specials!`
    };
    
    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  const handleDownload = (format: string) => {
    if (!qrCode) return;
    
    let dataUrl = '';
    let filename = '';
    let mimeType = '';
    
    switch (format) {
      case 'png':
        dataUrl = qrCode.qrCodeData;
        filename = `qrcode-${Date.now()}.png`;
        mimeType = 'image/png';
        break;
      case 'svg':
        dataUrl = `data:image/svg+xml;base64,${btoa(qrCode.qrCodeSvg)}`;
        filename = `qrcode-${Date.now()}.svg`;
        mimeType = 'image/svg+xml';
        break;
      case 'pdf':
        dataUrl = qrCode.downloadFormats.pdf;
        filename = `qrcode-${Date.now()}.pdf`;
        mimeType = 'application/pdf';
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
    ...BASIC_OPTIONS,
    ...STYLE_OPTIONS,
    ...ADVANCED_OPTIONS.filter(opt => {
      if (opt.key === 'gradientStartColor' || opt.key === 'gradientEndColor' || opt.key === 'gradientDirection') {
        return config.gradientEnabled;
      }
      if (opt.key === 'textSize' || opt.key === 'textColor') {
        return config.textBelow.length > 0;
      }
      return true;
    }),
  ];

  const getSizeColor = (size: number) => {
    if (size > 500) return 'text-red-800 bg-red-100';
    if (size > 300) return 'text-yellow-800 bg-yellow-100';
    return 'text-green-800 bg-green-100';
  };

  const getErrorCorrectionColor = (level: string) => {
    switch (level) {
      case 'L': return 'text-red-800 bg-red-100';
      case 'M': return 'text-yellow-800 bg-yellow-100';
      case 'Q': return 'text-blue-800 bg-blue-100';
      case 'H': return 'text-green-800 bg-green-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* QR Code Preview */}
        {qrCode && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">QR Code Preview</h3>
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg flex flex-col items-center">
              <div 
                className="border border-gray-300 rounded"
                dangerouslySetInnerHTML={{ __html: qrCode.qrCodeSvg }}
              />
              {config.textBelow && (
                <div 
                  className="mt-2 font-medium"
                  style={{ 
                    color: config.textColor,
                    fontSize: `${config.textSize}px`
                  }}
                >
                  {config.textBelow}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Statistics */}
        {qrCode && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">QR Code Info</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getSizeColor(qrCode.metadata.size)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📏</div>
                  <div>
                    <div className="font-medium text-sm">
                      {qrCode.metadata.size}×{qrCode.metadata.size} pixels
                    </div>
                    <div className="text-xs opacity-80">
                      Version {qrCode.metadata.version}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-2 rounded text-xs ${getErrorCorrectionColor(config.errorCorrectionLevel)}`}>
                <div className="flex justify-between">
                  <span>Error Correction:</span>
                  <span className="font-medium">{qrCode.metadata.errorCorrectionLevel}</span>
                </div>
              </div>
              
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-600">Scan Distance:</span>
                  <span className="text-blue-800 font-medium">{qrCode.metadata.estimatedScanDistance}</span>
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
              onClick={() => handleQuickExample('url')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              🌐 Website URL
            </button>
            <button
              onClick={() => handleQuickExample('email')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📧 Email Address
            </button>
            <button
              onClick={() => handleQuickExample('phone')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              📱 Phone Number
            </button>
            <button
              onClick={() => handleQuickExample('wifi')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              📶 WiFi Network
            </button>
            <button
              onClick={() => handleQuickExample('vcard')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              👤 Contact Card
            </button>
            <button
              onClick={() => handleQuickExample('location')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              📍 GPS Location
            </button>
            <button
              onClick={() => handleQuickExample('sms')}
              className="px-3 py-2 text-xs bg-pink-100 text-pink-800 rounded hover:bg-pink-200 transition-colors text-left"
            >
              💬 SMS Message
            </button>
            <button
              onClick={() => handleQuickExample('text')}
              className="px-3 py-2 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-left"
            >
              📝 Plain Text
            </button>
          </div>
        </div>

        <OptionsPanel
          title="QR Code Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Data Analysis */}
        {qrCode && qrCode.metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Data Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-blue-50 rounded">
                <span className="text-blue-600">Data Length:</span>
                <span className="text-blue-800 font-medium">{qrCode.metadata.actualDataLength} chars</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-green-50 rounded">
                <span className="text-green-600">Capacity:</span>
                <span className="text-green-800 font-medium">{qrCode.metadata.dataCapacity} chars</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-purple-50 rounded">
                <span className="text-purple-600">Module Count:</span>
                <span className="text-purple-800 font-medium">{qrCode.metadata.moduleCount}×{qrCode.metadata.moduleCount}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                <span className="text-indigo-600">Redundancy:</span>
                <span className="text-indigo-800 font-medium">{qrCode.metadata.redundancy}%</span>
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

        {/* Download Options */}
        {qrCode && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Download QR Code</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleDownload('png')}
                className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-left"
              >
                📥 Download PNG
              </button>
              <button
                onClick={() => handleDownload('svg')}
                className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-left"
              >
                📥 Download SVG
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                className="px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-left"
              >
                📥 Download PDF
              </button>
            </div>
          </div>
        )}

        {/* QR Code Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">QR Code Info</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">📱 About QR Codes</div>
              <div className="space-y-1">
                <div>• Quick Response codes for fast scanning</div>
                <div>• Works with smartphones and tablets</div>
                <div>• Higher error correction = better reliability</div>
                <div>• Larger size = longer scan distance</div>
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
          title="Content to Encode"
          value={input}
          onChange={setInput}
          placeholder="Enter text, URL, email, or any data to encode in QR code..."
          language="text"
        />

        <OutputPanel
          title="QR Code Details"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="text"
          placeholder="QR code generation details will appear here..."
          processingMessage="Generating QR code..."
          customActions={
            output && qrCode ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      canvas.width = qrCode.metadata.size;
                      canvas.height = qrCode.metadata.size;
                      
                      // Create image from SVG
                      const img = new Image();
                      const svgBlob = new Blob([qrCode.qrCodeSvg], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(svgBlob);
                      
                      img.onload = () => {
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                          if (blob) {
                            navigator.clipboard?.write([
                              new ClipboardItem({ 'image/png': blob })
                            ]);
                          }
                        });
                        URL.revokeObjectURL(url);
                      };
                      img.src = url;
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Image
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(qrCode.qrCodeSvg)}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📝 Copy SVG
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(qrCode.qrCodeData)}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  📄 Copy Data URL
                </button>
                <button
                  onClick={() => {
                    const report = `QR Code Generation Report\nGenerated: ${new Date().toISOString()}\n\nContent: ${qrCode.originalText}\n\nSpecifications:\n- Version: ${qrCode.metadata.version}\n- Error Correction: ${qrCode.metadata.errorCorrectionLevel}\n- Size: ${qrCode.metadata.size}×${qrCode.metadata.size} pixels\n- Module Count: ${qrCode.metadata.moduleCount}×${qrCode.metadata.moduleCount}\n- Data Length: ${qrCode.metadata.actualDataLength} characters\n- Data Capacity: ${qrCode.metadata.dataCapacity} characters\n- Redundancy: ${qrCode.metadata.redundancy}%\n- Estimated Scan Distance: ${qrCode.metadata.estimatedScanDistance}\n\nConfiguration:\n- Error Correction Level: ${config.errorCorrectionLevel}\n- Colors: ${config.darkColor} / ${config.lightColor}\n- Dot Style: ${config.dotStyle}\n- Margin: ${config.margin}px\n${config.gradientEnabled ? `- Gradient: ${config.gradientStartColor} to ${config.gradientEndColor}\n` : ''}${config.textBelow ? `- Text Below: "${config.textBelow}"\n` : ''}\n${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getSizeColor(qrCode.metadata.size)}`}>
                  {qrCode.metadata.size}×{qrCode.metadata.size}
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  v{qrCode.metadata.version}
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}