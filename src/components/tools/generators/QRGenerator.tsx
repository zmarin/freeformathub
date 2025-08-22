import { useState, useEffect, useMemo, useRef } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processQRGeneration, type QRGeneratorConfig } from '../../../tools/generators/qr-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface QRGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: QRGeneratorConfig = {
  size: 300,
  errorCorrectionLevel: 'M',
  margin: 20,
  darkColor: '#000000',
  lightColor: '#ffffff',
  format: 'png',
  logo: {
    enabled: false,
    size: 20,
  },
  style: {
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    dotStyle: 'square',
  },
  gradient: {
    enabled: false,
    type: 'linear',
    startColor: '#000000',
    endColor: '#333333',
  },
};

const OPTIONS = [
  {
    key: 'format',
    label: 'Output Format',
    type: 'select' as const,
    default: 'png',
    options: [
      { value: 'png', label: '=� PNG Image' },
      { value: 'svg', label: '=� SVG Vector' },
      { value: 'base64', label: '= Base64 Data URL' },
    ],
    description: 'Choose the output format for your QR code',
  },
  {
    key: 'size',
    label: 'Size (px)',
    type: 'range' as const,
    default: 300,
    min: 100,
    max: 1000,
    step: 50,
    description: 'Size of the generated QR code in pixels',
  },
  {
    key: 'errorCorrectionLevel',
    label: 'Error Correction',
    type: 'select' as const,
    default: 'M',
    options: [
      { value: 'L', label: 'L - Low (~7% recovery)' },
      { value: 'M', label: 'M - Medium (~15% recovery)' },
      { value: 'Q', label: 'Q - Quartile (~25% recovery)' },
      { value: 'H', label: 'H - High (~30% recovery)' },
    ],
    description: 'Higher levels allow more damage recovery but reduce capacity',
  },
  {
    key: 'margin',
    label: 'Margin (px)',
    type: 'range' as const,
    default: 20,
    min: 0,
    max: 100,
    step: 10,
    description: 'White space around the QR code',
  },
] as const;

const COLOR_OPTIONS = [
  {
    key: 'darkColor',
    label: 'Dark Color',
    type: 'color' as const,
    default: '#000000',
    description: 'Color for the QR code modules (dark parts)',
  },
  {
    key: 'lightColor',
    label: 'Light Color',
    type: 'color' as const,
    default: '#ffffff',
    description: 'Background color (light parts)',
  },
] as const;

const STYLE_OPTIONS = [
  {
    key: 'style.dotStyle',
    label: 'Dot Style',
    type: 'select' as const,
    default: 'square',
    options: [
      { value: 'square', label: ' Square' },
      { value: 'dots', label: '� Dots' },
      { value: 'rounded', label: '� Rounded' },
    ],
    description: 'Shape of the QR code modules',
  },
] as const;

export function QRGenerator({ className = '' }: QRGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<QRGeneratorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: QRGeneratorConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setQrImage(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processQRGeneration(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Handle different output formats
          if (result.dataURL) {
            setQrImage(result.dataURL);
          } else if (result.svgString) {
            // Convert SVG to data URL for display
            const svgBlob = new Blob([result.svgString], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);
            setQrImage(svgUrl);
          }
          
          // Add to history
          addToHistory({
            toolId: 'qr-generator',
            input: inputValue,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate QR code');
          setOutput('');
          setQrImage(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during QR code generation');
        setOutput('');
        setQrImage(null);
      } finally {
        setIsProcessing(false);
      }
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('qr-generator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    if (key.startsWith('style.')) {
      const styleKey = key.split('.')[1];
      setConfig(prev => ({
        ...prev,
        style: {
          ...prev.style,
          [styleKey]: value,
        },
      }));
    } else if (key.startsWith('logo.')) {
      const logoKey = key.split('.')[1];
      setConfig(prev => ({
        ...prev,
        logo: {
          ...prev.logo,
          [logoKey]: value,
        },
      }));
    } else if (key.startsWith('gradient.')) {
      const gradientKey = key.split('.')[1];
      setConfig(prev => ({
        ...prev,
        gradient: {
          ...prev.gradient!,
          [gradientKey]: value,
        },
      }));
    } else {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  const downloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.${config.format === 'svg' ? 'svg' : 'png'}`;
    link.href = qrImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // QR code examples
  const examples = [
    {
      label: 'Website URL',
      value: 'https://freeformathub.com',
    },
    {
      label: 'Email Address',
      value: 'mailto:hello@example.com?subject=Hello&body=Hi there!',
    },
    {
      label: 'Phone Number',
      value: 'tel:+1-555-123-4567',
    },
    {
      label: 'WiFi Network',
      value: 'WIFI:T:WPA;S:MyNetwork;P:mypassword;;',
    },
    {
      label: 'Contact (vCard)',
      value: `BEGIN:VCARD
VERSION:3.0
FN:John Doe
ORG:Example Company
TEL:+1-555-123-4567
EMAIL:john@example.com
URL:https://example.com
END:VCARD`,
    },
    {
      label: 'SMS Message',
      value: 'smsto:+1-555-123-4567:Hello, this is a pre-filled SMS message!',
    },
    {
      label: 'Location',
      value: 'geo:37.7749,-122.4194?q=San Francisco, CA',
    },
    {
      label: 'Bitcoin Address',
      value: 'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.01',
    },
  ];

  // Build all options
  const allOptions = [
    ...OPTIONS,
    ...COLOR_OPTIONS,
    ...STYLE_OPTIONS,
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="Text or Data to Encode"
          value={input}
          onChange={setInput}
          placeholder="Enter URL, text, WiFi credentials, or any data..."
          description="Enter the text, URL, or data you want to encode in the QR code"
          examples={examples}
          onExampleClick={handleExample}
          rows={6}
        />
        
        <OptionsPanel
          title="QR Code Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {qrImage && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
              <button
                onClick={downloadQR}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg flex justify-center">
              <img
                src={qrImage}
                alt="Generated QR Code"
                className="max-w-full h-auto border border-gray-200 rounded"
                style={{ maxHeight: '200px' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Generated QR Code"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Enter text or data to generate a QR code..."
          customActions={
            qrImage ? (
              <div className="flex gap-2">
                <button
                  onClick={downloadQR}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  =� Download QR Code
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(qrImage)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  = Copy Data URL
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}