import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processDnsLookup, type DnsLookupConfig } from '../../../tools/network/dns-lookup';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface DnsLookupProps {
  className?: string;
}

const DEFAULT_CONFIG: DnsLookupConfig = {
  recordType: 'A',
  resolver: 'cloudflare',
  showTimings: true,
  includeAuthority: false,
  includeAdditional: false,
  outputFormat: 'detailed',
  validateDomain: true,
  bulkMode: false,
};

const OPTIONS = [
  {
    key: 'recordType',
    label: 'Record Type',
    type: 'select' as const,
    default: 'A',
    options: [
      { value: 'A', label: 'A - IPv4 Address' },
      { value: 'AAAA', label: 'AAAA - IPv6 Address' },
      { value: 'CNAME', label: 'CNAME - Canonical Name' },
      { value: 'MX', label: 'MX - Mail Exchange' },
      { value: 'TXT', label: 'TXT - Text Record' },
      { value: 'NS', label: 'NS - Name Server' },
      { value: 'SOA', label: 'SOA - Start of Authority' },
      { value: 'PTR', label: 'PTR - Pointer Record' },
      { value: 'SRV', label: 'SRV - Service Record' },
      { value: 'ALL', label: 'ALL - Multiple Types' },
    ],
    description: 'Select the DNS record type to query',
  },
  {
    key: 'resolver',
    label: 'DNS Server',
    type: 'select' as const,
    default: 'cloudflare',
    options: [
      { value: 'cloudflare', label: 'Cloudflare DNS (1.1.1.1)' },
      { value: 'google', label: 'Google DNS (8.8.8.8)' },
      { value: 'quad9', label: 'Quad9 (9.9.9.9)' },
      { value: 'opendns', label: 'OpenDNS' },
    ],
    description: 'Choose which DNS server to use for the lookup',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Report' },
      { value: 'simple', label: 'Simple Format' },
      { value: 'json', label: 'JSON Format' },
    ],
    description: 'Choose the output format for DNS results',
  },
  {
    key: 'showTimings',
    label: 'Show Query Time',
    type: 'checkbox' as const,
    default: true,
    description: 'Display DNS query response time and server info',
  },
  {
    key: 'includeAuthority',
    label: 'Include Authority Section',
    type: 'checkbox' as const,
    default: false,
    description: 'Show authoritative name servers for the domain',
  },
  {
    key: 'includeAdditional',
    label: 'Include Additional Section',
    type: 'checkbox' as const,
    default: false,
    description: 'Show additional DNS records returned by the server',
  },
  {
    key: 'validateDomain',
    label: 'Validate Domain Format',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate domain name format before lookup',
  },
  {
    key: 'bulkMode',
    label: 'Bulk Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Lookup multiple domains (separate with commas or newlines)',
  },
] as const;

export function DnsLookup({ className = '' }: DnsLookupProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<DnsLookupConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: DnsLookupConfig) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await processDnsLookup(value, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'dns-lookup',
            input: value,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to perform DNS lookup');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during DNS lookup');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 500), // Slightly longer debounce for network requests
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('dns-lookup');
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
      label: 'Popular Website',
      value: 'google.com',
    },
    {
      label: 'Email Provider',
      value: 'gmail.com',
    },
    {
      label: 'CDN Service',
      value: 'cloudflare.com',
    },
    {
      label: 'Developer Platform',
      value: 'github.com',
    },
    {
      label: 'Bulk Lookup',
      value: `google.com
microsoft.com
apple.com`,
    },
    {
      label: 'Subdomain',
      value: 'api.github.com',
    },
  ];

  // Get record type specific examples
  const getRecordExamples = () => {
    switch (config.recordType) {
      case 'MX':
        return [
          { label: 'Gmail MX', value: 'gmail.com' },
          { label: 'Outlook MX', value: 'outlook.com' },
          { label: 'Yahoo MX', value: 'yahoo.com' },
        ];
      case 'TXT':
        return [
          { label: 'SPF Record', value: 'google.com' },
          { label: 'DKIM Record', value: 'github.com' },
          { label: 'Domain Verification', value: 'microsoft.com' },
        ];
      case 'NS':
        return [
          { label: 'Root Servers', value: 'com' },
          { label: 'Domain NS', value: 'cloudflare.com' },
          { label: 'Subdomain NS', value: 'pages.github.com' },
        ];
      case 'AAAA':
        return [
          { label: 'Google IPv6', value: 'google.com' },
          { label: 'Cloudflare IPv6', value: 'cloudflare.com' },
          { label: 'GitHub IPv6', value: 'github.com' },
        ];
      default:
        return examples;
    }
  };

  const currentExamples = getRecordExamples();

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title={config.bulkMode ? 'Domain Names' : 'Domain Name'}
          value={input}
          onChange={setInput}
          placeholder={
            config.bulkMode 
              ? "google.com\ncloudflare.com\ngithub.com" 
              : "example.com"
          }
          description={
            config.bulkMode
              ? "Enter multiple domain names (one per line or comma-separated)"
              : "Enter a domain name to lookup DNS records"
          }
          examples={currentExamples}
          onExampleClick={handleExample}
        />
        
        <OptionsPanel
          title="DNS Options"
          options={OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="DNS Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'markdown'}
          placeholder="Enter a domain name to see DNS lookup results..."
        />
      </div>
    </div>
  );
}