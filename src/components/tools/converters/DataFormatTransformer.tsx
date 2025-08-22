import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processDataFormatTransformer, type DataFormatTransformerConfig } from '../../../tools/converters/data-format-transformer';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface DataFormatTransformerProps {
  className?: string;
}

const DEFAULT_CONFIG: DataFormatTransformerConfig = {
  sourceFormat: 'json',
  targetFormat: 'yaml',
  preserveComments: false,
  prettyPrint: true,
  indentSize: 2,
  csvDelimiter: ',',
  csvHasHeaders: true,
  csvQuoteChar: '"',
  csvEscapeChar: '\\',
  xmlRootElement: 'root',
  xmlIndentation: true,
  arrayHandling: 'preserve',
  nullHandling: 'preserve',
  dateFormat: 'iso',
  customDateFormat: '',
  validateInput: true,
  strictMode: false,
};

const FORMAT_OPTIONS = [
  {
    key: 'sourceFormat',
    label: 'Source Format',
    type: 'select' as const,
    default: 'json',
    options: [
      { value: 'json', label: '📄 JSON - JavaScript Object Notation' },
      { value: 'yaml', label: '📝 YAML - Yet Another Markup Language' },
      { value: 'csv', label: '📊 CSV - Comma Separated Values' },
      { value: 'xml', label: '🔖 XML - eXtensible Markup Language' },
      { value: 'toml', label: '⚙️ TOML - Tom\'s Obvious Minimal Language' },
      { value: 'ini', label: '🔧 INI - Initialization File' },
      { value: 'properties', label: '🔑 Properties - Java Properties' },
    ],
    description: 'Format of the input data',
  },
  {
    key: 'targetFormat',
    label: 'Target Format',
    type: 'select' as const,
    default: 'yaml',
    options: [
      { value: 'json', label: '📄 JSON - JavaScript Object Notation' },
      { value: 'yaml', label: '📝 YAML - Yet Another Markup Language' },
      { value: 'csv', label: '📊 CSV - Comma Separated Values' },
      { value: 'xml', label: '🔖 XML - eXtensible Markup Language' },
      { value: 'toml', label: '⚙️ TOML - Tom\'s Obvious Minimal Language' },
      { value: 'ini', label: '🔧 INI - Initialization File' },
      { value: 'properties', label: '🔑 Properties - Java Properties' },
    ],
    description: 'Desired output format',
  },
] as const;

const GENERAL_OPTIONS = [
  {
    key: 'prettyPrint',
    label: 'Pretty Print',
    type: 'checkbox' as const,
    default: true,
    description: 'Format output with proper indentation and spacing',
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
    key: 'preserveComments',
    label: 'Preserve Comments',
    type: 'checkbox' as const,
    default: false,
    description: 'Keep comments when supported by both formats',
  },
  {
    key: 'validateInput',
    label: 'Validate Input',
    type: 'checkbox' as const,
    default: true,
    description: 'Validate input format before conversion',
  },
] as const;

const CSV_OPTIONS = [
  {
    key: 'csvDelimiter',
    label: 'CSV Delimiter',
    type: 'text' as const,
    default: ',',
    description: 'Character used to separate CSV fields',
  },
  {
    key: 'csvHasHeaders',
    label: 'CSV Has Headers',
    type: 'checkbox' as const,
    default: true,
    description: 'First row contains column headers',
  },
  {
    key: 'csvQuoteChar',
    label: 'Quote Character',
    type: 'text' as const,
    default: '"',
    description: 'Character used to quote CSV fields',
  },
  {
    key: 'csvEscapeChar',
    label: 'Escape Character',
    type: 'text' as const,
    default: '\\',
    description: 'Character used to escape special characters',
  },
] as const;

const XML_OPTIONS = [
  {
    key: 'xmlRootElement',
    label: 'XML Root Element',
    type: 'text' as const,
    default: 'root',
    description: 'Name of the root XML element',
  },
  {
    key: 'xmlIndentation',
    label: 'XML Indentation',
    type: 'checkbox' as const,
    default: true,
    description: 'Format XML with proper indentation',
  },
] as const;

const DATA_HANDLING_OPTIONS = [
  {
    key: 'arrayHandling',
    label: 'Array Handling',
    type: 'select' as const,
    default: 'preserve',
    options: [
      { value: 'preserve', label: 'Preserve - Keep arrays as-is' },
      { value: 'flatten', label: 'Flatten - Convert to flat structure' },
      { value: 'convert', label: 'Convert - Adapt to target format' },
    ],
    description: 'How to handle array structures',
  },
  {
    key: 'nullHandling',
    label: 'Null Handling',
    type: 'select' as const,
    default: 'preserve',
    options: [
      { value: 'preserve', label: 'Preserve - Keep null values' },
      { value: 'empty', label: 'Empty - Convert to empty strings' },
      { value: 'omit', label: 'Omit - Remove null values' },
    ],
    description: 'How to handle null/undefined values',
  },
  {
    key: 'dateFormat',
    label: 'Date Format',
    type: 'select' as const,
    default: 'iso',
    options: [
      { value: 'iso', label: 'ISO 8601 - 2023-12-25T10:30:00Z' },
      { value: 'timestamp', label: 'Unix Timestamp - 1703505000' },
      { value: 'locale', label: 'Locale String - 12/25/2023' },
      { value: 'custom', label: 'Custom Format - Define your own' },
    ],
    description: 'Format for date/time values',
  },
] as const;

