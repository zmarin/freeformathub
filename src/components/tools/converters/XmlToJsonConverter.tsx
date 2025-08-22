import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processXmlToJsonConverter, type XmlToJsonConfig } from '../../../tools/converters/xml-to-json-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface XmlToJsonConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: XmlToJsonConfig = {
  attributePrefix: '@',
  textNodeName: '#text',
  preserveWhitespace: false,
  ignoreAttributes: false,
  parseNumbers: true,
  parseBooleans: true,
  trimTextValues: true,
  mergeTextNodes: true,
  arrayMode: 'smart',
  namespacesEnabled: false,
  namespaceSeparator: ':',
  validateXml: true,
  maxDepth: 50,
  ignoreDeclaration: false,
  ignoreComments: false,
  ignoreProcessingInstructions: false,
};

const STRUCTURE_OPTIONS = [
  {
    key: 'attributePrefix',
    label: 'Attribute Prefix',
    type: 'text' as const,
    default: '@',
    description: 'Prefix for XML attributes in JSON',
  },
  {
    key: 'textNodeName',
    label: 'Text Node Name',
    type: 'text' as const,
    default: '#text',
    description: 'Property name for element text content',
  },
  {
    key: 'arrayMode',
    label: 'Array Handling',
    type: 'select' as const,
    default: 'smart',
    options: [
      { value: 'smart', label: 'Smart Detection' },
      { value: 'force', label: 'Force Arrays' },
      { value: 'never', label: 'Never Arrays' },
    ],
    description: 'How to handle repeated elements',
  },
  {
    key: 'namespaceSeparator',
    label: 'Namespace Separator',
    type: 'text' as const,
    default: ':',
    description: 'Separator for namespace prefixes',
  },
] as const;

const PARSING_OPTIONS = [
  {
    key: 'parseNumbers',
    label: 'Parse Numbers',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert numeric strings to numbers',
  },
  {
    key: 'parseBooleans',
    label: 'Parse Booleans',
    type: 'checkbox' as const,
    default: true,
    description: 'Convert "true"/"false" to booleans',
  },
  {
    key: 'trimTextValues',
    label: 'Trim Text Values',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove leading/trailing whitespace',
  },
  {
    key: 'preserveWhitespace',
    label: 'Preserve Whitespace',
    type: 'checkbox' as const,
    default: false,
    description: 'Keep all whitespace characters',
  },
  {
    key: 'mergeTextNodes',
    label: 'Merge Text Nodes',
    type: 'checkbox' as const,
    default: true,
    description: 'Combine adjacent text nodes',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'ignoreAttributes',
    label: 'Ignore Attributes',
    type: 'checkbox' as const,
    default: false,
    description: 'Skip XML attributes during conversion',
  },
  {
    key: 'namespacesEnabled',
    label: 'Process Namespaces',
    type: 'checkbox' as const,
    default: false,
    description: 'Handle XML namespaces',
  },
  {
    key: 'validateXml',
    label: 'Validate XML',
    type: 'checkbox' as const,
    default: true,
    description: 'Perform basic XML validation',
  },
  {
    key: 'ignoreDeclaration',
    label: 'Ignore Declaration',
    type: 'checkbox' as const,
    default: false,
    description: 'Skip <?xml ...?> declaration',
  },
  {
    key: 'ignoreComments',
    label: 'Ignore Comments',
    type: 'checkbox' as const,
    default: false,
    description: 'Skip <!-- comment --> blocks',
  },
  {
    key: 'ignoreProcessingInstructions',
    label: 'Ignore Processing Instructions',
    type: 'checkbox' as const,
    default: false,
    description: 'Skip <?instruction ...?> blocks',
  },
  {
    key: 'maxDepth',
    label: 'Max Depth',
    type: 'number' as const,
    default: 50,
    min: 1,
    max: 100,
    description: 'Maximum nesting depth for parsing',
  },
] as const;

