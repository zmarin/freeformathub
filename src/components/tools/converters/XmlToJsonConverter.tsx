import { useState, useEffect, useMemo, useCallback } from 'react';
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
    if (elements > 50) return 'text-danger bg-danger-subtle';
    if (elements > 20) return 'text-warning bg-warning-subtle';
    return 'text-success bg-success-subtle';
  };

  const getDepthColor = (depth: number) => {
    if (depth > 8) return 'text-danger bg-danger-subtle';
    if (depth > 4) return 'text-warning bg-warning-subtle';
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
      <div className="sticky top-0 z-10" style={{
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
            🔄 {isProcessing ? 'Converting...' : 'Convert XML'}
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
                <span className="font-medium">{conversion.conversionStats.totalElements}</span> elements
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-xl)',
        minHeight: '500px'
      }} className="md:grid-cols-1">
        <div className="space-y-6">
          <InputPanel
            title="XML Input"
            value={input}
            onChange={setInput}
            placeholder="Enter XML data to convert to JSON..."
            language="xml"
            supportsDragDrop
            onFileContent={(content) => setInput(content)}
            acceptedFileTypes=".xml,.txt"
          />

          {/* Conversion Statistics */}
          {conversion && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Conversion Statistics</h3>
              <div className="space-y-3">
                <div className={`p-3 rounded border-2 ${getComplexityColor(conversion.conversionStats.totalElements)}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-xl">📊</div>
                    <div>
                      <div className="font-medium text-sm">
                        {conversion.conversionStats.totalElements} Elements
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
                  📄 Simple Elements
                </button>
                <button
                  onClick={() => handleQuickExample('attributes')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  🏷️ XML Attributes
                </button>
                <button
                  onClick={() => handleQuickExample('arrays')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  📋 Repeated Elements
                </button>
                <button
                  onClick={() => handleQuickExample('mixed')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  🎯 Mixed Content
                </button>
                <button
                  onClick={() => handleQuickExample('complex')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  🏗️ Complex Structure
                </button>
                <button
                  onClick={() => handleQuickExample('namespaces')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  🌐 XML Namespaces
                </button>
                <button
                  onClick={() => handleQuickExample('comments')}
                  className="btn btn-outline text-left"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  💬 Comments & Instructions
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
                  <div className={`p-2 rounded ${conversion.structureInfo.hasNamespaces ? 'bg-success-subtle text-success' : 'text-muted'}`} style={{ backgroundColor: conversion.structureInfo.hasNamespaces ? 'var(--color-success-subtle)' : 'var(--color-surface-secondary)' }}>
                    <div className="flex items-center gap-1">
                      <span>{conversion.structureInfo.hasNamespaces ? '✅' : '❌'}</span>
                      <span>Namespaces</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded ${conversion.structureInfo.hasMixedContent ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`} style={{ backgroundColor: conversion.structureInfo.hasMixedContent ? 'var(--color-warning-subtle)' : 'var(--color-success-subtle)' }}>
                    <div className="flex items-center gap-1">
                      <span>{conversion.structureInfo.hasMixedContent ? '⚠️' : '✅'}</span>
                      <span>Mixed</span>
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

          {/* XML/JSON Information */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>Conversion Info</h3>
            <div style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }} className="p-3 rounded-lg text-xs">
              <div className="font-medium mb-2">🔃 XML to JSON Mapping</div>
              <div className="space-y-1">
                <div>• XML elements → JSON objects</div>
                <div>• XML attributes → @property</div>
                <div>• Element text → #text property</div>
                <div>• Repeated elements → JSON arrays</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <OutputPanel
            title="JSON Output"
            value={output}
            error={error}
            isProcessing={isProcessing}
            language="json"
            placeholder="Converted JSON will appear here..."
            processingMessage="Converting XML to JSON..."
            supportsCopy
            supportsDownload
            downloadFileName="converted.json"
            customActions={
              output && conversion ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const jsonString = JSON.stringify(conversion.jsonData, null, 2);
                      navigator.clipboard?.writeText(jsonString);
                    }}
                    className="btn btn-sm btn-secondary"
                  >
                    📋 Copy JSON
                  </button>
                  <button
                    onClick={() => {
                      const compactJson = JSON.stringify(conversion.jsonData);
                      navigator.clipboard?.writeText(compactJson);
                    }}
                    className="btn btn-sm btn-outline"
                  >
                    📦 Copy Compact
                  </button>
                  <div className={`px-3 py-1 text-xs font-medium rounded ${getComplexityColor(conversion.conversionStats.totalElements)}`}>
                    {conversion.conversionStats.totalElements} Elements
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
                  <span>Total Elements:</span>
                  <span className="font-medium">{conversion.conversionStats.totalElements}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }} className="flex justify-between p-2 rounded">
                  <span>Attributes:</span>
                  <span className="font-medium">{conversion.conversionStats.attributes}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-secondary-subtle)', color: 'var(--color-secondary)' }} className="flex justify-between p-2 rounded">
                  <span>Text Nodes:</span>
                  <span className="font-medium">{conversion.conversionStats.textNodes}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }} className="flex justify-between p-2 rounded">
                  <span>Processing Time:</span>
                  <span className="font-medium">{conversion.conversionStats.conversionTime}ms</span>
                </div>
                {conversion.conversionStats.comments > 0 && (
                  <div style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }} className="flex justify-between p-2 rounded">
                    <span>Comments:</span>
                    <span className="font-medium">{conversion.conversionStats.comments}</span>
                  </div>
                )}
                {conversion.conversionStats.namespaces > 0 && (
                  <div style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }} className="flex justify-between p-2 rounded">
                    <span>Namespaces:</span>
                    <span className="font-medium">{conversion.conversionStats.namespaces}</span>
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