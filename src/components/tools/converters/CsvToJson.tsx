import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processCsvToJson, type CsvToJsonConfig } from '../../../tools/converters/csv-to-json';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CsvToJsonProps {
  className?: string;
}

const DEFAULT_CONFIG: CsvToJsonConfig = {
  delimiter: 'comma',
  customDelimiter: '',
  hasHeaders: true,
  skipEmptyLines: true,
  trimWhitespace: true,
  quoteChar: '"',
  escapeChar: '\\',
  outputFormat: 'records',
  parseNumbers: true,
  parseBooleans: true,
  parseDates: false,
  nullValues: ['', 'null', 'NULL', 'N/A'],
  customHeaders: '',
  encoding: 'utf-8',
  strictMode: false,
  includeLineNumbers: false,
  flattenArrays: false,
  maxRows: 0,
};

const PARSING_OPTIONS = [
  {
    key: 'delimiter',
    label: 'Delimiter',
    type: 'select' as const,
    default: 'comma',
    options: [
      { value: 'comma', label: 'Comma (,)' },
      { value: 'semicolon', label: 'Semicolon (;)' },
      { value: 'tab', label: 'Tab (\\t)' },
      { value: 'pipe', label: 'Pipe (|)' },
      { value: 'space', label: 'Space ( )' },
      { value: 'custom', label: 'Custom' },
    ],
    description: 'Character used to separate CSV fields',
  },
  {
    key: 'hasHeaders',
    label: 'Has Headers',
    type: 'checkbox' as const,
    default: true,
    description: 'First row contains column headers',
  },
  {
    key: 'quoteChar',
    label: 'Quote Character',
    type: 'text' as const,
    default: '"',
    description: 'Character used to quote CSV fields',
  },
  {
    key: 'escapeChar',
    label: 'Escape Character',
    type: 'text' as const,
    default: '\\',
    description: 'Character used to escape special characters',
  },
] as const;

const DATA_PROCESSING_OPTIONS = [
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
    description: 'Convert boolean strings (true/false, yes/no) to boolean values',
  },
  {
    key: 'parseDates',
    label: 'Parse Dates',
    type: 'checkbox' as const,
    default: false,
    description: 'Convert date strings to ISO format',
  },
  {
    key: 'trimWhitespace',
    label: 'Trim Whitespace',
    type: 'checkbox' as const,
    default: true,
    description: 'Remove leading and trailing whitespace from values',
  },
  {
    key: 'skipEmptyLines',
    label: 'Skip Empty Lines',
    type: 'checkbox' as const,
    default: true,
    description: 'Ignore completely empty rows',
  },
] as const;

const OUTPUT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'records',
    options: [
      { value: 'records', label: '📋 Records - Array of objects [{}, {}]' },
      { value: 'array', label: '📊 Array - 2D array [[],[]]' },
      { value: 'object', label: '🗂️ Object - Columns as arrays {col: []}' },
    ],
    description: 'Structure of the JSON output',
  },
  {
    key: 'includeLineNumbers',
    label: 'Include Line Numbers',
    type: 'checkbox' as const,
    default: false,
    description: 'Add __line property to each record',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'strictMode',
    label: 'Strict Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Reject rows with parsing errors instead of attempting to fix them',
  },
  {
    key: 'maxRows',
    label: 'Max Rows (0 = unlimited)',
    type: 'number' as const,
    default: 0,
    min: 0,
    max: 100000,
    description: 'Limit the number of rows to process',
  },
] as const;

