import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processYaml, type YamlFormatterConfig } from '../../../tools/formatters/yaml-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface YamlFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: YamlFormatterConfig = {
  mode: 'format',
  indent: 2,
  sortKeys: false,
  removeComments: false,
  quotingType: 'minimal',
  lineWidth: 80,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'format',
    options: [
      { value: 'format', label: 'Format YAML' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'convert-to-json', label: 'YAML → JSON' },
      { value: 'convert-from-json', label: 'JSON → YAML' },
    ],
    description: 'Choose operation mode',
  },
  {
    key: 'indent',
    label: 'Indentation',
    type: 'number' as const,
    default: 2,
    min: 1,
    max: 8,
    description: 'Number of spaces for indentation',
  },
  {
    key: 'sortKeys',
    label: 'Sort Keys',
    type: 'boolean' as const,
    default: false,
    description: 'Sort object keys alphabetically',
  },
  {
    key: 'quotingType',
    label: 'Quoting Style',
    type: 'select' as const,
    default: 'minimal',
    options: [
      { value: 'minimal', label: 'Minimal (quote when needed)' },
      { value: 'single', label: 'Single quotes preferred' },
      { value: 'double', label: 'Double quotes preferred' },
      { value: 'preserve', label: 'Preserve original' },
    ],
    description: 'How to handle string quoting',
  },
];

const FORMAT_EXAMPLES = [
  {
    title: 'Basic Configuration',
    value: 'name: MyApp\nversion: 1.0.0\ndatabase:\n  host: localhost\n  port: 5432',
  },
  {
    title: 'Docker Compose',
    value: 'version: "3.8"\nservices:\n  web:\n    image: nginx\n    ports:\n      - "80:80"\n  db:\n    image: postgres\n    environment:\n      POSTGRES_PASSWORD: secret',
  },
  {
    title: 'Kubernetes Config',
    value: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\ndata:\n  app.properties: |\n    debug=true\n    database.url=jdbc:mysql://localhost/db',
  },
  {
    title: 'CI/CD Pipeline',
    value: 'name: Build\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v2\n      - name: Setup Node\n        uses: actions/setup-node@v2',
  },
];

const JSON_TO_YAML_EXAMPLES = [
  {
    title: 'Simple Object',
    value: '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}',
  },
  {
    title: 'Configuration Object',
    value: '{\n  "database": {\n    "host": "localhost",\n    "port": 5432,\n    "credentials": {\n      "username": "admin",\n      "password": "secret"\n    }\n  },\n  "features": ["auth", "logging", "metrics"]\n}',
  },
];

export function YamlFormatter({ className = '' }: YamlFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<YamlFormatterConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  // Get appropriate examples based on mode
  const examples = useMemo(() => {
    return config.mode === 'convert-from-json' ? JSON_TO_YAML_EXAMPLES : FORMAT_EXAMPLES;
  }, [config.mode]);

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: YamlFormatterConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = processYaml(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          
          // Add to history for successful operations
          addToHistory({
            toolId: 'yaml-formatter',
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
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  // Clear input/output when mode changes between YAML and JSON
  useEffect(() => {
    setInput('');
    setOutput('');
    setError(undefined);
  }, [config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: YamlFormatterConfig) => {
    setConfig(newConfig);
  };

  const getLabelsForMode = () => {
    switch (config.mode) {
      case 'convert-to-json':
        return {
          input: 'YAML Input',
          output: 'JSON Output',
          placeholder: 'Paste YAML to convert to JSON...',
          inputSyntax: 'yaml',
          outputSyntax: 'json',
        };
      case 'convert-from-json':
        return {
          input: 'JSON Input',
          output: 'YAML Output',
          placeholder: 'Paste JSON to convert to YAML...',
          inputSyntax: 'json',
          outputSyntax: 'yaml',
        };
      case 'validate':
        return {
          input: 'YAML Input',
          output: 'Validation Result',
          placeholder: 'Paste YAML to validate...',
          inputSyntax: 'yaml',
          outputSyntax: 'text',
        };
      default:
        return {
          input: 'YAML Input',
          output: 'Formatted YAML',
          placeholder: 'Paste YAML to format...',
          inputSyntax: 'yaml',
          outputSyntax: 'yaml',
        };
    }
  };

  const labels = getLabelsForMode();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={labels.input}
          placeholder={labels.placeholder}
          syntax={labels.inputSyntax}
          examples={examples}
          accept=".yml,.yaml,.json"
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
        label={labels.output}
        syntax={labels.outputSyntax}
        downloadFilename={
          config.mode === 'convert-to-json' ? 'converted.json' : 'formatted.yaml'
        }
        downloadContentType={
          config.mode === 'convert-to-json' ? 'application/json' : 'text/yaml'
        }
      />
    </div>
  );
}