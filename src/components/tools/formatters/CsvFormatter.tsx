import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processCsvFormatter, type CsvFormatterConfig } from '../../../tools/formatters/csv-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CsvFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: CsvFormatterConfig = {
  mode: 'format',
  delimiter: ',',
  customDelimiter: '|',
  quoteChar: 'auto',
  escapeChar: 'auto',
  hasHeader: true,
  strictValidation: false,
  trimWhitespace: true,
  handleEmptyRows: 'remove',
  outputFormat: 'csv',
  sortBy: '',
  sortOrder: 'asc',
  filterColumn: '',
  filterValue: '',
  addRowNumbers: false,
  detectTypes: true,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'format',
    options: [
      { value: 'format', label: 'Format CSV' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'convert', label: 'Convert Format' },
    ],
    description: 'Processing mode: format, validate, or convert data',
  },
  {
    key: 'delimiter',
    label: 'Input Delimiter',
    type: 'select' as const,
    default: ',',
    options: [
      { value: ',', label: 'Comma (,)' },
      { value: ';', label: 'Semicolon (;)' },
      { value: '\t', label: 'Tab (\\t)' },
      { value: '|', label: 'Pipe (|)' },
      { value: 'custom', label: 'Custom' },
    ],
    description: 'Field delimiter used in input CSV',
  },
  {
    key: 'customDelimiter',
    label: 'Custom Delimiter',
    type: 'text' as const,
    default: '|',
    description: 'Custom delimiter character',
    showWhen: (config: CsvFormatterConfig) => config.delimiter === 'custom',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'csv',
    options: [
      { value: 'csv', label: 'CSV' },
      { value: 'tsv', label: 'TSV (Tab-separated)' },
      { value: 'json', label: 'JSON Array' },
      { value: 'table', label: 'ASCII Table' },
    ],
    description: 'Output format for processed data',
    showWhen: (config: CsvFormatterConfig) => config.mode !== 'validate',
  },
  {
    key: 'hasHeader',
    label: 'Has Header Row',
    type: 'boolean' as const,
    default: true,
    description: 'First row contains column headers',
  },
  {
    key: 'trimWhitespace',
    label: 'Trim Whitespace',
    type: 'boolean' as const,
    default: true,
    description: 'Remove leading and trailing whitespace from fields',
  },
  {
    key: 'handleEmptyRows',
    label: 'Empty Rows',
    type: 'select' as const,
    default: 'remove',
    options: [
      { value: 'keep', label: 'Keep' },
      { value: 'remove', label: 'Remove' },
      { value: 'error', label: 'Report as Error' },
    ],
    description: 'How to handle completely empty rows',
  },
  {
    key: 'strictValidation',
    label: 'Strict Validation',
    type: 'boolean' as const,
    default: false,
    description: 'Enable strict validation rules (column consistency, data types)',
  },
  {
    key: 'detectTypes',
    label: 'Detect Data Types',
    type: 'boolean' as const,
    default: true,
    description: 'Automatically detect column data types',
  },
  {
    key: 'addRowNumbers',
    label: 'Add Row Numbers',
    type: 'boolean' as const,
    default: false,
    description: 'Add row number column to output',
    showWhen: (config: CsvFormatterConfig) => config.mode !== 'validate',
  },
  {
    key: 'sortBy',
    label: 'Sort By Column',
    type: 'text' as const,
    default: '',
    description: 'Column name to sort by (leave empty for no sorting)',
    showWhen: (config: CsvFormatterConfig) => config.mode !== 'validate',
  },
  {
    key: 'sortOrder',
    label: 'Sort Order',
    type: 'select' as const,
    default: 'asc',
    options: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
    description: 'Sort order when sorting is enabled',
    showWhen: (config: CsvFormatterConfig) => config.sortBy.length > 0 && config.mode !== 'validate',
  },
  {
    key: 'filterColumn',
    label: 'Filter Column',
    type: 'text' as const,
    default: '',
    description: 'Column name to filter by (leave empty for no filtering)',
    showWhen: (config: CsvFormatterConfig) => config.mode !== 'validate',
  },
  {
    key: 'filterValue',
    label: 'Filter Value',
    type: 'text' as const,
    default: '',
    description: 'Value to filter by (substring match)',
    showWhen: (config: CsvFormatterConfig) => config.filterColumn.length > 0 && config.mode !== 'validate',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Basic CSV',
    input: `name,age,city,country
John Doe,25,New York,USA
Jane Smith,30,London,UK
Bob Johnson,35,Paris,France`,
    config: { ...DEFAULT_CONFIG, mode: 'format' as const, hasHeader: true }
  },
  {
    name: 'Semicolon Delimited',
    input: `product;price;category;stock
"Laptop, Gaming";999.99;Electronics;5
"Book, Programming";29.99;Education;12
"Phone, Mobile";699.99;Electronics;8`,
    config: { ...DEFAULT_CONFIG, delimiter: ';' as const, hasHeader: true }
  },
  {
    name: 'Convert to JSON',
    input: `id,name,email,active
1,John Doe,john@example.com,true
2,Jane Smith,jane@example.com,false
3,Bob Johnson,bob@example.com,true`,
    config: { ...DEFAULT_CONFIG, mode: 'convert' as const, outputFormat: 'json' as const, hasHeader: true }
  },
  {
    name: 'Tab Separated',
    input: `Name	Department	Salary	Years
John Smith	Engineering	75000	5
Jane Doe	Marketing	65000	3
Mike Wilson	Sales	58000	2`,
    config: { ...DEFAULT_CONFIG, delimiter: '\t' as const, outputFormat: 'table' as const, hasHeader: true }
  },
  {
    name: 'Validation Example',
    input: `email,age,phone,date
john@example.com,25,555-1234,2023-01-01
invalid-email,thirty,invalid-phone,not-a-date
jane@test.com,35,555-5678,2023-12-31`,
    config: { ...DEFAULT_CONFIG, mode: 'validate' as const, strictValidation: true, detectTypes: true }
  },
];