export function DataFormatTransformer({ className = '' }: DataFormatTransformerProps) {
  const [input, setInput] = useState(`{
  "name": "John Doe",
  "age": 30,
  "skills": ["JavaScript", "Python", "Go"],
  "address": {
    "city": "New York",
    "country": "USA"
  }
}`);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<DataFormatTransformerConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: DataFormatTransformerConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processDataFormatTransformer(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setMetadata(result.metadata);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'data-format-transformer',
            input: `${currentConfig.sourceFormat} → ${currentConfig.targetFormat}`,
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to transform data format');
          setOutput('');
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during transformation');
        setOutput('');
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('data-format-transformer');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'json-yaml' | 'csv-json' | 'xml-json' | 'yaml-csv' | 'complex') => {
    const examples = {
      'json-yaml': {
        input: `{
  "users": [
    {"name": "Alice", "role": "admin"},
    {"name": "Bob", "role": "user"}
  ],
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}`,
        config: { sourceFormat: 'json' as const, targetFormat: 'yaml' as const }
      },
      'csv-json': {
        input: `name,age,city,active
Alice,28,New York,true
Bob,32,London,false
Carol,25,Tokyo,true`,
        config: { sourceFormat: 'csv' as const, targetFormat: 'json' as const, csvHasHeaders: true }
      },
      'xml-json': {
        input: `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="1">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
  </book>
  <book id="2">
    <title>To Kill a Mockingbird</title>
    <author>Harper Lee</author>
    <year>1960</year>
  </book>
</catalog>`,
        config: { sourceFormat: 'xml' as const, targetFormat: 'json' as const }
      },
      'yaml-csv': {
        input: `employees:
  - name: David
    department: Engineering
    salary: 75000
  - name: Emma
    department: Marketing
    salary: 65000
  - name: Frank
    department: Sales
    salary: 70000`,
        config: { sourceFormat: 'yaml' as const, targetFormat: 'csv' as const }
      },
      'complex': {
        input: `{
  "api": {
    "version": "2.0",
    "endpoints": [
      {
        "path": "/users",
        "methods": ["GET", "POST"],
        "auth": true
      },
      {
        "path": "/posts",
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "auth": false
      }
    ]
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "ssl": true
  }
}`,
        config: { sourceFormat: 'json' as const, targetFormat: 'yaml' as const, prettyPrint: true }
      }
    };
    
    const example = examples[type];
    setInput(example.input);
    setConfig(prev => ({ ...prev, ...example.config }));
  };

  const swapFormats = () => {
    const newConfig = {
      ...config,
      sourceFormat: config.targetFormat,
      targetFormat: config.sourceFormat,
    };
    setConfig(newConfig);
    if (output && !error) {
      setInput(output);
    }
  };

  // Build conditional options
  const allOptions = [
    ...FORMAT_OPTIONS,
    ...GENERAL_OPTIONS,
    ...(config.sourceFormat === 'csv' || config.targetFormat === 'csv' ? CSV_OPTIONS : []),
    ...(config.sourceFormat === 'xml' || config.targetFormat === 'xml' ? XML_OPTIONS : []),
    ...DATA_HANDLING_OPTIONS,
  ];

  const showCSVOptions = config.sourceFormat === 'csv' || config.targetFormat === 'csv';
  const showXMLOptions = config.sourceFormat === 'xml' || config.targetFormat === 'xml';

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Format Conversion</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-600 mb-1">From</div>
              <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm font-medium uppercase">
                {config.sourceFormat}
              </div>
            </div>
            <button
              onClick={swapFormats}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Swap formats"
            >
              ⇄
            </button>
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-600 mb-1">To</div>
              <div className="px-3 py-2 bg-green-100 text-green-800 rounded text-sm font-medium uppercase">
                {config.targetFormat}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('json-yaml')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              📄→📝 JSON to YAML
            </button>
            <button
              onClick={() => handleQuickExample('csv-json')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📊→📄 CSV to JSON
            </button>
            <button
              onClick={() => handleQuickExample('xml-json')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              🔖→📄 XML to JSON
            </button>
            <button
              onClick={() => handleQuickExample('yaml-csv')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              📝→📊 YAML to CSV
            </button>
            <button
              onClick={() => handleQuickExample('complex')}
              className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-left"
            >
              🔄 Complex Structure
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Transformation Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Transformation Metadata */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Transformation Info</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="grid gap-1">
                <div>
                  <span className="text-blue-600">Source:</span>
                  <span className="ml-1 font-medium text-blue-800 uppercase">{metadata.sourceFormat}</span>
                </div>
                <div>
                  <span className="text-blue-600">Target:</span>
                  <span className="ml-1 font-medium text-blue-800 uppercase">{metadata.targetFormat}</span>
                </div>
                <div>
                  <span className="text-blue-600">Size:</span>
                  <span className="ml-1 font-medium text-blue-800">
                    {metadata.sourceSize} → {metadata.targetSize} bytes
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Records:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.recordCount}</span>
                </div>
                <div>
                  <span className="text-blue-600">Fields:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.fieldCount}</span>
                </div>
                <div>
                  <span className="text-blue-600">Time:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.transformationTime}ms</span>
                </div>
                <div>
                  <span className="text-blue-600">Depth:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.structure.depth}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Structure Analysis */}
        {metadata && metadata.structure && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Structure Analysis</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Arrays:</span>
                  <span className={metadata.structure.hasArrays ? 'text-green-600' : 'text-gray-400'}>
                    {metadata.structure.hasArrays ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Objects:</span>
                  <span className={metadata.structure.hasObjects ? 'text-green-600' : 'text-gray-400'}>
                    {metadata.structure.hasObjects ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nulls:</span>
                  <span className={metadata.structure.hasNulls ? 'text-yellow-600' : 'text-gray-400'}>
                    {metadata.structure.hasNulls ? '⚠' : '✗'}
                  </span>
                </div>
                {metadata.structure.fieldNames.length > 0 && (
                  <div>
                    <div className="text-gray-600 mb-1">Fields:</div>
                    <div className="text-gray-800 text-xs">
                      {metadata.structure.fieldNames.slice(0, 5).join(', ')}
                      {metadata.structure.fieldNames.length > 5 && 
                        ` (+${metadata.structure.fieldNames.length - 5} more)`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Types */}
        {metadata && metadata.dataTypes && Object.keys(metadata.dataTypes).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Data Types</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(metadata.dataTypes).map(([field, type]) => (
                <div key={field} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="text-gray-600 font-mono">{field}</span>
                  <span className="text-gray-800 font-medium capitalize">{type as string}</span>
                </div>
              ))}
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

        {/* Format Support Matrix */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Format Support</h3>
          <div className="text-xs space-y-1">
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800 mb-1">Best Supported</div>
              <div className="text-gray-600">JSON ↔ YAML ↔ CSV</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800 mb-1">Basic Support</div>
              <div className="text-gray-600">XML, TOML, INI, Properties</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title={`Source Data (${config.sourceFormat.toUpperCase()})`}
          value={input}
          onChange={setInput}
          placeholder={`Enter ${config.sourceFormat.toUpperCase()} data to transform...`}
          language={config.sourceFormat === 'json' ? 'json' : config.sourceFormat === 'xml' ? 'xml' : 'text'}
        />

        <OutputPanel
          title={`Transformed Data (${config.targetFormat.toUpperCase()})`}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.targetFormat === 'json' ? 'json' : config.targetFormat === 'xml' ? 'xml' : 'text'}
          placeholder={`Transformed ${config.targetFormat.toUpperCase()} data will appear here...`}
          processingMessage="Transforming data format..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Output
                </button>
                <button
                  onClick={() => {
                    const extension = config.targetFormat === 'json' ? 'json' :
                                     config.targetFormat === 'yaml' ? 'yaml' :
                                     config.targetFormat === 'csv' ? 'csv' :
                                     config.targetFormat === 'xml' ? 'xml' : 'txt';
                    const mimeType = config.targetFormat === 'json' ? 'application/json' :
                                    config.targetFormat === 'csv' ? 'text/csv' :
                                    config.targetFormat === 'xml' ? 'text/xml' : 'text/plain';
                    const blob = new Blob([output], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `transformed-data.${extension}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download
                </button>
                {metadata && (
                  <button
                    onClick={() => {
                      const report = `Data Transformation Report
Generated: ${new Date().toISOString()}

Source Format: ${metadata.sourceFormat}
Target Format: ${metadata.targetFormat}
Source Size: ${metadata.sourceSize} bytes
Target Size: ${metadata.targetSize} bytes
Records: ${metadata.recordCount}
Fields: ${metadata.fieldCount}
Processing Time: ${metadata.transformationTime}ms

Structure:
- Depth: ${metadata.structure.depth}
- Has Arrays: ${metadata.structure.hasArrays}
- Has Objects: ${metadata.structure.hasObjects}
- Has Nulls: ${metadata.structure.hasNulls}

Field Names: ${metadata.structure.fieldNames.join(', ')}

${warnings.length > 0 ? `\nWarnings:\n${warnings.map(w => `- ${w}`).join('\n')}` : ''}`;
                      
                      navigator.clipboard?.writeText(report);
                    }}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    📊 Copy Report
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}