export function XmlToJsonConverter({ className = '' }: XmlToJsonConverterProps) {
  const [input, setInput] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<order id="ORD-001" date="2024-01-15">
  <customer type="premium">
    <name>Acme Corporation</name>
    <contact>
      <email>orders@acme.com</email>
      <phone>+1-555-0123</phone>
    </contact>
    <address>
      <street>123 Business Ave</street>
      <city>New York</city>
      <state>NY</state>
      <zip>10001</zip>
    </address>
  </customer>
  <items>
    <item sku="PRD-001">
      <name>Wireless Headphones</name>
      <quantity>2</quantity>
      <price currency="USD">99.99</price>
    </item>
    <item sku="PRD-002">
      <name>Bluetooth Speaker</name>
      <quantity>1</quantity>
      <price currency="USD">149.99</price>
    </item>
  </items>
  <payment>
    <method>credit_card</method>
    <status>approved</status>
    <total>349.97</total>
  </payment>
  <shipping>
    <method>express</method>
    <estimated_delivery>2024-01-17</estimated_delivery>
  </shipping>
  <notes>Rush delivery requested</notes>
</order>`);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversion, setConversion] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<XmlToJsonConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: XmlToJsonConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processXmlToJsonConverter(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setConversion(result.conversion);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'xml-to-json-converter',
            input: currentInput.substring(0, 50) + (currentInput.length > 50 ? '...' : ''),
            output: result.conversion ? `${result.conversion.conversionStats.totalElements} elements` : 'Converted',
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to convert XML to JSON');
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
    setCurrentTool('xml-to-json-converter');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'simple' | 'attributes' | 'arrays' | 'mixed' | 'complex' | 'namespaces' | 'comments') => {
    const examples = {
      simple: `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <active>true</active>
  <salary>75000.50</salary>
</person>`,
      attributes: `<product id="123" category="electronics" featured="true">
  <name>Smartphone</name>
  <price currency="USD" tax="included">599.99</price>
  <availability inStock="true" quantity="25"/>
  <rating value="4.5" reviews="1250"/>
</product>`,
      arrays: `<library>
  <book isbn="978-0123456789">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
  </book>
  <book isbn="978-0987654321">
    <title>To Kill a Mockingbird</title>
    <author>Harper Lee</author>
    <year>1960</year>
  </book>
  <book isbn="978-0456789123">
    <title>1984</title>
    <author>George Orwell</author>
    <year>1949</year>
  </book>
</library>`,
      mixed: `<article id="art-001">
  <title>Introduction to XML</title>
  <author email="author@example.com">Jane Smith</author>
  <content>
    <paragraph>XML is a markup language.</paragraph>
    <code language="xml">&lt;example&gt;Hello&lt;/example&gt;</code>
    <paragraph>It is widely used for data exchange.</paragraph>
  </content>
  <metadata>
    <created>2024-01-15</created>
    <tags>
      <tag>xml</tag>
      <tag>tutorial</tag>
      <tag>programming</tag>
    </tags>
  </metadata>
</article>`,
      complex: `<company id="tech-corp-001">
  <info>
    <name>Tech Corporation</name>
    <founded>2010</founded>
    <headquarters>
      <address>
        <street>456 Innovation Drive</street>
        <city>San Francisco</city>
        <state>CA</state>
        <country>USA</country>
      </address>
    </headquarters>
  </info>
  <departments>
    <department id="eng">
      <name>Engineering</name>
      <employees count="75">
        <employee id="emp-001">
          <name>Alice Johnson</name>
          <role>Senior Developer</role>
          <skills>
            <skill level="expert">JavaScript</skill>
            <skill level="advanced">Python</skill>
            <skill level="intermediate">Go</skill>
          </skills>
        </employee>
      </employees>
    </department>
    <department id="sales">
      <name>Sales</name>
      <employees count="40"/>
    </department>
  </departments>
</company>`,
      namespaces: `<?xml version="1.0"?>
<catalog xmlns:book="http://example.com/book" 
         xmlns:author="http://example.com/author">
  <book:item book:id="123">
    <book:title>XML Processing</book:title>
    <author:info author:id="456">
      <author:name>John Developer</author:name>
      <author:email>john@example.com</author:email>
    </author:info>
    <book:price currency="USD">29.99</book:price>
  </book:item>
</catalog>`,
      comments: `<?xml version="1.0" encoding="UTF-8"?>
<!-- Configuration file for application -->
<config>
  <!-- Database settings -->
  <database>
    <host>localhost</host>
    <port>5432</port>
    <!-- Credentials are encrypted -->
    <username>admin</username>
  </database>
  
  <!-- Cache configuration -->
  <cache enabled="true">
    <ttl>3600</ttl> <!-- 1 hour -->
    <size>1000</size>
  </cache>
  
  <?php echo "This is a processing instruction"; ?>
</config>`
    };
    
    setInput(examples[type]);
  };

  const handleClearData = () => {
    setInput('');
    setOutput('');
  };

  // Build conditional options
  const allOptions = [
    ...STRUCTURE_OPTIONS.filter(opt => 
      opt.key !== 'namespaceSeparator' || config.namespacesEnabled
    ),
    ...PARSING_OPTIONS.filter(opt => 
      opt.key !== 'preserveWhitespace' || !config.trimTextValues
    ),
    ...ADVANCED_OPTIONS,
  ];

  const getComplexityColor = (elements: number) => {
    if (elements > 50) return 'text-red-800 bg-red-100';
    if (elements > 20) return 'text-yellow-800 bg-yellow-100';
    return 'text-green-800 bg-green-100';
  };

  const getDepthColor = (depth: number) => {
    if (depth > 8) return 'text-red-800 bg-red-100';
    if (depth > 4) return 'text-yellow-800 bg-yellow-100';
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
              <div className={`p-3 rounded border-2 ${getComplexityColor(conversion.conversionStats.totalElements)}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">📊</div>
                  <div>
                    <div className="font-medium text-sm">
                      {conversion.conversionStats.totalElements} Elements
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
              📄 Simple Elements
            </button>
            <button
              onClick={() => handleQuickExample('attributes')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              🏷️ XML Attributes
            </button>
            <button
              onClick={() => handleQuickExample('arrays')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              📋 Repeated Elements
            </button>
            <button
              onClick={() => handleQuickExample('mixed')}
              className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors text-left"
            >
              🎯 Mixed Content
            </button>
            <button
              onClick={() => handleQuickExample('complex')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              🏗️ Complex Structure
            </button>
            <button
              onClick={() => handleQuickExample('namespaces')}
              className="px-3 py-2 text-xs bg-cyan-100 text-cyan-800 rounded hover:bg-cyan-200 transition-colors text-left"
            >
              🌐 XML Namespaces
            </button>
            <button
              onClick={() => handleQuickExample('comments')}
              className="px-3 py-2 text-xs bg-pink-100 text-pink-800 rounded hover:bg-pink-200 transition-colors text-left"
            >
              💬 Comments & Instructions
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
                <div className={`p-2 rounded ${conversion.structureInfo.hasNamespaces ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <span>{conversion.structureInfo.hasNamespaces ? '✅' : '❌'}</span>
                    <span>Namespaces</span>
                  </div>
                </div>
                <div className={`p-2 rounded ${conversion.structureInfo.hasMixedContent ? 'bg-yellow-50 text-yellow-800' : 'bg-gray-50 text-gray-600'}`}>
                  <div className="flex items-center gap-1">
                    <span>{conversion.structureInfo.hasMixedContent ? '⚠️' : '✅'}</span>
                    <span>Mixed</span>
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
                <span className="text-blue-600">Total Elements:</span>
                <span className="text-blue-800 font-medium">{conversion.conversionStats.totalElements}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-green-50 rounded">
                <span className="text-green-600">Attributes:</span>
                <span className="text-green-800 font-medium">{conversion.conversionStats.attributes}</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-purple-50 rounded">
                <span className="text-purple-600">Text Nodes:</span>
                <span className="text-purple-800 font-medium">{conversion.conversionStats.textNodes}</span>
              </div>
              {conversion.conversionStats.comments > 0 && (
                <div className="flex justify-between text-xs p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-600">Comments:</span>
                  <span className="text-yellow-800 font-medium">{conversion.conversionStats.comments}</span>
                </div>
              )}
              {conversion.conversionStats.namespaces > 0 && (
                <div className="flex justify-between text-xs p-2 bg-indigo-50 rounded">
                  <span className="text-indigo-600">Namespaces:</span>
                  <span className="text-indigo-800 font-medium">{conversion.conversionStats.namespaces}</span>
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

        {/* XML/JSON Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Conversion Info</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="text-blue-800">
              <div className="font-medium mb-1">🔃 XML to JSON Mapping</div>
              <div className="space-y-1">
                <div>• XML elements → JSON objects</div>
                <div>• XML attributes → @property</div>
                <div>• Element text → #text property</div>
                <div>• Repeated elements → JSON arrays</div>
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
          title="XML Input"
          value={input}
          onChange={setInput}
          placeholder="Enter XML data to convert to JSON..."
          language="xml"
        />

        <OutputPanel
          title="JSON Output"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="json"
          placeholder="Converted JSON will appear here..."
          processingMessage="Converting XML to JSON..."
          customActions={
            output && conversion ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const jsonString = JSON.stringify(conversion.jsonData, null, 2);
                    navigator.clipboard?.writeText(jsonString);
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy JSON
                </button>
                <button
                  onClick={() => {
                    const jsonString = JSON.stringify(conversion.jsonData, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `converted-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download JSON
                </button>
                <button
                  onClick={() => {
                    const compactJson = JSON.stringify(conversion.jsonData);
                    navigator.clipboard?.writeText(compactJson);
                  }}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  📦 Copy Compact
                </button>
                <button
                  onClick={() => {
                    const report = `XML to JSON Conversion Report\nGenerated: ${new Date().toISOString()}\n\nConversion Summary:\n- Total Elements: ${conversion.conversionStats.totalElements}\n- Attributes: ${conversion.conversionStats.attributes}\n- Text Nodes: ${conversion.conversionStats.textNodes}\n- Comments: ${conversion.conversionStats.comments}\n- Processing Instructions: ${conversion.conversionStats.processingInstructions}\n- Namespaces: ${conversion.conversionStats.namespaces}\n- Processing Time: ${conversion.conversionStats.conversionTime}ms\n- Output Size: ${conversion.conversionStats.outputSize} characters\n\nStructure Information:\n- Root Element: ${conversion.structureInfo.rootElement}\n- Max Depth: ${conversion.structureInfo.maxDepth}\n- Has Attributes: ${conversion.structureInfo.hasAttributes}\n- Has Text Content: ${conversion.structureInfo.hasTextContent}\n- Has Namespaces: ${conversion.structureInfo.hasNamespaces}\n- Mixed Content: ${conversion.structureInfo.hasMixedContent}\n\n${warnings.length > 0 ? `Warnings:\n${warnings.map(w => `- ${w}`).join('\n')}\n\n` : ''}JSON Output:\n${JSON.stringify(conversion.jsonData, null, 2)}`;
                    
                    navigator.clipboard?.writeText(report);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  📊 Copy Report
                </button>
                <div className={`px-3 py-1 text-xs font-medium rounded ${getComplexityColor(conversion.conversionStats.totalElements)}`}>
                  {conversion.conversionStats.totalElements} Elements
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