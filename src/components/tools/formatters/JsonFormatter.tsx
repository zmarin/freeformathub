import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { formatJson, type JsonFormatterConfig } from '../../../tools/formatters/json-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JsonFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonFormatterConfig = {
  indent: 2,
  sortKeys: false,
  removeComments: true,
  validateOnly: false,
};

const OPTIONS = [
  {
    key: 'indent',
    label: 'Indentation',
    type: 'select' as const,
    default: 2,
    options: [
      { value: '0', label: 'Minified (no spaces)' },
      { value: '2', label: '2 spaces' },
      { value: '4', label: '4 spaces' },
      { value: '8', label: '8 spaces' },
    ],
    description: 'Number of spaces for indentation (0 for minified)',
  },
  {
    key: 'sortKeys',
    label: 'Sort Keys',
    type: 'boolean' as const,
    default: false,
    description: 'Alphabetically sort object keys',
  },
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Strip // and /* */ comments (makes invalid JSON valid)',
  },
  {
    key: 'validateOnly',
    label: 'Validate Only',
    type: 'boolean' as const,
    default: false,
    description: 'Only validate JSON without formatting output',
  },
];

const EXAMPLES = [
  {
    title: 'Basic Object',
    value: '{"name":"John","age":30,"city":"New York"}',
  },
  {
    title: 'Nested Structure',
    value: '{"user":{"profile":{"name":"Jane","settings":{"theme":"dark","notifications":true}},"posts":[{"id":1,"title":"Hello World"},{"id":2,"title":"Getting Started"}]}}',
  },
  {
    title: 'Array of Objects',
    value: '[{"id":1,"name":"Item 1","active":true},{"id":2,"name":"Item 2","active":false}]',
  },
  {
    title: 'With Comments (Invalid JSON)',
    value: `{
  // User information
  "name": "John",
  "age": 30, // Age in years
  "city": "New York"
}`,
  },
];

export function JsonFormatter({ className = '' }: JsonFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsonFormatterConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  // Convert string values from select to numbers for indent
  const processedConfig = useMemo(() => ({
    ...config,
    indent: parseInt(String(config.indent)) || 2,
  }), [config]);

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: JsonFormatterConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = formatJson(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          
          // Add to history for successful operations
          addToHistory({
            toolId: 'json-formatter',
            input: inputText,
            output: result.output || '',
            config: cfg,
            timestamp: Date.now(),
          });
        } else {
          setOutput('');
          setError(result.error);
        }
        
        setIsLoading(false);
      }, 100);
    }, 300),
    [addToHistory]
  );

  // Process input when it changes
  useEffect(() => {
    debouncedProcess(input, processedConfig);
  }, [input, processedConfig, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JsonFormatterConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="JSON Input"
          placeholder="Paste your JSON here..."
          syntax="json"
          examples={EXAMPLES}
          accept=".json,.txt"
        />
        
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
        label="Formatted JSON"
        syntax="json"
        showLineNumbers={true}
        downloadFilename="formatted.json"
        downloadContentType="application/json"
      />
    </div>
  );
}