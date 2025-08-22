import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processCertificate, type CertificateConfig } from '../../../tools/encoders/certificate-decoder';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CertificateDecoderProps {
  className?: string;
}

const DEFAULT_CONFIG: CertificateConfig = {
  inputFormat: 'auto',
  outputFormat: 'detailed',
  showChain: false,
  validateExpiry: true,
  checkSecurity: true,
  includeExtensions: true,
  showFingerprints: true,
  bulkMode: false,
};

const OPTIONS = [
  {
    key: 'inputFormat',
    label: 'Input Format',
    type: 'select' as const,
    default: 'auto',
    options: [
      { value: 'auto', label: 'Auto-detect' },
      { value: 'pem', label: 'PEM Format' },
      { value: 'der', label: 'DER Format' },
      { value: 'base64', label: 'Base64 Encoded' },
      { value: 'url', label: 'HTTPS URL' },
    ],
    description: 'Specify the format of the certificate input',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Analysis' },
      { value: 'simple', label: 'Simple Summary' },
      { value: 'json', label: 'JSON Format' },
    ],
    description: 'Choose how to display the certificate analysis',
  },
  {
    key: 'validateExpiry',
    label: 'Validate Expiry',
    type: 'checkbox' as const,
    default: true,
    description: 'Check certificate validity dates and expiration status',
  },
  {
    key: 'checkSecurity',
    label: 'Security Analysis',
    type: 'checkbox' as const,
    default: true,
    description: 'Analyze key strength, algorithms, and security issues',
  },
  {
    key: 'includeExtensions',
    label: 'Show Extensions',
    type: 'checkbox' as const,
    default: true,
    description: 'Display certificate extensions and their values',
  },
  {
    key: 'showFingerprints',
    label: 'Show Fingerprints',
    type: 'checkbox' as const,
    default: true,
    description: 'Generate and display certificate fingerprints',
  },
  {
    key: 'bulkMode',
    label: 'Bulk Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Analyze multiple certificates (separate with double newlines)',
  },
] as const;

export function CertificateDecoder({ className = '' }: CertificateDecoderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<CertificateConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: CertificateConfig) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await processCertificate(value, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'certificate-decoder',
            input: value,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process certificate');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during certificate processing');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 500), // Longer debounce for network requests
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('certificate-decoder');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  const examples = [
    {
      label: 'Sample PEM Certificate',
      value: `-----BEGIN CERTIFICATE-----
MIIFXzCCBEegAwIBAgISA1234567890ABCDEFGH1234567890MA0GCSqGSIb3DQEBCwUA
MEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQD
ExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMzA4MTUwNjMwMDBaFw0y
NDExMTMwNjI5NTlaMBkxFzAVBgNVBAMTDmV4YW1wbGUuY29tMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwIlL1234567890ABCDEFGH1234567890ABCDEF
GH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890A
BCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH123456
7890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH12
34567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEF
GH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890AB
wIDAQABo4ICaTCCAmUwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUF
BwMBBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBT1234567890ABC
DEFGH1234567890ABCDEFGHzAfBgNVHSMEGDAWgBT1234567890ABCDEFGH123456
7890ABCDEFGHzBVBgNVHREETjBMgg5leGFtcGxlLmNvbYISd3d3LmV4YW1wbGUu
Y29tghBhcGkuZXhhbXBsZS5jb22CEmFkbWluLmV4YW1wbGUuY29tMA0GCSqGSIb3
DQEBCwUAA4IBAQAwIlL1234567890ABCDEFGH1234567890ABCDEFGH1234567890
ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234
567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEF
GH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890A
BCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH123456
7890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH
-----END CERTIFICATE-----`,
    },
    {
      label: 'Website Certificate (Google)',
      value: 'https://google.com',
    },
    {
      label: 'Website Certificate (GitHub)',
      value: 'https://github.com',
    },
    {
      label: 'Website Certificate (Cloudflare)',
      value: 'https://cloudflare.com',
    },
    {
      label: 'Base64 Certificate Data',
      value: 'MIIFXzCCBEegAwIBAgISA1234567890ABCDEFGH1234567890MA0GCSqGSIb3DQEBCwUAMEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQDExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMzA4MTUwNjMwMDBaFw0yNDExMTMwNjI5NTlaMBkxFzAVBgNVBAMTDmV4YW1wbGUuY29t',
    },
    {
      label: 'Expired Certificate Example',
      value: `-----BEGIN CERTIFICATE-----
MIIFXzCCBEegAwIBAgISA0000000000EXPIRED000000000MA0GCSqGSIb3DQEBCwUA
MEoxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MSMwIQYDVQQD
ExpMZXQncyBFbmNyeXB0IEF1dGhvcml0eSBYMzAeFw0yMDEwMTUwNjMwMDBaFw0y
MTA4MTMwNjI5NTlaMBkxFzAVBgNVBAMTDmV4cGlyZWQuY29tMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwIlL1234567890ABCDEFGH1234567890ABCDEF
GH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890A
BCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH123456
7890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH12
34567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEF
GH1234567890ABCDEFGH1234567890ABCDEFGH1234567890ABCDEFGH1234567890AB
wIDAQABo4ICaTCCAmUwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUF
-----END CERTIFICATE-----`,
    },
  ];

  // Dynamic placeholder based on input format
  const getPlaceholder = () => {
    switch (config.inputFormat) {
      case 'pem':
        return '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----';
      case 'url':
        return 'https://example.com';
      case 'base64':
        return 'MIIFXzCCBEegAwIBAgISA...';
      case 'der':
        return 'Binary DER data (hex encoded)...';
      default:
        return 'Paste certificate data or URL here...';
    }
  };

  const getDescription = () => {
    if (config.bulkMode) {
      return 'Enter multiple certificates separated by double newlines (maximum 5 certificates)';
    }
    
    switch (config.inputFormat) {
      case 'pem':
        return 'Paste PEM formatted certificate including BEGIN/END markers';
      case 'url':
        return 'Enter HTTPS URL to fetch and analyze the website\'s certificate';
      case 'base64':
        return 'Paste Base64 encoded certificate data without markers';
      case 'der':
        return 'Paste DER encoded certificate data (hex format)';
      default:
        return 'The tool will automatically detect PEM, Base64, DER, or URL format';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title={config.bulkMode ? 'Certificates' : 'Certificate Data'}
          value={input}
          onChange={setInput}
          placeholder={getPlaceholder()}
          description={getDescription()}
          examples={examples}
          onExampleClick={handleExample}
          language={config.inputFormat === 'pem' ? 'text' : undefined}
          rows={config.bulkMode ? 10 : 8}
        />
        
        <OptionsPanel
          title="Decoder Options"
          options={OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Certificate Analysis"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'markdown'}
          placeholder="Enter certificate data to see detailed analysis..."
        />
      </div>
    </div>
  );
}