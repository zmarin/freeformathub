import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processQRGeneration, type QRGeneratorConfig } from '../../../tools/generators/qr-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface QrGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: QRGeneratorConfig = {
  data: '',
  size: 300,
  errorCorrectionLevel: 'M',
  margin: 4,
  darkColor: '#000000',
  lightColor: '#FFFFFF',
  format: 'SVG',
  logoSize: 20,
  dataType: 'text',
  batchMode: false,
  includeText: false,
};

const OPTIONS = [
  {
    key: 'dataType',
    label: 'Data Type',
    type: 'select' as const,
    default: 'text',
    options: [
      { value: 'text', label: 'Plain Text' },
      { value: 'url', label: 'Website URL' },
      { value: 'email', label: 'Email Address' },
      { value: 'phone', label: 'Phone Number' },
      { value: 'sms', label: 'SMS Message' },
      { value: 'wifi', label: 'WiFi Network' },
      { value: 'vcard', label: 'Contact Card' },
      { value: 'event', label: 'Calendar Event' },
    ],
    description: 'Type of data to encode (affects formatting)',
  },
  {
    key: 'size',
    label: 'QR Code Size',
    type: 'number' as const,
    default: 300,
    min: 100,
    max: 1000,
    step: 50,
    description: 'Size in pixels (width and height)',
  },
  {
    key: 'errorCorrectionLevel',
    label: 'Error Correction',
    type: 'select' as const,
    default: 'M',
    options: [
      { value: 'L', label: 'Low (~7% recovery)' },
      { value: 'M', label: 'Medium (~15% recovery)' },
      { value: 'Q', label: 'Quartile (~25% recovery)' },
      { value: 'H', label: 'High (~30% recovery)' },
    ],
    description: 'Error correction level for damage resistance',
  },
  {
    key: 'margin',
    label: 'Margin Size',
    type: 'number' as const,
    default: 4,
    min: 0,
    max: 20,
    description: 'White space around QR code (in modules)',
  },
  {
    key: 'darkColor',
    label: 'Dark Color',
    type: 'color' as const,
    default: '#000000',
    description: 'Color for QR code modules (foreground)',
  },
  {
    key: 'lightColor',
    label: 'Light Color',
    type: 'color' as const,
    default: '#FFFFFF',
    description: 'Background color',
  },
  {
    key: 'format',
    label: 'Output Format',
    type: 'select' as const,
    default: 'SVG',
    options: [
      { value: 'SVG', label: 'SVG (Scalable Vector)' },
      { value: 'PNG', label: 'PNG (Raster Image)' },
      { value: 'PDF', label: 'PDF Document' },
    ],
    description: 'Output file format',
  },
  {
    key: 'includeText',
    label: 'Include Text Label',
    type: 'boolean' as const,
    default: false,
    description: 'Show data as text below QR code',
  },
  {
    key: 'batchMode',
    label: 'Batch Mode',
    type: 'boolean' as const,
    default: false,
    description: 'Generate multiple QR codes (one per line)',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Website URL',
    input: 'https://freeformathub.com',
    config: { ...DEFAULT_CONFIG, dataType: 'url' as const, includeText: true }
  },
  {
    name: 'Contact Card',
    input: 'John Doe|+1-555-123-4567|john@example.com',
    config: { ...DEFAULT_CONFIG, dataType: 'vcard' as const, errorCorrectionLevel: 'M' as const }
  },
  {
    name: 'WiFi Network',
    input: 'MyHomeNetwork|MyPassword123|WPA2',
    config: { ...DEFAULT_CONFIG, dataType: 'wifi' as const, errorCorrectionLevel: 'H' as const }
  },
  {
    name: 'Email with Subject',
    input: 'mailto:support@company.com?subject=Support%20Request&body=Hello',
    config: { ...DEFAULT_CONFIG, dataType: 'email' as const }
  },
  {
    name: 'Phone Number',
    input: '+1-555-123-4567',
    config: { ...DEFAULT_CONFIG, dataType: 'phone' as const, includeText: true }
  },
  {
    name: 'High Security QR',
    input: 'Confidential Document Link: https://secure.company.com/doc/12345',
    config: { ...DEFAULT_CONFIG, errorCorrectionLevel: 'H' as const, size: 400, margin: 6 }
  },
];

