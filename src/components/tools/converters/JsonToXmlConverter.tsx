import { useState, useEffect, useMemo } from 'react';
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
    if (nodes > 100) return 'text-red-800 bg-red-100';
    if (nodes > 50) return 'text-yellow-800 bg-yellow-100';
    return 'text-green-800 bg-green-100';
  };

  const getDepthColor = (depth: number) => {
    if (depth > 10) return 'text-red-800 bg-red-100';
    if (depth > 5) return 'text-yellow-800 bg-yellow-100';
    return 'text-green-800 bg-green-100';
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Conversion Statistics */}
        {conversion && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Conversion Statistics</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded border-2 ${getComplexityColor(conversion.conversionStats.totalNodes)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📊</div>
                  <div>
                    <div className="font-medium text-sm">
                      {conversion.conversionStats.totalNodes} Total Nodes
                    </div>
                    <div className="text-xs opacity-80">
                      {conversion.conversionStats.outputSize} characters
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-2 rounded text-xs ${getDepthColor(conversion.structureInfo.maxDepth)}`}>
                <div className="flex justify-between">
                  <span>Max Depth:</span>
                  <span className="font-medium">{conversion.structureInfo.maxDepth}</span>
                </div>
              </div>
              
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-600">Processing:</span>
                  <span className="text-blue-800 font-medium">{conversion.conversionStats.conversionTime}ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('simple')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              📄 Simple Object
            </button>
            <button
              onClick={() => handleQuickExample('array')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📋 Arrays & Lists
            </button>
            <button
              onClick={() => handleQuickExample('complex')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              🏗️ Nested Objects
            </button>
            <button
              onClick={() => handleQuickExample('attributes')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              🏷️ XML Attributes
            </button>
            <button
              onClick={() => handleQuickExample('mixed')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              🎯 Mixed Content
            </button>
            <button
              onClick={() => handleQuickExample('nested')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              📡 Deep Nesting
            </button>
            <button
              onClick={() => handleQuickExample('namespaces')}
              className="px-3 py-2 text-xs bg-pink-100 text-pink-800 rounded hover:bg-pink-200 transition-colors text-left"
            >
              🌐 XML Namespaces
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Conversion Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Structure Analysis */}
        {conversion && conversion.structureInfo && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Structure Analysis</h3>
            <div className="space-y-2">
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-600">Root Element:</span>
                  <span className="text-blue-800 font-medium font-mono">&lt;{conversion.structureInfo.rootElement}&gt;</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded ${conversion.structureInfo.hasArrays ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <span>{conversion.structureInfo.hasArrays ? '✅' : '❌'}</span>
                    <span>Arrays</span>
                  </div>
                </div>
                <div className={`p-2 rounded ${conversion.structureInfo.hasObjects ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <span>{conversion.structureInfo.hasObjects ? '✅' : '❌'}</span>
                    <span>Objects</span>
                  </div>
                </div>
                <div className={`p-2 rounded ${conversion.structureInfo.hasAttributes ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <span>{conversion.structureInfo.hasAttributes ? '✅' : '❌'}</span>
                    <span>Attributes</span>
                  </div>
                </div>
                <div className={`p-2 rounded ${conversion.structureInfo.hasTextContent ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <span>{conversion.structureInfo.hasTextContent ? '✅' : '❌'}</span>
                    <span>Text</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Element Breakdown */}
        {conversion && conversion.conversionStats && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Element Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-blue-50 rounded">
                <span className="text-blue-600">Object Elements:</span>
                <span className="text-blue-800 font-medium">{conversion.conversionStats.objectElements}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-green-50 rounded">
                <span className="text-green-600">Array Elements:</span>
                <span className="text-green-800 font-medium">{conversion.conversionStats.arrayElements}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-purple-50 rounded">
                <span className="text-purple-600">Text Nodes:</span>
                <span className="text-purple-800 font-medium">{conversion.conversionStats.textNodes}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                <span className="text-indigo-600">Attributes:</span>
                <span className="text-indigo-800 font-medium">{conversion.conversionStats.attributes}</span>
              </div>
              {conversion.conversionStats.nullValues > 0 && (
                <div className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Null Values:</span>
                  <span className="text-gray-800 font-medium">{conversion.conversionStats.nullValues}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Warnings</h3>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-800">{warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JSON/XML Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Conversion Info</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🔄 JSON to XML Mapping</div>
              <div className="space-y-1">
                <div>• JSON objects → XML elements</div>
                <div>• JSON arrays → Multiple child elements</div>
                <div>• "@property" → XML attributes</div>
                <div>• "#text" → Element text content</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🗑️ Clear Data
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="JSON Input"
          value={input}
          onChange={setInput}
          placeholder="Enter JSON data to convert to XML..."
          language="json"
        />

        <OutputPanel
          title="XML Output"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="xml"
          placeholder="Converted XML will appear here..."
          processingMessage="Converting JSON to XML..."
          customActions={
            output && conversion ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigator.clipboard?.writeText(conversion.xmlDocument)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download XML
                </button>
                <button
                  onClick={() => {
                    const report = `JSON to XML Conversion Report\nGenerated: ${new Date().toISOString()}\n\nConversion Summary:\n- Total Nodes: ${conversion.conversionStats.totalNodes}\n- Attributes: ${conversion.conversionStats.attributes}\n- Text Nodes: ${conversion.conversionStats.textNodes}\n- Array Elements: ${conversion.conversionStats.arrayElements}\n- Object Elements: ${conversion.conversionStats.objectElements}\n- Processing Time: ${conversion.conversionStats.conversionTime}ms\n- Output Size: ${conversion.conversionStats.outputSize} characters\n\nStructure Information:\n- Max Depth: ${conversion.structureInfo.maxDepth}\n- Root Element: ${conversion.structureInfo.rootElement}\n- Contains Arrays: ${conversion.structureInfo.hasArrays}\n- Contains Objects: ${conversion.structureInfo.hasObjects}\n- Has Attributes: ${conversion.structureInfo.hasAttributes}\n- Has Text Content: ${conversion.structureInfo.hasTextContent}\n\n${warnings.length > 0 ? `Warnings:\n${warnings.map(w => `- ${w}`).join('\n')}\n\n` : ''}XML Output:\n${conversion.xmlDocument}`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getComplexityColor(conversion.conversionStats.totalNodes)}`}>
                  {conversion.conversionStats.totalNodes} Nodes
                </div>
                <div className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  Depth: {conversion.structureInfo.maxDepth}
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}