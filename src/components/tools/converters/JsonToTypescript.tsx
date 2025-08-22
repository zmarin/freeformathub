import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processJsonToTypescript, type JsonToTypescriptConfig } from '../../../tools/converters/json-to-typescript';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JsonToTypescriptProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonToTypescriptConfig = {
  interfaceName: 'GeneratedInterface',
  useOptionalProperties: false,
  inferArrayTypes: true,
  useUnionTypes: true,
  formatOutput: true,
  includeComments: true,
  rootAsArray: false,
  useCamelCase: false,
  includeNullables: true,
  generateExport: true,
};

const BASIC_OPTIONS = [
  {
    key: 'interfaceName',
    label: 'Interface Name',
    type: 'text' as const,
    default: 'GeneratedInterface',
    placeholder: 'Enter interface name...',
    description: 'Name for the main TypeScript interface',
  },
  {
    key: 'generateExport',
    label: 'Export Interfaces',
    type: 'checkbox' as const,
    default: true,
    description: 'Add "export" keyword to generated interfaces',
  },
  {
    key: 'useOptionalProperties',
    label: 'Optional Properties',
    type: 'checkbox' as const,
    default: false,
    description: 'Mark null/undefined properties as optional (property?: type)',
  },
  {
    key: 'includeNullables',
    label: 'Include Nullables',
    type: 'checkbox' as const,
    default: true,
    description: 'Preserve null types instead of converting to any',
  },
  {
    key: 'useCamelCase',
    label: 'Convert to camelCase',
    type: 'checkbox' as const,
    default: false,
    description: 'Convert snake_case properties to camelCase',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'inferArrayTypes',
    label: 'Infer Array Types',
    type: 'checkbox' as const,
    default: true,
    description: 'Analyze array contents to generate specific types',
  },
  {
    key: 'useUnionTypes',
    label: 'Union Types',
    type: 'checkbox' as const,
    default: true,
    description: 'Use union types for mixed arrays (type1 | type2)[]',
  },
  {
    key: 'rootAsArray',
    label: 'Root as Array',
    type: 'checkbox' as const,
    default: false,
    description: 'Handle JSON arrays at root level',
  },
  {
    key: 'formatOutput',
    label: 'Format Output',
    type: 'checkbox' as const,
    default: true,
    description: 'Apply basic formatting to generated code',
  },
  {
    key: 'includeComments',
    label: 'Include Comments',
    type: 'checkbox' as const,
    default: true,
    description: 'Add helpful comments to generated interfaces',
  },
] as const;

export function JsonToTypescript({ className = '' }: JsonToTypescriptProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<JsonToTypescriptConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((inputValue: string, currentConfig: JsonToTypescriptConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setMetadata(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processJsonToTypescript(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setMetadata({
            interfaceCount: result.interfaceCount,
            typeDefinitions: result.typeDefinitions,
          });
          
          // Add to history
          addToHistory({
            toolId: 'json-to-typescript',
            input: inputValue,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to convert JSON to TypeScript');
          setOutput('');
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while converting JSON');
        setOutput('');
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('json-to-typescript');
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

  // Example JSON data
  const examples = [
    {
      label: 'Simple User',
      value: JSON.stringify({
        id: 123,
        name: "John Doe",
        email: "john@example.com",
        isActive: true,
        lastLogin: null
      }, null, 2),
    },
    {
      label: 'API Response',
      value: JSON.stringify({
        data: {
          users: [{
            id: 1,
            profile: {
              firstName: "Alice",
              lastName: "Smith",
              age: 30
            }
          }]
        },
        meta: {
          total: 100,
          page: 1
        }
      }, null, 2),
    },
    {
      label: 'E-commerce Product',
      value: JSON.stringify({
        product: {
          id: "prod_123",
          name: "Wireless Headphones",
          price: 99.99,
          categories: ["electronics", "audio"],
          specifications: {
            battery: "20 hours",
            connectivity: ["bluetooth", "usb-c"],
            weight: 250
          },
          inStock: true,
          reviews: [
            { rating: 5, comment: "Great sound!" },
            { rating: 4, comment: "Good value" }
          ]
        }
      }, null, 2),
    },
    {
      label: 'Configuration Object',
      value: JSON.stringify({
        app: {
          name: "My App",
          version: "1.0.0",
          features: {
            auth: {
              enabled: true,
              providers: ["google", "github"]
            },
            database: {
              type: "postgresql",
              config: {
                host: "localhost",
                port: 5432
              }
            }
          }
        }
      }, null, 2),
    },
    {
      label: 'Array of Objects',
      value: JSON.stringify([
        { id: 1, name: "Item 1", active: true },
        { id: 2, name: "Item 2", active: false },
        { id: 3, name: "Item 3", active: true }
      ], null, 2),
    },
  ];

  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="JSON Data"
          value={input}
          onChange={setInput}
          placeholder='Enter JSON data to convert...'
          description="Paste your JSON data to generate TypeScript interfaces"
          examples={examples}
          onExampleClick={handleExample}
          rows={12}
          language="json"
        />
        
        <OptionsPanel
          title="Conversion Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Interface Name Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Generated Interface</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="font-mono text-blue-800">
              {config.generateExport ? 'export ' : ''}interface {config.interfaceName} {'{ ... }'}
            </div>
            <p className="text-blue-700 mt-1">
              This will be the main interface name in your generated TypeScript code
            </p>
          </div>
        </div>

        {/* Metadata Display */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Generation Results</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="text-green-600">Interfaces Generated:</span>
                  <div className="font-medium text-green-800">{metadata.interfaceCount}</div>
                </div>
                {metadata.typeDefinitions && metadata.typeDefinitions.length > 0 && (
                  <div className="pt-2 border-t border-green-200">
                    <span className="text-green-600">Type Definitions:</span>
                    <div className="mt-1 space-y-1">
                      {metadata.typeDefinitions.map((def: any, index: number) => (
                        <div key={index} className="text-green-700">
                          <span className="font-mono text-xs">{def.name}</span>
                          <span className="ml-2 text-gray-600">({def.properties} props)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TypeScript Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">TypeScript Tips</h3>
          <div className="p-3 bg-gray-50 rounded-lg text-xs">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Optional Properties:</span>
                <div className="text-gray-600">Use when data might be incomplete</div>
              </div>
              <div>
                <span className="font-medium">Union Types:</span>
                <div className="text-gray-600">Handle arrays with mixed types</div>
              </div>
              <div>
                <span className="font-medium">CamelCase:</span>
                <div className="text-gray-600">Convert API snake_case to JS convention</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Generated TypeScript Interfaces"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="typescript"
          placeholder="Enter JSON data to generate TypeScript interfaces..."
          processingMessage="Converting JSON to TypeScript..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  =� Copy Code
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${config.interfaceName}.ts`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  =� Download .ts File
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}