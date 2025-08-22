import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processWhoisLookup, type WhoisConfig } from '../../../tools/network/whois-lookup';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface WhoisLookupProps {
  className?: string;
}

const DEFAULT_CONFIG: WhoisConfig = {
  domainType: 'auto',
  outputFormat: 'detailed',
  showRaw: false,
  includeDNS: true,
  includeHistory: false,
  timeout: 10000,
};

const OPTIONS = [
  {
    key: 'domainType',
    label: 'Query Type',
    type: 'select' as const,
    default: 'auto',
    options: [
      { value: 'auto', label: '🔍 Auto-detect' },
      { value: 'domain', label: '🌐 Domain Name' },
      { value: 'ip', label: '🔢 IP Address' },
    ],
    description: 'Specify the type of query or let auto-detection determine it',
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
    description: 'Choose how to display the whois information',
  },
  {
    key: 'includeDNS',
    label: 'Include DNS Records',
    type: 'checkbox' as const,
    default: true,
    description: 'Show DNS record information for domains',
  },
  {
    key: 'showRaw',
    label: 'Show Raw Data',
    type: 'checkbox' as const,
    default: false,
    description: 'Display the raw WHOIS response data',
  },
  {
    key: 'includeHistory',
    label: 'Include History',
    type: 'checkbox' as const,
    default: false,
    description: 'Show historical registration data (when available)',
  },
] as const;

export function WhoisLookup({ className = '' }: WhoisLookupProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<WhoisConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: WhoisConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processWhoisLookup(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'whois-lookup',
            input: inputValue,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to perform WHOIS lookup');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during WHOIS lookup');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 1000),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('whois-lookup');
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

  // Common lookup examples
  const examples = [
    {
      label: 'Example Domain',
      value: 'example.com',
    },
    {
      label: 'Google Domain',
      value: 'google.com',
    },
    {
      label: 'GitHub Domain',
      value: 'github.com',
    },
    {
      label: 'IP Address (Google DNS)',
      value: '8.8.8.8',
    },
    {
      label: 'IP Address (Cloudflare)',
      value: '1.1.1.1',
    },
    {
      label: 'Example IP',
      value: '93.184.216.34',
    },
    {
      label: 'Educational Domain',
      value: 'mit.edu',
    },
    {
      label: 'Government Domain',
      value: 'nasa.gov',
    },
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="Domain or IP Address"
          value={input}
          onChange={setInput}
          placeholder="Enter domain name (e.g., example.com) or IP address (e.g., 8.8.8.8)"
          description="Enter a domain name or IP address to look up registration and network information"
          examples={examples}
          onExampleClick={handleExample}
          rows={2}
        />
        
        <OptionsPanel
          title="Lookup Options"
          options={OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Quick lookup buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Lookups</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setInput('example.com')}
              className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              🌐 Example.com
            </button>
            <button
              onClick={() => setInput('8.8.8.8')}
              className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              🔢 Google DNS
            </button>
            <button
              onClick={() => setInput('github.com')}
              className="px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
            >
              💻 GitHub
            </button>
            <button
              onClick={() => setInput('1.1.1.1')}
              className="px-3 py-2 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
            >
              ☁️ Cloudflare
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="WHOIS Information"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'markdown'}
          placeholder="Enter a domain name or IP address to look up its information..."
          processingMessage="Looking up WHOIS information..."
        />
      </div>
    </div>
  );
}