export function CsvToJson({ className = '' }: CsvToJsonProps) {
  const [input, setInput] = useState(`name,age,city,active,salary
John Doe,30,New York,true,75000
Jane Smith,25,Los Angeles,false,65000
Bob Johnson,35,Chicago,true,80000
Alice Brown,28,Houston,true,70000
Charlie Davis,32,Phoenix,false,72000`);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<CsvToJsonConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: CsvToJsonConfig) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      try {
        const result = processCsvToJson(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setMetadata(result.metadata);
          setWarnings(result.warnings || []);
          
          // Add to history
          addToHistory({
            toolId: 'csv-to-json',
            input: `${result.metadata?.rowCount || 0} rows → ${currentConfig.outputFormat}`,
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to convert CSV to JSON');
          setOutput('');
          setMetadata(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during CSV to JSON conversion');
        setOutput('');
        setMetadata(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('csv-to-json');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'simple' | 'semicolon' | 'noheaders' | 'quotes' | 'complex' | 'numbers') => {
    const examples = {
      simple: `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`,
      
      semicolon: `Product;Price;Stock;Available
Laptop;999.99;15;yes
Mouse;29.99;50;yes
Keyboard;79.99;0;no`,
      
      noheaders: `John,30,New York,true
Jane,25,Los Angeles,false
Bob,35,Chicago,true`,
      
      quotes: `"Name","Description","Price"
"John's Laptop","High-end gaming laptop with ""NVIDIA"" graphics",1299.99
"Jane's Mouse","Wireless optical mouse, ""ergonomic"" design",39.99
"Bob's Keyboard","Mechanical keyboard with RGB lighting",129.99`,
      
      complex: `date,product,quantity,price,discount,tax_rate,notes
2023-12-01,"MacBook Pro",2,2499.00,0.10,0.08,"Bulk order, priority shipping"
2023-12-02,"iPhone 15",5,999.99,0.05,0.08,"Standard delivery"
2023-12-03,"AirPods Pro",10,249.00,0.15,0.08,"Holiday promotion"`,
      
      numbers: `ID,Value,Scientific,Percentage,Currency
1,42,1.23e10,85.5%,$1,234.56
2,-17,6.02e23,0.01%,€567.89
3,0,3.14e-5,100%,¥987.12`
    };
    
    setInput(examples[type]);
    
    // Adjust config for different examples
    if (type === 'semicolon') {
      setConfig(prev => ({ ...prev, delimiter: 'semicolon' }));
    } else if (type === 'noheaders') {
      setConfig(prev => ({ ...prev, hasHeaders: false, customHeaders: 'name,age,city,active' }));
    } else {
      setConfig(prev => ({ ...prev, delimiter: 'comma', hasHeaders: true }));
    }
  };

  const handleFormatPreset = (format: 'records' | 'array' | 'object') => {
    setConfig(prev => ({ ...prev, outputFormat: format }));
  };

  // Build conditional options
  const allOptions = [
    ...PARSING_OPTIONS,
    ...(config.delimiter === 'custom' ? [{
      key: 'customDelimiter',
      label: 'Custom Delimiter',
      type: 'text' as const,
      default: '',
      description: 'Enter custom delimiter character(s)',
    }] : []),
    ...((!config.hasHeaders || config.hasHeaders === false) ? [{
      key: 'customHeaders',
      label: 'Custom Headers',
      type: 'text' as const,
      default: '',
      description: 'Comma-separated header names (optional)',
    }] : []),
    ...DATA_PROCESSING_OPTIONS,
    ...OUTPUT_OPTIONS,
    ...ADVANCED_OPTIONS,
  ];

  const showCustomDelimiter = config.delimiter === 'custom';
  const showCustomHeaders = !config.hasHeaders;

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Output Format</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleFormatPreset('records')}
              className={`px-2 py-2 text-xs rounded transition-colors ${
                config.outputFormat === 'records'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              📋 Objects
            </button>
            <button
              onClick={() => handleFormatPreset('array')}
              className={`px-2 py-2 text-xs rounded transition-colors ${
                config.outputFormat === 'array'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              📊 Array
            </button>
            <button
              onClick={() => handleFormatPreset('object')}
              className={`px-2 py-2 text-xs rounded transition-colors ${
                config.outputFormat === 'object'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              }`}
            >
              🗂️ Columns
            </button>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickExample('simple')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-left"
            >
              📄 Simple CSV
            </button>
            <button
              onClick={() => handleQuickExample('semicolon')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-left"
            >
              📊 Semicolon Delimiter
            </button>
            <button
              onClick={() => handleQuickExample('noheaders')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors text-left"
            >
              📝 No Headers
            </button>
            <button
              onClick={() => handleQuickExample('quotes')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-left"
            >
              💬 Quoted Fields
            </button>
            <button
              onClick={() => handleQuickExample('complex')}
              className="px-3 py-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-left"
            >
              🔧 Complex Data
            </button>
            <button
              onClick={() => handleQuickExample('numbers')}
              className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-left"
            >
              🔢 Numbers & Scientific
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Conversion Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Conversion Statistics */}
        {metadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Conversion Stats</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="grid gap-1">
                <div>
                  <span className="text-blue-600">Rows:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.rowCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-600">Columns:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.columnCount}</span>
                </div>
                <div>
                  <span className="text-blue-600">Null Values:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.nullCount}</span>
                </div>
                <div>
                  <span className="text-blue-600">Output Size:</span>
                  <span className="ml-1 font-medium text-blue-800">
                    {(metadata.outputSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Processing:</span>
                  <span className="ml-1 font-medium text-blue-800">{metadata.processingTime}ms</span>
                </div>
                {metadata.emptyRowsSkipped > 0 && (
                  <div>
                    <span className="text-blue-600">Empty Rows Skipped:</span>
                    <span className="ml-1 font-medium text-blue-800">{metadata.emptyRowsSkipped}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Column Information */}
        {metadata && metadata.detectedColumns && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Column Details</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {metadata.detectedColumns.slice(0, 10).map((column: string, index: number) => (
                <div key={index} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="text-gray-600 font-mono truncate mr-2">{column}</span>
                  <span className="text-gray-800 text-xs">
                    {metadata.dataTypes[column] || 'string'}
                  </span>
                </div>
              ))}
              {metadata.detectedColumns.length > 10 && (
                <div className="text-xs text-center text-gray-500 p-1">
                  +{metadata.detectedColumns.length - 10} more columns
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Types Legend */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Data Type Detection</h3>
          <div className="text-xs space-y-1">
            <div className="p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-800 mb-1">Auto-Detection</div>
              <div className="text-gray-600 space-y-1">
                <div>• Numbers: 123, -45.67, 1.23e10</div>
                <div>• Booleans: true/false, yes/no, 1/0</div>
                <div>• Dates: YYYY-MM-DD, MM/DD/YYYY</div>
                <div>• Nulls: empty, null, N/A</div>
              </div>
            </div>
          </div>
        </div>

        {/* Parse Errors */}
        {metadata && metadata.errors && metadata.errors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Parse Errors</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {metadata.errors.map((error: any, index: number) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <div className="text-red-800">
                    <div className="font-medium">Line {error.line}: {error.error}</div>
                    {error.value && (
                      <div className="text-red-600 mt-1 font-mono truncate">
                        "{error.value}"
                      </div>
                    )}
                  </div>
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
      </div>

      <div className="lg:col-span-8 space-y-6">
        <InputPanel
          title="CSV Data"
          value={input}
          onChange={setInput}
          placeholder="Enter CSV data to convert to JSON..."
          language="text"
        />

        <OutputPanel
          title={`JSON Output (${config.outputFormat} format)`}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="json"
          placeholder="Converted JSON data will appear here..."
          processingMessage="Converting CSV to JSON..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy JSON
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([output], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'converted-data.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download JSON
                </button>
                {metadata && (
                  <button
                    onClick={() => {
                      const report = `CSV to JSON Conversion Report
Generated: ${new Date().toISOString()}

Source Data:
- Rows: ${metadata.rowCount.toLocaleString()}
- Columns: ${metadata.columnCount}
- Format: ${config.outputFormat}
- Delimiter: ${config.delimiter}

Processing:
- Empty Rows Skipped: ${metadata.emptyRowsSkipped}
- Null Values: ${metadata.nullCount}
- Parse Errors: ${metadata.errors?.length || 0}
- Processing Time: ${metadata.processingTime}ms

Output:
- Size: ${(metadata.outputSize / 1024).toFixed(1)} KB
- Structure: ${config.outputFormat}

Columns:
${metadata.detectedColumns.map((col: string) => 
  `- ${col}: ${metadata.dataTypes[col] || 'string'}`
).join('\n')}

${metadata.errors && metadata.errors.length > 0 ? `\nParse Errors:\n${metadata.errors.map((e: any) => 
  `- Line ${e.line}: ${e.error}`
).join('\n')}` : ''}

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