import { useState, useEffect, useMemo, useCallback } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processJsonToXmlConverter, type JsonToXmlConfig } from '../../../tools/converters/json-to-xml-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface JsonToXmlConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonToXmlConfig = {
  rootElementName: 'root',
  arrayElementName: 'item',
  includeXmlDeclaration: true,
  prettyPrint: true,
  indentSize: 2,
  attributePrefix: '@',
  textNodeName: '#text',
  handleNullValues: 'empty',
  convertNumbers: true,
  convertBooleans: true,
  validateXmlNames: true,
  maxDepth: 50,
  customNamespaces: [],
};

const STRUCTURE_OPTIONS = [
  {
    key: 'rootElementName',
    label: 'Root Element Name',
    type: 'text' as const,
    default: 'root',
    description: 'Name for the root XML element',
  },
  {
    key: 'arrayElementName',
    label: 'Array Item Name',
    type: 'text' as const,
    default: 'item',
    description: 'Element name for array items',
  },
  {
    key: 'attributePrefix',
    label: 'Attribute Prefix',
    type: 'text' as const,
    default: '@',
    description: 'JSON property prefix for XML attributes',
  },
  {
    key: 'textNodeName',
    label: 'Text Node Name',
    type: 'text' as const,
    default: '#text',
    description: 'JSON property name for element text content',
  },
] as const;

const FORMAT_OPTIONS = [
  {
    key: 'includeXmlDeclaration',
    label: 'Include XML Declaration',
    type: 'checkbox' as const,
    default: true,
    description: 'Add <?xml version="1.0" encoding="UTF-8"?> header',
  },
  {
    key: 'prettyPrint',
    label: 'Pretty Print',
    type: 'checkbox' as const,
    default: true,
    description: 'Format XML with proper indentation',
  },
  {
    key: 'indentSize',
    label: 'Indent Size',
    type: 'number' as const,
    default: 2,
    min: 1,
    max: 8,
    description: 'Number of spaces for indentation',
  },
  {
    key: 'handleNullValues',
    label: 'Null Value Handling',
    type: 'select' as const,
    default: 'empty',
    options: [
      { value: 'omit', label: 'Omit Element' },
      { value: 'empty', label: 'Empty Element' },
      { value: 'null', label: 'Text "null"' },
    ],
    description: 'How to handle null values in JSON',
  },
] as const;

const VALIDATION_OPTIONS = [
  {
    key: 'convertNumbers',
    label: 'Convert Numbers',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert JSON numbers to XML text',
  },
  {
    key: 'convertBooleans',
    label: 'Convert Booleans',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert JSON booleans to XML text',
  },
  {
    key: 'validateXmlNames',
    label: 'Validate XML Names',
    type: 'checkbox' as const,
    default: true,
    description: 'Sanitize invalid XML element names',
  },
  {
    key: 'maxDepth',
    label: 'Max Depth',
    type: 'number' as const,
    default: 50,
    min: 1,
    max: 100,
    description: 'Maximum nesting depth for conversion',
  },
] as const;

