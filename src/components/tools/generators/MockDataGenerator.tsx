import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processMockData, type MockDataConfig } from '../../../tools/generators/mock-data-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface MockDataGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: MockDataConfig = {
  dataType: 'user',
  count: 10,
  format: 'json',
  locale: 'en',
  includeIds: true,
  includeTimestamps: true,
  nullProbability: 0,
  outputStyle: 'pretty',
};

const OPTIONS = [
  {
    key: 'dataType',
    label: 'Data Type',
    type: 'select' as const,
    default: 'user',
    options: [
      { value: 'user', label: '👤 User Profiles' },
      { value: 'product', label: '📦 Products' },
      { value: 'order', label: '🛒 Orders' },
      { value: 'address', label: '📍 Addresses' },
      { value: 'custom', label: '⚙️ Custom Schema' },
    ],
    description: 'Select the type of data to generate',
  },
  {
    key: 'count',
    label: 'Record Count',
    type: 'number' as const,
    default: 10,
    min: 1,
    max: 10000,
    description: 'Number of records to generate (1-10,000)',
  },
  {
    key: 'format',
    label: 'Output Format',
    type: 'select' as const,
    default: 'json',
    options: [
      { value: 'json', label: 'JSON' },
      { value: 'csv', label: 'CSV' },
      { value: 'sql', label: 'SQL Inserts' },
      { value: 'xml', label: 'XML' },
      { value: 'yaml', label: 'YAML' },
    ],
    description: 'Choose the output format for generated data',
  },
  {
    key: 'locale',
    label: 'Locale',
    type: 'select' as const,
    default: 'en',
    options: [
      { value: 'en', label: '🇺🇸 English' },
      { value: 'es', label: '🇪🇸 Spanish' },
      { value: 'fr', label: '🇫🇷 French' },
      { value: 'de', label: '🇩🇪 German' },
      { value: 'it', label: '🇮🇹 Italian' },
      { value: 'pt', label: '🇵🇹 Portuguese' },
      { value: 'ru', label: '🇷🇺 Russian' },
      { value: 'ja', label: '🇯🇵 Japanese' },
      { value: 'zh', label: '🇨🇳 Chinese' },
    ],
    description: 'Language/region for generated names and locations',
  },
  {
    key: 'outputStyle',
    label: 'Output Style',
    type: 'select' as const,
    default: 'pretty',
    options: [
      { value: 'pretty', label: 'Pretty (Formatted)' },
      { value: 'compact', label: 'Compact' },
      { value: 'minified', label: 'Minified' },
    ],
    description: 'Format style for JSON output',
  },
  {
    key: 'includeIds',
    label: 'Include IDs',
    type: 'checkbox' as const,
    default: true,
    description: 'Add auto-incrementing ID fields to records',
  },
  {
    key: 'includeTimestamps',
    label: 'Include Timestamps',
    type: 'checkbox' as const,
    default: true,
    description: 'Add createdAt and updatedAt timestamp fields',
  },
  {
    key: 'nullProbability',
    label: 'Null Probability (%)',
    type: 'number' as const,
    default: 0,
    min: 0,
    max: 50,
    description: 'Percentage chance for fields to be null (0-50%)',
  },
] as const;

// Advanced options that only show for custom data type
const CUSTOM_OPTIONS = [
  {
    key: 'seedValue',
    label: 'Seed Value',
    type: 'text' as const,
    default: '',
    description: 'Custom seed for reproducible results (optional)',
  },
] as const;

