import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [input, setInput] = useState(`{
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "age": 30,
      "location": "New York",
      "preferences": {
        "theme": "dark",
        "notifications": true,
        "features": ["email", "sms", "push"]
      }
    },
    "posts": [
      {
        "id": 1,
        "title": "Hello World",
        "content": "My first post!",
        "published": true,
        "publishedAt": "2024-01-15T10:00:00Z",
        "tags": ["introduction", "first-post"],
        "stats": {
          "views": 100,
          "likes": 25,
          "comments": 5
        }
      },
      {
        "id": 2,
        "title": "Learning TypeScript",
        "content": "TypeScript is awesome!",
        "published": false,
        "publishedAt": null,
        "tags": ["typescript", "learning"],
        "stats": {
          "views": 0,
          "likes": 0,
          "comments": 0
        }
      }
    ]
  }
}`);
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
            input: inputValue.substring(0, 50) + (inputValue.length > 50 ? '...' : ''),
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

  const handleQuickExample = (example: any) => {
    setInput(typeof example === 'string' ? example : JSON.stringify(example, null, 2));
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Example JSON data
  const examples = [
    {
      label: '👤 Simple User',
      value: JSON.stringify({
        id: 123,
        name: "John Doe",
        email: "john@example.com",
        isActive: true,
        lastLogin: null
      }, null, 2),
    },
    {
      label: '📊 API Response',
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
      label: '🛒 E-commerce Product',
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
      label: '⚙️ Configuration Object',
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
      label: '📋 Array of Objects',
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

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      processInput(input, config);
    }
  }, [input, config, processInput]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sticky Controls Bar */}
      <div className="sticky top-0 z-10" className="grid-responsive" style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-lg)'
      }}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => processInput(input, config)}
            disabled={isProcessing || !input.trim()}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            🔄 {isProcessing ? 'Generating...' : 'Generate Types'}
          </button>

          <button
            onClick={handleClearData}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            🗑️ Clear
          </button>

          {/* Real-time Stats */}
          {metadata && (
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-medium">{metadata.interfaceCount}</span> interfaces
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-medium">{output.split('\n').length}</span> lines
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-medium">{(output.length / 1024).toFixed(1)}KB</span>
              </div>
            </div>
          )}

          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Press <kbd className="kbd">Ctrl+Enter</kbd> to generate
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid-responsive" style={{
        // Responsive grid handled by CSS class
        
        gap: 'var(--space-xl)',
        minHeight: '500px'
      }} className="md:grid-cols-1">
        <div className="space-y-6">
          <InputPanel
            title="JSON Data"
            value={input}
            onChange={setInput}
            placeholder="Enter JSON data to convert..."
            language="json"
            supportsDragDrop
            onFileContent={(content) => setInput(content)}
            acceptedFileTypes=".json,.txt"
          />

          {/* Quick Examples */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <details className="space-y-3">
              <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-text)' }}>
                📋 Quick Examples
              </summary>
              <div className="grid grid-cols-1 gap-2 mt-3">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickExample(example.value)}
                    className="btn btn-outline text-left"
                    style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <OptionsPanel
            title="Generation Options"
            options={allOptions}
            values={config}
            onChange={handleConfigChange}
          />

          {/* Interface Name Preview */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Generated Interface Preview</h3>
            <div style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }} className="p-3 rounded-lg text-xs font-mono">
              {config.generateExport ? 'export ' : ''}interface {config.interfaceName} {'{ ... }'}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              This will be the main interface name in your generated TypeScript code
            </p>
          </div>

          {/* Metadata Display */}
          {metadata && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Generation Results</h3>
              <div className="space-y-3">
                <div style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }} className="p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">🎯</div>
                    <div>
                      <div className="font-medium text-sm">
                        {metadata.interfaceCount} Interfaces Generated
                      </div>
                      <div className="text-xs opacity-75">
                        {output.split('\n').length} lines of TypeScript code
                      </div>
                    </div>
                  </div>
                </div>

                {metadata.typeDefinitions && metadata.typeDefinitions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Type Definitions:</h4>
                    {metadata.typeDefinitions.map((def: any, index: number) => (
                      <div key={index} style={{ backgroundColor: 'var(--color-secondary-subtle)', color: 'var(--color-secondary)' }} className="p-2 rounded text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-medium">{def.name}</span>
                          <span className="opacity-75">({def.properties} properties)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TypeScript Tips */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>TypeScript Tips</h3>
            <div className="space-y-3 text-xs">
              <div style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }} className="p-3 rounded">
                <div className="font-medium mb-1">💡 Best Practices</div>
                <div className="space-y-1">
                  <div>• <strong>Optional Properties:</strong> Use when data might be incomplete</div>
                  <div>• <strong>Union Types:</strong> Handle arrays with mixed types</div>
                  <div>• <strong>CamelCase:</strong> Convert API snake_case to JS convention</div>
                  <div>• <strong>Export Interfaces:</strong> Enable imports in other modules</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <OutputPanel
            title="Generated TypeScript Interfaces"
            value={output}
            error={error}
            isProcessing={isProcessing}
            language="typescript"
            placeholder="Enter JSON data to generate TypeScript interfaces..."
            processingMessage="Generating TypeScript interfaces..."
            supportsCopy
            supportsDownload
            downloadFileName={`${config.interfaceName}.ts`}
            customActions={
              output ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => navigator.clipboard?.writeText(output)}
                    className="btn btn-sm btn-secondary"
                  >
                    📋 Copy Code
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
                    className="btn btn-sm btn-outline"
                  >
                    💾 Download .ts File
                  </button>
                  {metadata && (
                    <div className="px-3 py-1 text-xs font-medium rounded bg-success-subtle text-success">
                      {metadata.interfaceCount} Interfaces
                    </div>
                  )}
                </div>
              ) : undefined
            }
          />

          {/* Code Analysis */}
          {output && metadata && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Code Analysis</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }} className="flex justify-between p-2 rounded">
                  <span>Lines of Code:</span>
                  <span className="font-medium">{output.split('\n').length}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }} className="flex justify-between p-2 rounded">
                  <span>Interfaces:</span>
                  <span className="font-medium">{metadata.interfaceCount}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-secondary-subtle)', color: 'var(--color-secondary)' }} className="flex justify-between p-2 rounded">
                  <span>File Size:</span>
                  <span className="font-medium">{(output.length / 1024).toFixed(1)}KB</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }} className="flex justify-between p-2 rounded">
                  <span>Export Mode:</span>
                  <span className="font-medium">{config.generateExport ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }} className="flex justify-between p-2 rounded">
                  <span>Optional Props:</span>
                  <span className="font-medium">{config.useOptionalProperties ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }} className="flex justify-between p-2 rounded">
                  <span>Null Handling:</span>
                  <span className="font-medium">{config.includeNullables ? 'Preserved' : 'Converted'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Usage Examples */}
          {output && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Usage Examples</h3>
              <div style={{ backgroundColor: 'var(--color-surface-secondary)' }} className="p-3 rounded text-xs font-mono">
                <div className="space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <div>// Import the generated types</div>
                  <div style={{ color: 'var(--color-primary)' }}>import {`{ ${config.interfaceName} }`} from './{config.interfaceName}.ts';</div>
                  <div></div>
                  <div>// Use in your code</div>
                  <div style={{ color: 'var(--color-success)' }}>const data: {config.interfaceName} = {`{ ... }`};</div>
                  <div></div>
                  <div>// Type-safe property access</div>
                  <div style={{ color: 'var(--color-secondary)' }}>console.log(data.property);</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}