export function JsonToXmlConverter({ className = '' }: JsonToXmlConverterProps) {
  const [input, setInput] = useState(`{
  "product": {
    "@id": "12345",
    "@category": "electronics",
    "name": "Wireless Headphones",
    "price": 99.99,
    "inStock": true,
    "description": "High-quality wireless headphones with noise cancellation",
    "features": [
      "Bluetooth 5.0",
      "30-hour battery",
      "Active noise cancellation",
      "Quick charge"
    ],
    "specifications": {
      "weight": "250g",
      "color": "Black",
      "warranty": "2 years",
      "#text": "Premium audio experience"
    },
    "reviews": [
      {
        "@rating": "5",
        "author": "John Smith",
        "comment": "Excellent sound quality!"
      },
      {
        "@rating": "4",
        "author": "Jane Doe",
        "comment": "Great battery life and comfort."
      }
    ]
  }
}`);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversion, setConversion] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<JsonToXmlConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: JsonToXmlConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processJsonToXmlConverter(currentInput, currentConfig);

        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setConversion(result.conversion);
          setWarnings(result.warnings || []);

          // Add to history
          addToHistory({
            toolId: 'json-to-xml-converter',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.conversion ? `${result.conversion.conversionStats.totalNodes} nodes` : 'Converted',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to convert JSON to XML');
          setOutput('');
          setConversion(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during conversion');
        setOutput('');
        setConversion(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('json-to-xml-converter');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'simple' | 'array' | 'complex' | 'attributes' | 'mixed' | 'nested' | 'namespaces') => {
    const examples = {
      simple: `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "active": true,
  "lastLogin": null
}`,
      array: `{
  "users": [
    {"id": 1, "name": "Alice", "role": "admin"},
    {"id": 2, "name": "Bob", "role": "user"},
    {"id": 3, "name": "Charlie", "role": "moderator"}
  ],
  "total": 3
}`,
      complex: `{
  "company": {
    "name": "Tech Corp",
    "founded": 2010,
    "employees": {
      "total": 150,
      "departments": {
        "engineering": 75,
        "sales": 40,
        "support": 35
      }
    },
    "locations": ["New York", "San Francisco", "London"]
  }
}`,
      attributes: `{
  "@xmlns": "http://example.com/schema",
  "@version": "1.0",
  "document": {
    "@id": "doc-123",
    "@type": "report",
    "title": "Annual Report",
    "author": {
      "@email": "author@example.com",
      "name": "Jane Smith"
    },
    "sections": [
      {
        "@number": "1",
        "title": "Introduction",
        "#text": "This section introduces the report."
      }
    ]
  }
}`,
      mixed: `{
  "order": {
    "@id": "ORD-001",
    "@date": "2024-01-15",
    "customer": {
      "@type": "premium",
      "name": "Acme Corp",
      "contact": {
        "email": "orders@acme.com",
        "phone": "+1-555-0123"
      }
    },
    "items": [
      {
        "@sku": "PRD-001",
        "name": "Widget A",
        "quantity": 10,
        "price": 25.50
      },
      {
        "@sku": "PRD-002",
        "name": "Widget B",
        "quantity": 5,
        "price": 45.00
      }
    ],
    "total": 480.00,
    "status": "confirmed"
  }
}`,
      nested: `{
  "config": {
    "database": {
      "host": "localhost",
      "port": 5432,
      "credentials": {
        "username": "admin",
        "encrypted": true
      },
      "pools": {
        "read": {"min": 1, "max": 10},
        "write": {"min": 2, "max": 5}
      }
    },
    "cache": {
      "redis": {
        "enabled": true,
        "ttl": 3600
      }
    }
  }
}`,
      namespaces: `{
  "@xmlns:product": "http://example.com/product",
  "@xmlns:customer": "http://example.com/customer",
  "order": {
    "product:item": {
      "@product:id": "12345",
      "product:name": "Laptop",
      "product:category": "Electronics"
    },
    "customer:info": {
      "@customer:id": "67890",
      "customer:name": "John Doe",
      "customer:type": "premium"
    }
  }
}`
    };

    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...STRUCTURE_OPTIONS,
    ...FORMAT_OPTIONS.filter(opt =>
      opt.key !== 'indentSize' || config.prettyPrint
    ),
    ...VALIDATION_OPTIONS,
  ];

  const getComplexityColor = (nodes: number) => {
    if (nodes > 100) return 'text-danger bg-danger-subtle';
    if (nodes > 50) return 'text-warning bg-warning-subtle';
    return 'text-success bg-success-subtle';
  };

  const getDepthColor = (depth: number) => {
    if (depth > 10) return 'text-danger bg-danger-subtle';
    if (depth > 5) return 'text-warning bg-warning-subtle';
    return 'text-success bg-success-subtle';
  };

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
      <div className="sticky top-0 z-10 grid-responsive" style={{
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
            🔄 {isProcessing ? 'Converting...' : 'Convert JSON'}
          </button>

          <button
            onClick={handleClearData}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            🗑️ Clear
          </button>

          {/* Real-time Stats */}
          {conversion && (
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-medium">{conversion.conversionStats.totalNodes}</span> nodes
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-medium">{conversion.conversionStats.conversionTime}ms</span>
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-medium">{(conversion.conversionStats.outputSize / 1024).toFixed(1)}KB</span>
              </div>
            </div>
          )}

          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Press <kbd className="kbd">Ctrl+Enter</kbd> to convert
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid-responsive md:grid-cols-1" style={{
        // Responsive grid handled by CSS class

        gap: 'var(--space-xl)',
        minHeight: '500px'
      }}>
        <div className="space-y-6">
          <InputPanel
            title="JSON Input"
            value={input}
            onChange={setInput}
            placeholder="Enter JSON data to convert to XML..."
            language="json"
            supportsDragDrop
            onFileContent={(content) => setInput(content)}
            acceptedFileTypes=".json,.txt"
          />

          {/* Conversion Statistics */}
          {conversion && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Conversion Statistics</h3>
              <div className="space-y-3">
                <div className={`p-3 rounded border-2 ${getComplexityColor(conversion.conversionStats.totalNodes)}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-xl">📊</div>
                    <div>
                      <div className="font-medium text-sm">
                        {conversion.conversionStats.totalNodes} Total Nodes
                      </div>
                      <div className="text-xs opacity-75">
                        {(conversion.conversionStats.outputSize / 1024).toFixed(1)}KB output
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded text-xs ${getDepthColor(conversion.structureInfo.maxDepth)}`}>
                    <div className="flex justify-between">
                      <span>Max Depth:</span>
                      <span className="font-medium">{conversion.structureInfo.maxDepth}</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }} className="p-2 rounded text-xs">
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{conversion.conversionStats.conversionTime}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Examples */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <details className="space-y-3">
              <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-text)' }}>
                📋 Quick Examples
              </summary>
              <div className="grid grid-cols-1 gap-2 mt-3">
                <button
                  onClick={() => handleQuickExample('simple')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  📄 Simple Object
                </button>
                <button
                  onClick={() => handleQuickExample('array')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  📋 Arrays & Lists
                </button>
                <button
                  onClick={() => handleQuickExample('complex')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  🏗️ Nested Objects
                </button>
                <button
                  onClick={() => handleQuickExample('attributes')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  🏷️ XML Attributes
                </button>
                <button
                  onClick={() => handleQuickExample('mixed')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  🎯 Mixed Content
                </button>
                <button
                  onClick={() => handleQuickExample('nested')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  📡 Deep Nesting
                </button>
                <button
                  onClick={() => handleQuickExample('namespaces')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  🌐 XML Namespaces
                </button>
              </div>
            </details>
          </div>

          <OptionsPanel
            title="Conversion Options"
            options={allOptions}
            values={config}
            onChange={handleConfigChange}
          />

          {/* Structure Analysis */}
          {conversion && conversion.structureInfo && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Structure Analysis</h3>
              <div className="space-y-3">
                <div style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }} className="p-2 rounded text-xs">
                  <div className="flex justify-between">
                    <span>Root Element:</span>
                    <span className="font-medium font-mono">&lt;{conversion.structureInfo.rootElement}&gt;</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded ${conversion.structureInfo.hasArrays ? 'bg-success-subtle text-success' : 'text-muted'}`} style={{ backgroundColor: conversion.structureInfo.hasArrays ? 'var(--color-success-subtle)' : 'var(--color-surface-secondary)' }}>
                    <div className="flex items-center gap-1">
                      <span>{conversion.structureInfo.hasArrays ? '✅' : '❌'}</span>
                      <span>Arrays</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded ${conversion.structureInfo.hasObjects ? 'bg-success-subtle text-success' : 'text-muted'}`} style={{ backgroundColor: conversion.structureInfo.hasObjects ? 'var(--color-success-subtle)' : 'var(--color-surface-secondary)' }}>
                    <div className="flex items-center gap-1">
                      <span>{conversion.structureInfo.hasObjects ? '✅' : '❌'}</span>
                      <span>Objects</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded ${conversion.structureInfo.hasAttributes ? 'bg-success-subtle text-success' : 'text-muted'}`} style={{ backgroundColor: conversion.structureInfo.hasAttributes ? 'var(--color-success-subtle)' : 'var(--color-surface-secondary)' }}>
                    <div className="flex items-center gap-1">
                      <span>{conversion.structureInfo.hasAttributes ? '✅' : '❌'}</span>
                      <span>Attributes</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded ${conversion.structureInfo.hasTextContent ? 'bg-success-subtle text-success' : 'text-muted'}`} style={{ backgroundColor: conversion.structureInfo.hasTextContent ? 'var(--color-success-subtle)' : 'var(--color-surface-secondary)' }}>
                    <div className="flex items-center gap-1">
                      <span>{conversion.structureInfo.hasTextContent ? '✅' : '❌'}</span>
                      <span>Text</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="card" style={{ padding: 'var(--space-lg)', borderColor: 'var(--color-warning)', borderWidth: '1px' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>⚠️ Warnings</h3>
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <div key={index} style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }} className="p-2 rounded text-xs">
                    <div className="flex items-start gap-2">
                      <span>⚠️</span>
                      <span>{warning}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JSON/XML Information */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Conversion Info</h3>
            <div style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }} className="p-3 rounded-lg text-xs">
              <div className="font-medium mb-2">🔄 JSON to XML Mapping</div>
              <div className="space-y-1">
                <div>• JSON objects → XML elements</div>
                <div>• JSON arrays → Multiple child elements</div>
                <div>• "@property" → XML attributes</div>
                <div>• "#text" → Element text content</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <OutputPanel
            title="XML Output"
            value={output}
            error={error}
            isProcessing={isProcessing}
            language="xml"
            placeholder="Converted XML will appear here..."
            processingMessage="Converting JSON to XML..."
            supportsCopy
            supportsDownload
            downloadFileName="converted.xml"
            customActions={
              output && conversion ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => navigator.clipboard?.writeText(conversion.xmlDocument)}
                    className="btn btn-sm btn-secondary"
                  >
                    📋 Copy XML
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([conversion.xmlDocument], { type: 'application/xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `converted-${Date.now()}.xml`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn btn-sm btn-outline"
                  >
                    💾 Download XML
                  </button>
                  <div className={`px-3 py-1 text-xs font-medium rounded ${getComplexityColor(conversion.conversionStats.totalNodes)}`}>
                    {conversion.conversionStats.totalNodes} Nodes
                  </div>
                </div>
              ) : undefined
            }
          />

          {/* Element Breakdown - Moved to Output Side */}
          {conversion && conversion.conversionStats && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Element Breakdown</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }} className="flex justify-between p-2 rounded">
                  <span>Object Elements:</span>
                  <span className="font-medium">{conversion.conversionStats.objectElements}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }} className="flex justify-between p-2 rounded">
                  <span>Array Elements:</span>
                  <span className="font-medium">{conversion.conversionStats.arrayElements}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-secondary-subtle)', color: 'var(--color-secondary)' }} className="flex justify-between p-2 rounded">
                  <span>Text Nodes:</span>
                  <span className="font-medium">{conversion.conversionStats.textNodes}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }} className="flex justify-between p-2 rounded">
                  <span>Attributes:</span>
                  <span className="font-medium">{conversion.conversionStats.attributes}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }} className="flex justify-between p-2 rounded">
                  <span>Processing Time:</span>
                  <span className="font-medium">{conversion.conversionStats.conversionTime}ms</span>
                </div>
                {conversion.conversionStats.nullValues > 0 && (
                  <div style={{ backgroundColor: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }} className="flex justify-between p-2 rounded">
                    <span>Null Values:</span>
                    <span className="font-medium">{conversion.conversionStats.nullValues}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}