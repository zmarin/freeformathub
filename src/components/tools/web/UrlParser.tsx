import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processUrlParser, type UrlParserConfig } from '../../../tools/web/url-parser';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface UrlParserProps {
  className?: string;
}

const DEFAULT_CONFIG: UrlParserConfig = {
  mode: 'parse',
  includeQueryParams: true,
  includeFragments: true,
  includeSecurity: true,
  includeEncoding: false,
  showValidation: true,
  outputFormat: 'detailed',
  decodeComponents: false,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'parse',
    options: [
      { value: 'parse', label: 'Full Analysis' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'analyze', label: 'Security Analysis' },
    ],
    description: 'Choose parsing mode: complete analysis, validation only, or security focus',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Report' },
      { value: 'json', label: 'JSON Format' },
      { value: 'table', label: 'Table Format' },
    ],
    description: 'Choose output format for URL analysis',
  },
  {
    key: 'includeQueryParams',
    label: 'Query Parameters',
    type: 'checkbox' as const,
    default: true,
    description: 'Parse and display query parameters',
  },
  {
    key: 'includeFragments',
    label: 'URL Fragments',
    type: 'checkbox' as const,
    default: true,
    description: 'Include URL fragments (hash) in analysis',
  },
  {
    key: 'showValidation',
    label: 'Validation Details',
    type: 'checkbox' as const,
    default: true,
    description: 'Show detailed validation results and issues',
  },
  {
    key: 'includeSecurity',
    label: 'Security Analysis',
    type: 'checkbox' as const,
    default: true,
    description: 'Analyze URL for security issues and patterns',
  },
  {
    key: 'includeEncoding',
    label: 'Encoding Analysis',
    type: 'checkbox' as const,
    default: false,
    description: 'Analyze URL encoding and decode components',
  },
  {
    key: 'decodeComponents',
    label: 'Decode Components',
    type: 'checkbox' as const,
    default: false,
    description: 'Decode URL-encoded components for display',
  },
] as const;

export function UrlParser({ className = '' }: UrlParserProps) {
  const [input, setInput] = useState('https://api.example.com:8443/v1/users?active=true&sort=name#results');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<UrlParserConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: UrlParserConfig) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processUrlParser(value, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'url-parser',
            input: value,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to parse URL');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during URL parsing');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('url-parser');
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
    { label: 'Basic HTTPS URL', value: 'https://example.com/path?param=value' },
    { label: 'With Port', value: 'https://api.example.com:8443/v1/data' },
    { label: 'With Auth', value: 'ftp://user:pass@files.example.com/docs/' },
    { label: 'Complex API URL', value: 'https://api.sub.example.com/v2/users/123?include=profile&format=json#section' },
    { label: 'With Encoded Chars', value: 'https://example.com/search?q=hello%20world&type=web' },
    { label: 'IP Address', value: 'http://192.168.1.100:8080/admin' },
    { label: 'Localhost', value: 'http://localhost:3000/app?debug=true' },
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="URL to Parse"
          value={input}
          onChange={setInput}
          placeholder="https://example.com/path?param=value"
          description="Enter any URL to parse and analyze its components"
          examples={examples}
          onExampleClick={handleExample}
        />
        
        <OptionsPanel
          title="Parser Options"
          options={OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="URL Analysis"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'markdown'}
          placeholder="Enter a URL to see detailed parsing and analysis results..."
        />
      </div>
    </div>
  );
}