export function MockDataGenerator({ className = '' }: MockDataGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<MockDataConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: MockDataConfig) => {
      setIsProcessing(true);
      setError(null);
      setMetadata(null);

      try {
        const result = processMockData(value, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setMetadata(result.metadata);
          
          // Add to history
          addToHistory({
            toolId: 'mock-data-generator',
            input: value,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate mock data');
          setOutput('');
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during data generation');
        setOutput('');
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('mock-data-generator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [config, processInput]); // Note: input only triggers for custom type

  // Only process input changes if we're in custom mode
  useEffect(() => {
    if (config.dataType === 'custom') {
      processInput(input, config);
    } else {
      processInput('', config);
    }
  }, [input, processInput, config.dataType]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  // Get examples based on data type
  const getExamples = () => {
    const examples = {
      user: [
        {
          label: 'Basic User Schema',
          value: `{
  "name": "name",
  "email": "email",
  "age": {"type": "integer", "min": 18, "max": 80},
  "active": {"type": "boolean", "probability": 0.9}
}`,
        },
      ],
      product: [
        {
          label: 'E-commerce Product',
          value: `{
  "name": "product",
  "price": {"type": "float", "min": 10, "max": 1000},
  "category": {"type": "string", "enum": ["Electronics", "Clothing", "Books", "Home"]},
  "inStock": "boolean"
}`,
        },
      ],
      order: [
        {
          label: 'Order with Items',
          value: `{
  "orderNumber": "string",
  "total": {"type": "float", "min": 20, "max": 500},
  "status": {"type": "string", "enum": ["pending", "processing", "shipped", "delivered"]},
  "customerEmail": "email"
}`,
        },
      ],
      address: [
        {
          label: 'Full Address',
          value: `{
  "street": "string",
  "city": "city", 
  "zipCode": {"type": "string", "length": 5},
  "coordinates": {"type": "string", "enum": ["40.7128,-74.0060", "34.0522,-118.2437"]}
}`,
        },
      ],
      custom: [
        {
          label: 'Gaming Profile',
          value: `{
  "username": {"type": "string", "length": 12},
  "level": {"type": "integer", "min": 1, "max": 100},
  "experience": {"type": "integer", "min": 0, "max": 999999},
  "class": {"type": "string", "enum": ["warrior", "mage", "archer", "rogue"]},
  "isOnline": {"type": "boolean", "probability": 0.3},
  "lastLogin": "datetime",
  "achievements": {"type": "integer", "min": 0, "max": 50}
}`,
        },
        {
          label: 'API Response',
          value: `{
  "requestId": "uuid",
  "status": {"type": "string", "enum": ["success", "error", "pending"]},
  "responseTime": {"type": "integer", "min": 10, "max": 2000},
  "endpoint": "url",
  "userAgent": "string",
  "timestamp": "datetime"
}`,
        },
        {
          label: 'IoT Sensor Data',
          value: `{
  "deviceId": "uuid",
  "temperature": {"type": "float", "min": -10, "max": 40},
  "humidity": {"type": "float", "min": 0, "max": 100},
  "pressure": {"type": "float", "min": 980, "max": 1050},
  "location": {"type": "string", "enum": ["room1", "room2", "outdoor"]},
  "batteryLevel": {"type": "integer", "min": 0, "max": 100}
}`,
        },
      ],
    };
    
    return examples[config.dataType] || examples.custom;
  };

  // Show different UI for custom vs predefined types
  const isCustomType = config.dataType === 'custom';
  const currentExamples = getExamples();

  const allOptions = isCustomType ? [...OPTIONS, ...CUSTOM_OPTIONS] : OPTIONS;

  const getLanguageForOutput = () => {
    switch (config.format) {
      case 'json':
        return 'json';
      case 'csv':
        return 'csv';
      case 'sql':
        return 'sql';
      case 'xml':
        return 'xml';
      case 'yaml':
        return 'yaml';
      default:
        return 'json';
    }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {isCustomType && (
          <InputPanel
            title="Custom Data Schema"
            value={input}
            onChange={setInput}
            placeholder={`{
  "fieldName": "fieldType",
  "customField": {
    "type": "integer",
    "min": 1,
    "max": 100
  }
}`}
            description="Define your data structure using JSON schema. Supported types: string, name, email, phone, integer, float, boolean, date, datetime, city, company, product, currency, uuid, url"
            examples={currentExamples}
            onExampleClick={handleExample}
            language="json"
            rows={10}
          />
        )}
        
        <OptionsPanel
          title="Generator Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />
        
        {metadata && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <h4 className="font-medium text-gray-900">Generation Stats</h4>
            <div className="space-y-1 text-gray-600">
              <div>📊 Records: {metadata.recordsGenerated}</div>
              <div>📋 Fields per record: {metadata.fieldsPerRecord}</div>
              <div>💾 Size: {(metadata.estimatedSize / 1024).toFixed(1)} KB</div>
              <div>⚡ Time: {metadata.generationTime}ms</div>
              {metadata.seedUsed !== 'auto-generated' && (
                <div>🌱 Seed: {metadata.seedUsed}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title={`Generated ${config.dataType === 'custom' ? 'Data' : config.dataType.charAt(0).toUpperCase() + config.dataType.slice(1) + ' Data'}`}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={getLanguageForOutput()}
          placeholder={
            isCustomType 
              ? "Define a custom schema to generate data..."
              : `Generating ${config.count} ${config.dataType} records in ${config.format.toUpperCase()} format...`
          }
        />
      </div>
    </div>
  );
}