export function CsvFormatter({ className = '' }: CsvFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CsvFormatterConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    rowCount: number;
    columnCount: number;
    headerCount: number;
    emptyRows: number;
    totalCells: number;
    validCells: number;
    invalidCells: number;
    dataTypes: { [column: string]: string };
    duplicateRows: number;
    originalSize: number;
    processedSize: number;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: CsvFormatterConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processCsvFormatter(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'csv-formatter',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
            setStats(null);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to process CSV');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 300);
    }, 400),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: CsvFormatterConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig(example.config);
  };

  const generateSampleCsv = () => {
    const sampleData = `id,name,email,department,salary,hire_date,active
1,John Smith,john.smith@company.com,Engineering,75000,2022-01-15,true
2,Jane Doe,jane.doe@company.com,Marketing,65000,2021-03-20,true
3,Bob Johnson,bob.johnson@company.com,Sales,58000,2023-02-10,false
4,Alice Brown,alice.brown@company.com,HR,62000,2020-11-05,true
5,Charlie Wilson,charlie.wilson@company.com,Finance,68000,2022-07-18,true`;
    
    setInput(sampleData);
  };

  const detectDelimiterFromInput = () => {
    if (!input.trim()) return;
    
    const sample = input.split('\n').slice(0, 5).join('\n');
    const delimiters = [',', ';', '\t', '|'];
    const counts: { [key: string]: number } = {};
    
    for (const delimiter of delimiters) {
      const lines = sample.split('\n');
      let consistentCount = 0;
      let firstLineCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const count = lines[i].split(delimiter).length - 1;
        if (i === 0) {
          firstLineCount = count;
        } else if (count === firstLineCount && count > 0) {
          consistentCount++;
        }
      }
      
      counts[delimiter] = firstLineCount > 0 ? consistentCount : 0;
    }
    
    // Get delimiter with highest consistency score
    const bestDelimiter = Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
    
    if (bestDelimiter !== config.delimiter) {
      setConfig({ ...config, delimiter: bestDelimiter as any });
    }
  };

  const getDelimiterDisplay = (delimiter: string): string => {
    switch (delimiter) {
      case ',': return 'Comma (,)';
      case ';': return 'Semicolon (;)';
      case '\t': return 'Tab';
      case '|': return 'Pipe (|)';
      case 'custom': return `Custom (${config.customDelimiter})`;
      default: return delimiter;
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="CSV Input"
          placeholder={`Enter CSV data:

name,age,city,country
John Doe,25,New York,USA
Jane Smith,30,London,UK
Bob Johnson,35,Paris,France

Supports various delimiters:
- Comma separated values (CSV)
- Semicolon separated values
- Tab separated values (TSV)
- Custom delimiters

Features:
- Header row detection
- Data type validation
- Sorting and filtering
- Format conversion`}
          syntax="csv"
          examples={[
            {
              title: 'Basic CSV',
              value: 'name,age,city\nJohn,25,NYC\nJane,30,London',
            },
            {
              title: 'With Quotes',
              value: 'name,description,price\n"Product A","High quality, durable",99.99',
            },
            {
              title: 'Tab Separated',
              value: 'Name\tDept\tSalary\nJohn\tEng\t75000',
            },
          ]}
        />

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={generateSampleCsv}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Sample CSV
            </button>
            <button
              onClick={detectDelimiterFromInput}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Auto-Detect Delimiter
            </button>
            <button
              onClick={() => setConfig({ ...config, mode: config.mode === 'validate' ? 'format' : 'validate' })}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
            >
              {config.mode === 'validate' ? 'Switch to Format' : 'Validate'}
            </button>
          </div>

          {/* Processing Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Settings:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Mode: {config.mode.charAt(0).toUpperCase() + config.mode.slice(1)}</div>
              <div>Delimiter: {getDelimiterDisplay(config.delimiter)}</div>
              {config.mode !== 'validate' && (
                <div>Output: {config.outputFormat.toUpperCase()}</div>
              )}
              <div>
                Options: {[
                  config.hasHeader && 'Headers',
                  config.trimWhitespace && 'Trim',
                  config.strictValidation && 'Strict',
                  config.detectTypes && 'Type Detection'
                ].filter(Boolean).join(', ') || 'Basic'}
              </div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Examples:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  onClick={() => insertExample(example)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {example.input.split('\n')[0].length > 35 ? 
                      example.input.split('\n')[0].substring(0, 35) + '...' : 
                      example.input.split('\n')[0]
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Analysis:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Rows:</span>
                    <span className="font-mono">{stats.rowCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Columns:</span>
                    <span className="font-mono">{stats.columnCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Cells:</span>
                    <span className="font-mono">{stats.totalCells}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Valid:</span>
                    <span className="font-mono">{stats.validCells}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Invalid:</span>
                    <span className="font-mono">{stats.invalidCells}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Empty Rows:</span>
                    <span className="font-mono">{stats.emptyRows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duplicates:</span>
                    <span className="font-mono">{stats.duplicateRows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <span className="font-mono">{stats.originalSize} → {stats.processedSize}</span>
                  </div>
                </div>
              </div>
              
              {Object.keys(stats.dataTypes).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Column Types:
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    {Object.entries(stats.dataTypes).slice(0, 4).map(([column, type]) => (
                      <div key={column} className="flex justify-between">
                        <span className="truncate max-w-20">{column}:</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">{type}</span>
                      </div>
                    ))}
                    {Object.keys(stats.dataTypes).length > 4 && (
                      <div className="text-gray-500">+ {Object.keys(stats.dataTypes).length - 4} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
        label={config.mode === 'validate' ? 'Validation Results' : 
               config.outputFormat === 'json' ? 'JSON Output' :
               config.outputFormat === 'table' ? 'Table Format' :
               `${config.outputFormat.toUpperCase()} Output`}
        syntax={config.mode === 'validate' ? 'text' : 
                config.outputFormat === 'json' ? 'json' :
                config.outputFormat === 'table' ? 'text' : 'csv'}
        downloadFilename={`processed.${config.outputFormat === 'json' ? 'json' : 
                                    config.outputFormat === 'tsv' ? 'tsv' : 
                                    config.outputFormat === 'table' ? 'txt' : 'csv'}`}
        downloadContentType={config.outputFormat === 'json' ? 'application/json' : 'text/plain'}
      />
    </div>
  );
}