export function QrGenerator({ className = '' }: QrGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<QRGeneratorConfig>(DEFAULT_CONFIG);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>();
  const [stats, setStats] = useState<{
    dataLength: number;
    encodedData: string;
    qrVersion: number;
    errorCorrectionLevel: string;
    moduleCount: number;
    estimatedSize: string;
    capacity: { numeric: number; alphanumeric: number; binary: number };
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: QRGeneratorConfig) => {
      const finalConfig = { ...cfg, data: text };
      
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        setQrCodeDataUrl(undefined);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processQRGeneration(text, finalConfig);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            setQrCodeDataUrl(result.qrCodeDataUrl);
            
            addToHistory({
              toolId: 'qr-generator',
              input: text,
              output: result.output || '',
              config: finalConfig,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
            setStats(null);
            setQrCodeDataUrl(undefined);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to generate QR code');
          setStats(null);
          setQrCodeDataUrl(undefined);
        }
        
        setIsLoading(false);
      }, 200);
    }, 400),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: QrGeneratorConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig(example.config);
  };

  const generateRandomData = (type: string) => {
    const data = {
      url: 'https://example.com/page/' + Math.floor(Math.random() * 1000),
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      text: `Random text content ${Math.floor(Math.random() * 10000)}`,
      wifi: `Network_${Math.floor(Math.random() * 100)}|password${Math.floor(Math.random() * 1000)}|WPA2`,
    };
    
    setInput(data[type as keyof typeof data] || data.text);
    setConfig({ ...config, dataType: type as any });
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qrcode.${config.format.toLowerCase()}`;
    link.click();
  };

  const getDataTypeHelp = () => {
    switch (config.dataType) {
      case 'wifi':
        return 'Format: NetworkName|Password|Security (e.g., MyWiFi|mypass123|WPA2)';
      case 'vcard':
        return 'Format: Name|Phone|Email (e.g., John Doe|555-1234|john@email.com)';
      case 'event':
        return 'Format: Title|Date|Location (e.g., Meeting|20231201T100000|Office)';
      case 'url':
        return 'Enter website URL (http:// or https:// will be added if missing)';
      case 'email':
        return 'Enter email address or full mailto: link with subject/body';
      case 'phone':
        return 'Enter phone number (tel: prefix will be added automatically)';
      case 'sms':
        return 'Enter phone number for SMS (sms: prefix will be added)';
      default:
        return 'Enter any text content to encode in the QR code';
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={`${config.batchMode ? 'Batch ' : ''}Data Input ${config.batchMode ? '(One per line)' : ''}`}
          placeholder={config.batchMode ? 
            `Enter multiple data entries, one per line:

https://example.com
contact@company.com
+1-555-123-4567
My WiFi Network|password123|WPA2

Each line will generate a separate QR code` :
            `Enter data to encode in QR code:

Examples:
- Website: https://example.com
- Email: contact@company.com
- Phone: +1-555-123-4567
- WiFi: NetworkName|Password|WPA2
- Contact: John Doe|555-1234|john@email.com

${getDataTypeHelp()}`}
          syntax="text"
          examples={[
            {
              title: 'Website URL',
              value: 'https://freeformathub.com',
            },
            {
              title: 'Contact Info',
              value: 'John Doe|+1-555-123-4567|john@example.com',
            },
            {
              title: 'WiFi Network',
              value: 'MyHomeWiFi|SecurePassword123|WPA2',
            },
          ]}
        />

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => generateRandomData('url')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Random URL
            </button>
            <button
              onClick={() => generateRandomData('email')}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Random Email
            </button>
            <button
              onClick={() => generateRandomData('phone')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
            >
              Random Phone
            </button>
            <button
              onClick={() => generateRandomData('wifi')}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              Random WiFi
            </button>
          </div>

          {/* QR Code Preview */}
          {qrCodeDataUrl && !config.batchMode && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                QR Code Preview:
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Generated QR Code" 
                  className="max-w-32 max-h-32 border border-gray-200 dark:border-gray-600 rounded"
                />
                <button
                  onClick={downloadQRCode}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  Download QR Code
                </button>
              </div>
            </div>
          )}

          {/* Configuration Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Settings:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Type: {config.dataType.toUpperCase()}, Size: {config.size}px</div>
              <div>Error Correction: {config.errorCorrectionLevel} ({
                config.errorCorrectionLevel === 'L' ? '~7%' :
                config.errorCorrectionLevel === 'M' ? '~15%' :
                config.errorCorrectionLevel === 'Q' ? '~25%' : '~30%'
              } recovery)</div>
              <div>Colors: {config.darkColor} on {config.lightColor}</div>
              <div>Format: {config.format}, Margin: {config.margin}, Text: {config.includeText ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Data Type Help */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
              {config.dataType.charAt(0).toUpperCase() + config.dataType.slice(1)} Format:
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {getDataTypeHelp()}
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Examples:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  onClick={() => insertExample(example)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {example.input.length > 40 ? 
                      example.input.substring(0, 40) + '...' : 
                      example.input
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                QR Code Analysis:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Data Size:</span>
                    <span className="font-mono">{stats.dataLength} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">QR Version:</span>
                    <span className="font-mono">{stats.qrVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Modules:</span>
                    <span className="font-mono">{stats.moduleCount}×{stats.moduleCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                    <span className="font-mono">{stats.capacity.binary}B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Used:</span>
                    <span className="font-mono">{Math.round((stats.dataLength / stats.capacity.binary) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Est. Size:</span>
                    <span className="font-mono">{stats.estimatedSize}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Encoded: {stats.encodedData.length > 30 ? 
                    stats.encodedData.substring(0, 30) + '...' : 
                    stats.encodedData
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Output Panel */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label="QR Code Generation Results"
        syntax="text"
        downloadFilename="qr-code-info.txt"
        downloadContentType="text/plain"
      />
    </div>
  );
}