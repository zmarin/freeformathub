import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processHttpStatusCodes, type HttpStatusConfig } from '../../../tools/web/http-status-codes';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface HttpStatusCodesProps {
  className?: string;
}

const DEFAULT_CONFIG: HttpStatusConfig = {
  mode: 'lookup',
  includeDescription: true,
  includeRfc: false,
  includeExamples: true,
  showObsolete: false,
  categoryFilter: 'all',
  outputFormat: 'detailed',
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'lookup',
    options: [
      { value: 'lookup', label: 'Look Up Code' },
      { value: 'search', label: 'Search Codes' },
      { value: 'category', label: 'Browse Category' },
    ],
    description: 'Choose how to find status codes: specific lookup, search, or browse by category',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Info' },
      { value: 'compact', label: 'Compact View' },
      { value: 'table', label: 'Table Format' },
      { value: 'json', label: 'JSON Format' },
    ],
    description: 'Choose output format for status code information',
  },
  {
    key: 'includeDescription',
    label: 'Full Descriptions',
    type: 'checkbox' as const,
    default: true,
    description: 'Include detailed descriptions and usage guidelines',
  },
  {
    key: 'includeExamples',
    label: 'Usage Examples',
    type: 'checkbox' as const,
    default: true,
    description: 'Show practical examples of when to use each status code',
  },
  {
    key: 'includeRfc',
    label: 'RFC References',
    type: 'checkbox' as const,
    default: false,
    description: 'Include RFC specification references',
  },
  {
    key: 'showObsolete',
    label: 'Show Obsolete Codes',
    type: 'checkbox' as const,
    default: false,
    description: 'Include obsolete or deprecated status codes',
  },
] as const;

const CATEGORY_OPTIONS = [
  {
    key: 'categoryFilter',
    label: 'Category Filter',
    type: 'select' as const,
    default: 'all',
    options: [
      { value: 'all', label: 'All Categories' },
      { value: '1xx', label: '1xx - Informational' },
      { value: '2xx', label: '2xx - Success' },
      { value: '3xx', label: '3xx - Redirection' },
      { value: '4xx', label: '4xx - Client Error' },
      { value: '5xx', label: '5xx - Server Error' },
    ],
    description: 'Filter status codes by category when browsing',
  },
] as const;

export function HttpStatusCodes({ className = '' }: HttpStatusCodesProps) {
  const [input, setInput] = useState('404');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<HttpStatusConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: HttpStatusConfig) => {
      // For category mode, we don't need input
      if (currentConfig.mode === 'category' || value.trim()) {
        setIsProcessing(true);
        setError(null);

        try {
          const result = processHttpStatusCodes(value, currentConfig);
          
          if (result.success && result.output) {
            setOutput(result.output);
            
            // Add to history
            addToHistory({
              toolId: 'http-status-codes',
              input: value,
              output: result.output,
              config: currentConfig,
              timestamp: Date.now(),
            });
          } else {
            setError(result.error || 'Failed to process status code lookup');
            setOutput('');
          }
        } catch (err) {
          setError('An unexpected error occurred during status code lookup');
          setOutput('');
        } finally {
          setIsProcessing(false);
        }
      } else {
        setOutput('');
        setError(null);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('http-status-codes');
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

  // Dynamic examples based on mode
  const getExamples = () => {
    if (config.mode === 'search') {
      return [
        { label: 'Search "not found"', value: 'not found' },
        { label: 'Search "unauthorized"', value: 'unauthorized' },
        { label: 'Search "server error"', value: 'server error' },
        { label: 'Search "redirect"', value: 'redirect' },
        { label: 'Search "created"', value: 'created' },
      ];
    } else if (config.mode === 'category') {
      return [
        { label: 'Browse All', value: '' },
        { label: 'Success Codes', value: '2xx' },
        { label: 'Client Errors', value: '4xx' },
        { label: 'Server Errors', value: '5xx' },
      ];
    } else {
      return [
        { label: 'OK', value: '200' },
        { label: 'Not Found', value: '404' },
        { label: 'Internal Server Error', value: '500' },
        { label: 'Unauthorized', value: '401' },
        { label: 'Forbidden', value: '403' },
        { label: 'Created', value: '201' },
        { label: 'Bad Request', value: '400' },
        { label: 'Teapot', value: '418' },
      ];
    }
  };

  // Dynamic placeholder and description based on mode
  const getInputProps = () => {
    if (config.mode === 'search') {
      return {
        placeholder: 'Search status codes...',
        description: 'Search by status code number, message, or description'
      };
    } else if (config.mode === 'category') {
      return {
        placeholder: 'Select category above...',
        description: 'Use the category filter above to browse status codes'
      };
    } else {
      return {
        placeholder: '404',
        description: 'Enter an HTTP status code (100-599) to look up'
      };
    }
  };

  // Filter options based on mode
  const visibleOptions = config.mode === 'category' 
    ? [...OPTIONS, ...CATEGORY_OPTIONS]
    : OPTIONS;

  const inputProps = getInputProps();
  const examples = getExamples();

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="HTTP Status Code"
          value={input}
          onChange={setInput}
          placeholder={inputProps.placeholder}
          description={inputProps.description}
          examples={examples}
          onExampleClick={handleExample}
        />
        
        <OptionsPanel
          title="Reference Options"
          options={visibleOptions}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Status Code Information"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'markdown'}
          placeholder={
            config.mode === 'lookup' 
              ? "Enter an HTTP status code to see detailed information..."
              : config.mode === 'search'
              ? "Enter search terms to find relevant status codes..."
              : "Select a category above to browse status codes..."
          }
        />
      </div>
    </div>
  );
}